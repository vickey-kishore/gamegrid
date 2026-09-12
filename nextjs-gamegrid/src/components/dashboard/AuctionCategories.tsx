'use client'

import { AuctionCategoryConfig } from '@/types'

interface AuctionCategoriesProps {
  categoryConfigs: AuctionCategoryConfig[]
}

export function AuctionCategories({ categoryConfigs }: AuctionCategoriesProps) {
  return (
    <div className="bg-gray-900 border border-white/5 rounded-lg p-6">
      <h2 className="text-lg font-bold text-white mb-4">Category Configurations</h2>
      {categoryConfigs.length === 0 ? (
        <p className="text-gray-400">No categories configured yet.</p>
      ) : (
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
      )}
    </div>
  )
}