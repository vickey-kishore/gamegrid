import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Divider,
  IconButton, Alert, CircularProgress, Grid, Paper
} from '@mui/material';
import { ArrowLeft, Save, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface TeamConfig {
  id?: number;
  teamName: string;
  logoPath: string | null;
  purseAmount: number;
  minimumPlayers: number;
  maximumPlayers: number;
}

interface AuctionFormViewProps {
  auctionId: number | null; // Null means creating
  onBackClick: () => void;
  onSaveSuccess: () => void;
}

export const AuctionFormView: React.FC<AuctionFormViewProps> = ({
  auctionId,
  onBackClick,
  onSaveSuccess
}) => {
  const isEdit = auctionId !== null;

  // Form states
  const [auctionName, setAuctionName] = useState('');
  const [eventName, setEventName] = useState('');
  const [events, setEvents] = useState<string[]>(['']);
  const [auctionDate, setAuctionDate] = useState('');
  const [description, setDescription] = useState('');
  const [minimumBid, setMinimumBid] = useState<number>(1000);
  const [bidIncrement, setBidIncrement] = useState<number>(500);
  const [maximumBid, setMaximumBid] = useState<number | ''>('');
  const [minMen, setMinMen] = useState<number>(4);
  const [minWomen, setMinWomen] = useState<number>(2);

  const [teams, setTeams] = useState<TeamConfig[]>([
    { teamName: 'Team A', logoPath: null, purseAmount: 100000, minimumPlayers: 8, maximumPlayers: 12 },
    { teamName: 'Team B', logoPath: null, purseAmount: 100000, minimumPlayers: 8, maximumPlayers: 12 }
  ]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      fetchAuctionDetails();
    }
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    setPageLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get(`/auctions/${auctionId}`);
      const data = response.data;
      setAuctionName(data.auctionName);
      setEventName(data.eventName || '');
      setEvents(data.events && data.events.length > 0 ? data.events : ['']);
      setAuctionDate(data.auctionDate || '');
      setDescription(data.description || '');
      setMinimumBid(data.minimumBid);
      setBidIncrement(data.bidIncrement);
      setMaximumBid(data.maximumBid || '');
      setMinMen(data.minMen || 4);
      setMinWomen(data.minWomen || 2);
      setTeams(data.teams);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to load auction configuration details.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddTeam = () => {
    setTeams([...teams, {
      teamName: `Team ${String.fromCharCode(65 + teams.length)}`,
      logoPath: null,
      purseAmount: 100000,
      minimumPlayers: 8,
      maximumPlayers: 12
    }]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) {
      alert('Auctions must have at least 2 teams.');
      return;
    }
    const newTeams = [...teams];
    newTeams.splice(index, 1);
    setTeams(newTeams);
  };

  const handleTeamChange = (index: number, field: keyof TeamConfig, value: any) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], [field]: value };
    setTeams(newTeams);
  };

  const handleLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logos');

      try {
        const response = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        handleTeamChange(index, 'logoPath', response.data.path);
      } catch (err: any) {
        alert('Logo upload failed.');
      }
    }
  };

  const handleAddEvent = () => {
    setEvents([...events, '']);
  };

  const handleRemoveEvent = (index: number) => {
    if (events.length <= 1) return;
    const newEvents = [...events];
    newEvents.splice(index, 1);
    setEvents(newEvents);
  };

  const handleEventChange = (index: number, val: string) => {
    const newEvents = [...events];
    newEvents[index] = val;
    setEvents(newEvents);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validate unique team names client-side
    const names = teams.map(t => t.teamName.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      setErrorMessage('Team names should be unique within an auction.');
      setLoading(false);
      return;
    }

    const validEvents = events.filter(ev => ev.trim() !== '');
    if (validEvents.length === 0) {
      setErrorMessage('At least one auction event category is required.');
      setLoading(false);
      return;
    }

    const payload = {
      auctionName,
      eventName: eventName || 'Multiple Events',
      category: validEvents[0],
      events: validEvents,
      minMen,
      minWomen,
      auctionDate: auctionDate || null,
      description: description || null,
      minimumBid,
      bidIncrement,
      maximumBid: maximumBid === '' ? null : maximumBid,
      teams
    };

    try {
      if (isEdit) {
        await api.put(`/auctions/${auctionId}`, payload);
      } else {
        await api.post('/auctions', payload);
      }
      onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.details) {
        // Validation messages
        const details = err.response.data.details;
        const msg = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ');
        setErrorMessage(`Validation error: ${msg}`);
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to save auction configuration settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBackClick} color="inherit">
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h3" color="primary">
          {isEdit ? 'Configure Auction' : 'Create New Auction'}
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ border: '1px solid rgba(255, 0, 60, 0.2)' }}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Grid container spacing={4}>
          {/* Settings Left Column */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Details Card */}
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h5" color="secondary">Auction Information</Typography>
                
                <TextField
                  label="Auction Name"
                  required
                  fullWidth
                  variant="outlined"
                  value={auctionName}
                  onChange={(e) => setAuctionName(e.target.value)}
                />
                
                <TextField
                  label="Event Name"
                  required
                  fullWidth
                  variant="outlined"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Badminton Cup 2026"
                />

                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Auction Events (Categories)</Typography>
                  {events.map((evt, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label={`Event Category #${idx + 1}`}
                        required
                        fullWidth
                        variant="outlined"
                        value={evt}
                        onChange={(e) => handleEventChange(idx, e.target.value)}
                        placeholder="e.g. Men Doubles, Women Doubles, Mixed Doubles"
                        size="small"
                      />
                      {events.length > 1 && (
                        <IconButton color="error" size="small" onClick={() => handleRemoveEvent(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddEvent}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add Event
                  </Button>
                </Box>

                <TextField
                  label="Auction Date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                  value={auctionDate}
                  onChange={(e) => setAuctionDate(e.target.value)}
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Rules Card */}
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h5" color="secondary">Auction Rules</Typography>
                
                <TextField
                  label="Minimum Bid (Base Price)"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={minimumBid}
                  onChange={(e) => setMinimumBid(Number(e.target.value))}
                />

                <TextField
                  label="Bid Increment Amount"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={bidIncrement}
                  onChange={(e) => setBidIncrement(Number(e.target.value))}
                />

                <TextField
                  label="Maximum Bid (Optional)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={maximumBid}
                  onChange={(e) => setMaximumBid(e.target.value === '' ? '' : Number(e.target.value))}
                />

                <TextField
                  label="Min Men per Team"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={minMen}
                  onChange={(e) => setMinMen(Number(e.target.value))}
                />

                <TextField
                  label="Min Women per Team"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={minWomen}
                  onChange={(e) => setMinWomen(Number(e.target.value))}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Teams Config Column */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" color="secondary">Participating Teams</Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddTeam}
                    size="small"
                  >
                    Add Team
                  </Button>
                </Box>
                
                <Divider />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '550px', overflowY: 'auto', pr: 1, py: 1 }}>
                  {teams.map((team, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative'
                      }}
                    >
                      {teams.length > 2 && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveTeam(index)}
                          sx={{ position: 'absolute', top: 12, right: 12 }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}

                      <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                        Team #{index + 1}
                      </Typography>

                      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Team Name"
                            required
                            fullWidth
                            size="small"
                            value={team.teamName}
                            onChange={(e) => handleTeamChange(index, 'teamName', e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {team.logoPath ? (
                            <Box
                              component="img"
                              src={`${ASSET_BASE_URL}/${team.logoPath}`}
                              alt="logo"
                              sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" color="text.secondary">Logo</Typography>
                            </Box>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<Upload size={14} />}
                          >
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => handleLogoUpload(index, e)}
                            />
                          </Button>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Purse Amount"
                            type="number"
                            required
                            fullWidth
                            size="small"
                            value={team.purseAmount}
                            onChange={(e) => handleTeamChange(index, 'purseAmount', Number(e.target.value))}
                          />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4 }}>
                          <TextField
                            label="Min Players"
                            type="number"
                            required
                            fullWidth
                            size="small"
                            value={team.minimumPlayers}
                            onChange={(e) => handleTeamChange(index, 'minimumPlayers', Number(e.target.value))}
                          />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4 }}>
                          <TextField
                            label="Max Players"
                            type="number"
                            required
                            fullWidth
                            size="small"
                            value={team.maximumPlayers}
                            onChange={(e) => handleTeamChange(index, 'maximumPlayers', Number(e.target.value))}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={onBackClick} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
          >
            Save Configuration
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AuctionFormView;
