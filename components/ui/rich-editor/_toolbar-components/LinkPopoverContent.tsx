"use client"

import React from "react"
import { Link as LinkIcon, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LinkPopoverContentProps {
  hrefInput: string
  setHrefInput: (value: string) => void
  hasExistingLink: boolean
  selectedText: string
  onApply: () => void
  onRemove: () => void
}

export function LinkPopoverContent({
  hrefInput,
  setHrefInput,
  hasExistingLink,
  selectedText,
  onApply,
  onRemove,
}: LinkPopoverContentProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="mb-1 text-sm font-medium text-white">
          {hasExistingLink ? "Edit Link" : "Add Link"}
        </h4>
        {selectedText && (
          <p className="text-xs text-gray-400 truncate max-w-[250px]">
            "{selectedText}"
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="href-input" className="text-xs text-gray-400">
          URL
        </label>
        <input
          id="href-input"
          type="url"
          placeholder="https://example.com"
          value={hrefInput}
          onChange={(e) => setHrefInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hrefInput.trim()) {
              onApply()
            }
          }}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg",
            "bg-[#11111b] border border-[#313244]",
            "text-white placeholder:text-gray-500",
            "focus:outline-none focus:border-blue-500",
            "transition-colors"
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      </div>
      
      <div className="flex gap-2 pt-1">
        <button
          onClick={onApply}
          disabled={!hrefInput.trim()}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5",
            "px-3 py-2 rounded-lg text-sm font-medium",
            "bg-blue-600 text-white",
            "hover:bg-blue-700 transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          {hasExistingLink ? "Update" : "Add Link"}
        </button>
        
        {hasExistingLink && (
          <button
            onClick={onRemove}
            className={cn(
              "px-3 py-2 rounded-lg",
              "bg-red-600/20 text-red-400",
              "hover:bg-red-600/30 transition-colors"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
