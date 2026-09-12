'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Auction } from '@/types'
import { useState, useEffect } from 'react'
import { Coins, Plus, Info as InfoIcon, Send, Copy, Check } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { canCreateResource, canManageResource } from '@/lib/permissions'

export default function AuctionsPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [copiedAuctionId, setCopiedAuctionId] = useState<number | null>(null)

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      if (!supabase) {
        setAuctions([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('auctions')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (data) setAuctions(data)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleDeleteAuction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this auction?')) return

    try {
      if (!supabase) return

      const { error } = await supabase
        .from('auctions')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) throw error

      fetchAuctions()
    } catch (error) {
      console.error('Failed to delete auction:', error)
      alert('Failed to delete auction. Please try again.')
    }
  }

  const handlePublishAuction = async (id: number) => {
    try {
      if (!supabase) return

      const { error } = await supabase
        .from('auctions')
        .update({ status: 'Published' })
        .eq('id', id)

      if (error) throw error

      fetchAuctions()
      alert('Auction published successfully!')
    } catch (error) {
      console.error('Failed to publish auction:', error)
      alert('Failed to publish auction. Please try again.')
    }
  }

  const handleCopyRegistrationLink = async (auctionId: number) => {
    const registrationUrl = `${window.location.origin}/auctions/${auctionId}/register`
    
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopiedAuctionId(auctionId)
      setTimeout(() => setCopiedAuctionId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  return (
    <MainLayout currentView="auctions-list">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-white">Auction Rooms</h1>
          {canCreateResource(userRole) && (
            <Button onClick={() => router.push('/auctions/create')}>
              <Plus size={16} className="mr-2" />
              Create Auction
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : auctions.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg py-12 text-center">
            <Coins size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No auctions configured yet.</p>
            <Button className="mt-4" onClick={() => router.push('/auctions/create')}>
              Create Your First Auction
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {auctions.map(auction => (
              <div key={auction.id} className="bg-gray-900 border border-white/5 rounded-lg p-6 hover:border-cyan-400 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{auction.auction_name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </span>
                      {auction.description && (
                        <button
                          onClick={() => setSelectedAuction(auction)}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="View description"
                        >
                          <InfoIcon size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Auction Name</p>
                        <p className="text-white font-semibold">{auction.auction_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Auction Venue</p>
                        <p className="text-white font-semibold">{auction.auction_venue || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Auction Date</p>
                        <p className="text-white font-semibold">{formatDate(auction.auction_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Min Bid</p>
                        <p className="text-white font-semibold">${auction.minimum_bid || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canManageResource(user, auction.user_id, userRole) ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/auctions/${auction.id}/dashboard`)}>
                          Open Board
                        </Button>
                        {auction.status === 'Draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishAuction(auction.id)}
                            className="bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
                          >
                            <Send size={16} className="mr-2" />
                            Publish
                          </Button>
                        )}
                        {auction.status === 'Published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyRegistrationLink(auction.id)}
                            className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20"
                          >
                            {copiedAuctionId === auction.id ? (
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
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/auctions/${auction.id}/edit`)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteAuction(auction.id)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/auctions/${auction.id}/view`)}>
                          View Details
                        </Button>
                        {auction.status === 'Published' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/auctions/${auction.id}/register`)}
                              className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20"
                            >
                              Register
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyRegistrationLink(auction.id)}
                              className="bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20"
                            >
                              {copiedAuctionId === auction.id ? (
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
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAuction(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Auction Description</h3>
              <button
                onClick={() => setSelectedAuction(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{selectedAuction.description || 'No description available.'}</p>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
