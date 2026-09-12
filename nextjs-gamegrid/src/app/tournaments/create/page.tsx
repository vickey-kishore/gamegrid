'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthContext'
import { canCreateResource } from '@/lib/permissions'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [formData, setFormData] = useState({
    tournament_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Draft' as const
  })

  useEffect(() => {
    if (!authLoading && user && !canCreateResource(userRole)) {
      setPermissionDenied(true)
      router.push('/')
    }
  }, [user, userRole, authLoading, router])

  if (authLoading) {
    return (
      <MainLayout currentView="create-tournament" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (permissionDenied) {
    return (
      <MainLayout currentView="create-tournament" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">You don't have permission to create tournaments.</div>
        </div>
      </MainLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!supabase) {
        alert('Please configure Supabase credentials in .env.local')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('tournaments')
        .insert({
          ...formData,
          user_id: user?.id
        })

      if (error) throw error

      router.push('/tournaments')
    } catch (error) {
      console.error('Failed to create tournament:', error)
      alert('Failed to create tournament. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout currentView="create-tournament" showHeader={false}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-extrabold text-white">Create New Tournament</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Tournament Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tournament Name *</label>
                <input
                  type="text"
                  required
                  value={formData.tournament_name}
                  onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
