export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="min-h-screen bg-[var(--color-bg)]"
      style={{
        // Brand color can be injected via CSS variable from challenge data
        // e.g., style={{ '--brand-color': challenge.brand_color }}
      }}
    >
      {children}
    </div>
  )
}

