import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, TextField, Box, Typography, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Tooltip, Grid, InputAdornment
} from '@mui/material';
import { Edit2, Trash2, Search, UserPlus, X, RefreshCw, User } from 'lucide-react';
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
  const [gender, setGender] = useState('');
  const [club, setClub] = useState('');

  // Extract unique category options from rules
  const uniqueCategories = React.useMemo(() => {
    const list = new Set<string>();
    rosterRules?.forEach(r => {
      if (r.category) list.add(r.category.trim());
    });
    return Array.from(list);
  }, [rosterRules]);

  useEffect(() => {
    if (open && auctionId) {
      fetchAuctionPlayers();
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

  const handleOpenAddForm = () => {
    setFormType('ADD');
    setName('');
    setPhoneNumber('');
    setEmail('');
    setPlayerCategory(uniqueCategories[0] || '');
    setGender('');
    setClub('');
    setFormOpen(true);
  };

  const handleOpenEditForm = (ap: AuctionPlayerResponse) => {
    setFormType('EDIT');
    setEditingPlayerId(ap.playerId);
    setName(ap.name || '');
    setPhoneNumber(ap.phoneNumber || '');
    setEmail(ap.email || '');
    setPlayerCategory(ap.category || '');
    setGender(ap.gender || '');
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
      gender: gender.trim() || playerCategory.trim(),
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

  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      (p.name?.toLowerCase().includes(search.toLowerCase())) ||
      (p.phoneNumber?.includes(search)) ||
      (p.email?.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = filterCategory === 'ALL' || p.category?.trim().toLowerCase() === filterCategory.trim().toLowerCase();

    return matchesSearch && matchesCat;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', py: 2 }}>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontFamily: '"Rajdhani", sans-serif' }}>
            Manage Auction Players
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Auction: {auctionName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, px: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
                    <Search size={18} style={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ flexGrow: 1, minWidth: '240px' }}
          />

          <FormControl size="small" sx={{ minWidth: '180px' }}>
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

          {status === 'Draft' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<UserPlus size={18} />}
              onClick={handleOpenAddForm}
            >
              Add Player Manually
            </Button>
          )}

          <IconButton onClick={fetchAuctionPlayers} color="inherit" title="Refresh List">
            <RefreshCw size={18} />
          </IconButton>
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
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Player Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Club</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                  {status === 'Draft' && <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((ap, index) => (
                  <TableRow key={ap.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={ap.photoPath ? (ap.photoPath.startsWith('http') ? ap.photoPath : `${ASSET_BASE_URL}/${ap.photoPath}`) : undefined} sx={{ width: 30, height: 30 }}>
                          <User size={14} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{ap.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{ap.category}</TableCell>
                    <TableCell>{ap.club || '—'}</TableCell>
                    <TableCell>{ap.phoneNumber}</TableCell>
                    <TableCell>{ap.email || '—'}</TableCell>
                    {status === 'Draft' && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
                  label="Gender"
                  placeholder="e.g. Men, Women"
                  fullWidth
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                />
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
    </Dialog>
  );
};
