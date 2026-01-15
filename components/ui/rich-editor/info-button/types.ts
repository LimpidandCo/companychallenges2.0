/**
 * Info Button Configuration
 * Stores all settings for the floating info button
 */
export interface InfoButtonConfig {
  /** Whether the info button is enabled */
  enabled: boolean
  
  /** The icon name (from lucide-react) */
  icon: InfoButtonIcon
  
  /** The button background color (hex) */
  color: string
  
  /** The button text/icon color (hex) */
  textColor: string
  
  /** The title shown in the modal header */
  title: string
  
  /** The content/info shown in the modal body (supports markdown-like formatting) */
  content: string
  
  /** Fixed position of the button on the page */
  position: InfoButtonPosition
}

export type InfoButtonPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right'

export type InfoButtonIcon = 
  | 'info'
  | 'help-circle'
  | 'lock'
  | 'key'
  | 'shield'
  | 'bell'
  | 'bookmark'
  | 'star'
  | 'heart'
  | 'lightbulb'
  | 'message-circle'
  | 'alert-circle'

export const INFO_BUTTON_ICONS: { value: InfoButtonIcon; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'help-circle', label: 'Help' },
  { value: 'lock', label: 'Lock' },
  { value: 'key', label: 'Key' },
  { value: 'shield', label: 'Shield' },
  { value: 'bell', label: 'Bell' },
  { value: 'bookmark', label: 'Bookmark' },
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'message-circle', label: 'Message' },
  { value: 'alert-circle', label: 'Alert' },
]

export const INFO_BUTTON_POSITIONS: { value: InfoButtonPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

export const DEFAULT_INFO_BUTTON_CONFIG: InfoButtonConfig = {
  enabled: false,
  icon: 'info',
  color: '#3b82f6',
  textColor: '#ffffff',
  title: 'Information',
  content: '',
  position: 'bottom-right',
}

