'use client'

import { Auction, AuctionTeam, AuctionEvent } from '@/types'
import { Calendar, MapPin, Coins, Users, Tag } from 'lucide-react'

interface AuctionOverviewProps {
  auction: Auction
  teams: AuctionTeam[]
  events: AuctionEvent[]
  formatDate: (dateString: string | null) => string
}

export function AuctionOverview({ auction, teams, events, formatDate }: AuctionOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Auction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Coins size={16} className="text-cyan-400" />
            <span className="text-gray-400 text-sm">Total Purse</span>
          </div>
          <p className="text-white font-semibold">${auction.auction_purse_amount || '-'}</p>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-cyan-400" />
            <span className="text-gray-400 text-sm">Teams</span>
          </div>
          <p className="text-white font-semibold">{teams.length}</p>
        </div>
      </div>

      {/* Events */}
      {auction.selected_events && auction.selected_events.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
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

      {/* Bidding Rules */}
      <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Bidding Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Minimum Bid</p>
            <p className="text-white font-semibold text-lg">${auction.minimum_bid || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Bid Increment</p>
            <p className="text-white font-semibold text-lg">${auction.bid_increment || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Auction Purse per Team</p>
            <p className="text-white font-semibold text-lg">${auction.auction_purse_amount || '-'}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {auction.description && (
        <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{auction.description}</p>
        </div>
      )}
    </div>
  )
}