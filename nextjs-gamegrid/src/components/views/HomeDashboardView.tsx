'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, ListCollapse, CalendarDays, Trophy, Coins, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Auction, Tournament } from '@/types'

interface AuctionWithVenue extends Auction {
  auction_venue?: string
}

export function HomeDashboardView() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [auctions, setAuctions] = useState<AuctionWithVenue[]>([])
  const [loading, setLoading] = useState(false)
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const stats = {
    upcomingTournaments: tournaments.filter(t => new Date(t.start_date) >= new Date()).length,
    upcomingAuctions: auctions.filter(a => a.status === 'Published' || a.status === 'Live').length,
    totalPlayers: 64,
    todaysMatches: 8
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      if (!supabase) {
        // Use mock data when Supabase is not configured
        const today = new Date()
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

        setTournaments([
          {
            id: 1,
            tournament_name: 'Summer Championship 2026',
            description: 'Annual badminton tournament featuring top players',
            start_date: today.toISOString().split('T')[0],
            end_date: nextMonth.toISOString().split('T')[0],
            status: 'Active',
            created_at: today.toISOString(),
            updated_at: today.toISOString()
          },
          {
            id: 2,
            tournament_name: 'Winter Cup',
            description: 'Indoor tournament series',
            start_date: nextMonth.toISOString().split('T')[0],
            end_date: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()).toISOString().split('T')[0],
            status: 'Draft',
            created_at: today.toISOString(),
            updated_at: today.toISOString()
          }
        ])

        setAuctions([
          {
            id: 1,
            auction_name: 'Player Auction 2026',
            event_name: 'Summer Championship',
            category: 'Badminton',
            events: 'Men Doubles,Mixed Doubles',
            roster_rules: [],
            allow_retention: false,
            max_retained_players: 0,
            retention_price: 0,
            auction_date: today.toISOString().split('T')[0],
            auction_venue: 'Main Sports Complex',
            description: 'Annual player auction for summer championship',
            minimum_bid: 1000,
            bid_increment: 100,
            auction_purse_amount: 50000,
            status: 'Published',
            is_deleted: false,
            created_at: today.toISOString(),
            updated_at: today.toISOString()
          }
        ])

        setLoading(false)
        return
      }

      const [toursRes, aucsRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
        supabase.from('auctions').select('*').eq('is_deleted', false).order('created_at', { ascending: false })
      ])

      if (toursRes.data) setTournaments(toursRes.data)
      if (aucsRes.data) setAuctions(aucsRes.data)
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const nearestTournament = tournaments.length > 0
    ? tournaments
      .filter(t => new Date(t.end_date) >= new Date())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] || tournaments[0]
    : null

  const countdownText = nearestTournament ? (() => {
    const today = new Date()
    const start = new Date(nearestTournament.start_date)
    const diffTime = start.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 1) return `Starts in ${diffDays} days`
    if (diffDays === 1) return 'Starts tomorrow'
    if (diffDays === 0) return 'Starts today'
    return 'Happening now'
  })() : ''

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
    setSelectedDay(null)
  }

  const goToToday = () => {
    const now = new Date()
    setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDay(now.getDate())
  }

  const calendarDays = (() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const days: (number | null)[] = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i)
    }
    return days
  })()

  const monthName = React.useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`
  }, [calendarDate])

  const shortMonthName = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[calendarDate.getMonth()]
  }, [calendarDate])

  const selectedDayEvents = React.useMemo(() => {
    if (!selectedDay) return { tournaments: [], auctions: [] }
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

    const matchedTournaments = tournaments.filter(t => dayStr >= t.start_date && dayStr <= t.end_date)
    const matchedAuctions = auctions.filter(a => a.auction_date === dayStr)

    return { tournaments: matchedTournaments, auctions: matchedAuctions }
  }, [selectedDay, calendarDate, tournaments, auctions])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'registration open':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'upcoming':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      {nearestTournament && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/5 border border-cyan-500/15 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-cyan-500/5">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-lg bg-cyan-400 border-2 border-cyan-400 flex items-center justify-center">
              <Trophy size={40} className="text-gray-900" />
            </div>
            <div>
              <span className="inline-block bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded mb-2 tracking-wider">
                {countdownText}
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-wide">
                {nearestTournament.tournament_name}
              </h2>
              <div className="flex gap-4 mt-2 text-gray-400 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-cyan-400" />
                  <span className="font-semibold">Tournament Venue</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-cyan-400" />
                  <span className="font-semibold">{nearestTournament.start_date} to {nearestTournament.end_date}</span>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push(`/tournaments/${nearestTournament.id}`)}>
            View Tournament
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border-l-4 border-cyan-400 rounded-lg p-4 cursor-pointer hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Upcoming Tournaments</p>
              <p className="text-3xl font-extrabold text-white mt-1">{stats.upcomingTournaments}</p>
              <p className="text-xs text-cyan-400 font-semibold mt-1">Active Scheduler</p>
            </div>
            <Trophy size={28} className="text-cyan-400" />
          </div>
        </div>

        <div className="bg-gray-900 border-l-4 border-pink-500 rounded-lg p-4 cursor-pointer hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Auctions</p>
              <p className="text-3xl font-extrabold text-white mt-1">{stats.upcomingAuctions}</p>
              <p className="text-xs text-pink-500 font-semibold mt-1">Bidding Rooms</p>
            </div>
            <Coins size={28} className="text-pink-500" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Listings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tournaments Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-white">Tournaments Hub</h3>
              <span className="text-xs border border-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                {tournaments.length} total
              </span>
            </div>

            <div className="grid gap-4">
              {tournaments.length === 0 ? (
                <div className="border border-dashed border-white/5 rounded-lg py-8 text-center text-gray-400">
                  No tournaments configured.
                </div>
              ) : (
                tournaments.map(tour => (
                  <div key={tour.id} className="bg-gray-900 border border-white/5 rounded-lg p-4 hover:border-cyan-400 transition-colors">
                    <div className="flex gap-3 items-start">
                      <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Trophy size={24} className="text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-bold text-white">{tour.tournament_name}</h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(tour.status)}`}>
                            {tour.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-gray-400 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin size={13} className="text-cyan-400" />
                            <span>Tournament Venue</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-cyan-400" />
                            <span>{tour.start_date} to {tour.end_date}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/tournaments/${tour.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auctions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-white">Auction Rooms</h3>
              <span className="text-xs border border-pink-500/20 text-pink-500 px-2 py-1 rounded">
                {auctions.length} total
              </span>
            </div>

            <div className="grid gap-4">
              {auctions.length === 0 ? (
                <div className="border border-white/5 rounded-lg py-8 text-center text-gray-400">
                  No auctions configured.
                </div>
              ) : (
                auctions.map(auc => (
                  <div key={auc.id} className="bg-gray-900 border border-white/5 rounded-lg p-4 hover:border-pink-500 transition-colors">
                    <div className="flex gap-3 items-start">
                      <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Coins size={24} className="text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-bold text-white">{auc.auction_name}</h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(auc.status)}`}>
                            {auc.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-gray-400 text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="text-white font-semibold ml-1">{auc.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Event:</span>
                            <span className="text-white font-semibold ml-1">{auc.event_name}</span>
                          </div>
                          {auc.auction_date && (
                            <div className="flex items-center gap-1">
                              <Calendar size={13} className="text-pink-500" />
                              <span>{formatDate(auc.auction_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="secondary" size="sm" onClick={() => router.push(`/auctions/${auc.id}/dashboard`)}>
                        Open Board
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="p-1 text-white hover:bg-white/10 rounded">
                  <ChevronLeft size={16} />
                </button>
                <h4 className="text-lg font-bold text-white min-w-[110px] text-center">{monthName}</h4>
                <button onClick={handleNextMonth} className="p-1 text-white hover:bg-white/10 rounded">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Today
                </button>
                <CalendarDays size={18} className="text-cyan-400" />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={`day-${i}`} className="text-xs font-bold text-gray-400">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => {
                const todayObj = new Date()
                const isToday = day === todayObj.getDate() &&
                  calendarDate.getMonth() === todayObj.getMonth() &&
                  calendarDate.getFullYear() === todayObj.getFullYear()

                const isSelected = day === selectedDay

                const year = calendarDate.getFullYear()
                const month = calendarDate.getMonth()
                const dayStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''

                const hasTournament = day ? tournaments.some(t => dayStr >= t.start_date && dayStr <= t.end_date) : false
                const hasAuction = day ? auctions.some(a => a.auction_date === dayStr) : false

                const showBorder = hasTournament || hasAuction
                const borderClass = hasAuction ? 'border-pink-500/40' : 'border-cyan-500/40'
                const dotClass = hasAuction ? 'bg-pink-500' : 'bg-cyan-400'

                return (
                  <div
                    key={idx}
                    className={`py-2 rounded-lg text-sm font-medium cursor-pointer relative
                      ${isToday ? 'bg-cyan-400 text-gray-900' : isSelected ? 'bg-cyan-400/15 text-white border border-cyan-400 shadow-[0_0_8px_rgba(22,224,255,0.3)]' : showBorder ? `border ${borderClass} text-white` : day ? 'text-white' : 'transparent'}
                      ${day ? 'hover:bg-white/5' : ''}`}
                    onClick={() => day && setSelectedDay(day)}
                  >
                    {day}
                    {showBorder && (
                      <div className={`w-1 h-1 rounded-full ${dotClass} absolute bottom-1 left-1/2 -translate-x-1/2`} />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/5 my-4" />

            {selectedDay ? (
              <div>
                <h5 className="text-sm font-bold text-cyan-400 mb-3">
                  Events on {selectedDay} {shortMonthName}, {calendarDate.getFullYear()}
                </h5>

                <div className="flex flex-col gap-2">
                  {selectedDayEvents.tournaments.length === 0 && selectedDayEvents.auctions.length === 0 ? (
                    <p className="text-xs text-gray-400">No events scheduled on this day.</p>
                  ) : (
                    <>
                      {selectedDayEvents.tournaments.map(t => (
                        <div key={t.id} className="p-2 border border-cyan-500/10 bg-cyan-500/5 rounded-lg">
                          <div className="flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span className="text-sm font-bold">{t.tournament_name}</span>
                          </div>
                          <p className="text-xs text-gray-400 ml-4 mt-1">Venue: Tournament Venue</p>
                        </div>
                      ))}
                      {selectedDayEvents.auctions.map(a => (
                        <div key={a.id} className="p-2 border border-pink-500/10 bg-pink-500/5 rounded-lg">
                          <div className="flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            <span className="text-sm font-bold">{a.auction_name}</span>
                          </div>
                          <p className="text-xs text-gray-400 ml-4 mt-1">Category: {a.category} • Live Room</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Select a day above to list scheduled tournaments or auctions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
