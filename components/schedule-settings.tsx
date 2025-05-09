"use client"
import { Clock, Calendar, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { Schedule } from "@/types/file-organizer"

interface ScheduleSettingsProps {
  schedule: Schedule
  setSchedule: (schedule: Schedule) => void
}

export function ScheduleSettings({ schedule, setSchedule }: ScheduleSettingsProps) {
  const { toast } = useToast()

  const handleScheduleChange = (key: keyof Schedule, value: any) => {
    setSchedule({ ...schedule, [key]: value })
  }

  const saveSchedule = () => {
    toast({
      title: "Schedule Saved",
      description: "Your schedule settings have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="run-on-startup">Run on system startup</Label>
          <Switch
            id="run-on-startup"
            checked={schedule.runOnStartup}
            onCheckedChange={(checked) => handleScheduleChange("runOnStartup", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="run-on-idle">Run when system is idle</Label>
          <Switch
            id="run-on-idle"
            checked={schedule.runWhenIdle}
            onCheckedChange={(checked) => handleScheduleChange("runWhenIdle", checked)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Schedule recurring organization</Label>
        <RadioGroup
          value={schedule.type}
          onValueChange={(value) => handleScheduleChange("type", value)}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="daily" id="daily" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="daily" className="font-medium">
                Daily
              </Label>
              {schedule.type === "daily" && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={schedule.time.toString()}
                    onValueChange={(value) => handleScheduleChange("time", Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="weekly" id="weekly" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="weekly" className="font-medium">
                Weekly
              </Label>
              {schedule.type === "weekly" && (
                <div className="mt-2 grid gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={schedule.day.toString()}
                      onValueChange={(value) => handleScheduleChange("day", Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={schedule.time.toString()}
                      onValueChange={(value) => handleScheduleChange("time", Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, "0")}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="custom" id="custom" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="custom" className="font-medium">
                Custom interval
              </Label>
              {schedule.type === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={schedule.interval.value}
                      onChange={(e) =>
                        handleScheduleChange("interval", {
                          ...schedule.interval,
                          value: Number.parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-16"
                    />
                    <Select
                      value={schedule.interval.unit}
                      onValueChange={(value) =>
                        handleScheduleChange("interval", {
                          ...schedule.interval,
                          unit: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-4">
        <Button className="w-full" onClick={saveSchedule}>
          Save Schedule Settings
        </Button>
      </div>
    </div>
  )
}
