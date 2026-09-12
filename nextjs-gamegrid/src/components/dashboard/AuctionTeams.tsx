'use client'

import { AuctionTeam } from '@/types'

interface AuctionTeamsProps {
  teams: AuctionTeam[]
}

export function AuctionTeams({ teams }: AuctionTeamsProps) {
  return (
    <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
      <h2 className="text-lg font-bold text-white mb-4">Teams</h2>
      {teams.length === 0 ? (
        <p className="text-gray-400">No teams configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="border border-white/5 rounded-lg p-4">
              <h3 className="text-md font-semibold text-white mb-2">{team.team_name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">Purse Amount</p>
                  <p className="text-white font-semibold">${team.purse_amount}</p>
                </div>
                <div>
                  <p className="text-gray-400">Remaining Purse</p>
                  <p className="text-white font-semibold">${team.remaining_purse}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}