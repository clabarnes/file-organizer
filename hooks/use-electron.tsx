"use client"

import { useState, useEffect, useCallback } from "react"
import type { Rule, Schedule } from "@/types/file-organizer"

// Define the electron API interface
interface ElectronAPI {
  getConfig: () => Promise<{
    rules: Rule[]
    schedule: Schedule
    selectedFolders: string[]
    isAutoOrganizeEnabled: boolean
    organizedCount: number
    lastRunTime: string | null
  }>
  saveRules: (rules: Rule[]) => Promise<boolean>
  saveSchedule: (schedule: Schedule) => Promise<boolean>
  saveSelectedFolders: (folders: string[]) => Promise<boolean>
  toggleAutoOrganize: (isEnabled: boolean) => Promise<boolean>
  runOrganizer: () => Promise<number>
  selectFolder: () => Promise<string | null>
  getFileSystem: (folderPath: string) => Promise<any[]>
  openFolder: (folderPath: string) => Promise<boolean>
  onOrganizerCompleted: (callback: (data: any) => void) => () => void
}

// Declare global window with electronAPI
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false)
  const [rules, setRules] = useState<Rule[]>([])
  const [schedule, setSchedule] = useState<Schedule>({
    runOnStartup: false,
    runWhenIdle: true,
    type: "daily",
    time: 20,
    day: 1,
    interval: {
      value: 4,
      unit: "hours",
    },
  })
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [isAutoOrganizeEnabled, setIsAutoOrganizeEnabled] = useState(true)
  const [organizedCount, setOrganizedCount] = useState(0)
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load configuration from Electron
  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI) {
        setIsElectron(true)
        try {
          const config = await window.electronAPI.getConfig()
          setRules(config.rules)
          setSchedule(config.schedule)
          setSelectedFolders(config.selectedFolders)
          setIsAutoOrganizeEnabled(config.isAutoOrganizeEnabled)
          setOrganizedCount(config.organizedCount)
          setLastRunTime(config.lastRunTime)
        } catch (error) {
          console.error("Error loading config:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Save rules to Electron
  const saveRules = useCallback(async (newRules: Rule[]) => {
    setRules(newRules)
    if (window.electronAPI) {
      await window.electronAPI.saveRules(newRules)
    }
  }, [])

  // Save schedule to Electron
  const saveSchedule = useCallback(async (newSchedule: Schedule) => {
    setSchedule(newSchedule)
    if (window.electronAPI) {
      await window.electronAPI.saveSchedule(newSchedule)
    }
  }, [])

  // Save selected folders to Electron
  const saveSelectedFolders = useCallback(async (folders: string[]) => {
    setSelectedFolders(folders)
    if (window.electronAPI) {
      await window.electronAPI.saveSelectedFolders(folders)
    }
  }, [])

  // Toggle auto-organize in Electron
  const toggleAutoOrganize = useCallback(async (isEnabled: boolean) => {
    setIsAutoOrganizeEnabled(isEnabled)
    if (window.electronAPI) {
      await window.electronAPI.toggleAutoOrganize(isEnabled)
    }
  }, [])

  // Run the organizer
  const runOrganizer = useCallback(async () => {
    if (window.electronAPI) {
      const count = await window.electronAPI.runOrganizer()
      return count
    }
    return 0
  }, [])

  // Select a folder using the native dialog
  const selectFolder = useCallback(async () => {
    if (window.electronAPI) {
      return await window.electronAPI.selectFolder()
    }
    return null
  }, [])

  // Get file system for a folder
  const getFileSystem = useCallback(async (folderPath: string) => {
    if (window.electronAPI) {
      return await window.electronAPI.getFileSystem(folderPath)
    }
    return []
  }, [])

  // Open a folder in the native file explorer
  const openFolder = useCallback(async (folderPath: string) => {
    if (window.electronAPI) {
      return await window.electronAPI.openFolder(folderPath)
    }
    return false
  }, [])

  // Set up organizer completed event listener
  useEffect(() => {
    if (window.electronAPI) {
      const removeListener = window.electronAPI.onOrganizerCompleted((data) => {
        setOrganizedCount((prev) => prev + data.count)
        setLastRunTime(new Date().toISOString())
      })

      return () => {
        removeListener()
      }
    }
  }, [])

  return {
    isElectron,
    isLoading,
    rules,
    schedule,
    selectedFolders,
    isAutoOrganizeEnabled,
    organizedCount,
    lastRunTime,
    saveRules,
    saveSchedule,
    saveSelectedFolders,
    toggleAutoOrganize,
    runOrganizer,
    selectFolder,
    getFileSystem,
    openFolder,
  }
}
