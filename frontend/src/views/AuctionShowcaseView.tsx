import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Paper, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, Select, MenuItem
} from '@mui/material';
import { User, Award, CheckCircle, AlertTriangle, ShieldCheck, Coins, XCircle } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface ShowcasePlayer {
  id: number;
  playerId: number;
  name: string;
  phoneNumber: string;
  category: string;
  club: string | null;
  photoPath: string | null;
  basePrice: number;
  status: string;
}

interface ShowcaseTeam {
  id: number;
  teamName: string;
  logoPath: string | null;
  purseAmount: number;
  remainingPurse: number;
  playersCount: number;
  minimumPlayers: number;
  purchasedPlayers?: any[];
}

interface AuctionShowcaseViewProps {
  auctionId: number | null;
}

export const AuctionShowcaseView: React.FC<AuctionShowcaseViewProps> = ({ auctionId }) => {
  const [currentPlayer, setCurrentPlayer] = useState<ShowcasePlayer | null>(null);
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [biddingTeam, setBiddingTeam] = useState<{ id: number; teamName: string; logoPath: string | null } | null>(null);
  const [playerStatus, setPlayerStatus] = useState<string>('Available');
  const [showRosters, setShowRosters] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [allMinSquadMet, setAllMinSquadMet] = useState<boolean>(false);
  const [teams, setTeams] = useState<ShowcaseTeam[]>([]);
  const [showcaseTeamId, setShowcaseTeamId] = useState<number | 'all'>('all');
  const [rosterRules, setRosterRules] = useState<{ category: string; minCount: number }[]>([]);
  const [showcaseSlide, setShowcaseSlide] = useState<string>('bidding');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [showcaseLayout, setShowcaseLayout] = useState<'grid' | 'individual'>('grid');
  const [showcaseIndividualIndex, setShowcaseIndividualIndex] = useState<number>(0);

  const fetchPlayers = async () => {
    try {
      const res = await api.get(`/auctions/${auctionId}/players`);
      setPlayers(res.data || []);
    } catch (err) {
      console.error('Failed to load players list:', err);
    }
  };

  useEffect(() => {
    if (!auctionId) return;

    // Load initial state from API
    const loadInitialData = async () => {
      try {
        const res = await api.get(`/auctions/${auctionId}`);
        const loadedTeams = res.data.teams || [];
        setTeams(loadedTeams);
        setRosterRules(res.data.rosterRules || []);
        if (loadedTeams.length > 0) {
          const sorted = [...loadedTeams].sort((a: any, b: any) => a.teamName.localeCompare(b.teamName));
          setShowcaseTeamId(sorted[0].id);
        }
        await fetchPlayers();
      } catch (err) {
        console.error('Failed to load showcase data:', err);
      }
    };
    loadInitialData();

    // Listen to real-time events via BroadcastChannel
    const bc = new BroadcastChannel(`auction_showcase_${auctionId}`);
    bc.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'UPDATE_STATE') {
        const payload = data.payload;
        setCurrentPlayer(payload.currentPlayer);
        setCurrentBid(payload.currentBid);
        setBiddingTeam(payload.biddingTeam);
        setPlayerStatus(payload.status);
        setShowRosters(payload.showRosters);
        setShowRules(payload.showRules || false);
        setShowcaseSlide(payload.showcaseSlide || 'bidding');
        if (payload.showcaseCategoryFilter !== undefined) {
          setCategoryFilter(payload.showcaseCategoryFilter);
        }
        if (payload.showcaseLayout !== undefined) {
          setShowcaseLayout(payload.showcaseLayout);
        }
        if (payload.showcaseIndividualIndex !== undefined) {
          setShowcaseIndividualIndex(payload.showcaseIndividualIndex);
        }
        setWarningMessage(payload.warning);
        setAllMinSquadMet(payload.allMinSquadMet);
        setShowcaseTeamId(payload.showcaseTeamId || 'all');
        if (payload.teamsList) {
          setTeams(payload.teamsList);
        }
        // Refresh players on real-time database updates
        fetchPlayers();
      }
    };

    // Request current state from active control dashboard
    bc.postMessage({ type: 'REQUEST_STATE' });

    return () => {
      bc.close();
    };
  }, [auctionId]);

  if (!auctionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0B1020', color: '#ffffff' }}>
        <Typography variant="h5">No active auction loaded for the Showcase view.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#0B1020', color: '#ffffff', overflow: 'hidden', p: 3, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header bar - Compact & Sleek */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(22, 224, 255, 0.12)', pb: 1, mb: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 'bold', color: '#16E0FF', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {showcaseSlide === 'rosters' ? "FRANCHISE ROSTERS" : 
             showcaseSlide === 'rules' ? "RULES & GUIDELINES" :
             showcaseSlide === 'available' ? "AVAILABLE PLAYERS POOL" :
             showcaseSlide === 'unsold' ? "UNSOLD PLAYERS POOL" : "LIVE BIDDING ROOM"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(showcaseSlide === 'available' || showcaseSlide === 'unsold') && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={categoryFilter}
                onChange={(e: any) => setCategoryFilter(e.target.value)}
                displayEmpty
                sx={{
                  height: '28px',
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(22, 224, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  '& .MuiSelect-select': { py: 0.5, px: 1.5, display: 'flex', alignItems: 'center', height: '28px' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSvgIcon-root': { color: '#16E0FF' },
                  '&:hover': { border: '1px solid rgba(22, 224, 255, 0.5)' }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All Categories</MenuItem>
                {Array.from(new Set(players.map(p => p.category).filter(Boolean))).map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Chip 
            label="HALL SHOWCASE" 
            variant="outlined"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 1, height: '24px' }}
          />
        </Box>
      </Box>

      {/* Roster View Slide */}
      {showRosters ? (
        showcaseTeamId !== 'all' ? (
          /* Single Team Showcase View */
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', pb: 2 }}>
            {teams.filter(t => t.id === showcaseTeamId).map((team) => (
              <Card key={team.id} sx={{ border: '2px solid rgba(22, 224, 255, 0.25)', bgcolor: '#141B2D', borderRadius: 4, p: 3, flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Header: Logo, Name, and Large Counters */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar 
                      src={team.logoPath ? `${ASSET_BASE_URL}/${team.logoPath}` : undefined} 
                      sx={{ width: 80, height: 80, border: '3px solid #16E0FF', boxShadow: '0 0 16px rgba(22, 224, 255, 0.25)' }}
                    >
                      {(team.teamName || '').substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {team.teamName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#16E0FF', fontWeight: 700, letterSpacing: '2px' }}>
                        FRANCHISE ROSTER SUMMARY
                      </Typography>
                    </Box>
                  </Box>

                  {/* Large Counters */}
                  <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1.5px', display: 'block', mb: 0.5 }}>TOTAL PURSE</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: '"Rajdhani", sans-serif' }}>₹{team.purseAmount.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1.5px', display: 'block', mb: 0.5 }}>REMAINING PURSE</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#16E0FF', fontFamily: '"Rajdhani", sans-serif' }}>₹{team.remainingPurse.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1.5px', display: 'block', mb: 0.5 }}>SQUAD SIZE</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: team.playersCount >= team.minimumPlayers ? '#10B981' : '#F59E0B', fontFamily: '"Rajdhani", sans-serif' }}>
                        {team.playersCount} / {team.minimumPlayers}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Category Constraints Progress Badges */}
                {rosterRules.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, p: 2, bgcolor: 'rgba(22, 224, 255, 0.02)', borderRadius: 3, border: '1px solid rgba(22, 224, 255, 0.06)' }}>
                    {rosterRules.map((rule, idx) => {
                      const currentCount = team.purchasedPlayers ? team.purchasedPlayers.filter((p: any) => p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === rule.category.replace(/\s+/g, ' ').trim().toLowerCase()).length : 0;
                      const met = currentCount >= rule.minCount;
                      return (
                        <Chip
                          key={idx}
                          size="medium"
                          label={`${rule.category}: ${currentCount} / ${rule.minCount}`}
                          sx={{
                            height: '32px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            px: 1,
                            bgcolor: met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                            color: met ? '#10B981' : '#F59E0B',
                            border: met ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: 1.5
                          }}
                        />
                      );
                    })}
                  </Box>
                )}

                {/* Purchased Players Registry Table (Compact List Format, fits 13 players statically) */}
                <TableContainer 
                  sx={{ 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    borderRadius: 2.5, 
                    flexGrow: 1, 
                    minHeight: 0, 
                    overflowY: 'hidden', 
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                  }}
                >
                  {team.purchasedPlayers && team.purchasedPlayers.length > 0 ? (
                    <Table size="small" stickyHeader sx={{ '& td': { py: 1.1, borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#141B2D', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, py: 1 } }}>
                          <TableCell sx={{ pl: 3, width: '60px' }}>S.No</TableCell>
                          <TableCell>Player Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Club</TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>Winning Bid</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {team.purchasedPlayers.slice(0, 13).map((p: any, pIdx: number) => (
                          <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                            <TableCell sx={{ pl: 3, color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>{pIdx + 1}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar 
                                  src={p.photoPath ? (p.photoPath.startsWith('http') ? p.photoPath : `${ASSET_BASE_URL}/${p.photoPath}`) : undefined} 
                                  sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                  <User size={16} />
                                </Avatar>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                                  {p.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#94a3b8' }}>{p.category}</TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>{p.club || '—'}</TableCell>
                            <TableCell align="right" sx={{ pr: 3, color: '#16E0FF', fontWeight: 900, fontSize: '1.02rem', fontFamily: '"Rajdhani", sans-serif' }}>
                              ₹{(p.soldPrice || 0).toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No players purchased yet.
                      </Typography>
                    </Box>
                  )}
                </TableContainer>
              </Card>
            ))}
          </Box>
        ) : (
          /* All Teams Roster Grids */
          <Grid container spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, pr: 1, pb: 2 }}>
            {teams.map((team) => {
              return (
                <Grid size={{ xs: 12 }} key={team.id}>
                  <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 3, p: 2 }}>
                    <CardContent sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      
                      {/* Top Stats Banner: Team info, purse metrics, category progress */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                        
                        {/* Franchise Name & Avatar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: '250px' }}>
                          <Avatar src={team.logoPath ? `${ASSET_BASE_URL}/${team.logoPath}` : undefined} sx={{ width: 60, height: 60, border: '2px solid rgba(22, 224, 255, 0.3)' }}>
                            {(team.teamName || '').substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 850, color: '#ffffff', fontFamily: '"Rajdhani", sans-serif' }}>
                              {team.teamName}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Purse Metrics */}
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px' }}>TOTAL BUDGET</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>₹{team.purseAmount.toLocaleString('en-IN')}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px' }}>REMAINING</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#16E0FF' }}>₹{team.remainingPurse.toLocaleString('en-IN')}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px' }}>SQUAD SIZE</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: team.playersCount >= team.minimumPlayers ? '#10B981' : '#F59E0B' }}>
                              {team.playersCount} / {team.minimumPlayers}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Category Breakdown Chips */}
                        {rosterRules.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, bgcolor: 'rgba(22, 224, 255, 0.02)', borderRadius: 2, border: '1px solid rgba(22, 224, 255, 0.06)' }}>
                            {rosterRules.map((rule, idx) => {
                              const currentCount = team.purchasedPlayers ? team.purchasedPlayers.filter((p: any) => p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === rule.category.replace(/\s+/g, ' ').trim().toLowerCase()).length : 0;
                              const met = currentCount >= rule.minCount;
                              return (
                                <Chip
                                  key={idx}
                                  size="medium"
                                  label={`${rule.category}: ${currentCount}/${rule.minCount}`}
                                  sx={{
                                    height: '26px',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    bgcolor: met ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                    color: met ? '#10B981' : '#F59E0B',
                                    border: met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: 1
                                  }}
                                />
                              );
                            })}
                          </Box>
                        )}
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                      {/* Detailed Players Table (Control Tab Format but larger and wider) */}
                      <TableContainer sx={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 1.5, maxHeight: '350px', overflowY: 'auto' }}>
                        {team.purchasedPlayers && team.purchasedPlayers.length > 0 ? (
                          <Table size="medium" stickyHeader>
                            <TableHead>
                              <TableRow sx={{ '& th': { bgcolor: '#141B2D', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', py: 1.2 } }}>
                                <TableCell sx={{ pl: 3, width: '60px' }}>#</TableCell>
                                <TableCell>Player</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Club</TableCell>
                                <TableCell align="right" sx={{ pr: 3 }}>Bid Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {team.purchasedPlayers.map((p: any, pIdx: number) => (
                                <TableRow key={p.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '0.85rem', py: 1 } }}>
                                  <TableCell sx={{ pl: 3, color: '#64748b', fontWeight: 600 }}>{pIdx + 1}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                                      <Avatar 
                                        src={p.photoPath ? (p.photoPath.startsWith('http') ? p.photoPath : `${ASSET_BASE_URL}/${p.photoPath}`) : undefined} 
                                        sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.08)' }}
                                      >
                                        <User size={16} />
                                      </Avatar>
                                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                                        {p.name}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>{p.category}</TableCell>
                                  <TableCell>{p.club || '—'}</TableCell>
                                  <TableCell align="right" sx={{ pr: 3, color: '#16E0FF', fontWeight: 800, fontSize: '0.92rem' }}>
                                    ₹{(p.soldPrice || 0).toLocaleString('en-IN')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', py: 4 }}>
                            No players purchased yet.
                          </Typography>
                        )}
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      ) : showRules ? (
        /* Rules & Guidelines Slide */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
          <Typography variant="h3" align="center" sx={{ fontWeight: 'bold', color: '#16E0FF', fontFamily: '"Rajdhani", sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Rules & Guidelines
          </Typography>

          <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', pb: 2 }}>
            {/* Rule Card 1: Purse & Budget */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid rgba(22, 224, 255, 0.15)', bgcolor: '#141B2D', borderRadius: 3, p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
                    Purse & Budgets
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Each franchise starts the campaign with an equal budget. Bids will be immediately deducted from the remaining purse.
                  </Typography>
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>STARTING PURSE AMOUNT</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#16E0FF', fontFamily: '"Rajdhani", sans-serif' }}>
                      ₹{(teams[0]?.purseAmount || 100000).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Rule Card 2: Roster Targets */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid rgba(22, 224, 255, 0.15)', bgcolor: '#141B2D', borderRadius: 3, p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
                    Squad Size Limits
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Franchises must draft players to meet the minimum squad size required to complete their roster registration.
                  </Typography>
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>MINIMUM SQUAD REQUIREMENT</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981', fontFamily: '"Rajdhani", sans-serif' }}>
                      {teams[0]?.minimumPlayers || 8} Players
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Rule Card 3: Roster Category Rules */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid rgba(22, 224, 255, 0.15)', bgcolor: '#141B2D', borderRadius: 3, p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
                    Category Quotas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Every team must fulfill the minimum players requirement per category to satisfy roster balance:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {rosterRules.length > 0 ? (
                      rosterRules.map((rule, idx) => (
                        <Chip
                          key={idx}
                          label={`${rule.category}: Minimum ${rule.minCount}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No specific category rules configured.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Bottom Row: Additional Guidelines */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.06)', bgcolor: '#141B2D', borderRadius: 3, p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
                    Auction Play Policies
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF', mt: 1, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        <strong>IPL-Style Reserve Cap:</strong> A franchise cannot submit a bid that leaves them with less money than needed to buy their remaining empty squad slots up to a size of 13 players.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF', mt: 1, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        <strong>Sold / Unsold Status:</strong> If a player does not receive bids, they are marked as Unsold. Sold players are officially added to their franchise registries and their final bid amount is locked.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF', mt: 1, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        <strong>Live Sync:</strong> Bidding stats, remaining purse amounts, and team rosters sync instantly to the projection showcase board.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : showcaseSlide === 'available' ? (
        /* Available Players Slide */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {showcaseLayout === 'grid' ? (
            players.filter(p => p.status === 'Available' && (!categoryFilter || p.category === categoryFilter)).length > 0 ? (
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
                <Grid container spacing={2}>
                  {players
                    .filter(p => p.status === 'Available' && (!categoryFilter || p.category === categoryFilter))
                    .map((player) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                        <Card sx={{ 
                          bgcolor: '#141B2D', 
                          border: '1px solid rgba(22, 224, 255, 0.15)', 
                          borderRadius: 2,
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#16E0FF',
                            boxShadow: '0 0 12px rgba(22, 224, 255, 0.15)',
                            transform: 'translateY(-2px)'
                          }
                        }}>
                          <Avatar
                            src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                            sx={{ width: 44, height: 44, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                          >
                            {(player.name || '').substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                              {player.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={player.category} 
                                size="small" 
                                sx={{ 
                                  height: '18px', 
                                  fontSize: '0.65rem', 
                                  fontWeight: 'bold', 
                                  bgcolor: 'rgba(22, 224, 255, 0.08)', 
                                  color: '#16E0FF', 
                                  border: '1px solid rgba(22, 224, 255, 0.15)' 
                                }} 
                              />
                              {player.club && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100px' }}>
                                  {player.club}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#16E0FF', fontFamily: '"Rajdhani", sans-serif' }}>
                              ₹{player.basePrice?.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                              Base Price
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </Box>
            ) : (
              <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', py: 10, borderRadius: 4, gap: 2 }}>
                <Award size={60} style={{ color: '#16E0FF', opacity: 0.4 }} />
                <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif' }}>
                  No available players remaining in this category.
                </Typography>
              </Paper>
            )
          ) : (
            /* Individual View (One-by-One Available) */
            (() => {
              const filtered = players.filter(p => p.status === 'Available' && (!categoryFilter || p.category === categoryFilter));
              if (filtered.length === 0) {
                return (
                  <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', py: 10, borderRadius: 4, gap: 2 }}>
                    <Award size={60} style={{ color: '#16E0FF', opacity: 0.4 }} />
                    <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif' }}>
                      No available players remaining in this category.
                    </Typography>
                  </Paper>
                );
              }
              const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
              const player = filtered[safeIndex >= 0 ? safeIndex : 0];
              if (!player) return null;
              return (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
                  <Card sx={{ 
                    width: '90%', 
                    maxWidth: '650px', 
                    border: '2px solid rgba(22, 224, 255, 0.25)', 
                    bgcolor: '#141B2D', 
                    borderRadius: 5, 
                    p: 4, 
                    boxShadow: '0 0 40px rgba(22, 224, 255, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <Avatar
                      src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                      sx={{ 
                        width: 200, 
                        height: 200, 
                        border: '4px solid #16E0FF', 
                        boxShadow: '0 0 30px rgba(22,224,255,0.2)' 
                      }}
                    >
                      <User size={90} style={{ color: '#94a3b8' }} />
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ fontWeight: 950, fontFamily: '"Rajdhani", sans-serif', color: '#ffffff', mb: 1 }}>
                        {player.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                        <Chip 
                          label={`Category: ${player.category}`} 
                          color="primary" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold', fontSize: '0.95rem', px: 1 }} 
                        />
                        {player.club && (
                          <Chip 
                            label={`Club: ${player.club}`} 
                            color="secondary" 
                            variant="outlined" 
                            sx={{ fontWeight: 'bold', fontSize: '0.95rem', px: 1 }} 
                          />
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', width: '80%', my: 0.5 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '2px', display: 'block', mb: 0.5 }}>
                        BASE PRICE
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: '#16E0FF', fontFamily: '"Rajdhani", sans-serif' }}>
                        ₹{player.basePrice?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              );
            })()
          )}
        </Box>
      ) : showcaseSlide === 'unsold' ? (
        /* Unsold Players Slide */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {showcaseLayout === 'grid' ? (
            players.filter(p => p.status === 'Unsold' && (!categoryFilter || p.category === categoryFilter)).length > 0 ? (
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
                <Grid container spacing={2}>
                  {players
                    .filter(p => p.status === 'Unsold' && (!categoryFilter || p.category === categoryFilter))
                    .map((player) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                        <Card sx={{ 
                          bgcolor: '#141B2D', 
                          border: '1px solid rgba(22, 224, 255, 0.15)', 
                          borderRadius: 2,
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#EF4444',
                            boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)',
                            transform: 'translateY(-2px)'
                          }
                        }}>
                          <Avatar
                            src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                            sx={{ width: 44, height: 44, border: '2px solid rgba(239, 68, 68, 0.3)' }}
                          >
                            {(player.name || '').substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                              {player.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={player.category} 
                                size="small" 
                                sx={{ 
                                  height: '18px', 
                                  fontSize: '0.65rem', 
                                  fontWeight: 'bold', 
                                  bgcolor: 'rgba(239, 68, 68, 0.08)', 
                                  color: '#EF4444', 
                                  border: '1px solid rgba(239, 68, 68, 0.15)' 
                                }} 
                              />
                              {player.club && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100px' }}>
                                  {player.club}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#EF4444', fontFamily: '"Rajdhani", sans-serif' }}>
                              ₹{player.basePrice?.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                              Base Price
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </Box>
            ) : (
              <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', py: 10, borderRadius: 4, gap: 2 }}>
                <Award size={60} style={{ color: '#EF4444', opacity: 0.4 }} />
                <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif' }}>
                  No unsold players found in this category.
                </Typography>
              </Paper>
            )
          ) : (
            /* Individual View (One-by-One Unsold) */
            (() => {
              const filtered = players.filter(p => p.status === 'Unsold' && (!categoryFilter || p.category === categoryFilter));
              if (filtered.length === 0) {
                return (
                  <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', py: 10, borderRadius: 4, gap: 2 }}>
                    <Award size={60} style={{ color: '#EF4444', opacity: 0.4 }} />
                    <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif' }}>
                      No unsold players found in this category.
                    </Typography>
                  </Paper>
                );
              }
              const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
              const player = filtered[safeIndex >= 0 ? safeIndex : 0];
              if (!player) return null;
              return (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
                  <Card sx={{ 
                    width: '90%', 
                    maxWidth: '650px', 
                    border: '2px solid rgba(239, 68, 68, 0.25)', 
                    bgcolor: '#141B2D', 
                    borderRadius: 5, 
                    p: 4, 
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <Avatar
                      src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                      sx={{ 
                        width: 200, 
                        height: 200, 
                        border: '4px solid #EF4444', 
                        boxShadow: '0 0 30px rgba(239,68,68,0.2)' 
                      }}
                    >
                      <User size={90} style={{ color: '#94a3b8' }} />
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ fontWeight: 950, fontFamily: '"Rajdhani", sans-serif', color: '#ffffff', mb: 1 }}>
                        {player.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                        <Chip 
                          label={`Category: ${player.category}`} 
                          color="error" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold', fontSize: '0.95rem', px: 1 }} 
                        />
                        {player.club && (
                          <Chip 
                            label={`Club: ${player.club}`} 
                            color="secondary" 
                            variant="outlined" 
                            sx={{ fontWeight: 'bold', fontSize: '0.95rem', px: 1 }} 
                          />
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', width: '80%', my: 0.5 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '2px', display: 'block', mb: 0.5 }}>
                        BASE PRICE
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: '#EF4444', fontFamily: '"Rajdhani", sans-serif' }}>
                        ₹{player.basePrice?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              );
            })()
          )}
        </Box>
      ) : (
        /* Live Bidding Slide */
        <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {currentPlayer ? (
            <Grid container spacing={4} sx={{ flexGrow: 1, minHeight: 0, pb: 2 }}>
              {/* Left Side: Player Card */}
              <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(22, 224, 255, 0.15)', bgcolor: '#141B2D', borderRadius: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Box sx={{ flexGrow: 1, minHeight: 0, bgcolor: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', p: 3 }}>
                    <Avatar 
                      src={currentPlayer.photoPath ? (currentPlayer.photoPath.startsWith('http') ? currentPlayer.photoPath : `${ASSET_BASE_URL}/${currentPlayer.photoPath}`) : undefined} 
                      sx={{ 
                        width: 300, 
                        height: 300, 
                        maxWidth: '90%', 
                        maxHeight: '90%', 
                        aspectRatio: '1/1',
                        border: '4px solid #16E0FF', 
                        boxShadow: '0 0 35px rgba(22,224,255,0.25)' 
                      }}
                    >
                      <User size={120} style={{ color: '#94a3b8' }} />
                    </Avatar>
                  </Box>
                  <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', gap: 1.8, flexShrink: 0 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', textAlign: 'center' }}>
                      {currentPlayer.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Chip label={`Category: ${currentPlayer.category}`} color="primary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 1 }} />
                      {currentPlayer.club && <Chip label={`Club: ${currentPlayer.club}`} color="secondary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 1 }} />}
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>BASE PRICE</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif' }}>
                        ₹{currentPlayer.basePrice.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Side: Dynamic Bidding Status Card */}
              <Grid size={{ xs: 12, md: 7 }} sx={{ height: '100%' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3.5, textAlign: 'center', py: 2 }}>
                    
                    {playerStatus === 'Available' && (
                      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <Box 
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            borderRadius: '50%', 
                            border: '4px solid #16E0FF', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            background: 'rgba(22, 224, 255, 0.05)',
                            boxShadow: '0 0 20px rgba(22, 224, 255, 0.2)',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(0.95)',
                                boxShadow: '0 0 0 0 rgba(22, 224, 255, 0.4)',
                              },
                              '70%': {
                                transform: 'scale(1)',
                                boxShadow: '0 0 0 20px rgba(22, 224, 255, 0)',
                              },
                              '100%': {
                                transform: 'scale(0.95)',
                                boxShadow: '0 0 0 0 rgba(22, 224, 255, 0)',
                              },
                            },
                          }}
                        >
                          <Coins size={60} style={{ color: '#16E0FF' }} />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body1" sx={{ color: '#16E0FF', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            LIVE BID PRICE
                          </Typography>
                          <Typography variant="h1" sx={{ fontWeight: 900, color: '#ffffff', textShadow: '0 0 35px rgba(22,224,255,0.3)', fontSize: '5.5rem', fontFamily: '"Rajdhani", sans-serif', lineHeight: 1.1, mt: 0.5 }}>
                            ₹{(currentBid || currentPlayer.basePrice).toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                            Starting Base Price: ₹{currentPlayer.basePrice.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: '420px', mx: 'auto', opacity: 0.7, fontStyle: 'italic' }}>
                            Franchises are bidding offline. Winning franchise will be revealed when player is marked Sold.
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {playerStatus === 'Sold' && biddingTeam && (
                      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
                        <CheckCircle size={70} style={{ color: '#10B981' }} />
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#10B981', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '2px' }}>
                          SOLD!
                        </Typography>
                        <Avatar 
                          src={biddingTeam.logoPath ? `${ASSET_BASE_URL}/${biddingTeam.logoPath}` : undefined} 
                          sx={{ width: 100, height: 100, border: '3px solid #10B981', boxShadow: '0 0 15px rgba(16,185,129,0.25)', fontSize: '2rem', fontWeight: 'bold' }}
                        >
                          {(biddingTeam.teamName || '').substring(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>
                            {biddingTeam.teamName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px', mt: 0.5, display: 'block' }}>
                            Acquiring Franchise
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h2" sx={{ color: '#16E0FF', fontWeight: 900, fontFamily: '"Rajdhani", sans-serif' }}>
                            ₹{currentBid?.toLocaleString('en-IN') || currentPlayer.basePrice.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
                            Final Winning Price
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {playerStatus === 'Unsold' && (
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <XCircle size={70} style={{ color: '#EF4444' }} />
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#EF4444', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '2px' }}>
                          UNSOLD
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: '350px' }}>
                          This player did not receive any bids during their session and has been marked as unsold.
                        </Typography>
                      </Box>
                    )}

                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            /* Idle view waiting for player */
            <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', py: 15, borderRadius: 4, gap: 3 }}>
              <Award size={80} style={{ color: '#16E0FF', opacity: 0.6 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif', color: '#ffffff', mb: 1 }}>
                  Waiting for Next Player Pool Selection...
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The panel controller will select and present the next player shortly.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      )}



      {/* Warning Overlay (Crossed Budget / Insufficient Purse Reserve Warning) */}
      {warningMessage && (
        <Box sx={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          width: '90%', maxWidth: '800px', zIndex: 2500,
          animation: 'slideUp 0.3s ease'
        }}>
          <Paper sx={{
            p: 3, border: '1px solid #EF4444', bgcolor: 'rgba(239,68,68,0.08)',
            backdropFilter: 'blur(10px)', color: '#ffffff', borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', gap: 2.5, alignItems: 'center'
          }}>
            <AlertTriangle size={32} style={{ color: '#EF4444', flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#EF4444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Budget Cap Alert Warning
              </Typography>
              <Typography variant="body2" sx={{ color: '#f8fafc', mt: 0.5, lineHeight: 1.5 }}>
                {warningMessage}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Squad Requirements Complete Celebration Message */}
      {allMinSquadMet && (
        <Box sx={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1500, animation: 'slideDown 0.4s ease'
        }}>
          <Paper sx={{
            px: 4, py: 1.8, border: '1px solid #10B981', bgcolor: 'rgba(16,185,129,0.1)',
            backdropFilter: 'blur(8px)', borderRadius: 2.5, display: 'flex', gap: 2, alignItems: 'center',
            boxShadow: '0 4px 20px rgba(16,185,129,0.15)'
          }}>
            <ShieldCheck size={20} style={{ color: '#10B981' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Base Squad Requirements Completed for All Teams!
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Copyright Footer */}
      <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid rgba(22, 224, 255, 0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', letterSpacing: '1px' }}>
          © 2026 GAMEGRID. ALL RIGHTS RESERVED.
        </Typography>
      </Box>
    </Box>
  );
};
