"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationProps {
  message: string
  onClose: () => void
}

export function Notification({ message, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow animation to complete
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 max-w-md transition-all duration-300 flex items-start gap-3 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-primary/10 p-2 rounded-full">
        <Bell className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">File Organizer</h4>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
