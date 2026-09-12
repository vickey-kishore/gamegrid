'use client'

import React from 'react'
import {
  Home, Trophy, Coins, Target, FileText, Settings,
  HelpCircle, ChevronLeft, ChevronRight, PlaySquare, Landmark
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedAuctionId?: number | null
  currentView?: string
}

export function Sidebar({ isOpen, onToggle, selectedAuctionId, currentView }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/') return true
    return pathname === path
  }

  const navigate = (path: string) => {
    router.push(path)
  }

  const handleFeaturePlaceholder = (featureName: string) => {
    alert(`${featureName} module is under development and will be released in the upcoming update.`)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 transition-all duration-300 ease-in-out flex flex-col overflow-y-auto
          ${isOpen ? 'w-64 translate-x-0 bg-gray-900 border-r border-white/5' : 'w-0 -translate-x-full'}`}
      >
        {/* Logo Section */}
        <div
          className="p-4 flex flex-col gap-1 border-b border-white/5 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
            GAMEGRID
          </h1>
          <p className="text-cyan-400 font-bold text-xs tracking-widest uppercase">
            SPORTS HUB
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-2 flex flex-col gap-1 flex-1">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
              ${isActive('/') || isActive('/dashboard')
                ? 'text-cyan-400 bg-cyan-400/5'
                : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
          >
            <Home size={18} />
            Dashboard
          </button>

          <button
            onClick={() => navigate('/tournaments')}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
              ${pathname?.startsWith('/tournaments')
                ? 'text-cyan-400 bg-cyan-400/5'
                : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
          >
            <Trophy size={18} />
            Tournaments
          </button>

          <button
            onClick={() => navigate('/auctions')}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
              ${pathname?.startsWith('/auctions')
                ? 'text-cyan-400 bg-cyan-400/5'
                : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
          >
            <Coins size={18} />
            Auctions
          </button>

          <button
            onClick={() => handleFeaturePlaceholder('Fixtures')}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
              ${pathname?.startsWith('/fixtures')
                ? 'text-cyan-400 bg-cyan-400/5'
                : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
          >
            <Target size={18} />
            Fixtures
          </button>

          <button
            onClick={() => handleFeaturePlaceholder('Reports')}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/2 transition-colors"
          >
            <FileText size={18} />
            Reports
          </button>

          <button
            onClick={() => handleFeaturePlaceholder('Settings')}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/2 transition-colors"
          >
            <Settings size={18} />
            Settings
          </button>

          {/* Active Bidding Room */}
          {selectedAuctionId && (currentView === 'dashboard' || currentView === 'rosters') && (
            <div className="mt-4 pt-2 border-t border-white/5 flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Active Bidding Room
              </p>
              <button
                onClick={() => navigate(`/auctions/${selectedAuctionId}/dashboard`)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentView === 'dashboard'
                    ? 'text-pink-500 bg-pink-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
              >
                <PlaySquare size={16} />
                Live Board
              </button>
              <button
                onClick={() => navigate(`/auctions/${selectedAuctionId}/rosters`)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentView === 'rosters'
                    ? 'text-pink-500 bg-pink-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/2'}`}
              >
                <Landmark size={16} />
                Roster Table
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/5 flex flex-col gap-1">
          <button
            onClick={() => alert('Support ticket center is opening. Contact us at support@gamegrid.com')}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            <HelpCircle size={16} />
            Need Help?
          </button>
          <p className="text-center text-xs text-gray-400 mt-1">GameGrid v1.0.0</p>
          <p className="text-center text-xs text-gray-600">© 2026 GameGrid. All rights reserved.</p>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ease-in-out
          w-8 h-8 bg-gray-800 border border-white/10 rounded-lg flex items-center justify-center
          text-cyan-400 hover:bg-gray-700 hover:text-white hover:border-cyan-400 shadow-lg
          ${isOpen ? 'left-60' : 'left-2'}`}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </>
  )
}
