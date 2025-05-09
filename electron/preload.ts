import { contextBridge, ipcRenderer } from "electron"

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Configuration
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveRules: (rules: any) => ipcRenderer.invoke("save-rules", rules),
  saveSchedule: (schedule: any) => ipcRenderer.invoke("save-schedule", schedule),
  saveSelectedFolders: (folders: string[]) => ipcRenderer.invoke("save-selected-folders", folders),
  toggleAutoOrganize: (isEnabled: boolean) => ipcRenderer.invoke("toggle-auto-organize", isEnabled),

  // File operations
  runOrganizer: () => ipcRenderer.invoke("run-organizer"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getFileSystem: (folderPath: string) => ipcRenderer.invoke("get-file-system", folderPath),
  openFolder: (folderPath: string) => ipcRenderer.invoke("open-folder", folderPath),

  // Event listeners
  onOrganizerCompleted: (callback: (data: any) => void) => {
    ipcRenderer.on("organizer-completed", (_, data) => callback(data))

    // Return a function to remove the event listener
    return () => {
      ipcRenderer.removeAllListeners("organizer-completed")
    }
  },
})
