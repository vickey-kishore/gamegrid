'use client'

import { AuctionRegistration, AuctionCategoryConfig } from '@/types'
import { Button } from '@/components/ui/Button'
import { Trash2, Filter } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuctionRegistrationsProps {
  registrations: AuctionRegistration[]
  categoryConfigs: AuctionCategoryConfig[]
  onRegistrationsChange: (registrations: AuctionRegistration[]) => void
  auctionId: string
}

export function AuctionRegistrations({ 
  registrations, 
  categoryConfigs, 
  onRegistrationsChange,
  auctionId 
}: AuctionRegistrationsProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')

  const handleDeleteRegistration = async (registrationId: number) => {
    if (!confirm('Are you sure you want to delete this registration?')) return

    try {
      if (!supabase) return

      const { error } = await supabase
        .from('auction_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      // Refresh registrations
      const { data: updatedRegistrations } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('auction_id', auctionId)

      if (updatedRegistrations) onRegistrationsChange(updatedRegistrations)
    } catch (error) {
      console.error('Failed to delete registration:', error)
      alert('Failed to delete registration. Please try again.')
    }
  }

  const getRegistrationCountByCategory = (categoryName: string) => {
    return registrations.filter(reg => reg.category === categoryName).length
  }

  const filteredRegistrations = selectedCategoryFilter === 'all' 
    ? registrations 
    : registrations.filter(reg => reg.category === selectedCategoryFilter)

  return (
    <div className="space-y-6">
      {/* Registration Statistics */}
      <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Registration Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryConfigs.map((config) => {
            const count = getRegistrationCountByCategory(config.category_name)
            return (
              <div key={config.id} className="border border-white/5 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-2">{config.category_name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Registered Players</span>
                  <span className="text-cyan-400 font-bold text-xl">{count}</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Max Players: {config.max_players}
                </div>
              </div>
            )
          })}
        </div>
        {registrations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Registrations</span>
              <span className="text-cyan-400 font-bold text-xl">{registrations.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Registered Players List */}
      {registrations.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Registered Players</h2>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categoryConfigs.map((config) => (
                  <option key={config.id} value={config.category_name}>
                    {config.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No registrations found for the selected category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Club</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">DOB</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Mobile</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{registration.name}</td>
                      <td className="py-3 px-4 text-white">{registration.category}</td>
                      <td className="py-3 px-4 text-white">{registration.club}</td>
                      <td className="py-3 px-4 text-white">{new Date(registration.dob).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-white">{registration.mobile_number}</td>
                      <td className="py-3 px-4 text-white">{registration.email}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRegistration(registration.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {registrations.length === 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-lg p-6 text-center">
          <p className="text-gray-400">No registrations yet. Share the registration link to start collecting player registrations.</p>
        </div>
      )}
    </div>
  )
}