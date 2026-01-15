"use client"

import React from "react"
import { Image as ImageIcon, ImagePlus, LayoutGrid, Video, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface MediaUploadPopoverProps {
  isUploading: boolean
  onImageUploadClick: () => void
  onMultipleImagesUploadClick: () => void
  onVideoUploadClick: () => void
}

export function MediaUploadPopover({
  isUploading,
  onImageUploadClick,
  onMultipleImagesUploadClick,
  onVideoUploadClick,
}: MediaUploadPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleOptionClick = (action: () => void) => {
    setOpen(false)
    setTimeout(() => {
      action()
    }, 50)
  }

  const menuItems = [
    {
      id: "single",
      icon: ImagePlus,
      label: "Single Image",
      description: "Add one image to your page",
      action: onImageUploadClick,
    },
    {
      id: "multiple",
      icon: LayoutGrid,
      label: "Image Gallery",
      description: "Create a grid of multiple images",
      action: onMultipleImagesUploadClick,
    },
    {
      id: "video",
      icon: Video,
      label: "Video",
      description: "Embed a video file",
      action: onVideoUploadClick,
      separator: true,
    },
  ]

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        disabled={isUploading}
        className={cn(
          "group relative flex items-center gap-1.5 h-8 px-2.5 rounded-md",
          "transition-all duration-100",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "text-gray-600",
          "hover:bg-gray-100 hover:text-gray-900",
          open && "bg-gray-100 text-gray-900"
        )}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">Media</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-100",
          open && "rotate-180"
        )} />
        
        {/* Tooltip for when text is hidden */}
        <span className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 sm:hidden",
          "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
          "opacity-0 scale-95 pointer-events-none",
          "group-hover:opacity-100 group-hover:scale-100",
          "transition-all duration-100 delay-200",
          "bg-gray-900 text-white"
        )}>
          Add Media
        </span>
      </button>

      {/* Dropdown Menu - Dark theme to match other popovers */}
      {open && (
        <div className={cn(
          "absolute top-full left-0 mt-1.5 z-50",
          "w-64 py-2 rounded-xl",
          "bg-[#1e1e2e] border border-[#313244] shadow-2xl",
          "animate-in fade-in-0 slide-in-from-top-1 duration-100"
        )}>
          <div className="px-3 pb-2 mb-1 border-b border-[#313244]">
            <p className="text-xs font-medium text-gray-400">Insert Media</p>
          </div>
          
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <React.Fragment key={item.id}>
                {item.separator && index > 0 && (
                  <div className="h-px mx-3 my-1.5 bg-[#313244]" />
                )}
                <button
                  className={cn(
                    "flex items-start gap-3 w-full px-3 py-2.5",
                    "transition-colors duration-75",
                    "text-left group/item hover:bg-[#313244]",
                    isUploading && "opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => !isUploading && handleOptionClick(item.action)}
                  disabled={isUploading}
                >
                  <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-[#313244] group-hover/item:bg-[#414154]">
                    <Icon className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-100">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
