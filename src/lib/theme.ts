/**
 * Professional DevOps Design System
 * Enterprise-grade theme configuration
 */

export const theme = {
  // Base backgrounds - Deep neutral foundation
  bg: {
    primary: '#0B0F1A',      // Main background - dark slate
    secondary: '#111827',    // Card/panel background
    tertiary: '#1F2937',     // Elevated elements
    hover: '#374151',        // Hover states
  },
  
  // Borders - Subtle, professional separation
  border: {
    default: '#1F2937',      // Standard borders
    subtle: '#374151',       // Lighter borders
    focus: '#4B5563',        // Focus states
  },
  
  // Text hierarchy - Clear, professional typography
  text: {
    primary: '#E5E7EB',      // Primary text - high contrast
    secondary: '#9CA3AF',    // Secondary text - medium contrast
    muted: '#6B7280',        // Muted text - low contrast
    inverse: '#111827',      // For light backgrounds
  },
  
  // Status colors - Toned down, professional
  status: {
    success: '#16A34A',      // Green - healthy/running (toned down)
    warning: '#F59E0B',      // Amber - warning
    error: '#EF4444',        // Red - critical/error
    info: '#3B82F6',         // Blue - info
  },
  
  // Accent colors - Professional green as primary
  accent: {
    primary: '#16A34A',      // Professional green
    soft: 'rgba(22,163,74,0.15)',  // Soft background highlight
    secondary: '#3B82F6',    // Blue accent
    tertiary: '#14B8A6',     // Teal accent
  },
  
  // Professional shadows - NO glow
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 2px 4px 0 rgb(0 0 0 / 0.4)',
    lg: '0 4px 8px 0 rgb(0 0 0 / 0.5)',
  },
  
  // Typography scale - Clear hierarchy
  typography: {
    h1: { size: '24px', weight: '600', spacing: '0.3px' },
    h2: { size: '18px', weight: '500', spacing: '0.2px' },
    body: { size: '14px', weight: '400' },
    caption: { size: '12px', weight: '400' },
  },

  // Subtle gradients - Only for backgrounds
  gradient: {
    success: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.02) 100%)',
    warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
    error: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)',
    neutral: 'linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(17, 24, 39, 0.3) 100%)',
  },
} as const;

// Professional CSS classes - Production-ready patterns
export const themeClasses = {
  // Page wrapper
  page: 'min-h-screen bg-[#0B0F1A]',
  
  // Container with consistent padding
  container: 'p-4 md:p-6 space-y-6 overflow-auto h-full',
  
  // Professional card design
  card: 'bg-[#111827] border border-[#1F2937] rounded-lg p-4 transition-all duration-200',
  cardHover: 'hover:border-[#374151]',
  cardShadow: 'shadow-[0_1px_2px_0_rgb(0_0_0_/_0.3)]',
  
  // Header structure
  header: 'bg-[#0B0F1A] border-b border-[#1F2937] pb-4',
  headerTitle: 'text-xl md:text-2xl font-semibold text-[#E5E7EB] tracking-wide',
  headerSubtitle: 'text-sm text-[#9CA3AF] mt-1.5',
  
  // Professional status badges
  statusSuccess: 'bg-green-600/10 text-green-500 border border-green-600/25 text-xs',
  statusWarning: 'bg-amber-500/10 text-amber-500 border border-amber-500/25 text-xs',
  statusError: 'bg-red-500/10 text-red-500 border border-red-500/25 text-xs',
  statusInfo: 'bg-blue-500/10 text-blue-500 border border-blue-500/25 text-xs',
  
  // Metric cards - Data visualization style
  metricCard: 'bg-[#111827] border border-[#1F2937] rounded-lg p-4',
  metricLabel: 'text-xs text-[#9CA3AF] uppercase tracking-wider font-medium',
  metricValue: 'text-2xl font-semibold text-[#E5E7EB] mt-1',
  metricUnit: 'text-sm text-[#6B7280] ml-1',
  
  // Button styles
  btnPrimary: 'bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors',
  btnSecondary: 'bg-transparent border border-[#374151] text-[#E5E7EB] hover:border-[#4B5563]',
  
  // Grid system
  grid: 'grid gap-4',
  grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
} as const;

export default theme;
