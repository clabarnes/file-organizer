"use client"

import { Folder } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="animate-pulse flex flex-col items-center">
        <div className="bg-primary p-4 rounded-lg mb-4">
          <Folder className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">File Organizer Assistant</h1>
        <p className="text-muted-foreground">Loading your configuration...</p>
      </div>
    </div>
  )
}
