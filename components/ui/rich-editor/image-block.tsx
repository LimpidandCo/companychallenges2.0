"use client"

import React, { useState } from "react"
import { ImageIcon, Loader2, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

import { TextNode } from "./types"

interface ImageBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onDragStart?: (nodeId: string) => void
  isSelected?: boolean
  onToggleSelection?: (nodeId: string) => void
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void
}

export function ImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: ImageBlockProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (onClickWithModifier) {
      onClickWithModifier(e, node.id)
    }
    if (!e.ctrlKey && !e.metaKey) {
      onClick()
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", node.id)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        nodeId: node.id,
        type: node.type,
        src: node.attributes?.src,
      })
    )
    if (onDragStart) {
      onDragStart(node.id)
    }
  }

  const imageUrl = node.attributes?.src as string | undefined
  const altText = node.attributes?.alt as string | undefined
  const caption = node.content || ""
  const isUploading = node.attributes?.loading === "true" || node.attributes?.loading === true
  const hasError = node.attributes?.error === "true" || node.attributes?.error === true

  return (
    <div
      draggable={!isUploading}
      onDragStart={handleDragStart}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-move transition-all duration-200",
        // Clean background - subtle gray that works on any background
        "bg-gray-100",
        // Border styling
        isActive && "ring-2 ring-blue-500/50",
        isSelected && "ring-2 ring-blue-500",
        !isActive && !isSelected && "hover:ring-1 hover:ring-gray-300"
      )}
      onClick={handleClick}
    >
      {/* Delete button - always visible on hover */}
      {onDelete && (
        <button
          type="button"
          className={cn(
            "absolute top-2 right-2 z-20",
            "w-8 h-8 rounded-lg flex items-center justify-center",
            "bg-red-500 text-white",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-red-600",
            "transition-all duration-150",
            "shadow-md"
          )}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log("Delete clicked for node:", node.id)
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Selection indicator - top left corner */}
      {onToggleSelection && (
        <button
          type="button"
          className={cn(
            "absolute top-2 left-2 z-20",
            "w-6 h-6 rounded-md flex items-center justify-center",
            "border-2 transition-all duration-150",
            isSelected 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleSelection(node.id)
          }}
        >
          {isSelected && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {/* Image content */}
      <div className="relative w-full min-h-[120px]">
        {/* Uploading state */}
        {isUploading && (
          <div className="flex h-48 w-full flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        )}

        {/* Error state */}
        {!isUploading && hasError && (
          <div className="flex h-48 w-full flex-col items-center justify-center bg-red-50">
            <Trash2 className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-red-600">Upload failed</p>
          </div>
        )}

        {/* Image display */}
        {!isUploading && !hasError && (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && imageUrl && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Image load error */}
            {imageError && (
              <div className="flex h-48 w-full flex-col items-center justify-center bg-gray-50">
                <ImageIcon className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Failed to load</p>
              </div>
            )}

            {/* Actual image */}
            {imageUrl && !imageError && (
              <img
                src={imageUrl}
                alt={altText || caption || "Image"}
                className={cn(
                  "w-full h-auto object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                draggable={false}
              />
            )}

            {/* Caption */}
            {caption && imageLoaded && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm">{caption}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
