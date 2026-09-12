'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { ArrowLeft, Menu, Send, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthContext'
import { canManageResource } from '@/lib/permissions'
import { Auction, AuctionTeam, AuctionCategoryConfig, AuctionRegistration, AuctionEvent } from '@/types'
import { AuctionSidebar } from '@/components/dashboard/AuctionSidebar'
import { AuctionOverview } from '@/components/dashboard/AuctionOverview'
import { AuctionTeams } from '@/components/dashboard/AuctionTeams'
import { AuctionCategories } from '@/components/dashboard/AuctionCategories'
import { AuctionRegistrations } from '@/components/dashboard/AuctionRegistrations'

type DashboardView = 'overview' | 'teams' | 'categories' | 'registrations'

export default function AuctionDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [teams, setTeams] = useState<AuctionTeam[]>([])
  const [categoryConfigs, setCategoryConfigs] = useState<AuctionCategoryConfig[]>([])
  const [registrations, setRegistrations] = useState<AuctionRegistration[]>([])
  const [events, setEvents] = useState<AuctionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchAuctionData()
    }
  }, [user, authLoading, id])

  const fetchAuctionData = async () => {
    try {
      if (!supabase) return

      // Fetch auction details
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', id)
        .single()

      if (auctionError) throw auctionError
      setAuction(auctionData)

      // Fetch teams
      const { data: teamsData } = await supabase
        .from('auction_teams')
        .select('*')
        .eq('auction_id', id)

      if (teamsData) setTeams(teamsData)

      // Fetch category configurations
      const { data: categoryConfigsData } = await supabase
        .from('auction_category_config')
        .select('*')
        .eq('auction_id', id)

      if (categoryConfigsData) setCategoryConfigs(categoryConfigsData)

      // Fetch all events
      const { data: eventsData } = await supabase
        .from('auction_events')
        .select('*')
        .order('sort_order', { ascending: true })

      if (eventsData) setEvents(eventsData)

      // Fetch registrations (only for admins/creators)
      if (canManageResource(user, auctionData?.user_id, userRole)) {
        const { data: registrationsData } = await supabase
          .from('auction_registrations')
          .select('*')
          .eq('auction_id', id)

        if (registrationsData) setRegistrations(registrationsData)
      }
    } catch (error) {
      console.error('Failed to fetch auction data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
      case 'live':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'draft':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const handleCopyRegistrationLink = async () => {
    const registrationUrl = `${window.location.origin}/auctions/${id}/register`
    
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  const handlePublishAuction = async () => {
    if (!auction) return

    // Validation checks before publishing
    if (!auction.minimum_bid || !auction.bid_increment || !auction.auction_purse_amount) {
      alert('Please complete all bidding rules before publishing.')
      return
    }

    if (!auction.selected_events || auction.selected_events.length === 0) {
      alert('Please select at least one event before publishing.')
      return
    }

    if (teams.length === 0) {
      alert('Please add at least one team before publishing.')
      return
    }

    if (categoryConfigs.length === 0) {
      alert('Please configure categories before publishing.')
      return
    }

    // Check if all category configs have max players set
    const incompleteCategories = categoryConfigs.filter(config => !config.max_players)
    if (incompleteCategories.length > 0) {
      alert('Please set max players for all categories before publishing.')
      return
    }

    setPublishing(true)
    try {
      if (!supabase) {
        alert('Please configure Supabase credentials in .env.local')
        setPublishing(false)
        return
      }

      const { error } = await supabase
        .from('auctions')
        .update({ status: 'Published' })
        .eq('id', id)

      if (error) throw error

      // Refresh auction data
      await fetchAuctionData()
      alert('Auction published successfully! Users can now view and register for this auction.')
    } catch (error) {
      console.error('Failed to publish auction:', error)
      alert('Failed to publish auction. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <MainLayout currentView="dashboard" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!auction) {
    return (
      <MainLayout currentView="dashboard" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Auction not found</div>
        </div>
      </MainLayout>
    )
  }

  // Redirect non-admin users to view page
  if (!canManageResource(user, auction.user_id, userRole)) {
    router.push(`/auctions/${id}/view`)
    return null
  }

  return (
    <MainLayout currentView="dashboard" showHeader={false}>
      <div className="flex h-screen">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} className="text-white" />
          </Button>
        </div>

        {/* Sidebar */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
          <AuctionSidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            auctionStatus={auction.status}
            isMobile={false}
            onSettingsClick={() => router.push(`/auctions/${id}/edit`)}
          />
        </div>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <AuctionSidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              auctionStatus={auction.status}
              isMobile={true}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onSettingsClick={() => router.push(`/auctions/${id}/edit`)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-extrabold text-white">{auction.auction_name}</h1>
                  <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getStatusColor(auction.status)}`}>
                    {auction.status}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {auction.status === 'Draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePublishAuction}
                    disabled={publishing}
                    className="bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
                  >
                    <Send size={16} className="mr-2" />
                    {publishing ? 'Publishing...' : 'Publish Auction'}
                  </Button>
                )}
                {auction.status === 'Published' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRegistrationLink}
                    className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={16} className="mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push(`/auctions/${id}/edit`)}>
                  Edit Auction
                </Button>
              </div>
            </div>

            {/* Content based on current view */}
            {currentView === 'overview' && (
              <AuctionOverview 
                auction={auction} 
                teams={teams} 
                events={events}
                formatDate={formatDate} 
              />
            )}

            {currentView === 'teams' && (
              <AuctionTeams teams={teams} />
            )}

            {currentView === 'categories' && (
              <AuctionCategories categoryConfigs={categoryConfigs} />
            )}

            {currentView === 'registrations' && (
              <AuctionRegistrations 
                registrations={registrations}
                categoryConfigs={categoryConfigs}
                onRegistrationsChange={setRegistrations}
                auctionId={id}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
