"use client"

import React, { useState } from "react"
import { Loader2, Video as VideoIcon, Trash2, Play } from "lucide-react"

import { cn } from "@/lib/utils"

import { TextNode } from "./types"

interface VideoBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onDragStart?: (nodeId: string) => void
  isSelected?: boolean
  onToggleSelection?: (nodeId: string) => void
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void
}

export function VideoBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: VideoBlockProps) {
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)

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

  const videoUrl = node.attributes?.src as string | undefined
  const caption = node.content || ""
  const isUploading = node.attributes?.loading === "true" || node.attributes?.loading === true
  const hasError = node.attributes?.error === "true" || node.attributes?.error === true

  return (
    <div
      draggable={!isUploading}
      onDragStart={handleDragStart}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-move transition-all duration-200",
        "bg-gray-900",
        isActive && "ring-2 ring-blue-500/50",
        isSelected && "ring-2 ring-blue-500",
        !isActive && !isSelected && "hover:ring-1 hover:ring-gray-300"
      )}
      onClick={handleClick}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          className={cn(
            "absolute top-3 right-3 z-20",
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
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Selection checkbox */}
      {onToggleSelection && (
        <button
          type="button"
          className={cn(
            "absolute top-3 left-3 z-20",
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

      {/* Video content */}
      <div className="relative w-full min-h-[200px]">
        {/* Uploading state */}
        {isUploading && (
          <div className="flex h-64 w-full flex-col items-center justify-center bg-gray-800">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400 mb-3" />
            <p className="text-sm text-gray-300 font-medium">Uploading video...</p>
            <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
          </div>
        )}

        {/* Error state */}
        {!isUploading && hasError && (
          <div className="flex h-64 w-full flex-col items-center justify-center bg-red-900/20">
            <Trash2 className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-red-400 font-medium">Upload failed</p>
            <p className="text-xs text-gray-500 mt-1">Please try again</p>
          </div>
        )}

        {/* Video display */}
        {!isUploading && !hasError && (
          <>
            {/* Loading skeleton */}
            {!videoLoaded && videoUrl && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-600" />
              </div>
            )}

            {/* Video error */}
            {videoError && (
              <div className="flex h-64 w-full flex-col items-center justify-center bg-gray-800">
                <VideoIcon className="h-10 w-10 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">Failed to load video</p>
              </div>
            )}

            {/* Actual video */}
            {videoUrl && !videoError && (
              <video
                src={videoUrl}
                controls
                className={cn(
                  "w-full h-auto max-h-[500px] transition-opacity duration-200",
                  videoLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {/* Caption */}
            {caption && videoLoaded && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm">{caption}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
