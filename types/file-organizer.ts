// File system types
export type FileItemType = "file" | "folder"

export interface FileItem {
  id: string
  name: string
  type: FileItemType
  children?: FileItem[]
}

export type FileSystem = FileItem[]

// Rule types
export type RuleType = "extension" | "date" | "name" | "size"

export interface Rule {
  id: number
  name: string
  type: RuleType
  condition: string
  destination: string
  active: boolean
}

// Schedule types
export type ScheduleType = "daily" | "weekly" | "custom"
export type IntervalUnit = "minutes" | "hours" | "days"

export interface Schedule {
  runOnStartup: boolean
  runWhenIdle: boolean
  type: ScheduleType
  time: number // Hour of day (0-23)
  day: number // Day of week (0-6, 0 is Sunday)
  interval: {
    value: number
    unit: IntervalUnit
  }
}
