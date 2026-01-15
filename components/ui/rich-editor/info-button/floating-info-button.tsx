"use client"

import React, { useState } from "react"
import {
  Info,
  HelpCircle,
  Lock,
  Key,
  Shield,
  Bell,
  Bookmark,
  Star,
  Heart,
  Lightbulb,
  MessageCircle,
  AlertCircle,
  X,
  LucideIcon,
} from "lucide-react"
import { InfoButtonConfig, InfoButtonIcon, InfoButtonPosition } from "./types"

// Icon mapping
const ICON_MAP: Record<InfoButtonIcon, LucideIcon> = {
  'info': Info,
  'help-circle': HelpCircle,
  'lock': Lock,
  'key': Key,
  'shield': Shield,
  'bell': Bell,
  'bookmark': Bookmark,
  'star': Star,
  'heart': Heart,
  'lightbulb': Lightbulb,
  'message-circle': MessageCircle,
  'alert-circle': AlertCircle,
}

// Position classes mapping - use larger offsets for better visibility
const POSITION_CLASSES: Record<InfoButtonPosition, string> = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
}

interface FloatingInfoButtonProps {
  config: InfoButtonConfig
  /** If true, shows in preview mode (no edit capabilities) */
  preview?: boolean
}

export function FloatingInfoButton({ config, preview = false }: FloatingInfoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!config.enabled) {
    return null
  }

  const IconComponent = ICON_MAP[config.icon]
  const positionClass = POSITION_CLASSES[config.position]

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed ${positionClass} z-[150] flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-200 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2`}
        style={{ 
          backgroundColor: config.color || '#3b82f6',
        }}
        aria-label={config.title}
      >
        <IconComponent
          className="w-6 h-6"
          style={{ color: config.textColor || '#ffffff' }}
        />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div 
            className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: config.color }}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className="w-6 h-6"
                  style={{ color: config.textColor }}
                />
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: config.textColor }}
                >
                  {config.title}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full transition-colors hover:bg-black/10"
                style={{ color: config.textColor }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {config.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
                {!config.content && (
                  <p className="text-gray-400 italic">No content provided.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: config.color }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

