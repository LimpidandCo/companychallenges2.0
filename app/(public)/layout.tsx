export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="min-h-screen bg-[var(--color-bg)]"
      style={{
        // Brand color can be injected via CSS variable from challenge data
        // e.g., style={{ '--brand-color': challenge.brand_color }}
      }}
    >
      {/* Mesh gradient background for visual interest */}
      <div className="fixed inset-0 mesh-gradient opacity-30 pointer-events-none" />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
