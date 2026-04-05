import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function AdminLayout({ title, subtitle, actions, children }: Props) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#fafaf9' }}>
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 200 }}>
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 border-b border-[#e8e8e8]"
          style={{ backgroundColor: '#fafaf9', height: 64 }}
        >
          <div>
            <h1 className="text-[17px] font-bold text-[#1a1a1a] leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#aaa] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
