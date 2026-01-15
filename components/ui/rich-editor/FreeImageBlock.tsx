"use client"

import React, { useEffect, useRef, useState } from "react"
import { ImageIcon, Loader2, Move, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

import { EditorActions } from "."
import { useEditorDispatch } from "./store/editor-store"
import { TextNode } from "./types"

interface FreeImageBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  readOnly?: boolean
}

export function FreeImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  readOnly = false,
}: FreeImageBlockProps) {
  const dispatch = useEditorDispatch()
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeSide, setResizeSide] = useState<"left" | "right" | null>(null)
  const [position, setPosition] = useState({
    x: parseFloat((node.attributes?.styles as any)?.left || "100") || 0,
    y: parseFloat((node.attributes?.styles as any)?.top || "100") || 0,
  })
  const [size, setSize] = useState<{ width: number; height: number | "auto" }>({
    width: parseFloat((node.attributes?.styles as any)?.width || "400") || 400,
    height: "auto",
  })
  const dragRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 })
  const startSizeRef = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 })

  const imageUrl = node.attributes?.src as string | undefined
  const altText = node.attributes?.alt as string | undefined
  const caption = node.content || ""
  const isUploading = node.attributes?.loading === "true" || node.attributes?.loading === true
  const hasError = node.attributes?.error === "true" || node.attributes?.error === true

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    startPosRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    }
  }

  const handleResizeStart = (e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeSide(side)
    startSizeRef.current = {
      width: size.width,
      height: typeof size.height === "number" ? size.height : 0,
      mouseX: e.clientX,
      mouseY: e.clientY,
    }
    startPosRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.mouseX
      const deltaY = e.clientY - startPosRef.current.mouseY
      const newX = startPosRef.current.x + deltaX
      const newY = startPosRef.current.y + deltaY
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      const currentStyles = (node.attributes?.styles || {}) as Record<string, string>
      const newStyles = {
        ...currentStyles,
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: "fixed",
        zIndex: currentStyles.zIndex || "10",
      }
      dispatch(
        EditorActions.updateNode(node.id, {
          attributes: { ...node.attributes, styles: newStyles },
        })
      )
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, position, node.id, node.attributes, dispatch])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startSizeRef.current.mouseX
      if (resizeSide === "right") {
        const newWidth = Math.max(200, Math.min(800, startSizeRef.current.width + deltaX))
        setSize({ width: newWidth, height: "auto" })
      } else if (resizeSide === "left") {
        const newWidth = Math.max(200, Math.min(800, startSizeRef.current.width - deltaX))
        const widthDiff = startSizeRef.current.width - newWidth
        const newX = startPosRef.current.x + widthDiff
        setSize({ width: newWidth, height: "auto" })
        setPosition({ x: newX, y: position.y })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeSide(null)
      const currentStyles = (node.attributes?.styles || {}) as Record<string, string>
      const newStyles = {
        ...currentStyles,
        width: `${size.width}px`,
        height: "auto",
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: "fixed",
        zIndex: currentStyles.zIndex || "10",
      }
      dispatch(
        EditorActions.updateNode(node.id, {
          attributes: { ...node.attributes, styles: newStyles },
        })
      )
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, resizeSide, size, position, node.id, node.attributes, dispatch])

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) {
      onClick()
    }
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "group absolute rounded-xl overflow-hidden shadow-xl",
        "bg-gray-100 border border-gray-200",
        readOnly ? "cursor-default" : isDragging ? "cursor-grabbing" : isResizing ? "cursor-ew-resize" : "cursor-grab",
        isActive && "ring-2 ring-blue-500/50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: typeof size.height === "string" ? size.height : `${size.height}px`,
        zIndex: isDragging || isResizing ? 1000 : 10,
      }}
      onClick={handleClick}
    >
      {/* Drag handle */}
      {!readOnly && (
        <button
          type="button"
          className={cn(
            "absolute top-2 left-2 z-20",
            "w-8 h-8 rounded-lg flex items-center justify-center",
            "bg-white/90 text-gray-600",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-white hover:text-gray-900",
            "transition-all duration-150",
            "shadow-md cursor-grab active:cursor-grabbing"
          )}
          onMouseDown={handleDragStart}
        >
          <Move className="h-4 w-4" />
        </button>
      )}

      {/* Delete button */}
      {!readOnly && onDelete && (
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
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Image content */}
      <div className="relative w-full">
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

            {/* Image error */}
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

      {/* Resize handles */}
      {!readOnly && !isUploading && !hasError && imageUrl && (
        <>
          {/* Right resize handle */}
          <div
            className="absolute top-1/2 right-0 z-20 flex h-16 w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, "right")}
          >
            <div className="h-10 w-1 rounded-full bg-blue-500/50 hover:bg-blue-500 transition-colors" />
          </div>

          {/* Left resize handle */}
          <div
            className="absolute top-1/2 left-0 z-20 flex h-16 w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, "left")}
          >
            <div className="h-10 w-1 rounded-full bg-blue-500/50 hover:bg-blue-500 transition-colors" />
          </div>
        </>
      )}
    </div>
  )
}
