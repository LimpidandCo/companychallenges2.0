"use client"

import React from "react"
import { Code2, Search } from "lucide-react"

import { cn } from "@/lib/utils"

interface CustomClassPopoverContentProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  devMode: boolean
  setDevMode: (value: boolean) => void
  filteredClasses: any[]
  onApplyClass: (className: string) => void
}

export function CustomClassPopoverContent({
  searchQuery,
  setSearchQuery,
  devMode,
  setDevMode,
  filteredClasses,
  onApplyClass,
}: CustomClassPopoverContentProps) {
  return (
    <div className="space-y-3">
      {/* Dev Mode Toggle */}
      <div className="flex items-center justify-between border-b border-[#313244] pb-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Dev Mode</span>
        </div>
        <button
          onClick={() => setDevMode(!devMode)}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors",
            devMode ? "bg-blue-600" : "bg-[#313244]"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
              devMode ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
        <input
          autoFocus
          placeholder={
            devMode
              ? "Search classes... (e.g., 'text', 'bg')"
              : "Search styles... (e.g., 'red', 'bold')"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-9 pr-3 py-2 text-sm rounded-lg",
            "bg-[#11111b] border border-[#313244]",
            "text-white placeholder:text-gray-500",
            "focus:outline-none focus:border-blue-500"
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Class List */}
      <div className="max-h-[300px] overflow-auto pr-1 space-y-3">
        {devMode ? (
          // Dev Mode: Show Tailwind classes
          <>
            {filteredClasses.map((group) => (
              <div key={group.category}>
                <h4 className="text-xs font-semibold text-gray-400 mb-2">
                  {group.category}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(group as any).classes.map((cls: string) => (
                    <button
                      key={cls}
                      onClick={() => onApplyClass(cls)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md",
                        "bg-[#313244] text-gray-200",
                        "hover:bg-[#414154] transition-colors"
                      )}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          // User Mode: Show user-friendly names
          <>
            {filteredClasses.map((group) => (
              <div key={group.category}>
                <h4 className="text-xs font-semibold text-gray-400 mb-2">
                  {group.category}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(group as any).items?.map(
                    (item: { label: string; value: string }) => (
                      <button
                        key={item.value}
                        onClick={() => onApplyClass(item.value)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md",
                          "bg-[#313244] text-gray-200",
                          "hover:bg-[#414154] transition-colors"
                        )}
                        title={`Applies: ${item.value}`}
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </>
        )}
        
        {filteredClasses.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No classes found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}
