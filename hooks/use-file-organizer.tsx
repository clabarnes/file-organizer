"use client"

import { useState, useEffect, useCallback } from "react"
import type { Rule, Schedule, FileSystem, FileItem } from "@/types/file-organizer"

// Initial rules
const initialRules: Rule[] = [
  {
    id: 1,
    name: "Documents",
    type: "extension",
    condition: "doc,docx,pdf,txt",
    destination: "C:\\Users\\YourUsername\\Documents",
    active: true,
  },
  {
    id: 2,
    name: "Images",
    type: "extension",
    condition: "jpg,png,gif,webp",
    destination: "C:\\Users\\YourUsername\\Pictures",
    active: true,
  },
  {
    id: 3,
    name: "Downloads Cleanup",
    type: "date",
    condition: "older than 30 days",
    destination: "C:\\Users\\YourUsername\\Archive",
    active: false,
  },
  {
    id: 4,
    name: "Videos",
    type: "extension",
    condition: "mp4,mov,avi",
    destination: "C:\\Users\\YourUsername\\Videos",
    active: true,
  },
]

// Initial schedule
const initialSchedule: Schedule = {
  runOnStartup: false,
  runWhenIdle: true,
  type: "daily",
  time: 20, // 8:00 PM
  day: 1, // Monday
  interval: {
    value: 4,
    unit: "hours",
  },
}

export function useFileOrganizer(fileSystem: FileSystem, selectedFolders: string[]) {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule)
  const [isAutoOrganizeEnabled, setIsAutoOrganizeEnabled] = useState(true)
  const [organizedCount, setOrganizedCount] = useState(0)
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)
  const [nextRunTime, setNextRunTime] = useState<string | null>("Today at 8:00 PM")
  const [isRunning, setIsRunning] = useState(false)

  // Function to find files that match a rule
  const findMatchingFiles = useCallback(
    (fileSystem: FileSystem, rule: Rule, selectedFolders: string[]): { path: string; file: FileItem }[] => {
      const matches: { path: string; file: FileItem }[] = []

      const searchFolder = (items: FileItem[], currentPath = "") => {
        for (const item of items) {
          const itemPath = currentPath ? `${currentPath}\\${item.name}` : `${item.name}:`

          // Only search in selected folders
          if (item.type === "folder") {
            const folderSelected = selectedFolders.some((folder) => {
              // Check if this folder or any parent folder is selected
              return folder === itemPath || folder.startsWith(itemPath + "\\")
            })

            if (folderSelected && item.children) {
              searchFolder(item.children, itemPath)
            }
          } else if (item.type === "file") {
            // Check if file matches rule
            if (rule.type === "extension") {
              const extensions = rule.condition.split(",").map((ext) => ext.trim().toLowerCase())
              const fileExt = item.name.split(".").pop()?.toLowerCase() || ""

              if (extensions.includes(fileExt)) {
                matches.push({ path: itemPath, file: item })
              }
            } else if (rule.type === "name") {
              // Simple name pattern matching (could be more sophisticated)
              if (rule.condition.includes("*")) {
                const pattern = rule.condition.replace(/\*/g, ".*")
                const regex = new RegExp(pattern, "i")
                if (regex.test(item.name)) {
                  matches.push({ path: itemPath, file: item })
                }
              } else if (item.name.toLowerCase().includes(rule.condition.toLowerCase())) {
                matches.push({ path: itemPath, file: item })
              }
            }
            // Date and size rules would need actual file metadata
            // In a real app, we'd check file dates and sizes here
          }
        }
      }

      searchFolder(fileSystem)
      return matches
    },
    [],
  )

  // Function to run the organizer
  const runOrganizer = useCallback(async () => {
    setIsRunning(true)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let totalOrganized = 0

    // Process each active rule
    for (const rule of rules.filter((r) => r.active)) {
      const matchingFiles = findMatchingFiles(fileSystem, rule, selectedFolders)
      totalOrganized += matchingFiles.length

      // In a real app, we would move the files here
      console.log(`Rule "${rule.name}" matched ${matchingFiles.length} files`)
      console.log(`Moving to: ${rule.destination}`)
    }

    // Update stats
    setOrganizedCount((prev) => prev + totalOrganized)
    setLastRunTime(new Date().toLocaleTimeString())

    // Calculate next run time based on schedule
    updateNextRunTime()

    setIsRunning(false)
    return totalOrganized
  }, [fileSystem, rules, selectedFolders, findMatchingFiles])

  // Update the next run time based on schedule
  const updateNextRunTime = useCallback(() => {
    if (!isAutoOrganizeEnabled) {
      setNextRunTime(null)
      return
    }

    const now = new Date()
    const next = new Date()

    if (schedule.type === "daily") {
      next.setHours(schedule.time, 0, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
    } else if (schedule.type === "weekly") {
      const currentDay = now.getDay()
      const targetDay = schedule.day
      const daysUntilTarget = (targetDay + 7 - currentDay) % 7

      next.setDate(now.getDate() + daysUntilTarget)
      next.setHours(schedule.time, 0, 0, 0)

      if (daysUntilTarget === 0 && next <= now) {
        next.setDate(next.getDate() + 7)
      }
    } else if (schedule.type === "custom") {
      const { value, unit } = schedule.interval

      if (unit === "minutes") {
        next.setMinutes(now.getMinutes() + value)
      } else if (unit === "hours") {
        next.setHours(now.getHours() + value)
      } else if (unit === "days") {
        next.setDate(now.getDate() + value)
      }
    }

    // Format the next run time
    const isToday =
      now.getDate() === next.getDate() && now.getMonth() === next.getMonth() && now.getFullYear() === next.getFullYear()

    const isTomorrow =
      new Date(now.getTime() + 86400000).getDate() === next.getDate() &&
      new Date(now.getTime() + 86400000).getMonth() === next.getMonth() &&
      new Date(now.getTime() + 86400000).getFullYear() === next.getFullYear()

    const timeString = next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    if (isToday) {
      setNextRunTime(`Today at ${timeString}`)
    } else if (isTomorrow) {
      setNextRunTime(`Tomorrow at ${timeString}`)
    } else {
      setNextRunTime(`${next.toLocaleDateString()} at ${timeString}`)
    }
  }, [schedule, isAutoOrganizeEnabled])

  // Update next run time when schedule or auto-organize status changes
  useEffect(() => {
    updateNextRunTime()
  }, [schedule, isAutoOrganizeEnabled, updateNextRunTime])

  // Set up a simulated scheduler
  useEffect(() => {
    if (!isAutoOrganizeEnabled) return

    // This is just a simulation - in a real app, we'd use a proper scheduler
    const interval = setInterval(() => {
      const now = new Date()
      const currentTime = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`

      // Check if it's time to run
      if (nextRunTime && currentTime.includes(nextRunTime.split(" at ")[1])) {
        runOrganizer()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isAutoOrganizeEnabled, nextRunTime, runOrganizer])

  return {
    rules,
    setRules,
    schedule,
    setSchedule,
    isAutoOrganizeEnabled,
    setIsAutoOrganizeEnabled,
    organizedCount,
    lastRunTime,
    nextRunTime,
    runOrganizer,
    isRunning,
  }
}
