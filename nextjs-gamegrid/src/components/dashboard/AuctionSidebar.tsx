'use client'

import { Button } from '@/components/ui/Button'
import { 
  LayoutDashboard, 
  Users, 
  Tag, 
  UserPlus, 
  Settings,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useState } from 'react'

type DashboardView = 'overview' | 'teams' | 'categories' | 'registrations'

interface AuctionSidebarProps {
  currentView: DashboardView
  onViewChange: (view: DashboardView) => void
  auctionStatus: string
  isMobile?: boolean
  onCloseMobile?: () => void
  onSettingsClick?: () => void
}

export function AuctionSidebar({ 
  currentView, 
  onViewChange, 
  auctionStatus,
  isMobile = false,
  onCloseMobile,
  onSettingsClick
}: AuctionSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    {
      id: 'overview' as DashboardView,
      label: 'Overview',
      icon: LayoutDashboard,
      alwaysVisible: true
    },
    {
      id: 'teams' as DashboardView,
      label: 'Teams',
      icon: Users,
      alwaysVisible: true
    },
    {
      id: 'categories' as DashboardView,
      label: 'Categories',
      icon: Tag,
      alwaysVisible: true
    },
    {
      id: 'registrations' as DashboardView,
      label: 'Registrations',
      icon: UserPlus,
      alwaysVisible: auctionStatus === 'Published'
    }
  ]

  return (
    <div className={`
      ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'relative'}
      ${collapsed && !isMobile ? 'w-20' : 'w-64'}
      bg-gray-900 border-r border-white/10 transition-all duration-300
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && !isMobile && (
          <h2 className="text-lg font-bold text-white">Dashboard</h2>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <Menu size={20} className="text-white" />
            ) : (
              <ChevronLeft size={20} className="text-white" />
            )}
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
          >
            <ChevronLeft size={20} className="text-white" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems
          .filter(item => item.alwaysVisible)
          .map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id)
                  if (isMobile && onCloseMobile) onCloseMobile()
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                  ${collapsed && !isMobile ? 'justify-center' : ''}
                `}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon size={20} />
                {(!collapsed || isMobile) && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
      </nav>

      {/* Admin Actions */}
      {!collapsed && onSettingsClick && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      )}
    </div>
  )
}