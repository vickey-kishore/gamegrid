import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Divider,
  IconButton, CircularProgress, Alert, Paper, Tooltip, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowLeft, User, Search, Play, CheckCircle, XCircle, SkipForward, Landmark, History } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface TeamConfig {
  id: number;
  teamName: string;
  logoPath: string | null;
  purseAmount: number;
  remainingPurse: number;
  playersCount: number;
  minimumPlayers: number;
  maximumPlayers: number;
}

interface AuctionPlayer {
  id: number;
  playerId: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  gender: string | null;
  age: number | null;
  category: string;
  city: string | null;
  state: string | null;
  skillLevel: string | null;
  photoPath: string | null;
  basePrice: number;
  status: 'Available' | 'Sold' | 'Unsold';
  soldPrice: number | null;
  teamId: number | null;
  teamName: string | null;
}

interface BidResponse {
  id: number;
  teamId: number;
  teamName: string;
  bidAmount: number;
  bidTime: string;
}

interface AuctionDashboardViewProps {
  auctionId: number;
  onBackClick: () => void;
}

export const AuctionDashboardView: React.FC<AuctionDashboardViewProps> = ({
  auctionId,
  onBackClick
}) => {
  const [auction, setAuction] = useState<any>(null);
  const [teams, setTeams] = useState<TeamConfig[]>([]);
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [currentAP, setCurrentAP] = useState<AuctionPlayer | null>(null);
  
  // Bidding Log for Current Player
  const [bidLogs, setBidLogs] = useState<BidResponse[]>([]);
  const [customBidAmount, setCustomBidAmount] = useState<string>('');

  // Search & Filters for Left Panel
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Available' | 'Sold' | 'Unsold'>('Available');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [auctionId]);

  useEffect(() => {
    if (currentAP) {
      fetchBidLogs(currentAP.playerId);
    } else {
      setBidLogs([]);
    }
  }, [currentAP]);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch auction info
      const auctionRes = await api.get(`/auctions/${auctionId}`);
      setAuction(auctionRes.data);
      setTeams(auctionRes.data.teams);

      // Fetch auction players
      const playersRes = await api.get(`/auctions/${auctionId}/players`);
      setPlayers(playersRes.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardState = async () => {
    try {
      const auctionRes = await api.get(`/auctions/${auctionId}`);
      setTeams(auctionRes.data.teams);

      const playersRes = await api.get(`/auctions/${auctionId}/players`);
      setPlayers(playersRes.data);

      // Refresh current player card if selected
      if (currentAP) {
        const updatedAP = playersRes.data.find((p: AuctionPlayer) => p.playerId === currentAP.playerId);
        if (updatedAP) {
          setCurrentAP(updatedAP);
          fetchBidLogs(updatedAP.playerId);
        }
      }
    } catch (err) {
      console.error('Failed to sync states:', err);
    }
  };

  const fetchBidLogs = async (playerId: number) => {
    try {
      const response = await api.get(`/bids/auction/${auctionId}/player/${playerId}`);
      setBidLogs(response.data);
      
      // Prefill custom bid amount input with next logical increment
      if (response.data.length > 0) {
        const highest = response.data[0].bidAmount;
        setCustomBidAmount((highest + (auction?.bidIncrement || 500)).toString());
      } else {
        setCustomBidAmount((auction?.minimumBid || 1000).toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceBid = async (teamId: number, customAmount?: number) => {
    if (!currentAP) return;
    setActionLoading(true);
    setErrorMsg(null);

    let bidAmount = customAmount;
    if (!bidAmount) {
      if (bidLogs.length > 0) {
        bidAmount = bidLogs[0].bidAmount + auction.bidIncrement;
      } else {
        bidAmount = auction.minimumBid;
      }
    }

    try {
      await api.post('/bids', {
        auctionId,
        playerId: currentAP.playerId,
        teamId,
        bidAmount
      });
      await refreshDashboardState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to place bid.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSold = async () => {
    if (!currentAP) return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/api/players/${currentAP.playerId}/sold`, {
        auctionId
      });
      setCurrentAP(null);
      await refreshDashboardState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to finalize sale.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentAP) return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/api/players/${currentAP.playerId}/unsold`, {
        auctionId
      });
      setCurrentAP(null);
      await refreshDashboardState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark as unsold.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipPlayer = () => {
    setCurrentAP(null);
  };

  // Filters left panel list
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = eventFilter ? p.category.toLowerCase() === eventFilter.toLowerCase() : true;
    const matchesStatus = p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const highestBid = bidLogs.length > 0 ? bidLogs[0] : null;

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3, height: '90vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBackClick} color="inherit">
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h3" color="primary">{auction?.auctionName} Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              {auction?.eventName} • Category: {auction?.category}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={auction?.status}
          color="info"
          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
        />
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ border: '1px solid rgba(255, 0, 60, 0.2)' }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Board Grid */}
      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        
        {/* LEFT PANEL: Player Queue */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Typography variant="h5" color="secondary">Bidding Pool</Typography>
              
              {/* Queue Status Chips */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['Available', 'Unsold', 'Sold'] as const).map((status) => (
                  <Button
                    key={status}
                    size="small"
                    variant={statusFilter === status ? 'contained' : 'outlined'}
                    color={status === 'Available' ? 'primary' : status === 'Sold' ? 'success' : 'error'}
                    onClick={() => setStatusFilter(status)}
                    sx={{ flexGrow: 1, fontSize: '0.75rem', py: 0.5 }}
                  >
                    {status}
                  </Button>
                ))}
              </Box>

              <TextField
                placeholder="Search players..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    )
                  }
                }}
              />

              {auction?.events && auction.events.length > 0 && (
                <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                  <InputLabel id="event-filter-label">Filter by Event Category</InputLabel>
                  <Select
                    labelId="event-filter-label"
                    value={eventFilter}
                    label="Filter by Event Category"
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <MenuItem value="">All Events</MenuItem>
                    {auction.events.map((ev: string) => (
                      <MenuItem key={ev} value={ev}>{ev}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Divider />

              <List sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '350px' }}>
                {filteredPlayers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No players in queue.
                  </Typography>
                ) : (
                  filteredPlayers.map((ap) => (
                    <ListItem
                      key={ap.id}
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        selected={currentAP?.id === ap.id}
                        onClick={() => setCurrentAP(ap)}
                        sx={{
                          borderRadius: 2,
                          border: currentAP?.id === ap.id ? '1px solid #00f0ff' : '1px solid transparent',
                          backgroundColor: currentAP?.id === ap.id ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={ap.photoPath ? `${ASSET_BASE_URL}/${ap.photoPath}` : undefined}>
                            <User size={18} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={ap.name}
                          secondary={
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {ap.category} • Skill: {ap.skillLevel || '—'}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* CENTER PANEL: Current Player Card & Controls */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {currentAP ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
                  {/* Player Card details */}
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Avatar
                      src={currentAP.photoPath ? `${ASSET_BASE_URL}/${currentAP.photoPath}` : undefined}
                      sx={{ width: 90, height: 90, border: '2px solid #00f0ff' }}
                    >
                      <User size={45} />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" color="text.primary">{currentAP.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={currentAP.category} size="small" color="secondary" />
                        <Chip label={`Skill: ${currentAP.skillLevel || 'N/A'}`} size="small" variant="outlined" />
                        <Chip label={`Gender: ${currentAP.gender || 'N/A'}`} size="small" variant="outlined" />
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>BASE PRICE</Typography>
                      <Typography variant="h5" color="primary">${currentAP.basePrice}</Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Dynamic Bidding board */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(0, 240, 255, 0.02)' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>CURRENT HIGHEST BID</Typography>
                        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          {highestBid ? `$${highestBid.bidAmount}` : 'No Bids'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(255, 0, 127, 0.02)' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>CURRENT LEADER</Typography>
                        <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                          {highestBid ? highestBid.teamName : 'None'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Actions / Bids Buttons */}
                  {currentAP.status === 'Available' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      
                      {/* Bid Placers list */}
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                          PLACE INCREMENTAL BID (+${auction.bidIncrement})
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.5 }}>
                          {teams.map((t) => {
                            const nextVal = highestBid ? highestBid.bidAmount + auction.bidIncrement : auction.minimumBid;
                            const isPurseFull = t.remainingPurse < nextVal;
                            const isSlotsFull = t.playersCount >= t.maximumPlayers;
                            const isLeader = highestBid?.teamId === t.id;
                            
                            return (
                              <Tooltip
                                key={t.id}
                                title={
                                  isPurseFull ? 'Insufficient budget' :
                                  isSlotsFull ? 'Roster size reached limit' :
                                  isLeader ? 'Holding highest bid' : `Bid $${nextVal}`
                                }
                              >
                                <span>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    size="small"
                                    disabled={actionLoading || isPurseFull || isSlotsFull || isLeader}
                                    onClick={() => handlePlaceBid(t.id)}
                                    sx={{ py: 1 }}
                                  >
                                    {t.teamName}
                                  </Button>
                                </span>
                              </Tooltip>
                            );
                          })}
                        </Box>
                      </Box>

                      {/* Custom Bid Trigger */}
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Custom Bid Amount"
                          type="number"
                          size="small"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value)}
                          sx={{ width: '180px' }}
                        />
                        <FormControl size="small" sx={{ flexGrow: 1 }}>
                          <InputLabel id="custom-bid-team-select">Team Bidding</InputLabel>
                          <Select
                            labelId="custom-bid-team-select"
                            label="Team Bidding"
                            defaultValue=""
                            onChange={(e: any) => {
                              if (e.target.value && customBidAmount) {
                                handlePlaceBid(Number(e.target.value), Number(customBidAmount));
                                e.target.value = ''; // Reset select
                              }
                            }}
                          >
                            <MenuItem value="" disabled>Select Team...</MenuItem>
                            {teams.map((t) => (
                              <MenuItem key={t.id} value={t.id} disabled={t.remainingPurse < Number(customBidAmount) || t.playersCount >= t.maximumPlayers}>
                                {t.teamName} (Bal: ${t.remainingPurse})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Sold / Unsold actions */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          disabled={actionLoading || !highestBid}
                          startIcon={<CheckCircle size={18} />}
                          onClick={handleMarkSold}
                        >
                          Mark Sold
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          disabled={actionLoading}
                          startIcon={<XCircle size={18} />}
                          onClick={handleMarkUnsold}
                        >
                          Mark Unsold
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          disabled={actionLoading}
                          startIcon={<SkipForward size={18} />}
                          onClick={handleSkipPlayer}
                        >
                          Skip
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Alert severity={currentAP.status === 'Sold' ? 'success' : 'error'} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        {currentAP.status === 'Sold' ? (
                          <Typography variant="body1">
                            Player sold to <strong>{currentAP.teamName}</strong> for <strong>${currentAP.soldPrice}</strong>
                          </Typography>
                        ) : (
                          <Typography variant="body1">Player marked Unsold</Typography>
                        )}
                      </Alert>
                      <Button variant="outlined" color="primary" sx={{ mt: 3 }} onClick={handleSkipPlayer}>
                        Select Another Player
                      </Button>
                    </Box>
                  )}

                  {/* Bid logs */}
                  {bidLogs.length > 0 && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <History size={14} /> RECENT BID LOGS
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1, maxHeight: 150, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        {bidLogs.map((log) => (
                          <Box key={log.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.teamName}</Typography>
                            <Typography variant="body2" color="primary">${log.bidAmount}</Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 2, textAlign: 'center', opacity: 0.7 }}>
                  <Play size={48} color="#00f0ff" />
                  <Box>
                    <Typography variant="h5" color="text.primary">Dashboard Bidding Idle</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a player from the queue on the left to load them into the bidding card.
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT PANEL: Teams Roster Budgets */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Typography variant="h5" color="secondary">Teams Standings</Typography>
              <Divider />

              <List sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px' }}>
                {teams.map((t) => {
                  const spent = t.purseAmount - t.remainingPurse;
                  const slotsLeft = t.maximumPlayers - t.playersCount;
                  
                  return (
                    <Paper
                      key={t.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                        <Avatar
                          src={t.logoPath ? `${ASSET_BASE_URL}/${t.logoPath}` : undefined}
                          sx={{ width: 35, height: 35, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <Landmark size={16} />
                        </Avatar>
                        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                          {t.teamName}
                        </Typography>
                      </Box>

                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>REMAINING PURSE</Typography>
                          <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            ${t.remainingPurse}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TOTAL SPENT</Typography>
                          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                            ${spent}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>SLOTS FILLED</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {t.playersCount} / {t.maximumPlayers}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>SLOTS LEFT</Typography>
                          <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                            {slotsLeft} slots
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default AuctionDashboardView;
