'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthContext'
import { canCreateResource } from '@/lib/permissions'
import { AuctionEvent } from '@/types'
import { getCategoriesForEvents, CategoryConfig } from '@/lib/eventCategoryMapping'

export default function CreateAuctionPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [availableEvents, setAvailableEvents] = useState<AuctionEvent[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([])
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([])
  const [formData, setFormData] = useState({
    auction_name: '',
    event_name: '',
    category: '',
    description: '',
    auction_date: '',
    auction_venue: '',
    minimum_bid: null as number | null,
    bid_increment: null as number | null,
    auction_purse_amount: null as number | null,
    allow_retention: false,
    max_retained_players: 0,
    retention_price: 0,
    status: 'Draft' as const
  })
  const [teams, setTeams] = useState([{ team_name: '' }])

  useEffect(() => {
    if (!authLoading && user && !canCreateResource(userRole)) {
      setPermissionDenied(true)
      router.push('/')
    }
  }, [user, userRole, authLoading, router])

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    // Auto-populate categories based on selected events
    const selectedEvents = availableEvents.filter(event => selectedEventIds.includes(event.id))
    const categories = getCategoriesForEvents(selectedEvents)
    setCategoryConfigs(categories)
  }, [selectedEventIds, availableEvents])

  const fetchEvents = async () => {
    try {
      if (!supabase) return

      const { data } = await supabase
        .from('auction_events')
        .select('*')
        .order('sort_order', { ascending: true })

      if (data) setAvailableEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  if (authLoading) {
    return (
      <MainLayout currentView="create-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (permissionDenied) {
    return (
      <MainLayout currentView="create-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">You don't have permission to create auctions.</div>
        </div>
      </MainLayout>
    )
  }

  const handleAddTeam = () => {
    setTeams([...teams, { team_name: '' }])
  }

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index))
  }

  const handleTeamChange = (index: number, value: string) => {
    const newTeams = [...teams]
    newTeams[index] = { team_name: value }
    setTeams(newTeams)
  }

  const handleCategoryConfigChange = (index: number, field: 'minPlayers' | 'maxPlayers', value: number) => {
    const newConfigs = [...categoryConfigs]
    newConfigs[index] = { ...newConfigs[index], [field]: value }
    setCategoryConfigs(newConfigs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedEventIds.length === 0) {
      alert('Please select at least one event')
      return
    }

    if (!formData.minimum_bid || !formData.bid_increment || !formData.auction_purse_amount) {
      alert('Please fill in all bidding rules fields')
      return
    }

    setLoading(true)

    try {
      if (!supabase) {
        alert('Please configure Supabase credentials in .env.local')
        setLoading(false)
        return
      }

      // Create auction
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .insert({
          ...formData,
          events: selectedEventIds.join(','),
          selected_events: selectedEventIds,
          roster_rules: [],
          user_id: user?.id
        })
        .select()
        .single()

      if (auctionError) throw auctionError

      // Create category configurations
      if (categoryConfigs.length > 0) {
        const categoryConfigsToInsert = categoryConfigs.map(config => ({
          auction_id: auction.id,
          category_name: config.name,
          min_players: config.minPlayers,
          max_players: config.maxPlayers
        }))

        const { error: categoryConfigError } = await supabase
          .from('auction_category_config')
          .insert(categoryConfigsToInsert)

        if (categoryConfigError) throw categoryConfigError
      }

      // Create teams
      const teamsToInsert = teams.map(team => ({
        auction_id: auction.id,
        team_name: team.team_name,
        purse_amount: formData.auction_purse_amount || 0,
        remaining_purse: formData.auction_purse_amount || 0,
        minimum_players: 0, // Will be set based on category
        maximum_players: 99 // Will be set based on category
      }))

      const { error: teamsError } = await supabase
        .from('auction_teams')
        .insert(teamsToInsert)

      if (teamsError) throw teamsError

      router.push('/auctions')
    } catch (error) {
      console.error('Failed to create auction:', error)
      alert('Failed to create auction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout currentView="create-auction" showHeader={false}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-extrabold text-white">Create New Auction</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Auction Name *</label>
                <input
                  type="text"
                  required
                  value={formData.auction_name}
                  onChange={(e) => setFormData({ ...formData, auction_name: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Auction Date</label>
                <input
                  type="date"
                  value={formData.auction_date}
                  onChange={(e) => setFormData({ ...formData, auction_date: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Auction Venue</label>
                <input
                  type="text"
                  value={formData.auction_venue}
                  onChange={(e) => setFormData({ ...formData, auction_venue: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Events Selection */}
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Events Selection</h2>
            <MultiSelect
              options={availableEvents}
              selectedIds={selectedEventIds}
              onChange={setSelectedEventIds}
              placeholder="Select events"
              label="Select Events *"
            />
            {selectedEventIds.length === 0 && (
              <p className="text-red-500 text-sm mt-2">Please select at least one event</p>
            )}
          </div>

          {/* Category Configuration */}
          {categoryConfigs.length > 0 && (
            <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Category Configuration</h2>
              <p className="text-gray-400 text-sm mb-4">Categories are auto-populated based on selected events</p>
              <div className="space-y-4">
                {categoryConfigs.map((config, index) => (
                  <div key={index} className="border border-white/5 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-white mb-3">{config.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Min Players</label>
                        <input
                          type="number"
                          min="1"
                          value={config.minPlayers}
                          onChange={(e) => handleCategoryConfigChange(index, 'minPlayers', parseInt(e.target.value) || 1)}
                          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Max Players *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={config.maxPlayers || ''}
                          onChange={(e) => handleCategoryConfigChange(index, 'maxPlayers', parseInt(e.target.value) || 0)}
                          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bidding Rules */}
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Bidding Rules</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Bid *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.minimum_bid || ''}
                  onChange={(e) => setFormData({ ...formData, minimum_bid: parseFloat(e.target.value) || null })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bid Increment *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.bid_increment || ''}
                  onChange={(e) => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) || null })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Auction Purse Amount *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.auction_purse_amount || ''}
                  onChange={(e) => setFormData({ ...formData, auction_purse_amount: parseFloat(e.target.value) || null })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Teams Configuration */}
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Teams Configuration</h2>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTeam}>
                <Plus size={16} className="mr-2" />
                Add Team
              </Button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Common settings for all teams: Auction Purse Amount (${formData.auction_purse_amount || 0}), 
              Category Min/Max Players, Minimum Bid (${formData.minimum_bid || 0}), 
              Bid Increment (${formData.bid_increment || 0})
            </p>

            {teams.map((team, index) => (
              <div key={index} className="border border-white/5 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-white">Team {index + 1}</h3>
                  {teams.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTeam(index)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={team.team_name}
                    onChange={(e) => handleTeamChange(index, e.target.value)}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Auction'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
