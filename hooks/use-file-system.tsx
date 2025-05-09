"use client"

import { useState } from "react"
import type { FileSystem } from "@/types/file-organizer"

// Generate a simulated file system
const generateFileSystem = (): FileSystem => {
  const documents = [
    { id: "doc1", name: "Report-Q1.docx", type: "file" as const },
    { id: "doc2", name: "Meeting-Notes.pdf", type: "file" as const },
    { id: "doc3", name: "Budget-2023.xlsx", type: "file" as const },
    { id: "doc4", name: "Project-Plan.pptx", type: "file" as const },
  ]

  const pictures = [
    { id: "pic1", name: "Vacation.jpg", type: "file" as const },
    { id: "pic2", name: "Family.png", type: "file" as const },
    { id: "pic3", name: "Screenshot.png", type: "file" as const },
  ]

  const downloads = [
    { id: "dl1", name: "Setup.exe", type: "file" as const },
    { id: "dl2", name: "Report.pdf", type: "file" as const },
    { id: "dl3", name: "Image.jpg", type: "file" as const },
    { id: "dl4", name: "Video.mp4", type: "file" as const },
    { id: "dl5", name: "Archive.zip", type: "file" as const },
    { id: "dl6", name: "Presentation.pptx", type: "file" as const },
  ]

  const desktop = [
    { id: "dt1", name: "Shortcut.lnk", type: "file" as const },
    { id: "dt2", name: "Notes.txt", type: "file" as const },
    { id: "dt3", name: "Screenshot_1.png", type: "file" as const },
    { id: "dt4", name: "Screenshot_2.png", type: "file" as const },
    { id: "dt5", name: "Untitled.docx", type: "file" as const },
  ]

  const videos = [
    { id: "vid1", name: "Holiday.mp4", type: "file" as const },
    { id: "vid2", name: "Tutorial.mp4", type: "file" as const },
  ]

  const music = [
    { id: "mus1", name: "Song1.mp3", type: "file" as const },
    { id: "mus2", name: "Song2.mp3", type: "file" as const },
    {
      id: "mus3",
      name: "Album",
      type: "folder" as const,
      children: [
        { id: "alb1", name: "Track1.mp3", type: "file" as const },
        { id: "alb2", name: "Track2.mp3", type: "file" as const },
      ],
    },
  ]

  return [
    {
      id: "c",
      name: "C",
      type: "folder",
      children: [
        {
          id: "users",
          name: "Users",
          type: "folder",
          children: [
            {
              id: "username",
              name: "YourUsername",
              type: "folder",
              children: [
                { id: "desktop", name: "Desktop", type: "folder", children: desktop },
                { id: "documents", name: "Documents", type: "folder", children: documents },
                { id: "downloads", name: "Downloads", type: "folder", children: downloads },
                { id: "pictures", name: "Pictures", type: "folder", children: pictures },
                { id: "videos", name: "Videos", type: "folder", children: videos },
                { id: "music", name: "Music", type: "folder", children: music },
              ],
            },
          ],
        },
        { id: "program-files", name: "Program Files", type: "folder", children: [] },
        { id: "windows", name: "Windows", type: "folder", children: [] },
      ],
    },
    {
      id: "d",
      name: "D",
      type: "folder",
      children: [
        { id: "games", name: "Games", type: "folder", children: [] },
        { id: "backup", name: "Backup", type: "folder", children: [] },
      ],
    },
  ]
}

export function useFileSystem() {
  const [fileSystem, setFileSystem] = useState<FileSystem>(generateFileSystem())
  const [selectedFolders, setSelectedFolders] = useState<string[]>([
    "C:\\Users\\YourUsername\\Desktop",
    "C:\\Users\\YourUsername\\Documents",
    "C:\\Users\\YourUsername\\Downloads",
    "C:\\Users\\YourUsername\\Pictures",
    "C:\\Users\\YourUsername\\Videos",
  ])

  return {
    fileSystem,
    setFileSystem,
    selectedFolders,
    setSelectedFolders,
  }
}
