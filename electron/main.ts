import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell } from "electron"
import * as path from "path"
import * as fs from "fs"
import { scheduleJob } from "node-schedule"
import Store from "electron-store"

// Initialize store for saving app configuration
const store = new Store({
  name: "file-organizer-config",
  defaults: {
    rules: [],
    schedule: {
      runOnStartup: false,
      runWhenIdle: true,
      type: "daily",
      time: 20,
      day: 1,
      interval: {
        value: 4,
        unit: "hours",
      },
    },
    selectedFolders: [],
    isAutoOrganizeEnabled: true,
    organizedCount: 0,
    lastRunTime: null,
  },
})

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let scheduledJobs: any[] = []

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "icons", "icon.ico"),
  })

  // Load the app
  const isDev = process.env.NODE_ENV === "development"
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"))
  }

  // Handle window close event
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  // Handle window closed event
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, "icons", "icon.ico"))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open File Organizer",
      click: () => {
        mainWindow?.show()
      },
    },
    {
      label: "Run Organization Now",
      click: () => {
        runFileOrganizer()
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip("File Organizer")
  tray.setContextMenu(contextMenu)

  tray.on("click", () => {
    mainWindow?.show()
  })
}

// Initialize the app
app.whenReady().then(() => {
  createWindow()
  createTray()
  setupIpcHandlers()
  setupScheduler()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Handle app quit
app.on("before-quit", () => {
  isQuitting = true
})

// Set up IPC handlers for communication with the renderer process
function setupIpcHandlers() {
  // Get configuration
  ipcMain.handle("get-config", () => {
    return {
      rules: store.get("rules"),
      schedule: store.get("schedule"),
      selectedFolders: store.get("selectedFolders"),
      isAutoOrganizeEnabled: store.get("isAutoOrganizeEnabled"),
      organizedCount: store.get("organizedCount"),
      lastRunTime: store.get("lastRunTime"),
    }
  })

  // Save rules
  ipcMain.handle("save-rules", (_, rules) => {
    store.set("rules", rules)
    return true
  })

  // Save schedule
  ipcMain.handle("save-schedule", (_, schedule) => {
    store.set("schedule", schedule)
    setupScheduler() // Reconfigure scheduler with new settings
    return true
  })

  // Save selected folders
  ipcMain.handle("save-selected-folders", (_, folders) => {
    store.set("selectedFolders", folders)
    return true
  })

  // Toggle auto-organize
  ipcMain.handle("toggle-auto-organize", (_, isEnabled) => {
    store.set("isAutoOrganizeEnabled", isEnabled)
    setupScheduler() // Reconfigure scheduler based on enabled state
    return true
  })

  // Run file organizer
  ipcMain.handle("run-organizer", async () => {
    return await runFileOrganizer()
  })

  // Select folder dialog
  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"],
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // Get file system
  ipcMain.handle("get-file-system", async (_, folderPath) => {
    return getFileSystem(folderPath || "C:\\")
  })

  // Open folder in explorer
  ipcMain.handle("open-folder", (_, folderPath) => {
    shell.openPath(folderPath)
    return true
  })
}

// Set up scheduler based on configuration
function setupScheduler() {
  // Clear existing scheduled jobs
  scheduledJobs.forEach((job) => job.cancel())
  scheduledJobs = []

  const isAutoOrganizeEnabled = store.get("isAutoOrganizeEnabled") as boolean
  if (!isAutoOrganizeEnabled) return

  const schedule = store.get("schedule") as any

  if (schedule.type === "daily") {
    // Schedule daily job
    const job = scheduleJob(`0 0 ${schedule.time} * * *`, runFileOrganizer)
    scheduledJobs.push(job)
  } else if (schedule.type === "weekly") {
    // Schedule weekly job
    const job = scheduleJob(`0 0 ${schedule.time} * * ${schedule.day}`, runFileOrganizer)
    scheduledJobs.push(job)
  } else if (schedule.type === "custom") {
    // Schedule custom interval job
    let interval: number

    if (schedule.interval.unit === "minutes") {
      interval = schedule.interval.value * 60 * 1000
    } else if (schedule.interval.unit === "hours") {
      interval = schedule.interval.value * 60 * 60 * 1000
    } else {
      interval = schedule.interval.value * 24 * 60 * 60 * 1000
    }

    // Initial run after interval
    const timeoutId = setTimeout(() => {
      runFileOrganizer()

      // Then set up recurring interval
      const intervalId = setInterval(runFileOrganizer, interval)

      // Store interval ID for cleanup
      scheduledJobs.push({
        cancel: () => clearInterval(intervalId),
      })
    }, interval)

    // Store timeout ID for cleanup
    scheduledJobs.push({
      cancel: () => clearTimeout(timeoutId),
    })
  }

  // Run on startup if enabled
  if (schedule.runOnStartup) {
    setTimeout(runFileOrganizer, 10000) // Run 10 seconds after startup
  }
}

// Run the file organizer
async function runFileOrganizer() {
  try {
    const rules = store.get("rules") as any[]
    const selectedFolders = store.get("selectedFolders") as string[]

    // Only process active rules
    const activeRules = rules.filter((rule) => rule.active)

    let totalOrganized = 0
    const organizedFiles = []

    // Process each rule
    for (const rule of activeRules) {
      const matchingFiles = await findMatchingFiles(selectedFolders, rule)

      // Organize files
      for (const filePath of matchingFiles) {
        try {
          const fileName = path.basename(filePath)
          const destinationPath = path.join(rule.destination, fileName)

          // Create destination directory if it doesn't exist
          if (!fs.existsSync(rule.destination)) {
            fs.mkdirSync(rule.destination, { recursive: true })
          }

          // Handle file name conflicts
          let finalDestination = destinationPath
          let counter = 1

          while (fs.existsSync(finalDestination)) {
            const ext = path.extname(fileName)
            const nameWithoutExt = path.basename(fileName, ext)
            finalDestination = path.join(rule.destination, `${nameWithoutExt} (${counter})${ext}`)
            counter++
          }

          // Move the file
          fs.renameSync(filePath, finalDestination)

          organizedFiles.push({
            from: filePath,
            to: finalDestination,
            rule: rule.name,
          })

          totalOrganized++
        } catch (error) {
          console.error(`Error organizing file ${filePath}:`, error)
        }
      }
    }

    // Update stats
    const currentCount = store.get("organizedCount") as number
    store.set("organizedCount", currentCount + totalOrganized)
    store.set("lastRunTime", new Date().toISOString())

    // Notify renderer process
    if (mainWindow) {
      mainWindow.webContents.send("organizer-completed", {
        count: totalOrganized,
        files: organizedFiles,
      })
    }

    // Show notification
    if (totalOrganized > 0) {
      new Notification({
        title: "File Organization Complete",
        body: `Successfully organized ${totalOrganized} files.`,
      }).show()
    }

    return totalOrganized
  } catch (error) {
    console.error("Error running file organizer:", error)
    return 0
  }
}

// Find files matching a rule
async function findMatchingFiles(selectedFolders: string[], rule: any): Promise<string[]> {
  const matchingFiles: string[] = []

  // Process each selected folder
  for (const folder of selectedFolders) {
    try {
      await processFolder(folder)
    } catch (error) {
      console.error(`Error processing folder ${folder}:`, error)
    }
  }

  // Recursively process folders
  async function processFolder(folderPath: string) {
    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true })

      for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively process subfolders
          await processFolder(entryPath)
        } else if (entry.isFile()) {
          // Check if file matches rule
          if (matchesRule(entryPath, entry.name, rule)) {
            matchingFiles.push(entryPath)
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${folderPath}:`, error)
    }
  }

  return matchingFiles
}

// Check if a file matches a rule
function matchesRule(filePath: string, fileName: string, rule: any): boolean {
  try {
    const stats = fs.statSync(filePath)

    if (rule.type === "extension") {
      const extensions = rule.condition.split(",").map((ext: string) => ext.trim().toLowerCase())
      const fileExt = path.extname(fileName).toLowerCase().replace(".", "")
      return extensions.includes(fileExt)
    } else if (rule.type === "name") {
      // Simple name pattern matching
      if (rule.condition.includes("*")) {
        const pattern = rule.condition.replace(/\*/g, ".*")
        const regex = new RegExp(pattern, "i")
        return regex.test(fileName)
      }
      return fileName.toLowerCase().includes(rule.condition.toLowerCase())
    } else if (rule.type === "date") {
      // Date based rules
      const fileTime = stats.mtime.getTime()
      const now = new Date().getTime()

      if (rule.condition.includes("older than")) {
        const days = Number.parseInt(rule.condition.match(/\d+/)[0])
        const threshold = now - days * 24 * 60 * 60 * 1000
        return fileTime < threshold
      } else if (rule.condition.includes("newer than")) {
        const days = Number.parseInt(rule.condition.match(/\d+/)[0])
        const threshold = now - days * 24 * 60 * 60 * 1000
        return fileTime > threshold
      }
    } else if (rule.type === "size") {
      // Size based rules
      const fileSize = stats.size

      if (rule.condition.includes("larger than")) {
        const match = rule.condition.match(/(\d+)\s*(KB|MB|GB)/i)
        if (match) {
          const size = Number.parseInt(match[1])
          const unit = match[2].toUpperCase()

          let threshold = size
          if (unit === "KB") threshold *= 1024
          else if (unit === "MB") threshold *= 1024 * 1024
          else if (unit === "GB") threshold *= 1024 * 1024 * 1024

          return fileSize > threshold
        }
      } else if (rule.condition.includes("smaller than")) {
        const match = rule.condition.match(/(\d+)\s*(KB|MB|GB)/i)
        if (match) {
          const size = Number.parseInt(match[1])
          const unit = match[2].toUpperCase()

          let threshold = size
          if (unit === "KB") threshold *= 1024
          else if (unit === "MB") threshold *= 1024 * 1024
          else if (unit === "GB") threshold *= 1024 * 1024 * 1024

          return fileSize < threshold
        }
      }
    }
  } catch (error) {
    console.error(`Error checking rule for ${filePath}:`, error)
  }

  return false
}

// Get file system structure for a folder
function getFileSystem(folderPath: string) {
  try {
    const result: any[] = []

    if (!fs.existsSync(folderPath)) {
      return result
    }

    const entries = fs.readdirSync(folderPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry.name)

      const item = {
        id: entryPath,
        name: entry.name,
        type: entry.isDirectory() ? "folder" : "file",
        path: entryPath,
      }

      result.push(item)
    }

    // Sort folders first, then files
    return result.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      return a.type === "folder" ? -1 : 1
    })
  } catch (error) {
    console.error(`Error getting file system for ${folderPath}:`, error)
    return []
  }
}
