"use client"

import { useState } from "react"
import { Folder, FolderPlus, Clock, Settings, Play, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { RulesList } from "@/components/rules-list"
import { ScheduleSettings } from "@/components/schedule-settings"
import { FileExplorer } from "@/components/file-explorer"
import { useToast } from "@/hooks/use-toast"
import { useFileSystem } from "@/hooks/use-file-system"
import { useFileOrganizer } from "@/hooks/use-file-organizer"
import { useElectron } from "@/hooks/use-electron"
import { Notification } from "@/components/notification"
import { LoadingScreen } from "@/components/loading-screen"

export default function FileOrganizer() {
  const [activeTab, setActiveTab] = useState("rules")
  const { toast } = useToast()

  // Use Electron API if available, otherwise use the web simulation
  const {
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
    runOrganizer: electronRunOrganizer,
    selectFolder,
  } = useElectron()

  // Fallback to web simulation if not in Electron
  const { fileSystem } = useFileSystem()
  const {
    rules: webRules,
    setRules: setWebRules,
    schedule: webSchedule,
    setSchedule: setWebSchedule,
    isAutoOrganizeEnabled: webIsAutoOrganizeEnabled,
    setIsAutoOrganizeEnabled: setWebIsAutoOrganizeEnabled,
    organizedCount: webOrganizedCount,
    lastRunTime: webLastRunTime,
    nextRunTime,
    runOrganizer: webRunOrganizer,
    isRunning,
  } = useFileOrganizer(fileSystem, selectedFolders)

  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  // Use the appropriate values based on environment
  const effectiveRules = isElectron ? rules : webRules
  const effectiveSchedule = isElectron ? schedule : webSchedule
  const effectiveIsAutoOrganizeEnabled = isElectron ? isAutoOrganizeEnabled : webIsAutoOrganizeEnabled
  const effectiveOrganizedCount = isElectron ? organizedCount : webOrganizedCount
  const effectiveLastRunTime = isElectron
    ? lastRunTime
      ? new Date(lastRunTime).toLocaleString()
      : null
    : webLastRunTime

  // Handle rule changes
  const handleRulesChange = (newRules) => {
    if (isElectron) {
      saveRules(newRules)
    } else {
      setWebRules(newRules)
    }
  }

  // Handle schedule changes
  const handleScheduleChange = (newSchedule) => {
    if (isElectron) {
      saveSchedule(newSchedule)
    } else {
      setWebSchedule(newSchedule)
    }
  }

  // Handle auto-organize toggle
  const handleAutoOrganizeToggle = (isEnabled) => {
    if (isElectron) {
      toggleAutoOrganize(isEnabled)
    } else {
      setWebIsAutoOrganizeEnabled(isEnabled)
    }
  }

  // Run the organizer when requested
  const handleRunNow = async () => {
    if (isRunning) return

    let count = 0
    if (isElectron) {
      count = await electronRunOrganizer()
    } else {
      count = await webRunOrganizer()
    }

    toast({
      title: "Organization Complete",
      description: `Successfully organized ${count} files.`,
    })

    setNotificationMessage(`Successfully organized ${count} files.`)
    setShowNotification(true)

    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false)
    }, 5000)
  }

  // Save configuration
  const handleSaveConfig = () => {
    if (isElectron) {
      saveRules(effectiveRules)
      saveSchedule(effectiveSchedule)
      saveSelectedFolders(selectedFolders)
    }

    toast({
      title: "Configuration Saved",
      description: "Your organization rules and settings have been saved.",
    })
  }

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="bg-primary p-2 rounded-lg">
              <Folder className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">File Organizer Assistant</h1>
              <p className="text-muted-foreground">Automatically organize your files on Windows 11</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveConfig}>
              <Save className="h-4 w-4 mr-2" />
              Save Config
            </Button>
            <Button size="sm" onClick={handleRunNow} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running..." : "Run Now"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Your assistant is {effectiveIsAutoOrganizeEnabled ? "active" : "inactive"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-organize">Auto-organize</Label>
                  <Switch
                    id="auto-organize"
                    checked={effectiveIsAutoOrganizeEnabled}
                    onCheckedChange={handleAutoOrganizeToggle}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Next scheduled run</Label>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {isElectron
                      ? effectiveIsAutoOrganizeEnabled
                        ? "Scheduled via Windows"
                        : "Not scheduled"
                      : nextRunTime
                        ? nextRunTime
                        : "Not scheduled"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Files organized</Label>
                  <p className="text-2xl font-bold">{effectiveOrganizedCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {effectiveLastRunTime ? `Last run: ${effectiveLastRunTime}` : "Never run"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" onClick={() => setActiveTab("schedule")}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="rules">Organization Rules</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="explorer">File Explorer</TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Rules</CardTitle>
                    <CardDescription>Define how your files should be organized</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RulesList rules={effectiveRules} setRules={handleRulesChange} />
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleRulesChange([
                          ...effectiveRules,
                          {
                            id: Date.now(),
                            name: "New Rule",
                            type: "extension",
                            condition: "",
                            destination: "C:\\Users\\NewFolder",
                            active: true,
                          },
                        ])
                      }}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add New Rule
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule Settings</CardTitle>
                    <CardDescription>Configure when the assistant should organize your files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScheduleSettings schedule={effectiveSchedule} setSchedule={handleScheduleChange} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explorer">
                <Card>
                  <CardHeader>
                    <CardTitle>File Explorer</CardTitle>
                    <CardDescription>Browse and select folders to organize</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileExplorer
                      isElectron={isElectron}
                      fileSystem={fileSystem}
                      selectedFolders={selectedFolders}
                      setSelectedFolders={saveSelectedFolders}
                      selectFolder={selectFolder}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {showNotification && <Notification message={notificationMessage} onClose={() => setShowNotification(false)} />}
    </div>
  )
}
