'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/components/auth/AuthContext'

interface MainLayoutProps {
  children: React.ReactNode
  selectedAuctionId?: number | null
  currentView?: string
  showHeader?: boolean
}

export function MainLayout({
  children,
  selectedAuctionId,
  currentView,
  showHeader = true
}: MainLayoutProps) {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    console.log('MainLayout - user:', user?.email, 'loading:', loading, 'isConfigured:', isConfigured)
    // Only redirect to login if Supabase is configured and user is not authenticated
    if (isConfigured && !loading && !user) {
      console.log('Redirecting to login...')
      router.push('/login')
    }
  }, [user, loading, router, isConfigured])

  if (loading && isConfigured) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  // If Supabase is not configured, show the app without authentication
  // If configured but no user, don't render anything (redirect will happen)
  if (isConfigured && !user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#0B1020]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedAuctionId={selectedAuctionId}
        currentView={currentView}
      />

      <main
        className={`flex-1 flex flex-col min-h-screen bg-[#0B1020] transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {showHeader && (
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
