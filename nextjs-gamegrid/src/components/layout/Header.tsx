'use client'

import React from 'react'
import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { user, signOut, isConfigured } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || (isConfigured ? 'User' : 'Demo User')

  return (
    <header className="h-[70px] bg-[rgba(11,16,32,0.85)] backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex items-center bg-white/3 border border-white/8 rounded-lg px-3 py-2 w-80 focus-within:border-cyan-400 focus-within:shadow-[0_0_8px_rgba(22,224,255,0.2)] transition-all">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search tournaments, auctions, players..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ml-2 text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button className="p-2 border border-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-cyan-400 text-gray-900">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{userName}</span>
            <span className="text-xs text-gray-400">{isConfigured ? 'Organizer' : 'Demo Mode'}</span>
          </div>
          {isConfigured && (
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
