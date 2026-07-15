import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, Divider,
  IconButton, CircularProgress, Alert, Paper, Autocomplete,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { ArrowLeft, User, CheckCircle, XCircle, SkipForward, History, Play, Monitor, Coins } from 'lucide-react';
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

const replaceBold = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>{part}</strong> : part));
};

const parseMarkdownToJSX = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const rawLines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Robust Table Detection
    if (trimmed.includes('|') && i + 1 < rawLines.length && rawLines[i+1].trim().includes('|') && /^[\s-:|]+$/.test(rawLines[i+1].trim().replace(/[a-zA-Z0-9]/g, ''))) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().includes('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) => {
          let cleaned = rowStr;
          if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
          if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
          return cleaned.split('|').map(c => c.trim());
        };

        const headers = parseRow(tableLines[0]);
        const separatorRow = parseRow(tableLines[1]);
        const isSeparator = separatorRow.every(cell => /^[\s-:]+$/.test(cell));
        const dataRowsStart = isSeparator ? 2 : 1;

        const rows: string[][] = [];
        for (let r = dataRowsStart; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          while (cells.length < headers.length) {
            cells.push('');
          }
          rows.push(cells.slice(0, headers.length));
        }

        elements.push(
          <TableContainer component={Paper} key={`tbl-${i}`} sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableRow>
                  {headers.map((h, hIdx) => (
                    <TableCell key={hIdx} sx={{ fontWeight: 'bold', color: 'secondary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {replaceBold(h)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, rIdx) => (
                  <TableRow key={rIdx} hover>
                    {row.map((cell, cIdx) => (
                      <TableCell key={cIdx} sx={{ color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {replaceBold(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }
      continue;
    }

    // Divider
    if (trimmed === '---') {
      elements.push(<Divider key={`div-${i}`} sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />);
      i++;
      continue;
    }

    const leadingSpaces = line.search(/\S/);
    const indentMultiplier = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : 0;
    const paddingLeft = indentMultiplier * 3;

    // Headers
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <Typography key={`h4-${i}`} variant="h6" color="primary" sx={{ fontWeight: 700, mt: 1.5, mb: 1, pl: paddingLeft, fontSize: '0.95rem', opacity: 0.9 }}>
          {replaceBold(trimmed.substring(5))}
        </Typography>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Typography key={`h3-${i}`} variant="h5" color="primary" sx={{ fontWeight: 700, mt: 3, mb: 1.5, pl: paddingLeft }}>
          {replaceBold(trimmed.substring(4))}
        </Typography>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <Typography key={`h2-${i}`} variant="h4" color="secondary" sx={{ fontWeight: 800, mt: 3.5, mb: 2, pl: paddingLeft }}>
          {replaceBold(trimmed.substring(3))}
        </Typography>
      );
      i++;
      continue;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      const bulletStyle = indentMultiplier > 0 
        ? { minWidth: 6, height: 6, border: '1.5px solid #FF0A88', borderRadius: '50%', mt: 0.9 }
        : { minWidth: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF', mt: 0.9 };

      elements.push(
        <Box key={`bullet-${i}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', ml: 2 + indentMultiplier * 2, mb: 1, pl: paddingLeft }}>
          <Box sx={bulletStyle} />
          <Typography variant="body2" sx={{ color: '#e2e8f0', lineHeight: 1.6 }}>
            {replaceBold(content)}
          </Typography>
        </Box>
      );
      i++;
      continue;
    }

    // Paragraph lines
    elements.push(
      <Typography key={`p-${i}`} variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.7, minHeight: trimmed === '' ? '12px' : 'auto', mb: 0.5, pl: paddingLeft }}>
        {replaceBold(line)}
      </Typography>
    );
    i++;
  }

  return elements;
};

interface AuctionDashboardViewProps {
  userRole: 'CREATOR' | 'PLAYER';
  auctionId: number;
  onBackClick: () => void;
}

export const AuctionDashboardView: React.FC<AuctionDashboardViewProps> = ({
  userRole,
  auctionId,
  onBackClick
}) => {
  const [auction, setAuction] = useState<any>(null);
  const [teams, setTeams] = useState<TeamConfig[]>([]);
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [currentAP, setCurrentAP] = useState<AuctionPlayer | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  
  // Bidding Log for Current Player
  const [bidLogs, setBidLogs] = useState<BidResponse[]>([]);
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [selectedBiddingTeamId, setSelectedBiddingTeamId] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<'Sold' | 'Unsold' | null>(null);
  const [showcaseCategoryFilter, setShowcaseCategoryFilter] = useState<string>('');
  const [showcaseLayout, setShowcaseLayout] = useState<'grid' | 'individual'>('grid');
  const [showcaseIndividualIndex, setShowcaseIndividualIndex] = useState<number>(0);

  // Search & Filters for Left Panel
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Available' | 'Sold' | 'Unsold'>('Available');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Showcase Tab Control States
  const [showcaseSlide, setShowcaseSlide] = useState<'bidding' | 'rosters' | 'rules' | 'available' | 'unsold'>('bidding');
  const [showcaseTeamId, setShowcaseTeamId] = useState<number | 'all'>('all');
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  // Validate budget reserve constraint in real-time
  const checkBudgetWarning = (teamId: string, amountStr: string) => {
    if (!teamId || !amountStr) return null;
    const amt = parseFloat(amountStr);
    if (isNaN(amt)) return null;
    const team = teams.find(t => t.id === parseInt(teamId));
    if (!team) return null;
    
    // Remaining empty slots after buying this player
    const emptySlots = Math.max(0, 13 - team.playersCount - 1);
    const minReserve = emptySlots * (auction?.minimumBid || 1000);
    const maxAllowed = team.remainingPurse - minReserve;
    
    if (amt > maxAllowed) {
      return `${team.teamName} cannot bid ₹${amt.toLocaleString('en-IN')} because they must reserve at least ₹${minReserve.toLocaleString('en-IN')} to buy their remaining ${emptySlots} players (Base Price: ₹${(auction?.minimumBid || 1000).toLocaleString('en-IN')}) to complete their 13-player squad.`;
    }
    return null;
  };

  const showcaseChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    showcaseChannelRef.current = new BroadcastChannel(`auction_showcase_${auctionId}`);
    return () => {
      showcaseChannelRef.current?.close();
    };
  }, [auctionId]);

  // Broadcast state changes to the Showcase channel
  const broadcastShowcaseState = (overrideStatus?: string, overrideWarning?: string | null, overrideShowRosters?: boolean) => {
    if (!showcaseChannelRef.current) return;
    
    const selectedTeamIdNum = parseInt(selectedBiddingTeamId);
    const leadTeam = teams.find(t => t.id === selectedTeamIdNum);
    const highestBid = bidLogs.length > 0 ? bidLogs[0] : null;
    const highestBidTeam = highestBid ? teams.find(t => t.id === highestBid.teamId) : null;

    const latestPlayer = currentAP ? players.find(p => p.playerId === currentAP.playerId) : null;
    const playerDbStatus = latestPlayer ? latestPlayer.status : (currentAP ? currentAP.status : 'Idle');
    const playerDbTeamId = latestPlayer ? latestPlayer.teamId : (currentAP ? currentAP.teamId : null);
    const playerDbSoldPrice = latestPlayer ? latestPlayer.soldPrice : (currentAP ? currentAP.soldPrice : null);

    const soldTeam = (currentAP && playerDbStatus === 'Sold' && playerDbTeamId)
      ? teams.find(t => t.id === playerDbTeamId)
      : null;

    const biddingTeamPayload = leadTeam ? {
      id: leadTeam.id,
      teamName: leadTeam.teamName,
      logoPath: leadTeam.logoPath
    } : (highestBidTeam ? {
      id: highestBidTeam.id,
      teamName: highestBidTeam.teamName,
      logoPath: highestBidTeam.logoPath
    } : (soldTeam ? {
      id: soldTeam.id,
      teamName: soldTeam.teamName,
      logoPath: soldTeam.logoPath
    } : null));

    const bidIncrement = auction?.bidIncrement || 0;
    const basePrice = currentAP ? currentAP.basePrice : 0;
    const highestBidVal = highestBid ? highestBid.bidAmount : (currentAP && playerDbStatus === 'Sold' && playerDbSoldPrice ? playerDbSoldPrice : 0);
    const minRequiredBid = highestBid ? (highestBidVal + bidIncrement) : basePrice;

    let activeBidVal = highestBid ? highestBidVal : (currentAP ? (playerDbStatus === 'Sold' && playerDbSoldPrice ? playerDbSoldPrice : basePrice) : null);
    
    if (customBidAmount) {
      const parsedCustomBid = parseFloat(customBidAmount);
      if (!isNaN(parsedCustomBid) && parsedCustomBid >= minRequiredBid) {
        activeBidVal = parsedCustomBid;
      }
    }
    const allMinSquadMet = teams.length > 0 && teams.every(t => t.playersCount >= t.minimumPlayers);

    showcaseChannelRef.current.postMessage({
      type: 'UPDATE_STATE',
      payload: {
        currentPlayer: currentAP ? {
          playerId: currentAP.playerId,
          name: currentAP.name,
          category: currentAP.category,
          club: currentAP.club,
          photoPath: currentAP.photoPath,
          basePrice: currentAP.basePrice
        } : null,
        currentBid: activeBidVal,
        biddingTeam: biddingTeamPayload,
        status: overrideStatus !== undefined ? overrideStatus : (pendingStatus ? pendingStatus : (currentAP ? (playerDbStatus === 'Sold' ? 'Sold' : playerDbStatus === 'Unsold' ? 'Unsold' : 'Available') : 'Idle')),
        showRosters: overrideShowRosters !== undefined ? overrideShowRosters : (showcaseSlide === 'rosters'),
        showRules: showcaseSlide === 'rules',
        showcaseSlide: showcaseSlide,
        showcaseCategoryFilter: showcaseCategoryFilter,
        showcaseLayout: showcaseLayout,
        showcaseIndividualIndex: showcaseIndividualIndex,
        showcaseTeamId: showcaseTeamId,
        warning: overrideWarning !== undefined ? overrideWarning : activeWarning,
        allMinSquadMet: allMinSquadMet,
        teamsList: teams.map(t => ({
          id: t.id,
          teamName: t.teamName,
          logoPath: t.logoPath,
          purseAmount: t.purseAmount,
          remainingPurse: t.remainingPurse,
          playersCount: t.playersCount,
          minimumPlayers: t.minimumPlayers,
          purchasedPlayers: players.filter(p => p.teamId === t.id && p.status === 'Sold')
        }))
      }
    });
  };

  // Watch input values to update warning state in real-time
  useEffect(() => {
    const warning = checkBudgetWarning(selectedBiddingTeamId, customBidAmount);
    setActiveWarning(warning);
  }, [selectedBiddingTeamId, customBidAmount, teams, players, auction]);

  // Synchronize values to Showcase channel
  useEffect(() => {
    broadcastShowcaseState();
  }, [currentAP, bidLogs, selectedBiddingTeamId, customBidAmount, pendingStatus, teams, players, showcaseSlide, activeWarning, showcaseTeamId, showcaseCategoryFilter, showcaseLayout, showcaseIndividualIndex]);

  // Listen for sync request events from newly opened Showcase tabs
  useEffect(() => {
    const channel = new BroadcastChannel(`auction_showcase_${auctionId}`);
    channel.onmessage = (event) => {
      if (event.data?.type === 'REQUEST_STATE') {
        broadcastShowcaseState();
      }
    };
    return () => {
      channel.close();
    };
  }, [auctionId, currentAP, bidLogs, selectedBiddingTeamId, customBidAmount, pendingStatus, teams, players, showcaseSlide, activeWarning, showcaseTeamId, showcaseCategoryFilter, showcaseLayout, showcaseIndividualIndex]);

  const handleLaunchShowcase = () => {
    const confirmInput = window.prompt('Type "launch" to launch the hall projection showcase screen:');
    if (confirmInput?.toLowerCase() !== 'launch') return;
    window.open(window.location.origin + window.location.pathname + `?view=showcase&auctionId=${auctionId}`, '_blank');
  };

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
      const loadedTeams = auctionRes.data.teams || [];
      setTeams(loadedTeams);
      if (loadedTeams.length > 0) {
        const sorted = [...loadedTeams].sort((a: any, b: any) => a.teamName.localeCompare(b.teamName));
        setShowcaseTeamId(sorted[0].id);
      }

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
      setAuction(auctionRes.data);
      const loadedTeams = auctionRes.data.teams || [];
      setTeams(loadedTeams);
      if (loadedTeams.length > 0 && (showcaseTeamId === 'all' || !loadedTeams.some((t: any) => t.id === showcaseTeamId))) {
        const sorted = [...loadedTeams].sort((a: any, b: any) => a.teamName.localeCompare(b.teamName));
        setShowcaseTeamId(sorted[0].id);
      }

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
      const sortedBids = (response.data || []).sort((a: any, b: any) => b.bidAmount - a.bidAmount);
      setBidLogs(sortedBids);
      
      // Prefill custom bid amount input with next logical increment
      if (sortedBids.length > 0) {
        const highest = sortedBids[0].bidAmount;
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

    const targetTeam = teams.find(t => t.id === teamId);
    if (targetTeam) {
      const warning = checkBudgetWarning(teamId.toString(), (bidAmount || 0).toString());
      if (warning) {
        alert(warning);
        setActionLoading(false);
        return;
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
    setPendingStatus('Sold');

    try {
      // Send sold status to channel
      broadcastShowcaseState('Sold');

      await api.post(`/players/${currentAP.playerId}/sold`, {
        auctionId
      });

      await refreshDashboardState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to finalize sale.');
    } finally {
      setPendingStatus(null);
      setActionLoading(false);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentAP) return;
    setActionLoading(true);
    setErrorMsg(null);
    setPendingStatus('Unsold');

    try {
      broadcastShowcaseState('Unsold');

      await api.post(`/players/${currentAP.playerId}/unsold`, {
        auctionId
      });

      await refreshDashboardState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark as unsold.');
    } finally {
      setPendingStatus(null);
      setActionLoading(false);
    }
  };

  const handleSkipPlayer = () => {
    setCurrentAP(null);
  };

  const handlePublishAuction = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/auctions/${auctionId}/publish`);
      await refreshDashboardState();
      alert('Auction published successfully! It is now Active/Upcoming.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to publish auction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartAuction = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/auctions/${auctionId}/start`);
      await refreshDashboardState();
      alert('Live bidding room started!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to start live auction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAuction = async () => {
    const confirmInput = window.prompt('Type "complete" to confirm marking this live auction as Completed:');
    if (confirmInput?.toLowerCase() !== 'complete') return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/auctions/${auctionId}/complete`);
      await refreshDashboardState();
      alert('Auction bidding completed!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete auction.');
    } finally {
      setActionLoading(false);
    }
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
    const matchesCategory = eventFilter ? p.category?.trim().toLowerCase() === eventFilter.trim().toLowerCase() : true;
    const matchesStatus = p.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const highestBid = bidLogs.length > 0 ? bidLogs[0] : null;

  const getMirrorBidPrice = () => {
    if (!currentAP) return 0;
    const basePrice = currentAP.basePrice || 0;
    const bidIncrement = auction?.bidIncrement || 0;
    const highestBidVal = highestBid ? highestBid.bidAmount : (currentAP.status === 'Sold' && currentAP.soldPrice ? currentAP.soldPrice : 0);
    const minRequiredBid = highestBid ? (highestBidVal + bidIncrement) : basePrice;

    let activeBidVal = highestBid ? highestBidVal : (currentAP.status === 'Sold' && currentAP.soldPrice ? currentAP.soldPrice : basePrice);
    
    if (customBidAmount) {
      const parsedCustomBid = parseFloat(customBidAmount);
      if (!isNaN(parsedCustomBid) && parsedCustomBid >= minRequiredBid) {
        activeBidVal = parsedCustomBid;
      }
    }
    return activeBidVal;
  };

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3, height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      {/* Header - Premium Optimum Design (Title on Top, Buttons below in a single line) */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
          pb: 2, 
          flexShrink: 0 
        }}
      >
        {/* Top Row: Back Button & Full Auction Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onBackClick} 
            color="inherit"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ color: '#16E0FF', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: '"Rajdhani", sans-serif' }}>
              ORGANIZER CONTROL PANEL
            </Typography>
          </Box>
        </Box>

        {/* Bottom Row: Quick Action Buttons in a single line */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center', 
            flexWrap: 'nowrap', 
            overflowX: 'auto', 
            py: 0.5,
            width: '100%',
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }
          }}
        >
          {userRole === 'CREATOR' && auction?.status === 'Draft' && (
            <Button
              variant="contained"
              color="warning"
              onClick={handlePublishAuction}
              sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, height: '36px', px: 2.5, whiteSpace: 'nowrap' }}
            >
              Publish Auction
            </Button>
          )}
          {userRole === 'CREATOR' && auction?.status === 'Active' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Play size={16} />}
              onClick={handleStartAuction}
              sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, height: '36px', px: 2.5, whiteSpace: 'nowrap' }}
            >
              Start Bidding
            </Button>
          )}
          {userRole === 'CREATOR' && auction?.status === 'Live' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteAuction}
              sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, height: '36px', px: 2.5, whiteSpace: 'nowrap' }}
            >
              Complete Auction
            </Button>
          )}

          {userRole === 'CREATOR' && (
            <>
              <Button
                variant="contained"
                onClick={handleLaunchShowcase}
                startIcon={<Monitor size={16} />}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 750, 
                  borderRadius: 2, 
                  height: '36px', 
                  px: 2,
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(22, 224, 255, 0.1)',
                  color: '#16E0FF',
                  border: '1px solid rgba(22, 224, 255, 0.3)',
                  '&:hover': { bgcolor: 'rgba(22, 224, 255, 0.2)' }
                }}
              >
                Launch Hall Screen
              </Button>

              {auction?.status === 'Live' && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <Select
                    value={showcaseSlide}
                    onChange={(e) => {
                      const newSlide = e.target.value as any;
                      setShowcaseSlide(newSlide);
                      setShowcaseIndividualIndex(0);
                    }}
                    sx={{ 
                      height: '36px', 
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      '& .MuiSelect-select': { py: 0, px: 2, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', height: '36px' },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '&:hover': { border: '1px solid rgba(255,255,255,0.25)' }
                    }}
                  >
                    <MenuItem value="bidding" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Showcase: Bidding</MenuItem>
                    <MenuItem value="rosters" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Showcase: Rosters</MenuItem>
                    <MenuItem value="rules" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Showcase: Rules</MenuItem>
                    <MenuItem value="available" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Showcase: Available</MenuItem>
                    <MenuItem value="unsold" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Showcase: Unsold</MenuItem>
                  </Select>
                </FormControl>
              )}
            </>
          )}

          <Chip
            label={auction?.status}
            color={auction?.status === 'Live' ? 'warning' : auction?.status === 'Completed' ? 'success' : 'info'}
            sx={{ fontWeight: 'bold', textTransform: 'uppercase', height: '36px', borderRadius: 2, px: 1 }}
          />
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ border: '1px solid rgba(255, 0, 60, 0.2)' }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Board Grid */}
      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0, maxHeight: 'calc(100vh - 140px)', overflow: 'hidden' }}>
        
        {/* LEFT PANEL: Selector Controls */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ bgcolor: '#141B2D', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h5" color="secondary" sx={{ fontWeight: 800, fontFamily: '"Rajdhani", sans-serif', letterSpacing: '0.5px' }}>
                SELECT ACTIVE PLAYER
              </Typography>
              
              {/* Status Chips */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['Available', 'Unsold', 'Sold'] as const).map((status) => (
                  <Button
                    key={status}
                    size="small"
                    variant={statusFilter === status ? 'contained' : 'outlined'}
                    color={status === 'Available' ? 'primary' : status === 'Sold' ? 'success' : 'error'}
                    onClick={() => setStatusFilter(status)}
                    sx={{ flexGrow: 1, fontSize: '0.75rem', py: 0.5, fontWeight: 700, borderRadius: 1.5 }}
                  >
                    {status}
                  </Button>
                ))}
              </Box>

              {/* Category Filter */}
              {rosterCategories.length > 0 && (
                <FormControl size="small" fullWidth>
                  <InputLabel id="category-filter-label" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Filter by Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={eventFilter}
                    label="Filter by Category"
                    onChange={(e) => setEventFilter(e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {rosterCategories.map((cat: string) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Player Selector Autocomplete */}
              <Autocomplete
                options={filteredPlayers.sort((a, b) => a.name.localeCompare(b.name))}
                getOptionLabel={(option) => `${option.name} (${option.category})`}
                value={currentAP}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setCurrentAP(newValue);
                  } else {
                    setCurrentAP(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Search & Select Player" 
                    size="small"
                    placeholder="Type player name..."
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props as any;
                  return (
                    <Box key={option.id} component="li" {...optionProps} sx={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={option.photoPath ? (option.photoPath.startsWith('http') ? option.photoPath : `${ASSET_BASE_URL}/${option.photoPath}`) : undefined} 
                        sx={{ width: 24, height: 24 }}
                      >
                        <User size={12} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                          {option.category} • Base: ₹{option.basePrice?.toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />

              {currentAP && (
                <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(22, 224, 255, 0.1)', textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.8rem' }}>
                    Active: {currentAP.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#16E0FF', fontWeight: 700, fontSize: '0.7rem' }}>
                    {currentAP.category} • Base: ₹{currentAP.basePrice?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT/MAIN PANEL: Mirrored Showcase Preview & Controls */}
        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: 0 }}>
          {currentAP ? (
            <>
              {/* TOP SECTION: Mirrored Showcase Projection Card */}
              <Card sx={{ 
                border: '2px solid rgba(22, 224, 255, 0.2)', 
                bgcolor: '#0F1524', 
                borderRadius: 3, 
                p: 2, 
                boxShadow: '0 0 20px rgba(0,0,0,0.3)', 
                flexShrink: 0,
                height: showcaseSlide === 'bidding' ? 'auto' : '340px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, width: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#16E0FF', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    📺 LIVE SHOWCASE MIRROR (PREVIEW: {showcaseSlide === 'bidding' ? 'BIDDING ROOM' : showcaseSlide === 'rosters' ? 'ROSTERS' : showcaseSlide === 'rules' ? 'RULES' : showcaseSlide === 'available' ? 'AVAILABLE' : 'UNSOLD'})
                  </Typography>
                  {showcaseSlide !== 'bidding' && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="error" 
                      onClick={() => setShowcaseSlide('bidding')} 
                      sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 0.2, height: '24px', borderRadius: 1.5 }}
                    >
                      Back to Bidding Slide
                    </Button>
                  )}
                </Box>
                
                {showcaseSlide === 'bidding' ? (
                  <Grid container spacing={2}>
                    {/* Left Side: Player Details */}
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 2, display: 'flex', alignItems: 'center', p: 1.5, gap: 2 }}>
                        <Avatar 
                          src={currentAP.photoPath ? (currentAP.photoPath.startsWith('http') ? currentAP.photoPath : `${ASSET_BASE_URL}/${currentAP.photoPath}`) : undefined} 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            border: '2px solid #16E0FF', 
                            boxShadow: '0 0 12px rgba(22,224,255,0.15)' 
                          }}
                        >
                          <User size={36} style={{ color: '#94a3b8' }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="h5" noWrap sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif' }}>
                            {currentAP.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip label={`Cat: ${currentAP.category}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: '18px' }} />
                            {currentAP.club && <Chip label={`Club: ${currentAP.club}`} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: '18px' }} />}
                          </Box>
                          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.65rem' }}>BASE PRICE</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif' }}>
                              ₹{currentAP.basePrice?.toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>

                    {/* Right Side: Showcase Live Bid/Sold Outcome Preview */}
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Card sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1.5, textAlign: 'center' }}>
                        {(() => {
                          const statusVal = pendingStatus ? pendingStatus : (currentAP.status === 'Sold' ? 'Sold' : currentAP.status === 'Unsold' ? 'Unsold' : 'Available');
                          
                          if (statusVal === 'Available') {
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #16E0FF', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(22, 224, 255, 0.05)' }}>
                                  <Coins size={22} style={{ color: '#16E0FF' }} />
                                </Box>
                                <Box sx={{ textAlign: 'left' }}>
                                  <Typography variant="caption" sx={{ color: '#16E0FF', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    LIVE BID PRICE
                                  </Typography>
                                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#ffffff', fontSize: '2.5rem', fontFamily: '"Rajdhani", sans-serif', lineHeight: 1 }}>
                                    ₹{getMirrorBidPrice().toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          } else if (statusVal === 'Sold') {
                            const soldPrice = currentAP.soldPrice || (highestBid ? highestBid.bidAmount : 0);
                            const soldTeamName = currentAP.teamName || (teams.find(t => t.id === Number(selectedBiddingTeamId))?.teamName) || 'Drafted';
                            const soldTeamLogo = (teams.find(t => t.id === currentAP.teamId)?.logoPath) || (teams.find(t => t.id === Number(selectedBiddingTeamId))?.logoPath);
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                <CheckCircle size={32} style={{ color: '#10B981' }} />
                                <Box sx={{ textAlign: 'left' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#10B981', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    SOLD!
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {soldTeamLogo && (
                                      <Avatar 
                                        src={`${ASSET_BASE_URL}/${soldTeamLogo}`} 
                                        sx={{ width: 22, height: 22, border: '1px solid #10B981' }}
                                      />
                                    )}
                                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 800 }}>
                                      {soldTeamName}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981', fontFamily: '"Rajdhani", sans-serif', fontSize: '2.2rem' }}>
                                  ₹{soldPrice?.toLocaleString('en-IN')}
                                </Typography>
                              </Box>
                            );
                          } else {
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <XCircle size={32} style={{ color: '#EF4444' }} />
                                <Typography variant="h4" sx={{ fontWeight: 950, color: '#EF4444', fontFamily: '"Rajdhani", sans-serif', letterSpacing: '0.5px' }}>
                                  UNSOLD
                                </Typography>
                              </Box>
                            );
                          }
                        })()}
                      </Card>
                    </Grid>
                  </Grid>
                ) : showcaseSlide === 'rosters' ? (
                  /* Mirrored Franchise Rosters slide */
                  (() => {
                    const selectedTeamIdVal = showcaseTeamId === 'all' ? (teams[0]?.id || '') : showcaseTeamId;
                    const selectedTeamObj = teams.find(t => t.id === Number(selectedTeamIdVal));
                    if (!selectedTeamObj) return <Typography variant="body2" color="text.secondary">No teams configured.</Typography>;
                    const teamPlayers = players.filter(p => p.teamId === selectedTeamObj.id && p.status === 'Sold');
                    return (
                      <Box sx={{ display: 'flex', gap: 2, height: '100%', flexGrow: 1, minHeight: 0 }}>
                        {/* Team summary (Left) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px', borderRight: '1px solid rgba(255,255,255,0.06)', pr: 2, flexShrink: 0, justifyContent: 'center' }}>
                          <FormControl size="small" sx={{ width: '100%', mb: 0.5 }}>
                            <Select
                              value={showcaseTeamId}
                              onChange={(e) => setShowcaseTeamId(e.target.value as number | 'all')}
                              sx={{
                                height: '26px',
                                borderRadius: 1.5,
                                fontSize: '0.7rem',
                                color: '#ffffff',
                                '& .MuiSelect-select': { py: 0.2, px: 1, fontWeight: 700 }
                              }}
                            >
                              {[...teams].sort((a, b) => a.teamName.localeCompare(b.teamName)).map((t) => (
                                <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                  {t.teamName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Avatar src={selectedTeamObj.logoPath ? `${ASSET_BASE_URL}/${selectedTeamObj.logoPath}` : undefined} sx={{ width: 44, height: 44, border: '1px solid rgba(22, 224, 255, 0.25)' }}>
                            {selectedTeamObj.teamName.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.5 }}>Bal: ₹{selectedTeamObj.remainingPurse?.toLocaleString('en-IN')}</Typography>
                        </Box>
                        {/* Roster players list (Right) */}
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, height: '100%' }}>
                          {teamPlayers.length > 0 ? (
                            teamPlayers.map((player) => (
                              <Box key={player.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{player.name}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip label={player.category} size="small" sx={{ height: '16px', fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981', fontSize: '0.75rem' }}>₹{player.soldPrice?.toLocaleString('en-IN')}</Typography>
                                </Box>
                              </Box>
                            ))
                          ) : (
                            <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>No players drafted yet.</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })()
                ) : showcaseSlide === 'rules' ? (
                  /* Mirrored Rules & Guidelines slide */
                  <Box sx={{ display: 'flex', gap: 2, height: '100%', flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <Typography variant="caption" color="text.secondary">STARTING PURSE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>₹{auction?.purseAmount?.toLocaleString('en-IN')}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <Typography variant="caption" color="text.secondary">TARGET SQUAD SIZE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>13 Players</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <Typography variant="caption" color="text.secondary">MIN SQUAD FOR CELEBRATION</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{auction?.minSquadSize || 8} Players</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>ROSTER GUIDELINES</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {auction?.rosterRules?.slice(0, 3).map((rule: any, idx: number) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.02)', p: 0.5, borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{rule.category}</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#16E0FF' }}>Min: {rule.minCount}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                ) : showcaseSlide === 'available' ? (
                  /* Mirrored Available slide */
                  (() => {
                    const filtered = players.filter(p => p.status === 'Available' && (!showcaseCategoryFilter || p.category === showcaseCategoryFilter));
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', flexGrow: 1, minHeight: 0 }}>
                        {/* Control Bar inside the Mirror Card */}
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 0.8 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant={showcaseLayout === 'grid' ? 'contained' : 'outlined'}
                              onClick={() => setShowcaseLayout('grid')}
                              sx={{ fontSize: '0.6rem', py: 0.2, px: 1, fontWeight: 700, height: '22px' }}
                            >
                              Tiles View
                            </Button>
                            <Button
                              size="small"
                              variant={showcaseLayout === 'individual' ? 'contained' : 'outlined'}
                              onClick={() => setShowcaseLayout('individual')}
                              sx={{ fontSize: '0.6rem', py: 0.2, px: 1, fontWeight: 700, height: '22px' }}
                            >
                              List View
                            </Button>
                          </Box>
                          
                          <FormControl size="small" sx={{ minWidth: 110 }}>
                            <Select
                              value={showcaseCategoryFilter}
                              onChange={(e) => setShowcaseCategoryFilter(e.target.value as string)}
                              displayEmpty
                              sx={{ height: '22px', fontSize: '0.65rem', borderRadius: 1.5, '& .MuiSelect-select': { py: 0.2, px: 1, fontWeight: 600 } }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>All Categories</MenuItem>
                              {rosterCategories.map((cat: string) => (
                                <MenuItem key={cat} value={cat} sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {showcaseLayout === 'individual' && (
                            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={showcaseIndividualIndex <= 0}
                                onClick={() => setShowcaseIndividualIndex(prev => Math.max(0, prev - 1))}
                                sx={{ fontSize: '0.55rem', py: 0.1, minWidth: '32px', height: '20px' }}
                              >
                                Prev
                              </Button>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', px: 0.5 }}>
                                {filtered.length > 0 ? `${showcaseIndividualIndex + 1} / ${filtered.length}` : '0 / 0'}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={showcaseIndividualIndex >= filtered.length - 1}
                                onClick={() => setShowcaseIndividualIndex(prev => Math.min(filtered.length - 1, prev + 1))}
                                sx={{ fontSize: '0.55rem', py: 0.1, minWidth: '32px', height: '20px' }}
                              >
                                Next
                              </Button>
                            </Box>
                          )}
                        </Box>

                        {/* Slide View Mirror Render */}
                        {showcaseLayout === 'grid' ? (
                          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, minHeight: 0 }}>
                            {filtered.length > 0 ? (
                              <Grid container spacing={1}>
                                {filtered.map((player) => (
                                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 1, bgcolor: '#141B2D' }}>
                                      <Avatar src={player.photoPath ? `${ASSET_BASE_URL}/${player.photoPath}` : undefined} sx={{ width: 18, height: 18 }} />
                                      <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>{player.name}</Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>No players available.</Typography>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          (() => {
                            const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
                            const player = filtered[safeIndex >= 0 ? safeIndex : 0];
                            if (!player) return <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>No players available.</Typography>;
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '90px', justifyContent: 'center' }}>
                                <Avatar src={player.photoPath ? `${ASSET_BASE_URL}/${player.photoPath}` : undefined} sx={{ width: 50, height: 50, border: '2px solid #16E0FF' }} />
                                <Box sx={{ textAlign: 'left' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', fontSize: '0.9rem', lineHeight: 1.1 }}>{player.name}</Typography>
                                  <Chip label={player.category} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.55rem', height: '15px', mt: 0.5 }} />
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#16E0FF', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>Base Price: ₹{player.basePrice?.toLocaleString('en-IN')}</Typography>
                                </Box>
                              </Box>
                            );
                          })()
                        )}
                      </Box>
                    );
                  })()
                ) : (
                  /* Mirrored Unsold slide */
                  (() => {
                    const filtered = players.filter(p => p.status === 'Unsold' && (!showcaseCategoryFilter || p.category === showcaseCategoryFilter));
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', flexGrow: 1, minHeight: 0 }}>
                        {/* Control Bar inside the Mirror Card */}
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 0.8 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant={showcaseLayout === 'grid' ? 'contained' : 'outlined'}
                              onClick={() => setShowcaseLayout('grid')}
                              sx={{ fontSize: '0.6rem', py: 0.2, px: 1, fontWeight: 700, height: '22px' }}
                            >
                              Tiles View
                            </Button>
                            <Button
                              size="small"
                              variant={showcaseLayout === 'individual' ? 'contained' : 'outlined'}
                              onClick={() => setShowcaseLayout('individual')}
                              sx={{ fontSize: '0.6rem', py: 0.2, px: 1, fontWeight: 700, height: '22px' }}
                            >
                              List View
                            </Button>
                          </Box>
                          
                          <FormControl size="small" sx={{ minWidth: 110 }}>
                            <Select
                              value={showcaseCategoryFilter}
                              onChange={(e) => setShowcaseCategoryFilter(e.target.value as string)}
                              displayEmpty
                              sx={{ height: '22px', fontSize: '0.65rem', borderRadius: 1.5, '& .MuiSelect-select': { py: 0.2, px: 1, fontWeight: 600 } }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>All Categories</MenuItem>
                              {rosterCategories.map((cat: string) => (
                                <MenuItem key={cat} value={cat} sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {showcaseLayout === 'individual' && (
                            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={showcaseIndividualIndex <= 0}
                                onClick={() => setShowcaseIndividualIndex(prev => Math.max(0, prev - 1))}
                                sx={{ fontSize: '0.55rem', py: 0.1, minWidth: '32px', height: '20px' }}
                              >
                                Prev
                              </Button>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', px: 0.5 }}>
                                {filtered.length > 0 ? `${showcaseIndividualIndex + 1} / ${filtered.length}` : '0 / 0'}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={showcaseIndividualIndex >= filtered.length - 1}
                                onClick={() => setShowcaseIndividualIndex(prev => Math.min(filtered.length - 1, prev + 1))}
                                sx={{ fontSize: '0.55rem', py: 0.1, minWidth: '32px', height: '20px' }}
                              >
                                Next
                              </Button>
                            </Box>
                          )}
                        </Box>

                        {/* Slide View Mirror Render */}
                        {showcaseLayout === 'grid' ? (
                          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, minHeight: 0 }}>
                            {filtered.length > 0 ? (
                              <Grid container spacing={1}>
                                {filtered.map((player) => (
                                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 1, bgcolor: '#141B2D' }}>
                                      <Avatar src={player.photoPath ? `${ASSET_BASE_URL}/${player.photoPath}` : undefined} sx={{ width: 18, height: 18 }} />
                                      <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>{player.name}</Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>No players unsold.</Typography>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          (() => {
                            const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
                            const player = filtered[safeIndex >= 0 ? safeIndex : 0];
                            if (!player) return <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>No players unsold.</Typography>;
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '90px', justifyContent: 'center' }}>
                                <Avatar src={player.photoPath ? `${ASSET_BASE_URL}/${player.photoPath}` : undefined} sx={{ width: 50, height: 50, border: '2px solid #EF4444' }} />
                                <Box sx={{ textAlign: 'left' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ffffff', fontFamily: '"Rajdhani", sans-serif', fontSize: '0.9rem', lineHeight: 1.1 }}>{player.name}</Typography>
                                  <Chip label={player.category} size="small" color="error" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.55rem', height: '15px', mt: 0.5 }} />
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>Base Price: ₹{player.basePrice?.toLocaleString('en-IN')}</Typography>
                                </Box>
                              </Box>
                            );
                          })()
                        )}
                      </Box>
                    );
                  })()
                )}
              </Card>

              {/* BOTTOM SECTION: Split Round Controls & Bidding Console */}
              {showcaseSlide === 'bidding' ? (
                <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
                  
                  {/* Left Column: Round outcomes (Mark Sold, Mark Unsold, Skip) */}
                  <Grid size={{ xs: 12, md: 5.5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ flexGrow: 1, border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                        ⚙️ ROUND OUTCOME ACTIONS
                      </Typography>
                      
                      {userRole !== 'PLAYER' ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'center', flexGrow: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="medium"
                            fullWidth
                            disabled={actionLoading || !highestBid || (pendingStatus !== null && pendingStatus !== 'Sold')}
                            startIcon={<CheckCircle size={18} />}
                            onClick={handleMarkSold}
                            sx={{ py: 1.2, fontWeight: 'bold' }}
                          >
                            Mark Sold
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="medium"
                            fullWidth
                            disabled={actionLoading || (pendingStatus !== null && pendingStatus !== 'Unsold')}
                            startIcon={<XCircle size={18} />}
                            onClick={handleMarkUnsold}
                            sx={{ py: 1.2, fontWeight: 'bold' }}
                          >
                            Mark Unsold
                          </Button>
                          <Button
                            variant="outlined"
                            color="inherit"
                            size="medium"
                            fullWidth
                            disabled={actionLoading}
                            startIcon={<SkipForward size={18} />}
                            onClick={handleSkipPlayer}
                            sx={{ py: 1, fontWeight: 'bold' }}
                          >
                            Skip / Next Player
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ py: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Only auction organizers can perform round outcome actions.
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  </Grid>

                  {/* Right Column: Bidding Controls (Enter Bid, select team, place bid) + logs list */}
                  <Grid size={{ xs: 12, md: 6.5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ flexGrow: 1, border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>
                      {currentAP.status === 'Available' && !pendingStatus ? (
                        userRole === 'PLAYER' ? (
                          <Box sx={{ py: 1, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Spectator Bidding View</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                              💸 ENTER BIDS
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <TextField
                                label="Bid Amount"
                                type="number"
                                size="small"
                                value={customBidAmount}
                                onChange={(e) => setCustomBidAmount(e.target.value)}
                                slotProps={{
                                  htmlInput: {
                                    step: auction?.bidIncrement || 100
                                  }
                                }}
                                helperText={`Min Increment: ₹${auction?.bidIncrement || 100}`}
                                sx={{ width: '130px', '& .MuiFormHelperText-root': { mx: 0, mt: 0.5, fontSize: '0.65rem' } }}
                              />
                              <FormControl size="small" sx={{ flexGrow: 1 }}>
                                <InputLabel id="custom-bid-team-select">Bidding Team</InputLabel>
                                <Select
                                  labelId="custom-bid-team-select"
                                  label="Bidding Team"
                                  value={selectedBiddingTeamId}
                                  onChange={(e) => setSelectedBiddingTeamId(e.target.value as string)}
                                >
                                  <MenuItem value="" disabled sx={{ fontSize: '0.8rem' }}>Select Team...</MenuItem>
                                  {teams.map((t) => (
                                    <MenuItem key={t.id} value={t.id} disabled={t.remainingPurse < Number(customBidAmount) || t.playersCount >= t.maximumPlayers} sx={{ fontSize: '0.8rem' }}>
                                      {t.teamName} (Bal: ₹{t.remainingPurse?.toLocaleString('en-IN')})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              size="medium"
                              fullWidth
                              disabled={actionLoading || !selectedBiddingTeamId || !customBidAmount}
                              onClick={() => {
                                handlePlaceBid(Number(selectedBiddingTeamId), Number(customBidAmount));
                                setSelectedBiddingTeamId('');
                              }}
                              sx={{ py: 1, fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 0 10px rgba(22, 224, 255, 0.2)' }}
                            >
                              Place Bid
                            </Button>
                          </Box>
                        )
                      ) : (
                        <Box sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.01)', gap: 0.5 }}>
                          <CheckCircle size={20} color="#10B981" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem' }}>
                            ROUND CONCLUDED
                          </Typography>
                        </Box>
                      )}

                      {/* Logs Registry List */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, minHeight: 0, flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontWeight: 600, fontSize: '0.7rem' }}>
                          <History size={14} /> LIVE ROUND BIDS HISTORY
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            flexGrow: 1,
                            overflowY: 'auto', 
                            backgroundColor: 'rgba(0,0,0,0.15)', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            borderRadius: 1.5,
                            maxHeight: '110px'
                          }}
                        >
                          {bidLogs.length > 0 ? (
                            (() => {
                              const highestBidVal = Math.max(...bidLogs.map(l => l.bidAmount));
                              return bidLogs.map((log) => {
                                const isHighest = log.bidAmount === highestBidVal;
                                return (
                                  <Box 
                                    key={log.id} 
                                    sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      py: 0.4, 
                                      px: 0.8,
                                      borderRadius: 1,
                                      mb: 0.4,
                                      border: isHighest ? '1px solid #16E0FF' : '1px solid transparent',
                                      bgcolor: isHighest ? 'rgba(22, 224, 255, 0.08)' : 'transparent',
                                      boxShadow: isHighest ? '0 0 10px rgba(22, 224, 255, 0.15)' : 'none'
                                    }}
                                  >
                                    <Typography variant="body2" noWrap sx={{ fontWeight: isHighest ? 800 : 600, color: isHighest ? '#16E0FF' : '#ffffff', fontSize: '0.75rem' }}>
                                      {log.teamName} {isHighest && '🔥'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isHighest ? '#16E0FF' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                                      ₹{log.bidAmount?.toLocaleString('en-IN')}
                                    </Typography>
                                  </Box>
                                );
                              });
                            })()
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                                No bids placed in this round.
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    </Card>
                  </Grid>

                </Grid>
              ) : null}
            </>
          ) : (
            /* No Player Active Fallback view: details on left, rules list on right */
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
              <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, border: '1px dashed rgba(22, 224, 255, 0.15)', bgcolor: '#141B2D', borderRadius: 3, textAlign: 'center', minHeight: '380px' }}>
                  <Monitor size={48} color="#16E0FF" style={{ opacity: 0.8, marginBottom: 16 }} />
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Rajdhani", sans-serif', letterSpacing: '0.5px' }}>
                    NO ACTIVE PLAYER SELECTED
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '350px' }}>
                    Search and select a player from the left panel to load them into the bidding pool and start live bidding.
                  </Typography>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, border: '1px solid rgba(255,255,255,0.06)', bgcolor: '#141B2D', borderRadius: 3, gap: 2 }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700, fontFamily: '"Rajdhani", sans-serif' }}>
                    BIDDING DIRECTORY
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(22, 224, 255, 0.1)' }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">BASE PRICE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{auction?.minimumBid?.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">MIN INCREMENT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{auction?.bidIncrement?.toLocaleString('en-IN')}</Typography>
                    </Box>
                    {auction?.maximumBid && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">MAX BID CAP</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{auction?.maximumBid?.toLocaleString('en-IN')}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">RETENTION ALLOWED</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: auction?.allowRetention ? 'success.main' : 'text.secondary' }}>
                        {auction?.allowRetention ? `Yes (Max ${auction?.maxRetainedPlayers})` : 'No'}
                      </Typography>
                    </Box>
                  </Box>

                  {auction?.rosterRules && auction.rosterRules.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                        ROSTER LIMITS
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, maxHeight: '180px', overflowY: 'auto' }}>
                        {auction.rosterRules.map((rule: any, index: number) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{rule.category}</Typography>
                            <Typography variant="caption" color="text.secondary">Min: {rule.minCount} slots</Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Rules & Guidelines Dialog */}
      <Dialog open={rulesOpen} onClose={() => setRulesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'secondary.main', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
          🏆 AUCTION RULES & GUIDELINES
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {auction?.description ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {parseMarkdownToJSX(auction.description)}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No custom guidelines or rules have been entered for this auction.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', p: 2 }}>
          <Button onClick={() => setRulesOpen(false)} variant="contained" color="primary">
            Close Rules
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionDashboardView;
