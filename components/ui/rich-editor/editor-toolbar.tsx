"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Eye,
  EyeOff,
  List,
  ListOrdered,
  Table as TableIcon,
  ExternalLink,
  Palette,
  MousePointerClick,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Separator } from "../separator"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { MediaUploadPopover } from "./media-upload-popover"
import { InsertButtonDialog, InfoButtonConfig, DEFAULT_INFO_BUTTON_CONFIG } from "./info-button"

interface EditorToolbarProps {
  isUploading: boolean
  readOnly?: boolean
  onReadOnlyChange?: (readOnly: boolean) => void
  onImageUploadClick: () => void
  onMultipleImagesUploadClick: () => void
  onVideoUploadClick: () => void
  onInsertComponentClick: () => void
  onCreateList: (listType: "ul" | "ol" | "li") => void
  onCreateTable: () => void
  onPreviewClick?: () => void
  pageBackgroundColor?: string
  onPageBackgroundColorChange?: (color: string) => void
  infoButtonConfig?: InfoButtonConfig
  onInfoButtonConfigChange?: (config: InfoButtonConfig) => void
}

// Reusable toolbar button with built-in tooltip
function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex h-8 w-8 items-center justify-center rounded-md",
        "transition-all duration-100",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Dark text on white toolbar
        "text-gray-600",
        "hover:bg-gray-100 hover:text-gray-900",
        "disabled:hover:bg-transparent disabled:hover:text-gray-600",
        isActive && "bg-gray-100 text-gray-900",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {/* Tooltip */}
      <span className={cn(
        "absolute -bottom-8 left-1/2 -translate-x-1/2 z-50",
        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
        "opacity-0 scale-95 pointer-events-none",
        "group-hover:opacity-100 group-hover:scale-100",
        "transition-all duration-100 delay-200",
        "bg-gray-900 text-white"
      )}>
        {label}
      </span>
    </button>
  )
}

// Toolbar group wrapper for consistent styling
function ToolbarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {children}
    </div>
  )
}

// Content background color presets - light and dark options
const CONTENT_BG_PRESETS = [
  // Light colors
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f8fafc' },
  { name: 'Warm White', value: '#fefdfb' },
  { name: 'Cool Gray', value: '#f1f5f9' },
  { name: 'Light Blue', value: '#eff6ff' },
  { name: 'Light Green', value: '#f0fdf4' },
  // Dark colors
  { name: 'Dark', value: '#1a1a2e' },
  { name: 'Charcoal', value: '#1f2937' },
  { name: 'Navy', value: '#0f172a' },
  { name: 'Dark Purple', value: '#1e1b4b' },
  { name: 'Dark Green', value: '#052e16' },
  { name: 'Dark Red', value: '#450a0a' },
]

export function EditorToolbar({
  isUploading,
  readOnly = false,
  onReadOnlyChange,
  onImageUploadClick,
  onMultipleImagesUploadClick,
  onVideoUploadClick,
  onCreateList,
  onCreateTable,
  onPreviewClick,
  pageBackgroundColor = '#ffffff',
  onPageBackgroundColorChange,
  infoButtonConfig = DEFAULT_INFO_BUTTON_CONFIG,
  onInfoButtonConfigChange,
}: EditorToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [infoButtonDialogOpen, setInfoButtonDialogOpen] = useState(false)

  useEffect(() => {
    const updateToolbarHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight
        document.documentElement.style.setProperty(
          "--toolbar-height",
          `${height + 4}px`
        )
      }
    }

    updateToolbarHeight()
    window.addEventListener("resize", updateToolbarHeight)

    return () => {
      window.removeEventListener("resize", updateToolbarHeight)
    }
  }, [])

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "sticky top-0 z-[100] mx-auto w-full",
        "bg-white",
        "border-b border-gray-200",
        "transition-all duration-200"
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1 px-4 py-1.5">
        {/* Preview Toggle */}
        {onReadOnlyChange && (
          <>
            <ToolbarButton
              icon={readOnly ? Eye : EyeOff}
              label={readOnly ? "Edit Mode" : "Preview"}
              onClick={() => onReadOnlyChange(!readOnly)}
              isActive={readOnly}
            />
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />
          </>
        )}

        {/* Media Upload */}
        <MediaUploadPopover
          isUploading={isUploading}
          onImageUploadClick={onImageUploadClick}
          onMultipleImagesUploadClick={onMultipleImagesUploadClick}
          onVideoUploadClick={onVideoUploadClick}
        />

        <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />

        {/* List Buttons */}
        <ToolbarGroup>
          <ToolbarButton
            icon={List}
            label="Bullet List"
            onClick={() => onCreateList("ul")}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Numbered List"
            onClick={() => onCreateList("ol")}
          />
        </ToolbarGroup>

        <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />

        {/* Table Button */}
        <ToolbarButton
          icon={TableIcon}
          label="Table"
          onClick={onCreateTable}
        />

        {/* Content Background Color */}
        {onPageBackgroundColorChange && (
          <>
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative flex h-8 items-center gap-1.5 px-2 rounded-md",
                    "transition-all duration-100",
                    "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  )}
                >
                  <Palette className="h-4 w-4" />
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: pageBackgroundColor }}
                  />
                  <span className={cn(
                    "absolute -bottom-8 left-1/2 -translate-x-1/2 z-50",
                    "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                    "opacity-0 scale-95 pointer-events-none",
                    "group-hover:opacity-100 group-hover:scale-100",
                    "transition-all duration-100 delay-200",
                    "bg-gray-900 text-white"
                  )}>
                    Page Background
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-72 p-4 z-[200] bg-[#1e1e2e] border-[#313244] shadow-2xl" 
                align="center" 
                sideOffset={8}
              >
                <div className="text-sm font-medium text-white mb-4">Page Background</div>
                
                {/* Color presets */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Light</div>
                    <div className="grid grid-cols-6 gap-2">
                      {CONTENT_BG_PRESETS.slice(0, 6).map((preset) => (
                        <button
                          key={preset.value}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onPageBackgroundColorChange(preset.value)}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 transition-all cursor-pointer",
                            "focus:outline-none",
                            pageBackgroundColor === preset.value
                              ? "border-blue-400 scale-110"
                              : "border-transparent hover:scale-105 hover:border-gray-500"
                          )}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Dark</div>
                    <div className="grid grid-cols-6 gap-2">
                      {CONTENT_BG_PRESETS.slice(6).map((preset) => (
                        <button
                          key={preset.value}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onPageBackgroundColorChange(preset.value)}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 transition-all cursor-pointer",
                            "focus:outline-none",
                            pageBackgroundColor === preset.value
                              ? "border-blue-400 scale-110"
                              : "border-gray-600 hover:scale-105 hover:border-gray-500"
                          )}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom color input */}
                <div className="pt-3 border-t border-[#313244]">
                  <div className="text-xs text-gray-400 mb-2">Custom</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pageBackgroundColor}
                      onChange={(e) => onPageBackgroundColorChange(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={pageBackgroundColor}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                          onPageBackgroundColorChange(val)
                        }
                      }}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#313244] bg-[#11111b] text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Insert Info Button */}
        {onInfoButtonConfigChange && (
          <>
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />
            <ToolbarButton
              icon={MousePointerClick}
              label={infoButtonConfig.enabled ? "Edit Info Button" : "Add Info Button"}
              onClick={() => setInfoButtonDialogOpen(true)}
              isActive={infoButtonConfig.enabled}
            />
            <InsertButtonDialog
              open={infoButtonDialogOpen}
              onOpenChange={setInfoButtonDialogOpen}
              config={infoButtonConfig}
              onSave={onInfoButtonConfigChange}
            />
          </>
        )}

        {/* Preview in New Tab */}
        {onPreviewClick && (
          <>
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-gray-200" />
            <ToolbarButton
              icon={ExternalLink}
              label="Preview Page"
              onClick={onPreviewClick}
            />
          </>
        )}
      </div>
    </div>
  )
}
