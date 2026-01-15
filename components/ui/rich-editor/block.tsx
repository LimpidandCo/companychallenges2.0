"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Code,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Plus,
  Quote,
  Type,
} from "lucide-react"

import { Button } from "../button"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { BlockContextMenu } from "./block-context-menu"
import { CommandMenu } from "./command-menu"
import { ELEMENT_OPTIONS } from "./elements"
import { FlexContainer } from "./flex-container"
// Import all block handlers and utilities
import {
  buildHTML,
  createHandleBackgroundColorChange,
  createHandleBlockDragEnd,
  createHandleBlockDragStart,
  createHandleClick,
  createHandleCommandSelect,
  createHandleCompositionEnd,
  createHandleCompositionStart,
  createHandleInput,
  createHandleKeyDown,
  getTypeClassName,
  restoreSelection,
  saveSelection,
} from "./handlers/block"
import {
  getContainerClasses,
  getElementType,
  getNodeRenderType,
} from "./handlers/block/block-renderer"
import { ImageBlock } from "./image-block"
import {
  useBlockNode,
  useEditorDispatch,
  useEditorStore,
  useIsNodeActive,
} from "./store/editor-store"
import { TableBuilder } from "./table-builder"
import {
  ContainerNode,
  EditorNode,
  getNodeTextContent,
  isContainerNode,
  TextNode,
} from "./types"
import { VideoBlock } from "./video-block"

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  List,
  ListOrdered,
}

interface BlockProps {
  nodeId: string // Changed: pass ID instead of full node to prevent re-renders
  isActive: boolean
  nodeRef: (el: HTMLElement | null) => void
  onInput: (element: HTMLElement) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onClick: () => void
  onDelete?: (nodeId?: string) => void
  onCreateNested?: (nodeId: string) => void
  depth?: number
  readOnly?: boolean
  onImageDragStart?: (nodeId: string) => void
  onChangeBlockType?: (nodeId: string, newType: string) => void
  onInsertImage?: (nodeId: string) => void
  onCreateList?: (nodeId: string, listType: string) => void
  onCreateTable?: (nodeId: string) => void
  onUploadImage?: (file: File) => Promise<string>
  onBlockDragStart?: (nodeId: string) => void
  selectedImageIds?: Set<string>
  onToggleImageSelection?: (nodeId: string) => void
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void
  onFlexContainerDragOver?: (
    e: React.DragEvent,
    flexId: string,
    position: "left" | "right" | null
  ) => void
  onFlexContainerDragLeave?: (e: React.DragEvent) => void
  onFlexContainerDrop?: (
    e: React.DragEvent,
    flexId: string,
    position: "left" | "right" | null
  ) => void
  dragOverFlexId?: string | null
  flexDropPosition?: "left" | "right" | null
  isFirstBlock?: boolean
  notionBased?: boolean
  hasCoverImage?: boolean
  onUploadCoverImage?: (file: File) => Promise<string>
  onSetDragOverNodeId?: (nodeId: string | null) => void
  onSetDropPosition?: (
    position: "before" | "after" | "left" | "right" | null
  ) => void
  draggingNodeId?: string | null
  onSetDraggingNodeId?: (nodeId: string | null) => void
}


export const Block = React.memo(
  function Block({
    nodeId,
    isActive,
    nodeRef,
    onInput,
    onKeyDown,
    onClick,
    onDelete,
    onCreateNested,
    depth = 0,
    readOnly = false,
    onImageDragStart,
    onChangeBlockType,
    onInsertImage,
    onCreateList,
    onCreateTable,
    onUploadImage,
    onBlockDragStart,
    selectedImageIds,
    onToggleImageSelection,
    onClickWithModifier,
    onFlexContainerDragOver,
    onFlexContainerDragLeave,
    onFlexContainerDrop,
    dragOverFlexId,
    flexDropPosition,
    isFirstBlock = false,
    notionBased = true,
    hasCoverImage = false,
    onUploadCoverImage,
    onSetDragOverNodeId,
    onSetDropPosition,
    draggingNodeId,
    onSetDraggingNodeId,
  }: BlockProps) {
    // ✅ OPTIMIZATION: Subscribe to ONLY this node's data
    // Thanks to structural sharing, this only causes re-render when THIS node changes
    const node = useBlockNode(nodeId)
    
    // Cache last known node to prevent flicker during state transitions
    const cachedNodeRef = useRef<typeof node>(node)
    if (node) {
      cachedNodeRef.current = node
    }
    
    // Use cached node if current lookup fails (prevents disappearing content)
    const effectiveNode = node || cachedNodeRef.current

    // If node not found even in cache, return null
    if (!effectiveNode) {
      console.warn(`Block: Node ${nodeId} not found and no cache available`)
      return null
    }

    const localRef = useRef<HTMLElement | null>(null)
    const isComposingRef = useRef(false)
    const shouldPreserveSelectionRef = useRef(false)
    // Removed isHovering state - it was never used and caused unnecessary re-renders
    const coverImageInputRef = useRef<HTMLInputElement>(null)
    const [isUploadingCover, setIsUploadingCover] = useState(false)

    // DEV: Track renders to verify optimization
    const renderCountRef = useRef(0)
    renderCountRef.current += 1

    if (process.env.NODE_ENV === "development") {
      console.log(`🔄testBlock ${nodeId} render #${renderCountRef.current}`)
    }

    // ZUSTAND: Get dispatch function (never changes, no re-renders)
    const dispatch = useEditorDispatch()

    // Command menu state
    const [showCommandMenu, setShowCommandMenu] = useState(false)
    const [commandMenuAnchor, setCommandMenuAnchor] =
      useState<HTMLElement | null>(null)

    // Add block popover state
    const [addBlockPopoverOpen, setAddBlockPopoverOpen] = useState(false)

    // Touch/drag state for mobile
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const [isDraggingTouch, setIsDraggingTouch] = useState(false)

    // Determine how to render this node
    const renderType = getNodeRenderType(effectiveNode)

    // Handle container nodes (recursive rendering)
    switch (renderType) {
      case "table": {
        const containerNode = effectiveNode as ContainerNode
        return (
          <TableBuilder
            key={effectiveNode.id}
            node={containerNode}
            onUpdate={(id, updates) => {
              if (dispatch) {
                dispatch({
                  type: "UPDATE_NODE",
                  payload: { id, updates },
                })
              }
            }}
            readOnly={readOnly}
            onBlockDragStart={onBlockDragStart}
            onDelete={onDelete}
          />
        )
      }

      case "flex": {
        const containerNode = effectiveNode as ContainerNode
        return (
          <FlexContainer
            key={effectiveNode.id}
            node={containerNode}
            onDragOver={(e, position) => {
              if (onFlexContainerDragOver) {
                onFlexContainerDragOver(e, effectiveNode.id, position)
              }
            }}
            onDragLeave={onFlexContainerDragLeave}
            onDrop={(e, position) => {
              if (onFlexContainerDrop) {
                onFlexContainerDrop(e, effectiveNode.id, position)
              }
            }}
            dragOverPosition={
              dragOverFlexId === effectiveNode.id ? flexDropPosition : null
            }
          >
            {containerNode.children.map((childNode) => {
              const isChildMedia =
                childNode &&
                "type" in childNode &&
                (childNode.type === "img" || childNode.type === "video")

              const blockContent = (
                <Block
                  key={childNode.id}
                  nodeId={childNode.id}
                  isActive={isActive}
                  nodeRef={nodeRef}
                  onInput={onInput}
                  onKeyDown={(e) => {
                    onKeyDown(e)
                  }}
                  onClick={onClick}
                  onDelete={
                    isChildMedia && onDelete
                      ? () => onDelete(childNode.id)
                      : undefined
                  }
                  onCreateNested={onCreateNested}
                  depth={depth + 1}
                  readOnly={readOnly}
                  onImageDragStart={onImageDragStart}
                  onChangeBlockType={onChangeBlockType}
                  onInsertImage={onInsertImage}
                  onCreateList={onCreateList}
                  onCreateTable={onCreateTable}
                  onUploadImage={onUploadImage}
                  selectedImageIds={selectedImageIds}
                  onToggleImageSelection={onToggleImageSelection}
                  onClickWithModifier={onClickWithModifier}
                  onFlexContainerDragOver={onFlexContainerDragOver}
                  onFlexContainerDragLeave={onFlexContainerDragLeave}
                  onFlexContainerDrop={onFlexContainerDrop}
                  dragOverFlexId={dragOverFlexId}
                  flexDropPosition={flexDropPosition}
                  onSetDragOverNodeId={onSetDragOverNodeId}
                  onSetDropPosition={onSetDropPosition}
                  draggingNodeId={draggingNodeId}
                  onSetDraggingNodeId={onSetDraggingNodeId}
                />
              )

              // Wrap in flex item div
              return (
                <div
                  key={childNode.id}
                  className="max-w-full min-w-[280px] flex-1"
                >
                  {blockContent}
                </div>
              )
            })}
          </FlexContainer>
        )
      }

      case "nested-container": {
        const containerNode = effectiveNode as ContainerNode

        // Get container classes
        const containerClasses = getContainerClasses(false, isActive)

        return (
          <div
            key={effectiveNode.id}
            data-node-id={effectiveNode.id}
            data-node-type="container"
            className={containerClasses}
          >
            {containerNode.children.map((childNode: EditorNode) => {
              const isChildMedia =
                childNode &&
                "type" in childNode &&
                (childNode.type === "img" || childNode.type === "video")

              return (
                <Block
                  key={childNode.id}
                  nodeId={childNode.id}
                  isActive={isActive}
                  nodeRef={nodeRef}
                  onInput={onInput}
                  onKeyDown={(e) => {
                    onKeyDown(e)
                  }}
                  onClick={onClick}
                  onDelete={
                    isChildMedia && onDelete
                      ? () => onDelete(childNode.id)
                      : undefined
                  }
                  onCreateNested={onCreateNested}
                  depth={depth + 1}
                  readOnly={readOnly}
                  onImageDragStart={onImageDragStart}
                  onChangeBlockType={onChangeBlockType}
                  onInsertImage={onInsertImage}
                  onCreateList={onCreateList}
                  onCreateTable={onCreateTable}
                  onUploadImage={onUploadImage}
                  selectedImageIds={selectedImageIds}
                  onToggleImageSelection={onToggleImageSelection}
                  onClickWithModifier={onClickWithModifier}
                  onFlexContainerDragOver={onFlexContainerDragOver}
                  onFlexContainerDragLeave={onFlexContainerDragLeave}
                  onFlexContainerDrop={onFlexContainerDrop}
                  dragOverFlexId={dragOverFlexId}
                  flexDropPosition={flexDropPosition}
                  onSetDragOverNodeId={onSetDragOverNodeId}
                  onSetDropPosition={onSetDropPosition}
                  draggingNodeId={draggingNodeId}
                  onSetDraggingNodeId={onSetDraggingNodeId}
                />
              )
            })}
          </div>
        )
      }
    }

    // Cast to TextNode for remaining cases
    const textNode = effectiveNode as TextNode

    // BR elements render as empty space
    if (textNode.type === "br") {
      return (
        <div
          key={textNode.id}
          data-node-id={textNode.id}
          className="h-6"
          onClick={onClick}
        />
      )
    }

    // Image nodes render as ImageBlock
    if (textNode.type === "img") {
      return (
        <ImageBlock
          node={textNode}
          isActive={isActive}
          onClick={onClick}
          onDelete={onDelete}
          onDragStart={onImageDragStart}
          isSelected={selectedImageIds?.has(textNode.id)}
          onToggleSelection={onToggleImageSelection}
          onClickWithModifier={onClickWithModifier}
        />
      )
    }

    // Video nodes render as VideoBlock
    if (textNode.type === "video") {
      return (
        <VideoBlock
          node={textNode}
          isActive={isActive}
          onClick={onClick}
          onDelete={onDelete}
          onDragStart={onImageDragStart}
          isSelected={selectedImageIds?.has(textNode.id)}
          onToggleSelection={onToggleImageSelection}
          onClickWithModifier={onClickWithModifier}
        />
      )
    }

    // Build HTML callback
    const memoizedBuildHTML = useCallback(() => {
      return buildHTML(textNode, readOnly)
    }, [textNode, readOnly])

    // Save selection callback
    const memoizedSaveSelection = useCallback(() => {
      return saveSelection(localRef)
    }, [])

    // Restore selection callback
    const memoizedRestoreSelection = useCallback(
      (
        savedSelection: {
          start: number
          end: number
          collapsed: boolean
        } | null
      ) => {
        restoreSelection(localRef, savedSelection)
      },
      []
    )

    // Update content when needed
    useEffect(() => {
      if (!localRef.current) return

      if (isComposingRef.current || shouldPreserveSelectionRef.current) {
        return
      }

      const element = localRef.current
      const newHTML = memoizedBuildHTML()

      if (element.innerHTML !== newHTML) {
        const hadFocus = document.activeElement === element
        const savedSelectionData = hadFocus ? memoizedSaveSelection() : null

        element.innerHTML = newHTML

        if (hadFocus && savedSelectionData) {
          memoizedRestoreSelection(savedSelectionData)
        }
      }
    }, [memoizedBuildHTML, memoizedSaveSelection, memoizedRestoreSelection])

    // Create all handlers
    const handleCompositionStart = useCallback(
      createHandleCompositionStart()(isComposingRef),
      []
    )

    const handleCompositionEnd = useCallback(
      createHandleCompositionEnd()(isComposingRef),
      []
    )

    const handleInput = useCallback(
      createHandleInput({
        textNode,
        readOnly,
        onInput,
        onChangeBlockType,
        showCommandMenu,
        setShowCommandMenu,
        setCommandMenuAnchor,
        shouldPreserveSelectionRef,
      }),
      [textNode, readOnly, onInput, onChangeBlockType, showCommandMenu]
    )

    const handleKeyDown = useCallback(
      createHandleKeyDown({
        textNode,
        readOnly,
        onInput,
        onKeyDown,
        onClick,
        onCreateNested,
        onChangeBlockType,
        onInsertImage,
        onCreateList,
        // ✅ Pass getter function - only called when needed, doesn't cause re-renders
        currentContainer: () =>
          useEditorStore.getState().history[
            useEditorStore.getState().historyIndex
          ],
        dispatch,
        localRef,
        isComposingRef,
        shouldPreserveSelectionRef,
        showCommandMenu,
        setShowCommandMenu,
        setCommandMenuAnchor,
      }),
      [textNode, readOnly, onKeyDown, onCreateNested, showCommandMenu, dispatch]
    )

    const handleClick = useCallback(createHandleClick({ readOnly, onClick }), [
      readOnly,
      onClick,
    ])

    const handleCommandSelect = useCallback(
      createHandleCommandSelect({
        textNode,
        onChangeBlockType,
        onInsertImage,
        onCreateList,
        onCreateTable,
        localRef,
        setShowCommandMenu,
        setCommandMenuAnchor,
      }),
      [textNode, onChangeBlockType, onInsertImage, onCreateList, onCreateTable]
    )

    const handleBackgroundColorChange = useCallback(
      createHandleBackgroundColorChange(textNode, dispatch),
      [textNode, dispatch]
    )

    const handleBlockDragStartFn = useCallback(
      createHandleBlockDragStart(textNode, onBlockDragStart),
      [textNode, onBlockDragStart]
    )

    const handleBlockDragEndFn = useCallback(
      createHandleBlockDragEnd(() => {
        // Clear all drag states when drag ends (including cancelled drags)
        if (onSetDragOverNodeId && onSetDropPosition && onSetDraggingNodeId) {
          onSetDragOverNodeId(null)
          onSetDropPosition(null)
          onSetDraggingNodeId(null)
        }
      }),
      [onSetDragOverNodeId, onSetDropPosition, onSetDraggingNodeId]
    )

    // Touch handlers for mobile drag support
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        // Prevent default to stop scrolling
        e.preventDefault()
        e.stopPropagation()

        const touch = e.touches[0]
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        setIsDraggingTouch(true)

        // Trigger drag start
        if (onBlockDragStart && textNode?.id) {
          onBlockDragStart(textNode.id)
        }
      },
      [onBlockDragStart, textNode?.id]
    )

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!touchStartRef.current || !isDraggingTouch) return

        // Prevent default scrolling while dragging
        e.preventDefault()
        e.stopPropagation()

        // Highlight the drop target using the same state as desktop
        const touch = e.touches[0]
        const elementBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        )
        const targetBlock = elementBelow?.closest("[data-node-id]")

        if (targetBlock && onSetDragOverNodeId && onSetDropPosition) {
          const targetId = targetBlock.getAttribute("data-node-id")
          if (targetId && targetId !== textNode?.id) {
            onSetDragOverNodeId(targetId)
            onSetDropPosition("after") // Default to after position on mobile
          } else {
            onSetDragOverNodeId(null)
            onSetDropPosition(null)
          }
        }
      },
      [isDraggingTouch, textNode?.id, onSetDragOverNodeId, onSetDropPosition]
    )

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const touch = e.changedTouches[0]
        const elementBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        )

        // Find the closest block node
        const targetBlock = elementBelow?.closest("[data-node-id]")
        if (targetBlock && textNode?.id) {
          const targetId = targetBlock.getAttribute("data-node-id")
          if (targetId && targetId !== textNode.id && dispatch) {
            // Move the block
            dispatch({
              type: "MOVE_NODE",
              payload: {
                nodeId: textNode.id,
                targetId,
                position: "after",
              },
            })
          }
        }

        // Clean up
        touchStartRef.current = null
        setIsDraggingTouch(false)

        // Clear drop indicators using the same state as desktop
        if (onSetDragOverNodeId && onSetDropPosition) {
          onSetDragOverNodeId(null)
          onSetDropPosition(null)
        }
      },
      [textNode?.id, dispatch, onSetDragOverNodeId, onSetDropPosition]
    )

    const handleTouchCancel = useCallback(() => {
      // Clean up on touch cancel (e.g., user scrolled or drag was interrupted)
      touchStartRef.current = null
      setIsDraggingTouch(false)

      // Clear drop indicators
      if (onSetDragOverNodeId && onSetDropPosition) {
        onSetDragOverNodeId(null)
        onSetDropPosition(null)
      }
    }, [onSetDragOverNodeId, onSetDropPosition])

    // Handle cover image upload
    const handleCoverImageUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onUploadCoverImage) return

        setIsUploadingCover(true)
        try {
          const url = await onUploadCoverImage(file)
          const { EditorActions } = await import("./lib/reducer/actions")
          dispatch(
            EditorActions.setCoverImage({
              url,
              alt: file.name,
              position: 50,
            })
          )
        } catch (error) {
          console.error("Failed to upload cover image:", error)
        } finally {
          setIsUploadingCover(false)
          // Reset input value so the same file can be selected again
          if (coverImageInputRef.current) {
            coverImageInputRef.current.value = ""
          }
        }
      },
      [onUploadCoverImage, dispatch]
    )

    // Check if block is empty
    const textContent = getNodeTextContent(textNode)
    const isEmpty = !textContent || textContent.trim() === ""

    // Get placeholder from attributes
    const placeholder = textNode.attributes?.placeholder as string | undefined

    // Determine if this is a header block (h1) - headers don't show command menu
    const isHeaderBlock = textNode.type === "h1"

    // Show command menu placeholder only if no custom placeholder is set and not a header block
    const showCommandPlaceholder =
      isEmpty &&
      isActive &&
      !readOnly &&
      onChangeBlockType &&
      !placeholder &&
      !isHeaderBlock

    // Determine which HTML element to render based on type
    const ElementType =
      textNode.type === "li"
        ? "li"
        : textNode.type === "ol"
          ? "ol"
          : textNode.type === "h1"
            ? "h1"
            : textNode.type === "h2"
              ? "h2"
              : textNode.type === "h3"
                ? "h3"
                : textNode.type === "h4"
                  ? "h4"
                  : textNode.type === "h5"
                    ? "h5"
                    : textNode.type === "h6"
                      ? "h6"
                      : textNode.type === "p"
                        ? "p"
                        : textNode.type === "blockquote"
                          ? "blockquote"
                          : textNode.type === "code"
                            ? "pre"
                            : "div"

    const isListItem = textNode.type === "li" || textNode.type === "ol"

    // Get custom class from attributes
    const customClassName = textNode.attributes?.className || ""
    const isHexColor =
      typeof customClassName === "string" && customClassName.startsWith("#")
    const textColor = isHexColor ? customClassName : ""
    const className = isHexColor ? "" : customClassName

    // Get background color from attributes
    const backgroundColor = textNode.attributes?.backgroundColor as
      | string
      | undefined

    // Common props for all elements
    const commonProps = {
      key: textNode.id,
      "data-node-id": textNode.id,
      "data-node-type": textNode.type,
      "data-show-command-placeholder": showCommandPlaceholder
        ? "true"
        : undefined,
      contentEditable: !readOnly,
      suppressContentEditableWarning: true,
      ...(placeholder ? { placeholder } : {}),
      className: `!ml-6
        ${isListItem ? "relative" : ""} 
        ${getTypeClassName(textNode.type)}
        ${className}
        ${readOnly ? "" : "outline-none focus:outline-none focus:ring-0"}
        ${isListItem ? "px-3 py-0.5 mb-1 list-disc pl-6" : textNode.type.startsWith("h") ? "px-3 py-2 mb-2" : "px-3 py-1.5 mb-2"}
        ${textNode.type === "ol" ? "list-decimal" : ""}
        ${notionBased && isFirstBlock && textNode.type === "h1" ? "pb-4" : ""}
        transition-colors duration-150
        ${!readOnly && isActive ? "bg-gray-50/30" : ""}
        ${!readOnly ? "hover:bg-gray-50/30" : ""}
        ${readOnly ? "cursor-default" : ""}
        empty:before:content-[attr(placeholder)] empty:before:text-muted-foreground empty:before:opacity-40 empty:before:pointer-events-none
        ${isListItem ? "empty:before:inline-block empty:before:pl-1" : ""}
        selection:bg-blue-500/30 selection:text-inherit
        [&::marker]:mr-2
      `,
      style: {
        marginLeft: isListItem
          ? `${depth * 0.5 + 1.5}rem`
          : `${depth * 0.5}rem`,
        ...(textColor ? { color: textColor as string } : {}),
        ...(backgroundColor ? { backgroundColor: backgroundColor } : {}),
      },
      spellCheck: false,
    }

    return (
      <>
        <BlockContextMenu
          readOnly={readOnly}
          onBackgroundColorChange={handleBackgroundColorChange}
          currentBackgroundColor={backgroundColor}
        >
          <div
            className={`group relative transition-all ${
              isDraggingTouch || draggingNodeId === textNode?.id
                ? "scale-95 opacity-50"
                : ""
            }`}
            style={{
              borderTop: "2px solid transparent",
              borderBottom: "2px solid transparent",
            }}
          >
            {/* Drag Handle & Add Button - Mobile: inline, Desktop: absolute positioned */}
            {!readOnly && onBlockDragStart && (
              <div className="mb-1 flex items-center gap-0.5 transition-opacity duration-200 md:absolute md:top-1/2 md:left-0 md:mb-0 md:-ml-[2rem] md:-translate-y-1/2 md:opacity-0 md:group-hover:opacity-100">
                {/* Add Cover Button - Only show on first block in Notion mode if no cover */}
                {notionBased &&
                  isFirstBlock &&
                  !hasCoverImage &&
                  onUploadCoverImage && (
                    <>
                      <input
                        ref={coverImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageUpload}
                      />
                      <button
                        className="hover:bg-accent rounded p-0.5 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          coverImageInputRef.current?.click()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isUploadingCover}
                        title="Add Cover"
                      >
                        {isUploadingCover ? (
                          <div className="border-primary h-5 w-5 animate-spin rounded-full border-b-2" />
                        ) : (
                          <ImageIcon
                            className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors duration-200"
                            strokeWidth={1.5}
                          />
                        )}
                      </button>
                    </>
                  )}

                {/* Add Block Button */}
                <Popover
                  open={addBlockPopoverOpen}
                  onOpenChange={setAddBlockPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      className="hover:bg-accent rounded p-0.5 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Plus
                        className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors duration-200"
                        strokeWidth={1.5}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="flex flex-col gap-1">
                      {ELEMENT_OPTIONS.map((element) => {
                        const IconComponent = element.icon
                          ? iconMap[element.icon]
                          : null
                        return (
                          <Button
                            key={element.value}
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => {
                              dispatch({
                                type: "INSERT_NODE",
                                payload: {
                                  node: {
                                    id: `${element.value}-${Date.now()}`,
                                    type: element.value as TextNode["type"],
                                    content: "",
                                  },
                                  targetId: textNode.id,
                                  position: "after",
                                },
                              })
                              setAddBlockPopoverOpen(false)
                            }}
                          >
                            {IconComponent && (
                              <IconComponent
                                className={element.iconSize || "h-4 w-4"}
                              />
                            )}
                            <span>{element.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Drag Handle */}
                <div
                  draggable
                  onDragStart={handleBlockDragStartFn}
                  onDragEnd={handleBlockDragEndFn}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchCancel}
                  className={`cursor-grab p-0.5 active:cursor-grabbing ${isDraggingTouch ? "opacity-50" : ""}`}
                  style={{ touchAction: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical
                    className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors duration-200"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            )}

            <ElementType
              {...commonProps}
              key={textNode.id}
              ref={(el: HTMLElement | null) => {
                localRef.current = el
                nodeRef(el)
              }}
              onInput={readOnly ? undefined : (e) => handleInput(e as any)}
              onKeyDown={readOnly ? undefined : (e) => handleKeyDown(e as any)}
              onClick={(e) => handleClick(e as any)}
              onCompositionStart={readOnly ? undefined : handleCompositionStart}
              onCompositionEnd={readOnly ? undefined : handleCompositionEnd}
            />
          </div>
        </BlockContextMenu>

        {/* Command Menu */}
        {!readOnly && (
          <CommandMenu
            isOpen={showCommandMenu}
            onClose={() => setShowCommandMenu(false)}
            onSelect={handleCommandSelect}
            anchorElement={commandMenuAnchor}
            nodeId={textNode.id}
            onUploadImage={onUploadImage}
          />
        )}
      </>
    )
  },
  (prevProps, nextProps) => {
    // Simple memo comparison - only compare props that affect rendering
    // Node content changes are handled by useBlockNode's Zustand subscription
    
    // Always re-render if nodeId changed
    if (prevProps.nodeId !== nextProps.nodeId) return false
    
    // Re-render if active state changed
    if (prevProps.isActive !== nextProps.isActive) return false
    
    // Re-render if readOnly changed
    if (prevProps.readOnly !== nextProps.readOnly) return false
    
    // Re-render if depth changed
    if (prevProps.depth !== nextProps.depth) return false
    
    // Only re-render if THIS block's drag status changed
    // (i.e., this block started or stopped being dragged)
    const wasBeingDragged = prevProps.draggingNodeId === prevProps.nodeId
    const isBeingDragged = nextProps.draggingNodeId === nextProps.nodeId
    if (wasBeingDragged !== isBeingDragged) return false
    
    // Re-render if flex-related drag state changed for this block
    if (prevProps.dragOverFlexId !== nextProps.dragOverFlexId) return false
    if (prevProps.flexDropPosition !== nextProps.flexDropPosition) return false
    
    // Re-render if layout props changed
    if (prevProps.isFirstBlock !== nextProps.isFirstBlock) return false
    if (prevProps.notionBased !== nextProps.notionBased) return false
    if (prevProps.hasCoverImage !== nextProps.hasCoverImage) return false
    
    // Re-render if selected images changed
    if (prevProps.selectedImageIds !== nextProps.selectedImageIds) {
      if (prevProps.selectedImageIds?.size !== nextProps.selectedImageIds?.size) return false
      if (prevProps.selectedImageIds && nextProps.selectedImageIds) {
        for (const id of prevProps.selectedImageIds) {
          if (!nextProps.selectedImageIds.has(id)) return false
        }
      }
    }
    
    // Props are equal - but useBlockNode will still trigger re-renders when node data changes
    return true
  }
)
