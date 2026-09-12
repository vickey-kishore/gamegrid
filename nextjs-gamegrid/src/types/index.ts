export type AuctionStatus = 'Draft' | 'Published' | 'Live' | 'Completed'
export type PlayerStatus = 'Available' | 'Sold' | 'Unsold'
export type TournamentStatus = 'Draft' | 'Active' | 'Completed'
export type FixtureStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'

export interface Auction {
  id: number
  auction_name: string
  event_name: string
  category: string
  events: string
  selected_events?: number[]
  roster_rules: any[]
  allow_retention: boolean
  max_retained_players: number
  retention_price: number
  auction_date: string
  auction_venue?: string
  description: string
  minimum_bid: number | null
  bid_increment: number | null
  auction_purse_amount: number | null
  status: AuctionStatus
  is_deleted: boolean
  user_id?: string
  created_at: string
  updated_at: string
  auction_teams?: AuctionTeam[]
  category_configs?: AuctionCategoryConfig[]
}

export interface AuctionEvent {
  id: number
  name: string
  sort_order: number
  created_at: string
}

export interface AuctionCategory {
  id: number
  name: string
  min_players: number
  max_players: number | null
  created_at: string
}

export interface AuctionCategoryConfig {
  id: number
  auction_id: number
  category_name: string
  min_players: number
  max_players: number
  created_at: string
  updated_at: string
}

export interface AuctionTeam {
  id: number
  auction_id: number
  team_name: string
  logo_path: string
  purse_amount: number
  remaining_purse: number
  minimum_players: number
  maximum_players: number
  created_at: string
  updated_at: string
}

export interface Player {
  id: number
  name: string
  category: string
  base_price: number
  image_url: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface AuctionPlayer {
  id: number
  auction_id: number
  player_id: number
  status: PlayerStatus
  sold_to_team_id?: number
  sold_price?: number
  created_at: string
  updated_at: string
  player?: Player
  team?: AuctionTeam
}

export interface Bid {
  id: number
  auction_id: number
  auction_player_id: number
  team_id: number
  amount: number
  created_at: string
  team?: AuctionTeam
}

export interface Tournament {
  id: number
  tournament_name: string
  description: string
  start_date: string
  end_date: string
  status: TournamentStatus
  user_id?: string
  created_at: string
  updated_at: string
}

export interface TournamentFixture {
  id: number
  tournament_id: number
  team_a_id: number
  team_b_id: number
  fixture_date: string
  venue: string
  result_a_score?: number
  result_b_score?: number
  status: FixtureStatus
  created_at: string
  updated_at: string
}

export interface AuctionEventCategory {
  id: number
  name: string
  created_at: string
}

export interface RosterCategoryConstraint {
  id: number
  name: string
  created_at: string
}

export interface AuctionRegistration {
  id: number
  auction_id: number
  name: string
  category: string
  club: string
  dob: string
  mobile_number: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuctionRequest {
  auctionName: string
  eventName?: string
  category?: string
  events?: string[]
  rosterRules?: any[]
  allowRetention?: boolean
  maxRetainedPlayers?: number
  retentionPrice?: number
  auctionDate?: string
  description?: string
  minimumBid?: number
  bidIncrement?: number
  maximumBid?: number
  teams: TeamConfig[]
}

export interface TeamConfig {
  teamName: string
  logoPath?: string
  purseAmount: number
  minimumPlayers: number
  maximumPlayers?: number
}

export interface User {
  id: string
  email?: string
  name?: string
  picture?: string
}

export interface Profile {
  id: string
  email?: string
  name?: string
  role: 'admin' | 'creator' | 'player'
  created_at: string
  updated_at: string
}

export type ViewState = 
  | 'home-dashboard' 
  | 'auctions-list' 
  | 'tournaments-list' 
  | 'import-players' 
  | 'create-auction' 
  | 'edit-auction' 
  | 'dashboard' 
  | 'rosters' 
  | 'create-tournament' 
  | 'edit-tournament' 
  | 'tournament-detail'
  | 'register-auction'
  | 'view-auction'
  | 'dashboard-overview'
  | 'dashboard-teams'
  | 'dashboard-categories'
  | 'dashboard-registrations'
