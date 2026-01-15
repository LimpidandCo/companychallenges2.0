"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { 
  Bold, 
  Code, 
  Italic, 
  Link as LinkIcon, 
  Strikethrough, 
  Underline,
  Type,
  Minus,
  Plus,
  ChevronDown,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/rich-editor/hooks/use-toast"

import {
  CustomClassPopoverContent,
  LinkPopoverContent,
} from "./_toolbar-components"
import {
  getUserFriendlyClasses,
  searchUserFriendlyClasses,
} from "./class-mappings"
import { EditorActions } from "./lib/reducer/actions"
import { useEditorDispatch } from "./store/editor-store"
import { tailwindClasses } from "./tailwind-classes"
import { SelectionInfo } from "./types"
import { getReplacementInfo, mergeClasses } from "./utils/class-replacement"
import { restoreSelection } from "./utils/editor-helpers"

// Color presets
const COLOR_PRESETS = [
  { name: "Default", value: "inherit" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
]

// Font family presets
const FONT_PRESETS = [
  { name: "Default", value: "inherit", label: "Default" },
  { name: "Sans", value: "ui-sans-serif, system-ui, sans-serif", label: "Sans Serif" },
  { name: "Serif", value: "ui-serif, Georgia, serif", label: "Serif" },
  { name: "Mono", value: "ui-monospace, monospace", label: "Monospace" },
  { name: "Inter", value: "'Inter', sans-serif", label: "Inter" },
  { name: "Roboto", value: "'Roboto', sans-serif", label: "Roboto" },
  { name: "Playfair", value: "'Playfair Display', serif", label: "Playfair" },
  { name: "Poppins", value: "'Poppins', sans-serif", label: "Poppins" },
  { name: "Lato", value: "'Lato', sans-serif", label: "Lato" },
  { name: "Merriweather", value: "'Merriweather', serif", label: "Merriweather" },
]

// Text alignment options
const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
]

// Element type options
const ELEMENT_TYPES = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "blockquote", label: "Quote" },
]

interface SelectionToolbarProps {
  selection: SelectionInfo | null
  selectedColor: string
  editorRef: React.RefObject<HTMLDivElement | null>
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>
  onFormat: (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => void
  onTypeChange: (type: string) => void
  onColorSelect: (color: string) => void
  onFontSizeSelect: (fontSize: string) => void
}

export function SelectionToolbar({
  selection,
  selectedColor,
  editorRef,
  nodeRefs,
}: SelectionToolbarProps) {
  const dispatch = useEditorDispatch()
  const { toast } = useToast()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Save selection when toolbar appears
  const savedSelectionRef = useRef<SelectionInfo | null>(null)

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false)
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [classPopoverOpen, setClassPopoverOpen] = useState(false)

  // Link input
  const [hrefInput, setHrefInput] = useState("")
  
  // Class search
  const [searchQuery, setSearchQuery] = useState("")
  const [devMode, setDevMode] = useState(false)

  // Font size
  const [currentFontSize, setCurrentFontSize] = useState(16)
  
  // Font family
  const [currentFont, setCurrentFont] = useState("inherit")
  
  // Text alignment
  const [currentAlign, setCurrentAlign] = useState("left")

  // Save selection whenever it changes
  useEffect(() => {
    if (selection && selection.text.length > 0) {
      savedSelectionRef.current = selection
      if (selection.styles?.fontSize) {
        const size = parseInt(selection.styles.fontSize.replace("px", ""))
        if (!isNaN(size)) setCurrentFontSize(size)
      }
      if (selection.href) {
        setHrefInput(selection.href)
      }
    }
  }, [selection])

  // Position toolbar
  useEffect(() => {
    const anyDropdownOpen = typeDropdownOpen || colorDropdownOpen || fontDropdownOpen || linkPopoverOpen || classPopoverOpen
    
    if (anyDropdownOpen) return

    if (!selection || selection.text.length === 0) {
      setIsVisible(false)
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      if (savedSelectionRef.current && position.top !== 0) return
      setIsVisible(false)
      return
    }

    const range = domSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    if (rect.width === 0 && rect.height === 0) {
      if (position.top !== 0) return
      setIsVisible(false)
      return
    }

    // Use fixed positioning - position relative to viewport
    const toolbarHeight = 44
    const gap = 8
    const toolbarWidth = toolbarRef.current?.offsetWidth || 500

    // Center horizontally on selection
    let left = rect.left + rect.width / 2 - toolbarWidth / 2
    
    // Position above selection by default
    let top = rect.top - toolbarHeight - gap

    // Keep within viewport horizontally
    left = Math.max(16, Math.min(left, window.innerWidth - toolbarWidth - 16))

    // If toolbar would go above viewport, put it below selection
    if (top < 16) {
      top = rect.bottom + gap
    }

    setPosition({ top, left })
    setIsVisible(true)
  }, [selection, typeDropdownOpen, colorDropdownOpen, fontDropdownOpen, linkPopoverOpen, classPopoverOpen, position.top])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false)
        setColorDropdownOpen(false)
        setFontDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Format handler
  const handleFormat = useCallback((format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    const sel = savedSelectionRef.current
    if (!sel) return

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.toggleFormat(format))
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs])

  // Type change handler
  const handleTypeChange = useCallback((type: string) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      if (type !== "code") {
        dispatch(EditorActions.applyInlineElementType(type as any))
      }
      setTypeDropdownOpen(false)
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs])

  // Color handler
  const handleColor = useCallback((color: string) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.applyInlineStyle("color", color))
      setColorDropdownOpen(false)
      toast({ title: "Color applied", variant: "info" })
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs, toast])

  // Font size handler
  const handleFontSize = useCallback((delta: number) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    const newSize = Math.max(10, Math.min(72, currentFontSize + delta))
    setCurrentFontSize(newSize)

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.applyInlineStyle("fontSize", `${newSize}px`))
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs, currentFontSize])

  // Font family handler
  const handleFontFamily = useCallback((fontFamily: string) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    setCurrentFont(fontFamily)
    setFontDropdownOpen(false)

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.applyInlineStyle("fontFamily", fontFamily))
      toast({ title: "Font applied", variant: "info" })
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs, toast])

  // Text alignment handler
  const handleAlign = useCallback((align: string) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    setCurrentAlign(align)

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.applyInlineStyle("textAlign", align))
      toast({ title: `Aligned ${align}`, variant: "info" })
      setTimeout(() => {
        const element = nodeRefs.current.get(sel.nodeId)
        if (element) restoreSelection(element, sel.start, sel.end)
      }, 10)
    }, 0)
  }, [dispatch, nodeRefs, toast])

  // Link handlers
  const handleApplyLink = useCallback(() => {
    const sel = savedSelectionRef.current
    if (!sel || !hrefInput.trim()) return

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.applyLink(hrefInput.trim()))
      toast({ title: "Link applied" })
      setHrefInput("")
      setLinkPopoverOpen(false)
    }, 0)
  }, [dispatch, hrefInput, toast])

  const handleRemoveLink = useCallback(() => {
    const sel = savedSelectionRef.current
    if (!sel) return

    dispatch(EditorActions.setCurrentSelection(sel))
    setTimeout(() => {
      dispatch(EditorActions.removeLink())
      toast({ title: "Link removed" })
      setHrefInput("")
      setLinkPopoverOpen(false)
    }, 0)
  }, [dispatch, toast])

  // Class handler
  const handleApplyClass = useCallback((className: string) => {
    const sel = savedSelectionRef.current
    if (!sel) return

    const merged = mergeClasses(sel.className || "", className)

    dispatch(EditorActions.setCurrentSelection({
      ...sel,
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    }))
    setTimeout(() => {
      dispatch(EditorActions.applyCustomClass(merged))
      toast({ title: "Class applied", description: className })
      setClassPopoverOpen(false)
      setSearchQuery("")
    }, 0)
  }, [dispatch, toast])

  // Filter classes
  const filteredClasses = devMode
    ? searchQuery
      ? tailwindClasses.map(g => ({ ...g, classes: g.classes.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(g => g.classes.length > 0)
      : tailwindClasses
    : searchQuery
      ? searchUserFriendlyClasses(searchQuery)
      : getUserFriendlyClasses()

  const activeSelection = selection || savedSelectionRef.current
  const anyDropdownOpen = typeDropdownOpen || colorDropdownOpen || fontDropdownOpen || linkPopoverOpen || classPopoverOpen

  if (!activeSelection && !anyDropdownOpen) return null

  const formats = activeSelection?.formats || {
    bold: false, italic: false, underline: false, strikethrough: false, code: false,
  }
  const currentType = activeSelection?.elementType || "p"
  const currentTypeLabel = ELEMENT_TYPES.find(t => t.value === currentType)?.label || "Paragraph"
  const hasLink = Boolean(savedSelectionRef.current?.href)

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.1 }}
          ref={toolbarRef}
          className="fixed z-[300] pointer-events-auto flex items-center gap-1 rounded-lg shadow-xl bg-[#1e1e2e] border border-[#313244] px-2 py-1.5"
          style={{ top: position.top, left: position.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Type Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-200 hover:bg-[#313244] transition-colors"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setColorDropdownOpen(false) }}
            >
              <span>{currentTypeLabel}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {typeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl py-1 min-w-[140px] z-[400]">
                {ELEMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-sm hover:bg-[#313244] flex items-center justify-between",
                      currentType === type.value ? "text-blue-400" : "text-gray-200"
                    )}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClick={() => handleTypeChange(type.value)}
                  >
                    <span>{type.label}</span>
                    {currentType === type.value && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-[#313244]" />

          {/* Format Buttons */}
          <ToolbarButton icon={Bold} active={formats.bold} onClick={() => handleFormat("bold")} />
          <ToolbarButton icon={Italic} active={formats.italic} onClick={() => handleFormat("italic")} />
          <ToolbarButton icon={Underline} active={formats.underline} onClick={() => handleFormat("underline")} />
          <ToolbarButton icon={Strikethrough} active={formats.strikethrough} onClick={() => handleFormat("strikethrough")} />
          <ToolbarButton icon={Code} active={formats.code} onClick={() => handleFormat("code")} />

          <div className="w-px h-5 bg-[#313244]" />

          {/* Color Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-200 hover:bg-[#313244] transition-colors"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => { setColorDropdownOpen(!colorDropdownOpen); setTypeDropdownOpen(false) }}
            >
              <div className="w-4 h-4 rounded border border-gray-500" style={{ backgroundColor: selectedColor === "inherit" ? "#fff" : selectedColor }} />
              <ChevronDown className="h-3 w-3" />
            </button>
            {colorDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-2 z-[400]">
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-7 h-7 rounded border-2 transition-all",
                        selectedColor === color.value ? "border-blue-500 scale-110" : "border-transparent hover:border-gray-500"
                      )}
                      style={{ backgroundColor: color.value === "inherit" ? "#fff" : color.value }}
                      title={color.name}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={() => handleColor(color.value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-0.5">
            <button
              className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:bg-[#313244]"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => handleFontSize(-2)}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xs text-gray-300 w-6 text-center">{currentFontSize}</span>
            <button
              className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:bg-[#313244]"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => handleFontSize(2)}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-200 hover:bg-[#313244] transition-colors max-w-[80px]"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => { setFontDropdownOpen(!fontDropdownOpen); setTypeDropdownOpen(false); setColorDropdownOpen(false) }}
            >
              <span className="truncate">{FONT_PRESETS.find(f => f.value === currentFont)?.label || "Font"}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            {fontDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl py-1 min-w-[150px] max-h-[200px] overflow-y-auto z-[400]">
                {FONT_PRESETS.map((font) => (
                  <button
                    key={font.name}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-sm hover:bg-[#313244] flex items-center justify-between",
                      currentFont === font.value ? "text-blue-400" : "text-gray-200"
                    )}
                    style={{ fontFamily: font.value }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClick={() => handleFontFamily(font.value)}
                  >
                    <span>{font.label}</span>
                    {currentFont === font.value && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-[#313244]" />

          {/* Text Alignment */}
          <div className="flex items-center gap-0.5">
            {ALIGN_OPTIONS.map((align) => {
              const Icon = align.icon
              return (
                <button
                  key={align.value}
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center transition-colors",
                    currentAlign === align.value ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#313244]"
                  )}
                  title={`Align ${align.label}`}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={() => handleAlign(align.value)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>

          <div className="w-px h-5 bg-[#313244]" />

          {/* Link Button */}
          <div className="relative">
            <button
              className={cn(
                "w-7 h-7 rounded flex items-center justify-center transition-colors",
                hasLink ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#313244]"
              )}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => setLinkPopoverOpen(!linkPopoverOpen)}
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            {linkPopoverOpen && (
              <div className="absolute top-full right-0 mt-1 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-3 w-72 z-[400]">
                <LinkPopoverContent
                  hrefInput={hrefInput}
                  setHrefInput={setHrefInput}
                  hasExistingLink={hasLink}
                  selectedText={savedSelectionRef.current?.text || ""}
                  onApply={handleApplyLink}
                  onRemove={handleRemoveLink}
                />
              </div>
            )}
          </div>

          {/* Custom Class Button */}
          <div className="relative">
            <button
              className="w-7 h-7 rounded flex items-center justify-center text-gray-300 hover:bg-[#313244]"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => setClassPopoverOpen(!classPopoverOpen)}
            >
              <Type className="h-4 w-4" />
            </button>
            {classPopoverOpen && (
              <div className="absolute top-full right-0 mt-1 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-3 w-80 max-h-64 overflow-auto z-[400]">
                <CustomClassPopoverContent
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  devMode={devMode}
                  setDevMode={setDevMode}
                  filteredClasses={filteredClasses}
                  onApplyClass={handleApplyClass}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ToolbarButton({ 
  icon: Icon, 
  active, 
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void 
}) {
  return (
    <button
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center transition-colors",
        active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#313244]"
      )}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
