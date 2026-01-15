"use client"

import React, { useState } from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface AddBlockButtonProps {
  onAdd: () => void
  position?: "before" | "after"
}

export function AddBlockButton({
  onAdd,
  position = "after",
}: AddBlockButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative flex h-8 items-center justify-center my-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Larger hover area for easier interaction */}
      <div 
        className="absolute inset-x-0 -inset-y-2 cursor-pointer" 
        onClick={onAdd} 
      />

      {/* Line indicator - appears on hover */}
      <div
        className={cn(
          "absolute inset-x-12 h-px transition-all duration-200",
          isHovered 
            ? "bg-blue-400/50" 
            : "bg-transparent"
        )}
      />

      {/* Add button - subtle by default, prominent on hover */}
      <button
        className={cn(
          "relative z-10 flex items-center justify-center",
          "h-6 w-6 rounded-full",
          "border-2 transition-all duration-200 ease-out",
          isHovered
            ? "bg-blue-500 border-blue-500 text-white shadow-lg scale-100 opacity-100"
            : "bg-white border-gray-200 text-gray-300 shadow-sm scale-75 opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
        title="Add new block"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
