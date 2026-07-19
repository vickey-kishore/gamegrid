import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, TextField, Box, Typography, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Tooltip, Grid, InputAdornment
} from '@mui/material';
import { Edit2, Trash2, Search, UserPlus, X, RefreshCw, User, Lock, Unlock, Award, Download } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface ManagePlayersDialogProps {
  open: boolean;
  onClose: () => void;
  auctionId: number;
  auctionName: string;
  rosterRules: { category: string; minCount: number }[];
  status: string;
}



interface AuctionPlayerResponse {
  id: number;
  playerId: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  category: string;
  gender: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  status: string;
  photoPath: string | null;
  club: string | null;
  isRetained?: boolean;
  teamName?: string | null;
  soldPrice?: number | null;
}

export const ManagePlayersDialog: React.FC<ManagePlayersDialogProps> = ({
  open,
  onClose,
  auctionId,
  auctionName,
  rosterRules,
  status
}) => {
  const [players, setPlayers] = useState<AuctionPlayerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [playerCategory, setPlayerCategory] = useState('');
  const [club, setClub] = useState('');

  // Retention States
  const [teams, setTeams] = useState<any[]>([]);
  const [auction, setAuction] = useState<any>(null);
  const [retainDialogOpen, setRetainDialogOpen] = useState(false);
  const [retainingPlayer, setRetainingPlayer] = useState<AuctionPlayerResponse | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [retentionPrice, setRetentionPrice] = useState<number | ''>('');

  // Extract unique category options from rules strictly
  const uniqueCategories = React.useMemo(() => {
    const list = new Set<string>();
    rosterRules?.forEach(r => {
      if (r.category) {
        list.add(r.category.replace(/\s+/g, ' ').trim());
      }
    });
    if (list.size === 0) {
      list.add("Men");
      list.add("45+");
      list.add("U-19 Boys");
      list.add("Veteran");
    }
    return Array.from(list);
  }, [rosterRules]);

  useEffect(() => {
    if (open && auctionId) {
      fetchAuctionPlayers();
      fetchAuctionTeams();
      fetchAuctionDetails();
    }
  }, [open, auctionId]);

  const fetchAuctionPlayers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auctions/${auctionId}/players`);
      setPlayers(res.data);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load registered players.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctionTeams = async () => {
    try {
      const res = await api.get(`/auctions/${auctionId}/teams`);
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  const fetchAuctionDetails = async () => {
    try {
      const res = await api.get(`/auctions/${auctionId}`);
      setAuction(res.data);
    } catch (err) {
      console.error('Failed to load auction details', err);
    }
  };

  const handleOpenRetainDialog = (ap: AuctionPlayerResponse) => {
    setRetainingPlayer(ap);
    setSelectedTeamId('');
    setRetentionPrice(auction?.retentionPrice || auction?.minimumBid || 1000);
    setRetainDialogOpen(true);
  };

  const handleRetainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retainingPlayer || !selectedTeamId || !retentionPrice) {
      alert('Please select a team and enter a retention price.');
      return;
    }

    try {
      await api.post(`/players/${retainingPlayer.playerId}/auction/${auctionId}/retain`, null, {
        params: {
          teamId: selectedTeamId,
          retentionPrice: Number(retentionPrice)
        }
      });
      alert(`Player ${retainingPlayer.name} retained successfully!`);
      setRetainDialogOpen(false);
      fetchAuctionPlayers();
      fetchAuctionTeams();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to retain player.');
    }
  };

  const handleReleaseRetainedPlayer = async (ap: AuctionPlayerResponse) => {
    if (!window.confirm(`Are you sure you want to release ${ap.name} from retention?`)) {
      return;
    }

    try {
      await api.post(`/players/${ap.playerId}/auction/${auctionId}/release-retained`);
      alert(`Player ${ap.name} released successfully!`);
      fetchAuctionPlayers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to release retained player.');
    }
  };

  const handleOpenAddForm = () => {
    setFormType('ADD');
    setName('');
    setPhoneNumber('');
    setEmail('');
    setPlayerCategory(uniqueCategories[0] || '');
    setClub('');
    setFormOpen(true);
  };

  const handleOpenEditForm = (ap: AuctionPlayerResponse) => {
    setFormType('EDIT');
    setEditingPlayerId(ap.playerId);
    setName(ap.name || '');
    setPhoneNumber(ap.phoneNumber || '');
    setEmail(ap.email || '');

    // Normalize and match the player's category against uniqueCategories
    const normalizedPlayerCat = (ap.category || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const matched = uniqueCategories.find(cat => cat.toLowerCase() === normalizedPlayerCat);

    setPlayerCategory(matched || ap.category || uniqueCategories[0] || '');
    setClub(ap.club || '');
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim() || !playerCategory.trim()) {
      alert('Please fill in all required fields (Name, Phone Number, Category)');
      return;
    }

    const payload = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim() || null,
      category: playerCategory.trim(),
      gender: playerCategory.trim(),
      age: null,
      city: null,
      state: null,
      club: club.trim() || null
    };

    try {
      if (formType === 'ADD') {
        await api.post('/players', payload, {
          params: { auctionId }
        });
        alert('Player registered successfully!');
      } else if (formType === 'EDIT' && editingPlayerId !== null) {
        await api.put(`/players/${editingPlayerId}`, payload);
        alert('Player details updated successfully!');
      }
      setFormOpen(false);
      fetchAuctionPlayers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save player details.');
    }
  };

  const handleClearAuctionPool = async () => {
    if (!window.confirm("Are you sure you want to remove ALL players from this auction? This will clear all registered players, reset all team retention budgets, and cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/auctions/${auctionId}/players`);
      alert("All players successfully removed from this auction.");
      fetchAuctionPlayers();
      fetchAuctionTeams();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to clear players pool.");
    }
  };

  const handleRemovePlayer = async (playerId: number, playerName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName} from this auction?`)) {
      return;
    }

    try {
      await api.delete(`/players/${playerId}/auction/${auctionId}`);
      alert('Player removed successfully.');
      fetchAuctionPlayers();
    } catch (err: any) {
      console.error(err);
      alert('Failed to remove player.');
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download the players list PDF.");
      return;
    }

    const formattedDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rowsHtml = filteredPlayers.map((ap, index) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${ap.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${ap.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${ap.club || '—'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>${auctionName} - Players List</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #333;
              margin: 0;
            }
            .page-wrapper-table {
              width: 100%;
              border-collapse: collapse;
              border: none;
            }
            .page-header-space {
              height: 1.6cm; /* Professional top margin space */
            }
            .page-footer-space {
              height: 1.6cm; /* Professional bottom margin space */
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #111;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #666;
            }
            .players-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .players-table th {
              background-color: #f5f5f5;
              padding: 12px 10px;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
              text-align: center;
              font-size: 14px;
            }
            .players-table td {
              font-size: 14px;
            }
            .print-date {
              position: fixed;
              top: 0.8cm;
              left: 1.6cm;
              font-size: 10px;
              color: #777;
              display: none;
            }
            .print-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-40deg);
              font-size: 72px;
              font-family: 'Rajdhani', 'Inter', sans-serif;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 4px;
              color: rgba(0, 0, 0, 0.04); /* Light, professional watermark */
              white-space: nowrap;
              z-index: -1000;
              pointer-events: none;
              display: none;
            }
            @media print {
              @page {
                size: auto;
                margin: 0; /* Suppress browser headers and footers */
              }
              body {
                margin: 0 1.6cm; /* Professional left and right margins */
              }
              .print-date {
                display: block;
              }
              .print-watermark {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-watermark">
            Game Grid
          </div>
          <div class="print-date">
            Date: ${formattedDate}
          </div>
          
          <table class="page-wrapper-table">
            <thead>
              <tr>
                <td>
                  <div class="page-header-space"></div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="header">
                    <h1>${auctionName}</h1>
                    <p>Official Players Registry Pool List</p>
                  </div>
                  
                  <table class="players-table">
                    <thead>
                      <tr>
                        <th style="width: 80px;">S.No</th>
                        <th style="text-align: left;">Player Name</th>
                        <th style="width: 180px;">Category</th>
                        <th style="width: 180px;">Club</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div class="page-footer-space"></div>
                </td>
              </tr>
            </tfoot>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      (p.name?.toLowerCase().includes(search.toLowerCase())) ||
      (p.phoneNumber?.includes(search)) ||
      (p.email?.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = filterCategory === 'ALL' ||
      p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === filterCategory.replace(/\s+/g, ' ').trim().toLowerCase();

    return matchesSearch && matchesCat;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0e1527', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', py: 2 }}>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif', color: 'primary.main' }}>
            Manage Auction Players
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, color: '#f1f5f9' }}>
            Auction: {auctionName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 3, mt: 1, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Left Side: Search & Filter */}
          <Box sx={{ display: 'flex', gap: 1.5, flex: 1, alignItems: 'center', minWidth: { xs: '100%', md: 'auto' } }}>
            <TextField
              label="Search Players"
              placeholder="Name, phone or email..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} style={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ width: '220px' }}
            />

            <FormControl size="small" sx={{ width: '160px' }}>
              <InputLabel>Filter Category</InputLabel>
              <Select
                value={filterCategory}
                label="Filter Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {uniqueCategories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Right Side: Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            {status === 'Draft' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<UserPlus size={16} />}
                  onClick={handleOpenAddForm}
                  sx={{ py: 0.8 }}
                >
                  Add Player
                </Button>
                {players.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Trash2 size={16} />}
                    onClick={handleClearAuctionPool}
                    sx={{ py: 0.8, borderColor: 'rgba(239, 68, 68, 0.4)', '&:hover': { borderColor: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}
                  >
                    Clear Pool
                  </Button>
                )}
              </>
            )}

            {players.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Download size={16} />}
                onClick={handleDownloadPDF}
                sx={{ py: 0.8 }}
              >
                PDF
              </Button>
            )}

            <IconButton onClick={fetchAuctionPlayers} color="inherit" size="small" title="Refresh List" sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <RefreshCw size={16} />
            </IconButton>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredPlayers.length === 0 ? (
          <Paper variant="outlined" sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No registered players found matching criteria.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '60px' }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Player Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Club</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Email Address</TableCell>
                  {status === 'Draft' && <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '120px' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((ap, index) => (
                  <TableRow key={ap.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{index + 1}</TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={ap.photoPath ? (ap.photoPath.startsWith('http') ? ap.photoPath : `${ASSET_BASE_URL}/${ap.photoPath}`) : undefined} sx={{ width: 30, height: 30 }}>
                          <User size={14} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>{ap.name}</Typography>
                          {ap.isRetained && (
                            <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>
                              Retained by {ap.teamName} (₹{ap.soldPrice})
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{ap.category}</TableCell>
                    <TableCell sx={{ color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{ap.club || '—'}</TableCell>
                    <TableCell sx={{ color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{ap.phoneNumber}</TableCell>
                    <TableCell sx={{ color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{ap.email || '—'}</TableCell>
                    {status === 'Draft' && (
                      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {auction?.allowRetention && (
                            ap.isRetained ? (
                              <Tooltip title="Release / Undo Retention">
                                <IconButton
                                  color="warning"
                                  size="small"
                                  onClick={() => handleReleaseRetainedPlayer(ap)}
                                >
                                  <Unlock size={16} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ap.status === 'Available' && (
                                <Tooltip title="Retain Player">
                                  <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => handleOpenRetainDialog(ap)}
                                  >
                                    <Award size={16} />
                                  </IconButton>
                                </Tooltip>
                              )
                            )
                          )}
                          <Tooltip title="Edit Profile">
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => handleOpenEditForm(ap)}
                            >
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Player">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemovePlayer(ap.playerId, ap.name)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close Registry
        </Button>
      </DialogActions>

      {/* Manual Entry Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 'bold' }}>
            {formType === 'ADD' ? 'Add Player to Auction Pool' : 'Edit Player Profile'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Player Name *"
                  fullWidth
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={playerCategory}
                    label="Category *"
                    onChange={(e) => setPlayerCategory(e.target.value)}
                  >
                    {uniqueCategories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Club"
                  placeholder="e.g. KBA"
                  fullWidth
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setFormOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save Entry
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Retain Player Confirmation Dialog */}
      <Dialog open={retainDialogOpen} onClose={() => setRetainDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleRetainSubmit}>
          <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 'bold' }}>
            Retain Player: {retainingPlayer?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Select the team that will retain this player. The retention price will be deducted from the team's total budget.
              </Typography>

              <FormControl fullWidth required>
                <InputLabel id="retain-team-select-label">Select Retaining Team</InputLabel>
                <Select
                  labelId="retain-team-select-label"
                  label="Select Retaining Team"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value as number)}
                >
                  <MenuItem value="" disabled>Select Team...</MenuItem>
                  {teams
                    .filter(t => {
                      const retainedCount = players.filter(p => p.isRetained && p.teamName === t.teamName).length;
                      return retainedCount < (auction?.maxRetainedPlayers || 99);
                    })
                    .map(t => (
                      <MenuItem key={t.id} value={t.id} disabled={t.remainingPurse < Number(retentionPrice)}>
                        {t.teamName} (Purse Bal: ₹{t.remainingPurse})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                label="Retention Price (₹)"
                type="number"
                fullWidth
                required
                disabled
                value={retentionPrice}
                helperText="This amount is fixed from auction configuration"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setRetainDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="secondary" startIcon={<Lock size={16} />}>
              Confirm Retention
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Dialog>
  );
};
