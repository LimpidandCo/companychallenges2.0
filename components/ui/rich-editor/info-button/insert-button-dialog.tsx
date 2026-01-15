"use client"

import React, { useState, useEffect } from "react"
import {
  Info,
  HelpCircle,
  Lock,
  Key,
  Shield,
  Bell,
  Bookmark,
  Star,
  Heart,
  Lightbulb,
  MessageCircle,
  AlertCircle,
  LucideIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InfoButtonConfig,
  InfoButtonIcon,
  InfoButtonPosition,
  INFO_BUTTON_ICONS,
  INFO_BUTTON_POSITIONS,
  DEFAULT_INFO_BUTTON_CONFIG,
} from "./types"

// Icon mapping
const ICON_MAP: Record<InfoButtonIcon, LucideIcon> = {
  'info': Info,
  'help-circle': HelpCircle,
  'lock': Lock,
  'key': Key,
  'shield': Shield,
  'bell': Bell,
  'bookmark': Bookmark,
  'star': Star,
  'heart': Heart,
  'lightbulb': Lightbulb,
  'message-circle': MessageCircle,
  'alert-circle': AlertCircle,
}

interface InsertButtonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: InfoButtonConfig
  onSave: (config: InfoButtonConfig) => void
}

export function InsertButtonDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: InsertButtonDialogProps) {
  const [localConfig, setLocalConfig] = useState<InfoButtonConfig>(config)

  // Sync with external config when dialog opens
  useEffect(() => {
    if (open) {
      setLocalConfig(config)
    }
  }, [open, config])

  const handleSave = () => {
    onSave(localConfig)
    onOpenChange(false)
  }

  const handleRemove = () => {
    onSave({ ...DEFAULT_INFO_BUTTON_CONFIG, enabled: false })
    onOpenChange(false)
  }

  const IconComponent = ICON_MAP[localConfig.icon]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-hidden flex flex-col bg-[#1e1e2e] border-[#313244] text-white">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base font-semibold text-white">
            Info Button
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-sm text-gray-300">
              Enable
            </Label>
            <button
              id="enabled"
              role="switch"
              aria-checked={localConfig.enabled}
              onClick={() => setLocalConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localConfig.enabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {localConfig.enabled && (
            <>
              {/* Preview */}
              <div className="flex items-center justify-center py-3 bg-[#11111b] rounded-lg">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: localConfig.color }}
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: localConfig.textColor }}
                  />
                </div>
                <span className="ml-3 text-xs text-gray-500">Preview</span>
              </div>

              {/* Icon & Position Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Icon</Label>
                  <Select
                    value={localConfig.icon}
                    onValueChange={(value: InfoButtonIcon) =>
                      setLocalConfig((prev) => ({ ...prev, icon: value }))
                    }
                  >
                    <SelectTrigger className="h-9 bg-[#11111b] border-[#313244] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                      {INFO_BUTTON_ICONS.map((icon) => {
                        const Icon = ICON_MAP[icon.value]
                        return (
                          <SelectItem
                            key={icon.value}
                            value={icon.value}
                            className="text-white hover:bg-[#313244] focus:bg-[#313244]"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Position</Label>
                  <Select
                    value={localConfig.position}
                    onValueChange={(value: InfoButtonPosition) =>
                      setLocalConfig((prev) => ({ ...prev, position: value }))
                    }
                  >
                    <SelectTrigger className="h-9 bg-[#11111b] border-[#313244] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                      {INFO_BUTTON_POSITIONS.map((pos) => (
                        <SelectItem
                          key={pos.value}
                          value={pos.value}
                          className="text-white hover:bg-[#313244] focus:bg-[#313244]"
                        >
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Colors Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Button Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={localConfig.color}
                        onChange={(e) =>
                          setLocalConfig((prev) => ({ ...prev, color: e.target.value }))
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="w-9 h-9 rounded-lg border border-[#313244] cursor-pointer"
                        style={{ backgroundColor: localConfig.color }}
                      />
                    </div>
                    <Input
                      value={localConfig.color}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="h-9 bg-[#11111b] border-[#313244] text-white font-mono text-xs"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Icon Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={localConfig.textColor}
                        onChange={(e) =>
                          setLocalConfig((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="w-9 h-9 rounded-lg border border-[#313244] cursor-pointer"
                        style={{ backgroundColor: localConfig.textColor }}
                      />
                    </div>
                    <Input
                      value={localConfig.textColor}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({ ...prev, textColor: e.target.value }))
                      }
                      className="h-9 bg-[#11111b] border-[#313244] text-white font-mono text-xs"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Modal Title</Label>
                <Input
                  value={localConfig.title}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="h-9 bg-[#11111b] border-[#313244] text-white text-sm"
                  placeholder="Information"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Modal Content</Label>
                <Textarea
                  value={localConfig.content}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="bg-[#11111b] border-[#313244] text-white text-sm min-h-[80px] resize-none"
                  placeholder="Enter the information to display..."
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-3 border-t border-[#313244] gap-2">
          {config.enabled && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="mr-auto"
            >
              Remove
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-[#313244] text-gray-300 hover:bg-[#2a2a3e]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

