'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tournament } from '@/types'
import { useState, useEffect } from 'react'
import { Trophy, Plus } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { canCreateResource, canManageResource } from '@/lib/permissions'

export default function TournamentsPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      if (!supabase) {
        setTournaments([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setTournaments(data)
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'draft':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'completed':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const handleDeleteTournament = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return

    try {
      if (!supabase) return

      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchTournaments()
    } catch (error) {
      console.error('Failed to delete tournament:', error)
      alert('Failed to delete tournament. Please try again.')
    }
  }

  return (
    <MainLayout currentView="tournaments-list">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-white">Tournaments</h1>
          {canCreateResource(userRole) && (
            <Button onClick={() => router.push('/tournaments/create')}>
              <Plus size={16} className="mr-2" />
              Create Tournament
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg py-12 text-center">
            <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tournaments configured yet.</p>
            <Button className="mt-4" onClick={() => router.push('/tournaments/create')}>
              Create Your First Tournament
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map(tournament => (
              <div key={tournament.id} className="bg-gray-900 border border-white/5 rounded-lg p-6 hover:border-cyan-400 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{tournament.tournament_name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="text-white font-semibold">{tournament.start_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="text-white font-semibold">{tournament.end_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Description</p>
                        <p className="text-white font-semibold">{tournament.description || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/tournaments/${tournament.id}`)}>
                      View Details
                    </Button>
                    {canManageResource(user, tournament.user_id, userRole) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteTournament(tournament.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
