import { AuctionEvent } from '@/types'

export interface CategoryConfig {
  name: string
  minPlayers: number
  maxPlayers: number | null
}

export function getCategoriesForEvents(events: AuctionEvent[]): CategoryConfig[] {
  const categoryMap = new Map<string, CategoryConfig>()

  events.forEach(event => {
    const category = getCategoryForEvent(event.name)
    if (category && !categoryMap.has(category.name)) {
      categoryMap.set(category.name, category)
    }
  })

  return Array.from(categoryMap.values())
}

function getCategoryForEvent(eventName: string): CategoryConfig | null {
  const lowerEventName = eventName.toLowerCase()

  // Men events
  if (lowerEventName.includes('men') && !lowerEventName.includes('under') && !lowerEventName.includes('veteran') && !lowerEventName.includes('jumbled')) {
    return { name: 'Men', minPlayers: 1, maxPlayers: null }
  }

  // Women events
  if (lowerEventName.includes('women') && !lowerEventName.includes('under') && !lowerEventName.includes('veteran') && !lowerEventName.includes('jumbled')) {
    return { name: 'Women', minPlayers: 1, maxPlayers: null }
  }

  // Under 19 boys events
  if (lowerEventName.includes('under 19') && lowerEventName.includes('boys')) {
    return { name: 'Under 19 Boys', minPlayers: 1, maxPlayers: null }
  }

  // Under 19 girls events
  if (lowerEventName.includes('under 19') && lowerEventName.includes('girls')) {
    return { name: 'Under 19 Girls', minPlayers: 1, maxPlayers: null }
  }

  // Under 17 boys events
  if (lowerEventName.includes('under 17') && lowerEventName.includes('boys')) {
    return { name: 'Under 17 Boys', minPlayers: 1, maxPlayers: null }
  }

  // Under 17 girls events
  if (lowerEventName.includes('under 17') && lowerEventName.includes('girls')) {
    return { name: 'Under 17 Girls', minPlayers: 1, maxPlayers: null }
  }

  // Veteran men / Jumbled men events
  if ((lowerEventName.includes('veteran') || lowerEventName.includes('jumbled')) && lowerEventName.includes('men')) {
    return { name: '40+ Men', minPlayers: 1, maxPlayers: null }
  }

  // Veteran women / Jumbled women events
  if ((lowerEventName.includes('veteran') || lowerEventName.includes('jumbled')) && lowerEventName.includes('women')) {
    return { name: '40+ Women', minPlayers: 1, maxPlayers: null }
  }

  // Mixed doubles
  if (lowerEventName.includes('mixed')) {
    return { name: 'Mixed', minPlayers: 1, maxPlayers: null }
  }

  return null
}
