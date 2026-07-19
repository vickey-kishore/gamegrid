import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Paper, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, Select, MenuItem, IconButton, Button, InputLabel
} from '@mui/material';
import { User, Award, CheckCircle, AlertTriangle, ShieldCheck, Coins, XCircle, ArrowLeft, Monitor, Play } from 'lucide-react';
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
  soldPrice?: number;
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
  const [rosterRules, setRosterRules] = useState<{ category: string; minCount: number; maxCount?: number }[]>([]);
  const [showcaseSlide, setShowcaseSlide] = useState<string>('bidding');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [showcaseLayout, setShowcaseLayout] = useState<'grid' | 'individual'>('grid');
  const [showcaseIndividualIndex, setShowcaseIndividualIndex] = useState<number>(0);
  const [auction, setAuction] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('VIEWER');

  const fetchPlayers = async () => {
    try {
      const res = await api.get(`/auctions/${auctionId}/players`);
      setPlayers(res.data || []);
    } catch (err) {
      console.error('Failed to load players list:', err);
    }
  };

  // Calculate franchise eligibility and max bid for current player
  const calculateFranchiseEligibility = (team: any) => {
    if (!currentPlayer) return null;

    const playerCategory = currentPlayer.category;
    const basePrice = currentPlayer.basePrice || 0;

    // Get roster rules for this category
    const categoryRule = rosterRules?.find((rule: any) =>
      rule.category?.replace(/\s+/g, ' ').trim().toLowerCase() === playerCategory?.replace(/\s+/g, ' ').trim().toLowerCase()
    );

    // Count current players in this category for this team
    const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'Sold');
    const categoryCount = teamPlayers.filter(p =>
      p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === playerCategory?.replace(/\s+/g, ' ').trim().toLowerCase()
    ).length;

    // Check if slot is full (if max count is defined)
    const maxCount = categoryRule?.maxCount;
    const slotFull = maxCount && categoryCount >= maxCount;

    // Calculate number of needed players in this category
    const minCount = categoryRule?.minCount || 0;
    const neededPlayers = Math.max(0, minCount - categoryCount);

    // Calculate max bid: remaining purse - (needed players * base price)
    const maxBid = team.remainingPurse - (neededPlayers * basePrice);

    // Determine status
    let status: 'eligible' | 'max-bid-reached' | 'slot-full' | 'ineligible';
    if (slotFull) {
      status = 'slot-full';
    } else if (maxBid <= 0) {
      status = 'max-bid-reached';
    } else if (currentBid && currentBid > maxBid) {
      status = 'ineligible';
    } else {
      status = 'eligible';
    }

    return {
      status,
      maxBid: Math.max(0, maxBid),
      categoryCount,
      minCount,
      maxCount,
      neededPlayers
    };
  };

  useEffect(() => {
    if (!auctionId) return;

    // Load initial state from API
    const loadInitialData = async () => {
      try {
        const res = await api.get(`/auctions/${auctionId}`);
        setAuction(res.data);
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

      {/* Roster View Slide */}
      {showcaseSlide === 'rosters' ? (
        <>
          {showcaseTeamId !== 'all' ? (
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

                  {/* Purchased Players Registry - Layout Switching */}
                  {showcaseLayout === 'grid' ? (
                    /* Grid View for single team */
                    <Grid container spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
                      {team.purchasedPlayers && team.purchasedPlayers.length > 0 ? (
                        team.purchasedPlayers
                          .filter(p => !categoryFilter || p.category === categoryFilter)
                          .map((p: any, pIdx: number) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                              <Card sx={{
                                bgcolor: '#141B2D',
                                border: '1px solid rgba(22, 224, 255, 0.15)',
                                borderRadius: 2,
                                p: 1.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: '#16E0FF',
                                  boxShadow: '0 0 12px rgba(22, 224, 255, 0.15)',
                                  transform: 'translateY(-2px)'
                                }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    src={p.photoPath ? (p.photoPath.startsWith('http') ? p.photoPath : `${ASSET_BASE_URL}/${p.photoPath}`) : undefined}
                                    sx={{ width: 48, height: 48, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                  >
                                    <User size={20} />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                                      {p.name}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8' }}>
                                      {p.category}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {p.club || '—'}
                                  </Typography>
                                  <Typography sx={{ color: '#16E0FF', fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Rajdhani", sans-serif' }}>
                                    ₹{(p.soldPrice || 0).toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                              </Card>
                            </Grid>
                          ))
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No players purchased yet.
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  ) : (
                    /* List View for single team */
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
                            {team.purchasedPlayers
                              .filter(p => !categoryFilter || p.category === categoryFilter)
                              .slice(0, 13)
                              .map((p: any, pIdx: number) => (
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
                  )}
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

                        {/* Players Display - Layout Switching */}
                        {showcaseLayout === 'grid' ? (
                          /* Grid View for all teams */
                          <Grid container spacing={1.5}>
                            {team.purchasedPlayers && team.purchasedPlayers.length > 0 ? (
                              team.purchasedPlayers.map((p: any) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                                  <Card sx={{
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(22, 224, 255, 0.1)',
                                    borderRadius: 1.5,
                                    p: 1.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(255,255,255,0.04)'
                                    }
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Avatar
                                        src={p.photoPath ? (p.photoPath.startsWith('http') ? p.photoPath : `${ASSET_BASE_URL}/${p.photoPath}`) : undefined}
                                        sx={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.08)' }}
                                      >
                                        <User size={16} />
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                                          {p.name}
                                        </Typography>
                                        <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#94a3b8' }}>
                                          {p.category}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography sx={{ color: '#16E0FF', fontWeight: 800, fontSize: '0.9rem', fontFamily: '"Rajdhani", sans-serif' }}>
                                      ₹{(p.soldPrice || 0).toLocaleString('en-IN')}
                                    </Typography>
                                  </Card>
                                </Grid>
                              ))
                            ) : (
                              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', py: 4 }}>
                                No players purchased yet.
                              </Typography>
                            )}
                          </Grid>
                        ) : (
                          /* List View for all teams */
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
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
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
        /* Live Bidding Slide - Premium Audience Display */
        <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#0B1220' }}>
          {currentPlayer ? (
            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', p: 4, gap: 4 }}>
              {/* Left Column: Player Spotlight (50%) */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Card sx={{
                  height: '100%',
                  border: '1px solid rgba(22, 224, 255, 0.2)',
                  bgcolor: '#0F1929',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 0 40px rgba(22, 224, 255, 0.1)'
                }}>
                  {/* Player Image - No halo effect, moved up */}
                  <Box sx={{
                    flexGrow: 0.7,
                    minHeight: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                    position: 'relative'
                  }}>
                    <Avatar
                      src={currentPlayer.photoPath ? (currentPlayer.photoPath.startsWith('http') ? currentPlayer.photoPath : `${ASSET_BASE_URL}/${currentPlayer.photoPath}`) : undefined}
                      sx={{
                        width: 350,
                        height: 350,
                        border: '4px solid rgba(22, 224, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(22, 224, 255, 0.2)',
                        position: 'relative'
                      }}
                    >
                      <User size={150} style={{ color: '#94a3b8' }} />
                    </Avatar>
                  </Box>

                  {/* Player Details - Bottom 40% of left panel */}
                  <CardContent sx={{ p: 3, flexShrink: 0, textAlign: 'center' }}>
                    {/* Player Name - Increased size for physical room visibility */}
                    <Typography variant="h1" sx={{
                      fontWeight: 900,
                      color: '#ffffff',
                      fontFamily: '"Rajdhani", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '3px',
                      fontSize: '4.5rem',
                      mb: 2,
                      lineHeight: 1.1
                    }}>
                      {currentPlayer.name}
                    </Typography>

                    {/* Category & Club Badges - Different colors for visibility */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                      <Chip
                        label={currentPlayer.category}
                        sx={{
                          bgcolor: 'rgba(16, 185, 129, 0.25)',
                          color: '#10B981',
                          border: '2px solid rgba(16, 185, 129, 0.5)',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          height: 'auto',
                          textShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                        }}
                      />
                      {currentPlayer.club && (
                        <Chip
                          label={currentPlayer.club}
                          sx={{
                            bgcolor: 'rgba(245, 158, 11, 0.25)',
                            color: '#F59E0B',
                            border: '2px solid rgba(245, 158, 11, 0.5)',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            height: 'auto',
                            textShadow: '0 0 10px rgba(245, 158, 11, 0.3)'
                          }}
                        />
                      )}
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(22, 224, 255, 0.3)', mb: 3, height: 2 }} />

                    {/* Base Price and Live Bid - Increased size for physical room visibility */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 4, pt: 2 }}>
                      {/* Base Price */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '1rem', mb: 1 }}>
                          Base Price
                        </Typography>
                        <Typography variant="h2" sx={{
                          fontWeight: 900,
                          color: '#ffffff',
                          fontFamily: '"Rajdhani", sans-serif',
                          fontSize: '2.8rem',
                          textShadow: '0 0 20px rgba(22, 224, 255, 0.3)'
                        }}>
                          ₹{currentPlayer.basePrice.toLocaleString('en-IN')}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" sx={{ borderColor: 'rgba(22, 224, 255, 0.3)', height: 80 }} />

                      {/* Live Bid */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#16E0FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '1rem', mb: 1 }}>
                          Live Bid
                        </Typography>
                        <Typography variant="h1" sx={{
                          fontWeight: 900,
                          color: '#16E0FF',
                          fontFamily: '"Rajdhani", sans-serif',
                          fontSize: '3.5rem',
                          textShadow: '0 0 35px rgba(22, 224, 255, 0.6)',
                          animation: 'bidPulse 2s ease-in-out infinite',
                          '@keyframes bidPulse': {
                            '0%, 100%': {
                              textShadow: '0 0 35px rgba(22, 224, 255, 0.6)',
                            },
                            '50%': {
                              textShadow: '0 0 45px rgba(22, 224, 255, 0.8)',
                            },
                          },
                        }}>
                          ₹{(playerStatus === 'Sold' ? (currentPlayer.soldPrice || currentBid || currentPlayer.basePrice) : (currentBid || currentPlayer.basePrice)).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Right Column: Franchise Eligibility (50%) */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Card sx={{
                  height: '100%',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: '#0F1929',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3
                }}>
                  {playerStatus === 'Available' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Section Title */}
                      <Typography variant="h5" sx={{
                        fontWeight: 800,
                        color: '#ffffff',
                        mb: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textAlign: 'center',
                        position: 'relative',
                        pb: 2,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '60%',
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent, #16E0FF, transparent)'
                        }
                      }}>
                        Franchise Eligibility
                      </Typography>

                      {/* Premium 3x2 Grid Layout */}
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 2,
                        flexGrow: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {teams.map((team, index) => {
                          const eligibility = calculateFranchiseEligibility(team);
                          if (!eligibility) return null;

                          const statusColor = {
                            'eligible': '#00FF7F',
                            'max-bid-reached': '#FFD700',
                            'slot-full': '#FF4444',
                            'ineligible': '#FFA500'
                          }[eligibility.status];

                          const statusText = {
                            'eligible': 'ELIGIBLE',
                            'max-bid-reached': 'MAX BID',
                            'slot-full': 'FULL',
                            'ineligible': 'INELIGIBLE'
                          }[eligibility.status];

                          const statusIcon = {
                            'eligible': '✓',
                            'max-bid-reached': '⚠',
                            'slot-full': '✗',
                            'ineligible': '✗'
                          }[eligibility.status];

                          const statusGlow = {
                            'eligible': '0 0 40px rgba(0, 255, 127, 0.6)',
                            'max-bid-reached': 'none',
                            'slot-full': 'none',
                            'ineligible': 'none'
                          }[eligibility.status];

                          const statusGlowHover = {
                            'eligible': '0 0 50px rgba(0, 255, 127, 0.8)',
                            'max-bid-reached': 'none',
                            'slot-full': 'none',
                            'ineligible': 'none'
                          }[eligibility.status];

                          const statusAnimation = {
                            'eligible': 'statusPulse 2s ease-in-out infinite',
                            'max-bid-reached': 'none',
                            'slot-full': 'none',
                            'ineligible': 'none'
                          }[eligibility.status];

                          return (
                            <Box
                              key={team.id}
                              sx={{
                                background: 'linear-gradient(135deg, rgba(15, 25, 41, 0.95) 0%, rgba(22, 224, 255, 0.05) 100%)',
                                border: `1px solid rgba(22, 224, 255, 0.15)`,
                                borderTop: `4px solid ${statusColor}`,
                                borderRadius: 3,
                                p: 2.5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1.5,
                                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), ${statusGlow}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: `cardEntry 0.5s ease-in-out ${index * 0.1}s both, ${statusAnimation}`,
                                '@keyframes cardEntry': {
                                  'from': { opacity: 0, transform: 'translateY(20px)' },
                                  'to': { opacity: 1, transform: 'translateY(0)' },
                                },
                                '@keyframes statusPulse': {
                                  '0%, 100%': { boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), ${statusGlow}` },
                                  '50%': { boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), ${statusGlowHover}` },
                                },
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  borderColor: 'rgba(22, 224, 255, 0.3)',
                                  boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), ${statusGlowHover}`
                                }
                              }}
                            >
                              {/* Team Logo */}
                              <Box sx={{
                                width: 55,
                                height: 55,
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: 'radial-gradient(circle, rgba(22, 224, 255, 0.1) 0%, transparent 70%)',
                                border: '2px solid rgba(22, 224, 255, 0.3)',
                                boxShadow: '0 0 15px rgba(22, 224, 255, 0.2)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1) rotate(5deg)',
                                  borderColor: 'rgba(22, 224, 255, 0.5)',
                                  boxShadow: '0 0 25px rgba(22, 224, 255, 0.4)'
                                }
                              }}>
                                <Avatar
                                  src={team.logoPath ? `${ASSET_BASE_URL}/${team.logoPath}` : undefined}
                                  sx={{
                                    width: 45,
                                    height: 45,
                                    bgcolor: 'transparent',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: '#ffffff'
                                  }}
                                >
                                  {(team.teamName || '').substring(0, 2).toUpperCase()}
                                </Avatar>
                              </Box>

                              {/* Team Name */}
                              <Typography sx={{
                                fontWeight: 900,
                                color: '#ffffff',
                                fontFamily: '"Rajdhani", sans-serif',
                                fontSize: '1.2rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                textAlign: 'center'
                              }}>
                                {team.teamName}
                              </Typography>

                              {/* Status Badge */}
                              <Box sx={{
                                px: 2,
                                py: 0.75,
                                borderRadius: 2,
                                background: `${statusColor}20`,
                                border: `1px solid ${statusColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75
                              }}>
                                <Typography sx={{
                                  fontWeight: 900,
                                  color: statusColor,
                                  fontSize: '0.85rem',
                                  letterSpacing: '0.5px'
                                }}>
                                  {statusIcon}
                                </Typography>
                                <Typography sx={{
                                  fontWeight: 700,
                                  color: statusColor,
                                  fontSize: '0.85rem',
                                  letterSpacing: '0.5px'
                                }}>
                                  {statusText}
                                </Typography>
                              </Box>

                              {/* Max Bid */}
                              {eligibility.status !== 'slot-full' && (
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography sx={{
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    mb: 0.25
                                  }}>
                                    Max
                                  </Typography>
                                  <Typography sx={{
                                    fontWeight: 900,
                                    color: '#16E0FF',
                                    fontFamily: '"Rajdhani", sans-serif',
                                    fontSize: '1.1rem',
                                    textShadow: '0 0 10px rgba(22, 224, 255, 0.5)'
                                  }}>
                                    ₹{eligibility.maxBid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </Typography>
                                </Box>
                              )}

                              {/* Category Count */}
                              <Typography sx={{
                                fontWeight: 500,
                                color: '#94a3b8',
                                fontSize: '0.8rem'
                              }}>
                                {eligibility.categoryCount}/{eligibility.minCount} {currentPlayer.category}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ) : playerStatus === 'Sold' && biddingTeam ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 4 }}>
                      <CheckCircle size={100} style={{ color: '#10B981' }} />
                      <Typography variant="h1" sx={{ fontWeight: 900, color: '#10B981', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '3px', fontSize: '4rem' }}>
                        SOLD!
                      </Typography>
                      <Avatar
                        src={biddingTeam.logoPath ? `${ASSET_BASE_URL}/${biddingTeam.logoPath}` : undefined}
                        sx={{ width: 120, height: 120, border: '4px solid #10B981', boxShadow: '0 0 30px rgba(16,185,129,0.4)', fontSize: '2.5rem', fontWeight: 'bold' }}
                      >
                        {(biddingTeam.teamName || '').substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '2.5rem' }}>
                          {biddingTeam.teamName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1.5px', mt: 1, display: 'block', fontSize: '1rem' }}>
                          Acquiring Franchise
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h1" sx={{ color: '#16E0FF', fontWeight: 900, fontFamily: '"Rajdhani", sans-serif', fontSize: '5rem' }}>
                          ₹{currentPlayer.soldPrice?.toLocaleString('en-IN') || currentBid?.toLocaleString('en-IN') || currentPlayer.basePrice.toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', fontSize: '1rem' }}>
                          Final Winning Price
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                      <XCircle size={80} style={{ color: '#EF4444' }} />
                      <Typography variant="h2" sx={{ fontWeight: 900, color: '#EF4444', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '2px', mt: 3 }}>
                        UNSOLD
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Box>
            </Box>
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
