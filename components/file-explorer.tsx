"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, HardDrive, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { FileItem, FileSystem } from "@/types/file-organizer"

interface FileExplorerProps {
  isElectron: boolean
  fileSystem: FileSystem
  selectedFolders: string[]
  setSelectedFolders: (folders: string[]) => void
  selectFolder?: () => Promise<string | null>
}

export function FileExplorer({
  isElectron,
  fileSystem,
  selectedFolders,
  setSelectedFolders,
  selectFolder,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["c", "users", "username"])
  const [path, setPath] = useState<string>("C:\\Users")
  const [currentFiles, setCurrentFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load files for the current path in Electron mode
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      const loadFiles = async () => {
        setIsLoading(true)
        try {
          const files = await window.electronAPI!.getFileSystem(path)
          setCurrentFiles(files)
        } catch (error) {
          console.error("Error loading files:", error)
          toast({
            title: "Error",
            description: "Failed to load files. Make sure the path is valid.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadFiles()
    }
  }, [isElectron, path, toast])

  const toggleExpand = (id: string) => {
    setExpandedFolders((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelect = (path: string) => {
    setSelectedFolders((prev) => (prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path]))
  }

  const isExpanded = (id: string) => expandedFolders.includes(id)
  const isSelected = (path: string) => selectedFolders.includes(path)

  const handleSaveSelected = () => {
    toast({
      title: "Folders Saved",
      description: `${selectedFolders.length} folders will be monitored for organization.`,
    })
  }

  const handleSelectFolder = async () => {
    if (isElectron && selectFolder) {
      const folder = await selectFolder()
      if (folder) {
        setPath(folder)
        if (!selectedFolders.includes(folder)) {
          setSelectedFolders([...selectedFolders, folder])
        }
      }
    }
  }

  const handleRefresh = async () => {
    if (isElectron && window.electronAPI) {
      setIsLoading(true)
      try {
        const files = await window.electronAPI.getFileSystem(path)
        setCurrentFiles(files)
        toast({
          title: "Refreshed",
          description: "File list has been updated.",
        })
      } catch (error) {
        console.error("Error refreshing files:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePathChange = (e) => {
    setPath(e.target.value)
  }

  const handlePathKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isElectron && window.electronAPI) {
        handleRefresh()
      }
    }
  }

  const renderElectronFileSystem = () => {
    if (isLoading) {
      return <div className="flex justify-center py-8">Loading files...</div>
    }

    if (currentFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p>No files found in this location.</p>
          <Button variant="outline" className="mt-2" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      )
    }

    return currentFiles.map((item) => (
      <div key={item.id} className="flex items-center py-1 hover:bg-muted/50 rounded px-1">
        {item.type === "folder" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mr-1"
            onClick={() => {
              setPath(item.path)
            }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {item.type === "folder" && (
          <Checkbox checked={isSelected(item.path)} onCheckedChange={() => toggleSelect(item.path)} className="mr-2" />
        )}
        {item.type === "folder" ? (
          <Folder className="h-4 w-4 mr-2 text-blue-500" />
        ) : (
          <File className="h-4 w-4 mr-2 text-gray-500" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>
    ))
  }

  const getFullPath = (item: FileItem, parentPath = "") => {
    const itemPath = parentPath ? `${parentPath}\\${item.name}` : `${item.name}:`
    return itemPath
  }

  const renderWebFileTree = (items: FileItem[], parentPath = "", level = 0) => {
    return items.map((item) => {
      const fullPath = getFullPath(item, parentPath)

      return (
        <div key={item.id} style={{ paddingLeft: `${level * 16}px` }}>
          <div className="flex items-center py-1 hover:bg-muted/50 rounded px-1">
            {item.type === "folder" && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-1" onClick={() => toggleExpand(item.id)}>
                {isExpanded(item.id) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            {item.type === "folder" ? (
              <Checkbox
                checked={isSelected(fullPath)}
                onCheckedChange={() => toggleSelect(fullPath)}
                className="mr-2"
              />
            ) : (
              <div className="w-4 mr-2" />
            )}
            {item.type === "folder" ? (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <File className="h-4 w-4 mr-2 text-gray-500" />
            )}
            <span className="text-sm">{item.name}</span>
          </div>
          {isExpanded(item.id) && item.children && renderWebFileTree(item.children, fullPath, level + 1)}
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <Input value={path} onChange={handlePathChange} onKeyDown={handlePathKeyDown} />
        {isElectron && (
          <Button variant="outline" size="sm" onClick={handleSelectFolder}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <ScrollArea className="h-[350px]">
          <div className="p-2">{isElectron ? renderElectronFileSystem() : renderWebFileTree(fileSystem)}</div>
        </ScrollArea>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={isElectron ? handleRefresh : undefined}>
          Refresh
        </Button>
        <Button onClick={handleSaveSelected}>Save Selected Folders</Button>
      </div>
    </div>
  )
}
