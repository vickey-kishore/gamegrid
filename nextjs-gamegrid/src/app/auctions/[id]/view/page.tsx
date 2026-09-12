'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Copy, Check, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthContext'
import { canManageResource } from '@/lib/permissions'
import { Auction, AuctionTeam, AuctionCategoryConfig, AuctionEvent } from '@/types'

export default function ViewAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [teams, setTeams] = useState<AuctionTeam[]>([])
  const [categoryConfigs, setCategoryConfigs] = useState<AuctionCategoryConfig[]>([])
  const [events, setEvents] = useState<AuctionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    fetchAuctionData()
  }, [id])

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

  if (loading) {
    return (
      <MainLayout currentView="view-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!auction) {
    return (
      <MainLayout currentView="view-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Auction not found</div>
        </div>
      </MainLayout>
    )
  }

  // If user is admin/creator, redirect to dashboard
  if (canManageResource(user, auction.user_id, userRole)) {
    router.push(`/auctions/${id}/dashboard`)
    return null
  }

  return (
    <MainLayout currentView="view-auction" showHeader={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
          
          {auction.status === 'Published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRegistrationLink}
              className="bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20"
            >
              {copiedLink ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copy Registration Link
                </>
              )}
            </Button>
          )}
        </div>

        {/* Auction Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-sm">Auction Date</span>
            </div>
            <p className="text-white font-semibold">{formatDate(auction.auction_date)}</p>
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-sm">Venue</span>
            </div>
            <p className="text-white font-semibold">{auction.auction_venue || '-'}</p>
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-sm">Teams</span>
            </div>
            <p className="text-white font-semibold">{teams.length}</p>
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-sm">Categories</span>
            </div>
            <p className="text-white font-semibold">{categoryConfigs.length}</p>
          </div>
        </div>

        {/* Events */}
        {auction.selected_events && auction.selected_events.length > 0 && (
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Events</h2>
            <div className="flex flex-wrap gap-2">
              {auction.selected_events.map((eventId) => {
                const event = events.find(e => e.id === eventId)
                return (
                  <span key={eventId} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-sm">
                    {event ? event.name : `Event ${eventId}`}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Category Configurations */}
        {categoryConfigs.length > 0 && (
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryConfigs.map((config) => (
                <div key={config.id} className="border border-white/5 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-white mb-2">{config.category_name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Min Players</p>
                      <p className="text-white font-semibold">{config.min_players}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Max Players</p>
                      <p className="text-white font-semibold">{config.max_players}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {auction.description && (
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{auction.description}</p>
          </div>
        )}

        {/* Register Button */}
        {auction.status === 'Published' && (
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Ready to participate?</h3>
            <p className="text-gray-400 mb-4">Register now to join this auction</p>
            <Button
              onClick={() => router.push(`/auctions/${id}/register`)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Register for Auction
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}