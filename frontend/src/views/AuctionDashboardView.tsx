import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Divider,
  IconButton, CircularProgress, Alert, Paper, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowLeft, User, Search, Play, CheckCircle, XCircle, SkipForward, History } from 'lucide-react';
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
  club: string | null;
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
  const [selectedBiddingTeamId, setSelectedBiddingTeamId] = useState<string>('');

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
      await api.post(`/players/${currentAP.playerId}/sold`, {
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
      await api.post(`/players/${currentAP.playerId}/unsold`, {
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

  // Memoized roster categories from rules
  const rosterCategories = React.useMemo(() => {
    const list = new Set<string>();
    auction?.rosterRules?.forEach((rule: any) => {
      if (rule.category) list.add(rule.category.trim());
    });
    return Array.from(list);
  }, [auction]);

  // Filters left panel list
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = eventFilter ? p.category?.trim().toLowerCase() === eventFilter.trim().toLowerCase() : true;
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
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3, height: 'calc(100vh - 120px)' }}>
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
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px', overflow: 'hidden' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minHeight: 0 }}>
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

              {rosterCategories.length > 0 && (
                <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                  <InputLabel id="category-filter-label">Filter by Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={eventFilter}
                    label="Filter by Category"
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {rosterCategories.map((cat: string) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Divider />

              <List sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                {filteredPlayers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No players in queue.
                  </Typography>
                ) : (
                  filteredPlayers.map((ap, index) => (
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
                          <Avatar src={ap.photoPath ? (ap.photoPath.startsWith('http') ? ap.photoPath : `${ASSET_BASE_URL}/${ap.photoPath}`) : undefined}>
                            <User size={18} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${index + 1}. ${ap.name}`}
                          secondary={
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {ap.category} {ap.club ? `• ${ap.club}` : ''}
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
        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px', overflow: 'hidden' }}>
            <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, justifyContent: 'center' }}>
              {currentAP ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flexGrow: 1 }}>
                  <Grid container spacing={4} sx={{ flexGrow: 1, alignItems: 'center', minHeight: 0 }}>
                    {/* Left Column: Player Photo & Name */}
                    <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 2 }}>
                      <Avatar
                        src={currentAP.photoPath ? (currentAP.photoPath.startsWith('http') ? currentAP.photoPath : `${ASSET_BASE_URL}/${currentAP.photoPath}`) : undefined}
                        sx={{ width: 220, height: 220, border: '4px solid #00f0ff', boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)', mb: 2 }}
                      >
                        <User size={110} />
                      </Avatar>
                      
                      <Typography variant="h3" sx={{ fontWeight: 'bold', letterSpacing: '0.5px' }} color="text.primary">
                        {currentAP.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, mt: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip label={currentAP.category} size="medium" color="secondary" sx={{ fontSize: '0.9rem', px: 1 }} />
                        <Chip label={`Gender: ${currentAP.gender || 'N/A'}`} size="medium" variant="outlined" sx={{ fontSize: '0.9rem', px: 1 }} />
                        {currentAP.club && (
                          <Chip label={`Club: ${currentAP.club}`} size="medium" color="primary" variant="outlined" sx={{ fontSize: '0.9rem', px: 1 }} />
                        )}
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>BASE PRICE</Typography>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>₹{currentAP.basePrice}</Typography>
                      </Box>
                    </Grid>

                    {/* Right Column: Bid Details Input & Sold/Unsold/Skip Buttons */}
                    <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2, borderLeft: { md: '1px solid rgba(255, 255, 255, 0.08)' }, pl: { md: 4 } }}>
                      {currentAP.status === 'Available' ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                          
                          {/* Bidding Controls Form */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}>
                              ENTER BID DETAILS
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <TextField
                                label="Bid Amount"
                                type="number"
                                size="medium"
                                value={customBidAmount}
                                onChange={(e) => setCustomBidAmount(e.target.value)}
                                sx={{ width: '150px' }}
                              />
                              <FormControl size="medium" sx={{ flexGrow: 1 }}>
                                <InputLabel id="custom-bid-team-select">Bidding Team</InputLabel>
                                <Select
                                  labelId="custom-bid-team-select"
                                  label="Bidding Team"
                                  value={selectedBiddingTeamId}
                                  onChange={(e) => setSelectedBiddingTeamId(e.target.value as string)}
                                >
                                  <MenuItem value="" disabled>Select Team...</MenuItem>
                                  {teams.map((t) => (
                                    <MenuItem key={t.id} value={t.id} disabled={t.remainingPurse < Number(customBidAmount) || t.playersCount >= t.maximumPlayers}>
                                      {t.teamName} (Bal: ₹{t.remainingPurse})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              size="large"
                              disabled={actionLoading || !selectedBiddingTeamId || !customBidAmount}
                              onClick={() => {
                                handlePlaceBid(Number(selectedBiddingTeamId), Number(customBidAmount));
                                setSelectedBiddingTeamId(''); // Reset selection after placement
                              }}
                              sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 'bold' }}
                            >
                              Place Bid
                            </Button>
                          </Box>

                          <Divider />

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="large"
                              fullWidth
                              disabled={actionLoading || !highestBid}
                              startIcon={<CheckCircle size={20} />}
                              onClick={handleMarkSold}
                              sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                              Mark Sold
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="large"
                              fullWidth
                              disabled={actionLoading}
                              startIcon={<XCircle size={20} />}
                              onClick={handleMarkUnsold}
                              sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                              Mark Unsold
                            </Button>
                            <Button
                              variant="outlined"
                              color="inherit"
                              size="large"
                              disabled={actionLoading}
                              startIcon={<SkipForward size={20} />}
                              onClick={handleSkipPlayer}
                              sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                              Skip
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Alert severity={currentAP.status === 'Sold' ? 'success' : 'error'} sx={{ display: 'inline-flex', alignItems: 'center', mb: 2 }}>
                            {currentAP.status === 'Sold' ? (
                              <Typography variant="body1">
                                Player sold to <strong>{currentAP.teamName}</strong> for <strong>₹{currentAP.soldPrice}</strong>
                              </Typography>
                            ) : (
                              <Typography variant="body1">Player marked Unsold</Typography>
                            )}
                          </Alert>
                          <Box>
                            <Button variant="outlined" color="primary" onClick={handleSkipPlayer} sx={{ fontWeight: 'bold', mt: 2 }}>
                              Select Another Player
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* Bid logs (Inside Right Column) */}
                      {bidLogs.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontWeight: 600 }}>
                            <History size={14} /> RECENT BID LOGS
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 1, maxHeight: 110, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            {bidLogs.map((log) => (
                              <Box key={log.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.teamName}</Typography>
                                <Typography variant="body2" color="primary">₹{log.bidAmount}</Typography>
                              </Box>
                            ))}
                          </Paper>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
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

      </Grid>
    </Box>
  );
};

export default AuctionDashboardView;
