import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, Divider,
  IconButton, CircularProgress, Alert, Paper, Autocomplete,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment
} from '@mui/material';
import { ArrowLeft, User, CheckCircle, XCircle, SkipForward, History, Play, Monitor, Coins, ChevronRight, Download, Settings, X } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';
import { AuctionShowcaseView } from './AuctionShowcaseView';

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
  serialNumber?: number | null;
  isRetained?: boolean;
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
    if (trimmed.includes('|') && i + 1 < rawLines.length && rawLines[i + 1].trim().includes('|') && /^[\s-:|]+$/.test(rawLines[i + 1].trim().replace(/[a-zA-Z0-9]/g, ''))) {
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
  const [bidAgainModalOpen, setBidAgainModalOpen] = useState(false);
  const [selectedPlayerForBidAgain, setSelectedPlayerForBidAgain] = useState<any>(null);
  const [soldConfirmationModalOpen, setSoldConfirmationModalOpen] = useState(false);

  // Search & Filters for Left Panel
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Available' | 'Sold' | 'Unsold'>('Available');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [playerSearchCategory, setPlayerSearchCategory] = useState<string>('');

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

  // Keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if ((event.target as HTMLElement).tagName === 'INPUT' ||
        (event.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // S: Mark Sold
      if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        // Trigger mark sold action
        console.log('Mark Sold shortcut triggered');
      }

      // U: Mark Unsold
      if (event.key.toLowerCase() === 'u' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        // Trigger mark unsold action
        console.log('Mark Unsold shortcut triggered');
      }

      // N: Next player
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        // Trigger next player action
        console.log('Next Player shortcut triggered');
      }

      // Escape: Close modals/dropdowns
      if (event.key === 'Escape') {
        event.preventDefault();
        // Close any open modals or dropdowns
        console.log('Escape shortcut triggered');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

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
          id: currentAP.id,
          playerId: currentAP.playerId,
          name: currentAP.name,
          category: currentAP.category,
          club: currentAP.club,
          photoPath: currentAP.photoPath,
          basePrice: currentAP.basePrice,
          soldPrice: currentAP.soldPrice,
          serialNumber: currentAP.serialNumber,
          isRetained: currentAP.isRetained
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

  const handleMarkSold = () => {
    if (!currentAP) return;
    if (!selectedBiddingTeamId) {
      setErrorMsg('Please select a team before marking as sold');
      return;
    }
    setSoldConfirmationModalOpen(true);
  };

  const confirmMarkSold = async () => {
    if (!currentAP) return;
    setSoldConfirmationModalOpen(false);
    setActionLoading(true);
    setErrorMsg(null);
    setPendingStatus('Sold');

    try {
      const bidAmount = customBidAmount || auction?.minimumBid || 0;

      await api.post(`/players/${currentAP.playerId}/sold`, {
        auctionId,
        teamId: parseInt(selectedBiddingTeamId),
        soldPrice: bidAmount
      });

      // Manually update currentAP with sold status and price immediately
      setCurrentAP({
        ...currentAP,
        status: 'Sold',
        soldPrice: bidAmount,
        teamId: parseInt(selectedBiddingTeamId)
      });

      // Broadcast immediately with updated state
      broadcastShowcaseState('Sold');

      // Then refresh dashboard state in background
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

  const handleNextPlayer = () => {
    setCurrentAP(null);
    setCustomBidAmount('');
    setSelectedBiddingTeamId('');
    broadcastShowcaseState('Available');
  };

  const handleBidAgain = (player: any) => {
    setSelectedPlayerForBidAgain(player);
    setBidAgainModalOpen(true);
  };

  const confirmBidAgain = async () => {
    if (!selectedPlayerForBidAgain) return;

    setBidAgainModalOpen(false);
    setActionLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/players/${selectedPlayerForBidAgain.playerId}/bid-again`, {
        auctionId
      });

      await refreshDashboardState();

      // Set the player for bidding after successful bid-again
      const updatedPlayers = await api.get(`/auctions/${auctionId}/players`);
      const playerForBidding = updatedPlayers.data.find((p: any) => p.playerId === selectedPlayerForBidAgain.playerId);

      if (playerForBidding) {
        setCurrentAP(playerForBidding);
        setShowcaseSlide('bidding');
        broadcastShowcaseState('Available');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to put player back for bidding.');
    } finally {
      setActionLoading(false);
      setSelectedPlayerForBidAgain(null);
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

  // Memoized roster categories from rules and players
  const rosterCategories = React.useMemo(() => {
    const list = new Set<string>();

    // First try to get categories from roster rules
    auction?.rosterRules?.forEach((rule: any) => {
      if (rule.category) list.add(rule.category.trim());
    });

    // If no categories from roster rules, derive from players
    if (list.size === 0 && players.length > 0) {
      players.forEach((player: any) => {
        if (player.category) list.add(player.category.trim());
      });
    }

    return Array.from(list);
  }, [auction, players]);

  // Filters left panel list
  const filteredPlayers = players.filter(p => {
    const matchesCategory = eventFilter ? p.category?.trim().toLowerCase() === eventFilter.trim().toLowerCase() : true;
    const matchesStatus = p.status === statusFilter;
    const matchesSearch = playerSearchQuery ?
      (p.name?.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
        p.id?.toString().includes(playerSearchQuery.toLowerCase())) : true;
    const matchesSearchCategory = playerSearchCategory ? p.category?.trim().toLowerCase() === playerSearchCategory.trim().toLowerCase() : true;
    return matchesCategory && matchesStatus && matchesSearch && matchesSearchCategory;
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

  // Calculate franchise eligibility and max bid for current player
  const calculateFranchiseEligibility = (team: any) => {
    if (!currentAP) return null;

    const playerCategory = currentAP.category;
    const basePrice = currentAP.basePrice || 0;

    // Get roster rules for this category
    const categoryRule = auction?.rosterRules?.find((rule: any) =>
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
    let status: 'eligible' | 'max-bid-reached' | 'slot-full';
    if (slotFull) {
      status = 'slot-full';
    } else if (maxBid <= 0) {
      status = 'max-bid-reached';
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', mb: 2 }}>
      {/* Header - Premium Design */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 3,
          bgcolor: '#0B1220',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
          minHeight: 56
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={onBackClick}
            color="inherit"
            sx={{
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(22, 224, 255, 0.1)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(22, 224, 255, 0.2)'
            }}>
              <Coins size={24} color="#16E0FF" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{
                color: '#ffffff',
                fontWeight: 700,
                fontFamily: '"Rajdhani", sans-serif',
                letterSpacing: '0.3px',
                fontSize: '1rem'
              }}>
                {auction?.auctionName || 'Auction'}
              </Typography>
              <Chip
                label={auction?.status || 'Active'}
                color={auction?.status === 'Live' ? 'warning' : auction?.status === 'Completed' ? 'success' : 'info'}
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.5px',
                  borderRadius: 1,
                  height: 18,
                  '& .MuiChip-label': { px: 0.75 }
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {userRole === 'CREATOR' && (
            <Button
              variant="outlined"
              onClick={handleLaunchShowcase}
              startIcon={<Monitor size={16} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '0.875rem',
                bgcolor: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Launch Hall Screen
            </Button>
          )}
          {userRole === 'CREATOR' && auction?.status === 'Active' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Play size={16} />}
              onClick={handleStartAuction}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '0.875rem',
                bgcolor: '#16E0FF',
                color: '#0B1220',
                '&:hover': {
                  bgcolor: '#22c55e'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Start Bidding
            </Button>
          )}
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{
          border: '1px solid rgba(255, 0, 60, 0.2)',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(255, 0, 60, 0.1)'
        }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Board Grid - Premium Layout */}
      <Grid container spacing={1.5} sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', px: 1.5, py: 1.5, bgcolor: '#0B1220', height: 'calc(100vh - 56px)' }}>

        {/* LEFT SIDEBAR: Overview & Auction Rules */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 2.4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Overview Card */}
          <Card sx={{
            bgcolor: '#141B2D',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ffffff', fontSize: '0.95rem' }}>
                Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Available Players */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  bgcolor: 'rgba(22, 224, 255, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(22, 224, 255, 0.15)'
                }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(22, 224, 255, 0.15)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={20} color="#16E0FF" />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>Available Players</Typography>
                    <Typography variant="h5" sx={{ color: '#16E0FF', fontWeight: 700, fontSize: '1.25rem' }}>
                      {players.filter(p => p.status === 'Available').length}
                    </Typography>
                  </Box>
                </Box>

                {/* Sold Players */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  bgcolor: 'rgba(34, 197, 94, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(34, 197, 94, 0.15)'
                }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(34, 197, 94, 0.15)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={20} color="#22c55e" />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>Sold Players</Typography>
                    <Typography variant="h5" sx={{ color: '#22c55e', fontWeight: 700, fontSize: '1.25rem' }}>
                      {players.filter(p => p.status === 'Sold').length}
                    </Typography>
                  </Box>
                </Box>

                {/* Unsold Players */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <XCircle size={20} color="#ef4444" />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>Unsold Players</Typography>
                    <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem' }}>
                      {players.filter(p => p.status === 'Unsold').length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Auction Rules Card */}
          <Card sx={{
            bgcolor: '#141B2D',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            flexGrow: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ffffff', fontSize: '0.95rem' }}>
                Auction Rules
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Base Price</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                    ₹{auction?.minimumBid?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Bid Increment</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                    ₹{auction?.bidIncrement?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                {auction?.allowRetention && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Max Retained</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                        {auction?.maxRetainedPlayers}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Retention Price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                        ₹{auction?.retentionPrice?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </>
                )}
                <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 1 }}>Currency</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                  INR (₹)
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    fontSize: '0.8rem',
                    color: '#16E0FF',
                    borderColor: 'rgba(22, 224, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(22, 224, 255, 0.5)',
                      bgcolor: 'rgba(22, 224, 255, 0.05)'
                    }
                  }}
                >
                  Edit Rules
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* MAIN CONTENT: Live Bidding */}
        <Grid size={{ xs: 12, sm: 12, md: 6.6, lg: 6.6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', minHeight: 0 }}>
          <Card sx={{
            bgcolor: '#141B2D',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              {/* Tabs */}
              <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Button
                    variant={showcaseSlide === 'bidding' ? 'text' : 'text'}
                    onClick={() => setShowcaseSlide('bidding')}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: showcaseSlide === 'bidding' ? '#16E0FF' : '#94a3b8',
                      borderBottom: showcaseSlide === 'bidding' ? '2px solid #16E0FF' : '2px solid transparent',
                      borderRadius: 0,
                      px: 2,
                      py: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Bidding
                  </Button>
                  <Button
                    variant={showcaseSlide === 'available' ? 'text' : 'text'}
                    onClick={() => setShowcaseSlide('available')}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: showcaseSlide === 'available' ? '#16E0FF' : '#94a3b8',
                      borderBottom: showcaseSlide === 'available' ? '2px solid #16E0FF' : '2px solid transparent',
                      borderRadius: 0,
                      px: 2,
                      py: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Available
                  </Button>
                  <Button
                    variant={showcaseSlide === 'unsold' ? 'text' : 'text'}
                    onClick={() => setShowcaseSlide('unsold')}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: showcaseSlide === 'unsold' ? '#16E0FF' : '#94a3b8',
                      borderBottom: showcaseSlide === 'unsold' ? '2px solid #16E0FF' : '2px solid transparent',
                      borderRadius: 0,
                      px: 2,
                      py: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Unsold
                  </Button>
                  <Button
                    variant={showcaseSlide === 'rosters' ? 'text' : 'text'}
                    onClick={() => setShowcaseSlide('rosters')}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: showcaseSlide === 'rosters' ? '#16E0FF' : '#94a3b8',
                      borderBottom: showcaseSlide === 'rosters' ? '2px solid #16E0FF' : '2px solid transparent',
                      borderRadius: 0,
                      px: 2,
                      py: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Roster
                  </Button>
                </Box>
              </Box>

              {/* Content Area */}
              <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}>
                {showcaseSlide === 'bidding' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Current Player Card - Sticky */}
                    <Card sx={{
                      bgcolor: 'rgba(255,255,255,0.02)',
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.06)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {/* Player Image */}
                          <Box sx={{ width: 120, height: 120, bgcolor: 'rgba(22, 224, 255, 0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(22, 224, 255, 0.2)', overflow: 'hidden' }}>
                            {currentAP?.photoPath ? (
                              <Avatar
                                src={currentAP.photoPath.startsWith('http') ? currentAP.photoPath : `${ASSET_BASE_URL}/${currentAP.photoPath}`}
                                sx={{ width: 120, height: 120 }}
                              />
                            ) : (
                              <User size={48} color="#16E0FF" />
                            )}
                          </Box>

                          {/* Player Details */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1.5rem' }}>
                                {currentAP?.name || 'Current Player'}
                              </Typography>
                              <Chip label={currentAP?.status || 'Active'} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontWeight: 600, fontSize: '0.75rem', height: 24 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>
                              Lot ID: {currentAP?.id || players.find(p => p.status === 'Available')?.id || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#16E0FF', fontSize: '0.85rem', mb: 2, fontWeight: 600 }}>
                              Auction No: {currentAP?.serialNumber || 'Loading...'}
                            </Typography>

                            {/* Pricing */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>Base Price</Typography>
                                <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1rem' }}>
                                  ₹{auction?.minimumBid?.toLocaleString('en-IN') || '0'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                                  {currentAP?.status === 'Sold' ? 'Status' : 'Current Bid'}
                                </Typography>
                                <Typography variant="h4" sx={{ color: currentAP?.status === 'Sold' ? '#22c55e' : '#22c55e', fontWeight: 700, fontSize: '1.75rem' }}>
                                  {currentAP?.status === 'Sold' ? `₹${currentAP?.soldPrice?.toLocaleString('en-IN') || currentAP?.basePrice?.toLocaleString('en-IN')}` : `₹${customBidAmount || (bidLogs.length > 0 ? bidLogs[0].bidAmount.toLocaleString('en-IN') : auction?.minimumBid?.toLocaleString('en-IN') || '0')}`}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>Next Minimum</Typography>
                                <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1rem' }}>
                                  ₹{((auction?.minimumBid || 0) + (auction?.bidIncrement || 0)).toLocaleString('en-IN')}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Bid Controls */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  onClick={() => {
                                    const currentBid = parseFloat(customBidAmount) || auction?.minimumBid || 0;
                                    const newBid = Math.max(auction?.minimumBid || 0, currentBid - (auction?.bidIncrement || 100));
                                    setCustomBidAmount(newBid.toString());
                                  }}
                                  variant="outlined"
                                  size="small"
                                  disabled={currentAP?.status === 'Sold'}
                                  sx={{
                                    minWidth: 40,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: '#ffffff',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.1)'
                                    },
                                    '&:disabled': {
                                      borderColor: '#475569',
                                      color: '#475569'
                                    }
                                  }}
                                >
                                  -
                                </Button>
                                <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1rem', minWidth: 80, textAlign: 'center' }}>
                                  ₹{customBidAmount || auction?.minimumBid || 0}
                                </Typography>
                                <Button
                                  onClick={() => {
                                    const currentBid = parseFloat(customBidAmount) || auction?.minimumBid || 0;
                                    const newBid = currentBid + (auction?.bidIncrement || 100);
                                    setCustomBidAmount(newBid.toString());
                                  }}
                                  variant="outlined"
                                  size="small"
                                  disabled={currentAP?.status === 'Sold'}
                                  sx={{
                                    minWidth: 40,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: '#ffffff',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.1)'
                                    },
                                    '&:disabled': {
                                      borderColor: '#475569',
                                      color: '#475569'
                                    }
                                  }}
                                >
                                  +
                                </Button>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', ml: 1 }}>
                                  Increment: ₹{auction?.bidIncrement || 100}
                                </Typography>
                              </Box>

                              <FormControl size="small" fullWidth>
                                <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select Team</InputLabel>
                                <Select
                                  value={selectedBiddingTeamId}
                                  onChange={(e) => setSelectedBiddingTeamId(e.target.value)}
                                  label="Select Team"
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    borderRadius: 2,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'rgba(255,255,255,0.1)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'rgba(22, 224, 255, 0.3)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#16E0FF',
                                      borderWidth: '1px',
                                    },
                                    '& .MuiSelect-select': {
                                      color: '#ffffff',
                                      fontSize: '0.85rem',
                                    },
                                  }}
                                >
                                  <MenuItem value="" sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Select Team</MenuItem>
                                  {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id.toString()} sx={{ fontSize: '0.85rem' }}>
                                      {team.teamName}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Franchise Eligibility Display */}
                    {currentAP && (
                      <Card sx={{
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1.5, fontSize: '0.9rem' }}>
                            Franchise Eligibility
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {teams.map((team) => {
                              const eligibility = calculateFranchiseEligibility(team);
                              if (!eligibility) return null;

                              const statusColor = {
                                'eligible': '#10B981',
                                'max-bid-reached': '#F59E0B',
                                'slot-full': '#EF4444'
                              }[eligibility.status];

                              const statusText = {
                                'eligible': 'Eligible',
                                'max-bid-reached': 'Max Bid Reached',
                                'slot-full': 'Slot Full'
                              }[eligibility.status];

                              return (
                                <Box
                                  key={team.id}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(255,255,255,0.05)'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar
                                      src={team.logoPath ? (team.logoPath.startsWith('http') ? team.logoPath : `${ASSET_BASE_URL}/${team.logoPath}`) : undefined}
                                      sx={{ width: 32, height: 32 }}
                                    >
                                      {(team.teamName || '').substring(0, 2).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                                        {team.teamName}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                        {eligibility.categoryCount}/{eligibility.minCount} {currentAP.category}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: statusColor, fontSize: '0.85rem' }}>
                                      {statusText}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                      Max Bid: ₹{eligibility.maxBid.toLocaleString('en-IN')}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </CardContent>
                      </Card>
                    )}

                    {/* Bottom Actions - Sticky */}
                    <Box sx={{
                      display: 'flex',
                      gap: 2,
                      mt: 2,
                      position: 'sticky',
                      bottom: 0,
                      bgcolor: '#141B2D',
                      p: 2,
                      borderRadius: 2,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      zIndex: 5,
                      boxShadow: '0 -4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleMarkSold}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.5,
                          fontSize: '1rem',
                          bgcolor: '#22c55e',
                          color: '#0B1220',
                          '&:hover': { bgcolor: '#16a34a' }
                        }}
                      >
                        Mark Sold
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleMarkUnsold}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.5,
                          fontSize: '1rem',
                          color: '#ef4444',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          '&:hover': {
                            borderColor: 'rgba(239, 68, 68, 0.5)',
                            bgcolor: 'rgba(239, 68, 68, 0.05)'
                          }
                        }}
                      >
                        Mark Unsold
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleNextPlayer}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.5,
                          fontSize: '1rem',
                          bgcolor: '#16E0FF',
                          color: '#0B1220',
                          '&:hover': { bgcolor: '#0DB5E0' }
                        }}
                      >
                        Next Player
                      </Button>
                    </Box>
                  </Box>
                )}

                {showcaseSlide === 'available' && (
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2 }}>
                      <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</InputLabel>
                              <Select
                                value={showcaseCategoryFilter}
                                onChange={(e) => setShowcaseCategoryFilter(e.target.value)}
                                label="Category"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.03)',
                                  borderRadius: 2,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.1)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(22, 224, 255, 0.3)',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#16E0FF',
                                    borderWidth: '1px',
                                  },
                                  '& .MuiSelect-select': {
                                    color: '#ffffff',
                                    fontSize: '0.85rem',
                                  },
                                }}
                              >
                                <MenuItem value="" sx={{ fontSize: '0.85rem' }}>All Categories</MenuItem>
                                {Array.from(new Set(players.filter(p => p.status === 'Available').map(p => p.category))).map((cat) => (
                                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.85rem' }}>{cat}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                              <Button
                                variant={showcaseLayout === 'grid' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => {
                                  setShowcaseLayout('grid');
                                  broadcastShowcaseState('Available');
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.85rem',
                                  bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'transparent',
                                  color: showcaseLayout === 'grid' ? '#0B1220' : '#ffffff',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  '&:hover': {
                                    bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                  }
                                }}
                              >
                                Tiles
                              </Button>
                              <Button
                                variant={showcaseLayout === 'individual' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => {
                                  setShowcaseLayout('individual');
                                  broadcastShowcaseState('Available');
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.85rem',
                                  bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'transparent',
                                  color: showcaseLayout === 'individual' ? '#0B1220' : '#ffffff',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  '&:hover': {
                                    bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                  }
                                }}
                              >
                                List
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                    {showcaseLayout === 'grid' ? (
                      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5, alignContent: 'start' }}>
                        {players
                          .filter(p => p.status === 'Available')
                          .filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase())
                          .map((player) => (
                            <Card
                              key={player.id}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.02)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                height: 'fit-content',
                                '&:hover': {
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                  borderColor: 'rgba(22, 224, 255, 0.3)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                  <Avatar
                                    src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                                    sx={{ width: 40, height: 40, border: '1px solid rgba(255,255,255,0.1)' }}
                                  >
                                    <User size={20} />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {player.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                      {player.category}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                  <Typography variant="body2" sx={{ color: '#16E0FF', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ₹{player.basePrice?.toLocaleString('en-IN')}
                                  </Typography>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                      setCurrentAP(player);
                                      setShowcaseSlide('bidding');
                                      broadcastShowcaseState('Available');
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                      bgcolor: '#22c55e',
                                      color: '#ffffff',
                                      '&:hover': {
                                        bgcolor: '#16a34a',
                                      }
                                    }}
                                  >
                                    Bid
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        {players.filter(p => p.status === 'Available').filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase()).length === 0 && (
                          <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8, color: '#94a3b8' }}>
                            <Typography variant="body2">No available players found</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                        {(() => {
                          const filtered = players.filter(p => p.status === 'Available').filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase());
                          if (filtered.length === 0) {
                            return (
                              <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                                <Typography variant="body2">No available players found</Typography>
                              </Box>
                            );
                          }
                          const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
                          const player = filtered[safeIndex >= 0 ? safeIndex : 0];
                          return (
                            <Box sx={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <Avatar
                                    src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                                    sx={{ width: 120, height: 120, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                  >
                                    <User size={60} />
                                  </Avatar>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 0.5 }}>
                                      {player.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                      {player.category}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#16E0FF' }}>
                                      ₹{player.basePrice?.toLocaleString('en-IN')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Base Price
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="large"
                                    variant="contained"
                                    onClick={() => {
                                      setCurrentAP(player);
                                      setShowcaseSlide('bidding');
                                      broadcastShowcaseState('Available');
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      bgcolor: '#22c55e',
                                      color: '#ffffff',
                                      px: 4,
                                      '&:hover': {
                                        bgcolor: '#16a34a',
                                      }
                                    }}
                                  >
                                    Bid Now
                                  </Button>
                                </CardContent>
                              </Card>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowcaseIndividualIndex(Math.max(0, showcaseIndividualIndex - 1))}
                                  disabled={showcaseIndividualIndex === 0}
                                  sx={{
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.05)'
                                    },
                                    '&:disabled': {
                                      borderColor: 'rgba(255,255,255,0.1)',
                                      color: 'rgba(255,255,255,0.3)'
                                    }
                                  }}
                                >
                                  Previous
                                </Button>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                  {showcaseIndividualIndex + 1} / {filtered.length}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowcaseIndividualIndex(Math.min(filtered.length - 1, showcaseIndividualIndex + 1))}
                                  disabled={showcaseIndividualIndex >= filtered.length - 1}
                                  sx={{
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.05)'
                                    },
                                    '&:disabled': {
                                      borderColor: 'rgba(255,255,255,0.1)',
                                      color: 'rgba(255,255,255,0.3)'
                                    }
                                  }}
                                >
                                  Next
                                </Button>
                              </Box>
                            </Box>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                )}

                {showcaseSlide === 'unsold' && (
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2 }}>
                      <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</InputLabel>
                              <Select
                                value={showcaseCategoryFilter}
                                onChange={(e) => setShowcaseCategoryFilter(e.target.value)}
                                label="Category"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.03)',
                                  borderRadius: 2,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.1)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(22, 224, 255, 0.3)',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#16E0FF',
                                    borderWidth: '1px',
                                  },
                                  '& .MuiSelect-select': {
                                    color: '#ffffff',
                                    fontSize: '0.85rem',
                                  },
                                }}
                              >
                                <MenuItem value="" sx={{ fontSize: '0.85rem' }}>All Categories</MenuItem>
                                {Array.from(new Set(players.filter(p => p.status === 'Unsold').map(p => p.category))).map((cat) => (
                                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.85rem' }}>{cat}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                              <Button
                                variant={showcaseLayout === 'grid' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => {
                                  setShowcaseLayout('grid');
                                  broadcastShowcaseState('Available');
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.85rem',
                                  bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'transparent',
                                  color: showcaseLayout === 'grid' ? '#0B1220' : '#ffffff',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  '&:hover': {
                                    bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                  }
                                }}
                              >
                                Tiles
                              </Button>
                              <Button
                                variant={showcaseLayout === 'individual' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => {
                                  setShowcaseLayout('individual');
                                  broadcastShowcaseState('Available');
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.85rem',
                                  bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'transparent',
                                  color: showcaseLayout === 'individual' ? '#0B1220' : '#ffffff',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  '&:hover': {
                                    bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                  }
                                }}
                              >
                                List
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                    {showcaseLayout === 'grid' ? (
                      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5, alignContent: 'start' }}>
                        {players
                          .filter(p => p.status === 'Unsold')
                          .filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase())
                          .map((player) => (
                            <Card
                              key={player.id}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.02)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                height: 'fit-content',
                                '&:hover': {
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                  borderColor: 'rgba(22, 224, 255, 0.3)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                  <Avatar
                                    src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                                    sx={{ width: 40, height: 40, border: '1px solid rgba(255,255,255,0.1)' }}
                                  >
                                    <User size={20} />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {player.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                      {player.category}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                  <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Unsold
                                  </Typography>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleBidAgain(player)}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                      color: '#16E0FF',
                                      borderColor: 'rgba(22, 224, 255, 0.3)',
                                      '&:hover': {
                                        borderColor: '#16E0FF',
                                        bgcolor: 'rgba(22, 224, 255, 0.1)'
                                      }
                                    }}
                                  >
                                    Bid Again
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        {players.filter(p => p.status === 'Unsold').filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase()).length === 0 && (
                          <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8, color: '#94a3b8' }}>
                            <Typography variant="body2">No unsold players found</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                        {(() => {
                          const filtered = players.filter(p => p.status === 'Unsold').filter(p => !showcaseCategoryFilter || p.category?.trim().toLowerCase() === showcaseCategoryFilter.trim().toLowerCase());
                          if (filtered.length === 0) {
                            return (
                              <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                                <Typography variant="body2">No unsold players found</Typography>
                              </Box>
                            );
                          }
                          const safeIndex = Math.min(showcaseIndividualIndex, filtered.length - 1);
                          const player = filtered[safeIndex >= 0 ? safeIndex : 0];
                          return (
                            <Box sx={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <Avatar
                                    src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                                    sx={{ width: 120, height: 120, border: '2px solid rgba(239, 68, 68, 0.3)' }}
                                  >
                                    <User size={60} />
                                  </Avatar>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 0.5 }}>
                                      {player.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                      {player.category}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                      Unsold
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="large"
                                    variant="outlined"
                                    onClick={() => handleBidAgain(player)}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      color: '#16E0FF',
                                      borderColor: 'rgba(22, 224, 255, 0.3)',
                                      px: 4,
                                      '&:hover': {
                                        borderColor: '#16E0FF',
                                        bgcolor: 'rgba(22, 224, 255, 0.1)'
                                      }
                                    }}
                                  >
                                    Bid Again
                                  </Button>
                                </CardContent>
                              </Card>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowcaseIndividualIndex(Math.max(0, showcaseIndividualIndex - 1))}
                                  disabled={showcaseIndividualIndex === 0}
                                  sx={{
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.05)'
                                    },
                                    '&:disabled': {
                                      borderColor: 'rgba(255,255,255,0.1)',
                                      color: 'rgba(255,255,255,0.3)'
                                    }
                                  }}
                                >
                                  Previous
                                </Button>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                  {showcaseIndividualIndex + 1} / {filtered.length}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  onClick={() => setShowcaseIndividualIndex(Math.min(filtered.length - 1, showcaseIndividualIndex + 1))}
                                  disabled={showcaseIndividualIndex >= filtered.length - 1}
                                  sx={{
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    '&:hover': {
                                      borderColor: '#16E0FF',
                                      bgcolor: 'rgba(22, 224, 255, 0.05)'
                                    },
                                    '&:disabled': {
                                      borderColor: 'rgba(255,255,255,0.1)',
                                      color: 'rgba(255,255,255,0.3)'
                                    }
                                  }}
                                >
                                  Next
                                </Button>
                              </Box>
                            </Box>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                )}

                {showcaseSlide === 'rosters' && (
                  <Box sx={{ mb: 2 }}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Team</InputLabel>
                            <Select
                              value={showcaseTeamId === 'all' ? 'all' : showcaseTeamId.toString()}
                              onChange={(e) => setShowcaseTeamId(e.target.value === 'all' ? 'all' : parseInt(e.target.value as string))}
                              label="Team"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.1)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(22, 224, 255, 0.3)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#16E0FF',
                                  borderWidth: '1px',
                                },
                                '& .MuiSelect-select': {
                                  color: '#ffffff',
                                  fontSize: '0.85rem',
                                },
                              }}
                            >
                              <MenuItem value="all" sx={{ fontSize: '0.85rem' }}>All Teams</MenuItem>
                              {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id.toString()} sx={{ fontSize: '0.85rem' }}>
                                  {team.teamName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</InputLabel>
                            <Select
                              value={showcaseCategoryFilter}
                              onChange={(e) => setShowcaseCategoryFilter(e.target.value)}
                              label="Category"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.1)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(22, 224, 255, 0.3)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#16E0FF',
                                  borderWidth: '1px',
                                },
                                '& .MuiSelect-select': {
                                  color: '#ffffff',
                                  fontSize: '0.85rem',
                                },
                              }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.85rem' }}>All Categories</MenuItem>
                              {rosterCategories.map((cat: string) => (
                                <MenuItem key={cat} value={cat} sx={{ fontSize: '0.85rem' }}>{cat}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                            <Button
                              variant={showcaseLayout === 'grid' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => {
                                setShowcaseLayout('grid');
                                broadcastShowcaseState('Available');
                              }}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.85rem',
                                bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'transparent',
                                color: showcaseLayout === 'grid' ? '#0B1220' : '#ffffff',
                                borderColor: 'rgba(255,255,255,0.2)',
                                '&:hover': {
                                  bgcolor: showcaseLayout === 'grid' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                }
                              }}
                            >
                              Tiles
                            </Button>
                            <Button
                              variant={showcaseLayout === 'individual' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => {
                                setShowcaseLayout('individual');
                                broadcastShowcaseState('Available');
                              }}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.85rem',
                                bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'transparent',
                                color: showcaseLayout === 'individual' ? '#0B1220' : '#ffffff',
                                borderColor: 'rgba(255,255,255,0.2)',
                                '&:hover': {
                                  bgcolor: showcaseLayout === 'individual' ? '#16E0FF' : 'rgba(255,255,255,0.05)',
                                }
                              }}
                            >
                              List
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {showcaseSlide !== 'bidding' && showcaseSlide !== 'unsold' && showcaseSlide !== 'rosters' && showcaseSlide !== 'available' && (
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', position: 'relative', bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <AuctionShowcaseView auctionId={auctionId} />
                  </Box>
                )}

                {/* Direct roster display for dashboard when showcaseSlide is rosters */}
                {showcaseSlide === 'rosters' && (
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
                    {showcaseTeamId !== 'all' ? (
                      /* Single Team View */
                      teams.filter(t => t.id === showcaseTeamId).map((team) => {
                        const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'Sold');
                        // Calculate squad size based on category rules
                        const minSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.minCount || 0), 0) || 0;
                        const maxSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.maxCount || 0), 0) || 0;
                        const showRange = minSquadSize !== maxSquadSize;
                        const squadSizeDisplay = showRange ? `${minSquadSize} - ${maxSquadSize}` : `${minSquadSize}`;

                        return (
                          <Card key={team.id} sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 3, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={team.logoPath ? (team.logoPath.startsWith('http') ? team.logoPath : `${ASSET_BASE_URL}/${team.logoPath}`) : undefined}
                                  sx={{ width: 60, height: 60, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                >
                                  {(team.teamName || '').substring(0, 2).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                    {team.teamName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    {team.playersCount} / {squadSizeDisplay} players
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Purse</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#16E0FF' }}>
                                    ₹{team.remainingPurse.toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {teamPlayers.length > 0 ? (
                              (() => {
                                const filteredPlayers = teamPlayers.filter(p => !showcaseCategoryFilter || p.category === showcaseCategoryFilter);
                                const groupedByCategory = filteredPlayers.reduce((acc, player) => {
                                  const category = player.category || 'Uncategorized';
                                  if (!acc[category]) {
                                    acc[category] = [];
                                  }
                                  acc[category].push(player);
                                  return acc;
                                }, {} as Record<string, typeof teamPlayers>);

                                if (filteredPlayers.length === 0) {
                                  return (
                                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                                      No players in this category
                                    </Typography>
                                  );
                                }

                                return showcaseLayout === 'grid' ? (
                                  /* Grid View for single team grouped by category */
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {Object.entries(groupedByCategory).map(([category, categoryPlayers]) => (
                                      <Box key={category}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#16E0FF', mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                          {category}
                                        </Typography>
                                        <Grid container spacing={2}>
                                          {categoryPlayers.map((player) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                                              <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                  <Avatar
                                                    src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined}
                                                    sx={{ width: 40, height: 40, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                                  >
                                                    {(player.name || '').substring(0, 2).toUpperCase()}
                                                  </Avatar>
                                                  <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                                                      {player.name}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 600, fontSize: '0.85rem' }}>
                                                  ₹{player.soldPrice?.toLocaleString('en-IN') || '0'}
                                                </Typography>
                                              </Card>
                                            </Grid>
                                          ))}
                                        </Grid>
                                      </Box>
                                    ))}
                                  </Box>
                                ) : (
                                  /* List View for single team grouped by category */
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {Object.entries(groupedByCategory).map(([category, categoryPlayers]) => (
                                      <Box key={category}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#16E0FF', mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                          {category}
                                        </Typography>
                                        <TableContainer sx={{ bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2 }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Player</TableCell>
                                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Sold Price</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {categoryPlayers.map((player) => (
                                                <TableRow key={player.id}>
                                                  <TableCell sx={{ color: '#ffffff' }}>{player.name}</TableCell>
                                                  <TableCell sx={{ color: '#22c55e', fontWeight: 600 }}>
                                                    ₹{player.soldPrice?.toLocaleString('en-IN') || '0'}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      </Box>
                                    ))}
                                  </Box>
                                );
                              })()
                            ) : (
                              <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                                No players purchased yet
                              </Typography>
                            )}
                          </Card>
                        );
                      })
                    ) : (
                      /* All Teams View */
                      showcaseLayout === 'grid' ? (
                        /* Grid View for all teams */
                        <Grid container spacing={2}>
                          {teams.map((team) => {
                            const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'Sold');
                            const filteredPlayers = teamPlayers.filter(p => !showcaseCategoryFilter || p.category === showcaseCategoryFilter);
                            const groupedByCategory = filteredPlayers.reduce((acc, player) => {
                              const category = player.category || 'Uncategorized';
                              if (!acc[category]) {
                                acc[category] = [];
                              }
                              acc[category].push(player);
                              return acc;
                            }, {} as Record<string, typeof teamPlayers>);
                            // Calculate squad size based on category rules
                            const minSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.minCount || 0), 0) || 0;
                            const maxSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.maxCount || 0), 0) || 0;
                            const showRange = minSquadSize !== maxSquadSize;
                            const squadSizeDisplay = showRange ? `${minSquadSize} - ${maxSquadSize}` : `${minSquadSize}`;

                            return (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team.id}>
                                <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar
                                      src={team.logoPath ? (team.logoPath.startsWith('http') ? team.logoPath : `${ASSET_BASE_URL}/${team.logoPath}`) : undefined}
                                      sx={{ width: 40, height: 40, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                    >
                                      {(team.teamName || '').substring(0, 2).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>
                                        {team.teamName}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                        {team.playersCount} / {squadSizeDisplay}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {filteredPlayers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      {Object.entries(groupedByCategory).map(([category, categoryPlayers]) => (
                                        <Box key={category}>
                                          <Typography variant="caption" sx={{ color: '#16E0FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                                            {category}
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {categoryPlayers.map((player) => (
                                              <Box key={player.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                                                <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.85rem' }}>
                                                  {player.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600, fontSize: '0.8rem' }}>
                                                  ₹{player.soldPrice?.toLocaleString('en-IN') || '0'}
                                                </Typography>
                                              </Box>
                                            ))}
                                          </Box>
                                        </Box>
                                      ))}
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                                      No players in this category
                                    </Typography>
                                  )}
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        /* List View for all teams */
                        <Grid container spacing={2}>
                          {teams.map((team) => {
                            const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'Sold');
                            const filteredPlayers = teamPlayers.filter(p => !showcaseCategoryFilter || p.category === showcaseCategoryFilter);
                            const groupedByCategory = filteredPlayers.reduce((acc, player) => {
                              const category = player.category || 'Uncategorized';
                              if (!acc[category]) {
                                acc[category] = [];
                              }
                              acc[category].push(player);
                              return acc;
                            }, {} as Record<string, typeof teamPlayers>);
                            // Calculate squad size based on category rules
                            const minSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.minCount || 0), 0) || 0;
                            const maxSquadSize = auction?.rosterRules?.reduce((sum: number, rule: any) => sum + (rule.maxCount || 0), 0) || 0;
                            const showRange = minSquadSize !== maxSquadSize;
                            const squadSizeDisplay = showRange ? `${minSquadSize} - ${maxSquadSize}` : `${minSquadSize}`;

                            return (
                              <Grid size={{ xs: 12 }} key={team.id}>
                                <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar
                                        src={team.logoPath ? (team.logoPath.startsWith('http') ? team.logoPath : `${ASSET_BASE_URL}/${team.logoPath}`) : undefined}
                                        sx={{ width: 50, height: 50, border: '2px solid rgba(22, 224, 255, 0.3)' }}
                                      >
                                        {(team.teamName || '').substring(0, 2).toUpperCase()}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                          {team.teamName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                          {team.playersCount} / {squadSizeDisplay} players
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                      <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Purse</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#16E0FF' }}>
                                          ₹{team.remainingPurse.toLocaleString('en-IN')}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>

                                  {filteredPlayers.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {Object.entries(groupedByCategory).map(([category, categoryPlayers]) => (
                                        <Box key={category}>
                                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#16E0FF', mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {category}
                                          </Typography>
                                          <TableContainer sx={{ bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2 }}>
                                            <Table size="small">
                                              <TableHead>
                                                <TableRow>
                                                  <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Player</TableCell>
                                                  <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Sold Price</TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {categoryPlayers.map((player) => (
                                                  <TableRow key={player.id}>
                                                    <TableCell sx={{ color: '#ffffff' }}>{player.name}</TableCell>
                                                    <TableCell sx={{ color: '#22c55e', fontWeight: 600 }}>
                                                      ₹{player.soldPrice?.toLocaleString('en-IN') || '0'}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </TableContainer>
                                        </Box>
                                      ))}
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                                      No players in this category
                                    </Typography>
                                  )}
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT SIDEBAR: Player Search & Quick Actions */}
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Player Search Card */}
          <Card sx={{
            bgcolor: '#141B2D',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                Player Search
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    placeholder="Search player name, ID..."
                    size="small"
                    fullWidth
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(22, 224, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#16E0FF',
                          borderWidth: '1px',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        paddingRight: playerSearchQuery ? '40px' : '14px',
                      },
                    }}
                  />
                  {playerSearchQuery && (
                    <IconButton
                      size="small"
                      onClick={() => setPlayerSearchQuery('')}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        '&:hover': { color: '#ffffff' }
                      }}
                    >
                      <X size={16} />
                    </IconButton>
                  )}
                </Box>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</InputLabel>
                  <Select
                    value={playerSearchCategory}
                    onChange={(e) => setPlayerSearchCategory(e.target.value)}
                    label="Category"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.03)',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(22, 224, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#16E0FF',
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-select': {
                        color: '#ffffff',
                        fontSize: '0.85rem',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>All Categories</MenuItem>
                    {Array.from(new Set(players.map(p => p.category))).map((cat) => (
                      <MenuItem key={cat} value={cat} sx={{ fontSize: '0.85rem' }}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Search Results */}
                {playerSearchQuery && (
                  <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map((player) => (
                        <Box
                          key={player.id}
                          onClick={() => setCurrentAP(player)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: currentAP?.id === player.id ? 'rgba(22, 224, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                            mb: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: currentAP?.id === player.id ? '1px solid rgba(22, 224, 255, 0.4)' : '1px solid transparent',
                            '&:hover': {
                              bgcolor: 'rgba(22, 224, 255, 0.1)',
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500, fontSize: '0.85rem' }}>
                            {player.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            ID: {player.id} • {player.category}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', py: 2 }}>
                        No players found
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bid Again Confirmation Modal */}
      <Dialog
        open={bidAgainModalOpen}
        onClose={() => setBidAgainModalOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#141B2D',
            border: '1px solid rgba(22, 224, 255, 0.3)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700 }}>
          Put Player Back for Bidding
        </DialogTitle>
        <DialogContent sx={{ color: '#94a3b8' }}>
          <Typography variant="body1">
            Do you want to put {selectedPlayerForBidAgain?.name} back up for bidding?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setBidAgainModalOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBidAgain}
            variant="contained"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              bgcolor: '#16E0FF',
              color: '#0B1220',
              '&:hover': {
                bgcolor: '#0DB5E0'
              },
              '&:disabled': {
                bgcolor: 'rgba(22, 224, 255, 0.3)',
                color: '#94a3b8'
              }
            }}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sold Confirmation Modal */}
      <Dialog
        open={soldConfirmationModalOpen}
        onClose={() => setSoldConfirmationModalOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#141B2D',
            border: '1px solid rgba(22, 224, 255, 0.3)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700 }}>
          Confirm Sale
        </DialogTitle>
        <DialogContent sx={{ color: '#94a3b8' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Mark the player as sold to the team?
          </Typography>
          {selectedBiddingTeamId && (() => {
            const team = teams.find((t: any) => t.id === parseInt(selectedBiddingTeamId));
            if (!team) return null;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, p: 2, bgcolor: 'rgba(22, 224, 255, 0.05)', borderRadius: 2 }}>
                {team.logoPath ? (
                  <Avatar
                    src={team.logoPath.startsWith('http') ? team.logoPath : `${ASSET_BASE_URL}/${team.logoPath}`}
                    sx={{ width: 48, height: 48 }}
                  />
                ) : (
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(22, 224, 255, 0.2)' }}>
                    {team.teamName?.substring(0, 2).toUpperCase() || 'TM'}
                  </Avatar>
                )}
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  {team.teamName}
                </Typography>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setSoldConfirmationModalOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmMarkSold}
            variant="contained"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              bgcolor: '#16E0FF',
              color: '#0B1220',
              '&:hover': {
                bgcolor: '#0DB5E0'
              },
              '&:disabled': {
                bgcolor: 'rgba(22, 224, 255, 0.3)',
                color: '#94a3b8'
              }
            }}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default AuctionDashboardView;


