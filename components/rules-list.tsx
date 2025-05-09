"use client"

import { useState } from "react"
import { Folder, FileType, Calendar, X, Edit, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Rule } from "@/types/file-organizer"

interface RulesListProps {
  rules: Rule[]
  setRules: (rules: Rule[]) => void
}

export function RulesList({ rules, setRules }: RulesListProps) {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleItem = (id: number) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleRuleActive = (id: number) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)))
  }

  const deleteRule = (id: number) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  const editRule = (rule: Rule) => {
    setEditingRule({ ...rule })
    setIsDialogOpen(true)
  }

  const saveRule = () => {
    if (editingRule) {
      setRules(rules.map((rule) => (rule.id === editingRule.id ? editingRule : rule)))
      setIsDialogOpen(false)
      setEditingRule(null)
    }
  }

  const getIcon = (type: Rule["type"]) => {
    switch (type) {
      case "extension":
        return <FileType className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      case "name":
        return <FileText className="h-4 w-4" />
      default:
        return <Folder className="h-4 w-4" />
    }
  }

  return (
    <>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rules defined. Add a rule to start organizing your files.
            </div>
          ) : (
            rules.map((rule) => (
              <Collapsible
                key={rule.id}
                open={openItems.includes(rule.id)}
                onOpenChange={() => toggleItem(rule.id)}
                className="border rounded-lg"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${rule.active ? "bg-primary/10" : "bg-muted"}`}>
                      {getIcon(rule.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {rule.type === "extension" ? "File types" : rule.type === "date" ? "Date based" : rule.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.active ? "default" : "outline"}>{rule.active ? "Active" : "Disabled"}</Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {openItems.includes(rule.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <CardContent className="border-t bg-muted/50 p-3 space-y-3">
                    <div className="grid grid-cols-[80px_1fr] gap-1 text-sm">
                      <span className="text-muted-foreground">Condition:</span>
                      <span>{rule.condition}</span>

                      <span className="text-muted-foreground">Destination:</span>
                      <span className="flex items-center">
                        <Folder className="h-3 w-3 mr-1 text-muted-foreground" />
                        {rule.destination}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={() => toggleRuleActive(rule.id)}>
                        {rule.active ? "Disable" : "Enable"}
                      </Button>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editRule(rule)}>
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>Modify the rule settings to organize your files.</DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-type">Rule Type</Label>
                <Select
                  value={editingRule.type}
                  onValueChange={(value) => setEditingRule({ ...editingRule, type: value as Rule["type"] })}
                >
                  <SelectTrigger id="rule-type">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extension">File Extension</SelectItem>
                    <SelectItem value="date">Date Modified</SelectItem>
                    <SelectItem value="name">File Name</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-condition">
                  {editingRule.type === "extension"
                    ? "File Extensions (comma separated)"
                    : editingRule.type === "date"
                      ? "Date Condition"
                      : editingRule.type === "name"
                        ? "Name Pattern"
                        : "Size Condition"}
                </Label>
                <Input
                  id="rule-condition"
                  value={editingRule.condition}
                  onChange={(e) => setEditingRule({ ...editingRule, condition: e.target.value })}
                  placeholder={
                    editingRule.type === "extension"
                      ? "jpg,png,pdf"
                      : editingRule.type === "date"
                        ? "older than 30 days"
                        : editingRule.type === "name"
                          ? "*report*"
                          : "larger than 100MB"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-destination">Destination Folder</Label>
                <Input
                  id="rule-destination"
                  value={editingRule.destination}
                  onChange={(e) => setEditingRule({ ...editingRule, destination: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
