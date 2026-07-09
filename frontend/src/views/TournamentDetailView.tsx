import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Tab, Tabs, MenuItem,
  Select, FormControl, InputLabel, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, TextField, Tooltip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Chip, Grid
} from '@mui/material';
import {
  ArrowLeft, Upload, Edit, MapPin,
  Users, Calendar, Trophy, Clock, Printer, Check, Plus, Coins, BookOpen
} from 'lucide-react';
import { api } from '../api';

interface EventParticipant {
  id: number;
  eventId: number;
  participantName: string;
  player1Name: string;
  player2Name: string | null;
  clubName: string | null;
  seedNumber: number | null;
}

interface FixtureMatch {
  id: number;
  eventId: number;
  roundNumber: number;
  matchNumber: number;
  participant1: EventParticipant | null;
  participant2: EventParticipant | null;
  scheduledTime: string | null;
  courtNumber: string | null;
  winnerId: number | null;
  winnerName: string | null;
}

interface Event {
  id: number;
  tournamentId: number;
  eventName: string;
  eventType: 'Singles' | 'Doubles';
  fixtureType: 'Knockout' | 'League';
  scoringType: string;
  pointsPerSet: number | null;
  numberOfSets: number | null;
  participantsCount: number;
  fixturesGenerated: boolean;
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

    // Check if this line starts a table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 1) {
        const parseRow = (rowStr: string) => {
          const cells = rowStr.split('|').map(c => c.trim());
          if (cells.length > 2) {
            return cells.slice(1, cells.length - 1);
          }
          return [];
        };

        const headers = parseRow(tableLines[0]);
        const hasSeparator = tableLines.length > 1 && /^\|[\s-:|]*\|$/.test(tableLines[1]);
        const dataRowsStart = hasSeparator ? 2 : 1;

        const rows: string[][] = [];
        for (let r = dataRowsStart; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          if (cells.length > 0) {
            rows.push(cells);
          }
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

interface TournamentDetailViewProps {
  userRole: 'CREATOR' | 'PLAYER';
  tournamentId: number;
  onBackClick: () => void;
  initialTab?: number;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  userRole,
  tournamentId,
  onBackClick,
  initialTab = 0
}) => {
  const [tournament, setTournament] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  
  // Tab states
  const [activeTab, setActiveTab] = useState(initialTab);

  // Participants registry
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  
  // Registration dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [regPlayer1, setRegPlayer1] = useState('');
  const [regPlayer2, setRegPlayer2] = useState('');
  const [regClub, setRegClub] = useState('');

  const handleSelfRegister = async () => {
    if (!regPlayer1.trim()) {
      alert('Player Name is required');
      return;
    }
    if (activeEvent?.eventType === 'Doubles' && !regPlayer2.trim()) {
      alert('Partner Name is required for Doubles events');
      return;
    }
    try {
      await api.post(`/events/${selectedEventId}/participants`, {
        player1Name: regPlayer1,
        player2Name: activeEvent?.eventType === 'Doubles' ? regPlayer2 : undefined,
        clubName: regClub
      });
      alert('Successfully registered for this event category!');
      setRegisterDialogOpen(false);
      setRegPlayer1('');
      setRegPlayer2('');
      setRegClub('');
      // Refresh list
      const partRes = await api.get(`/events/${selectedEventId}/participants`, { params: { size: 100 } });
      setParticipants(partRes.data.content);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };
  const [partLoading, setPartLoading] = useState(false);
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editingSeed, setEditingSeed] = useState<string>('');

  // Fixtures draw
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [fixLoading, setFixLoading] = useState(false);

  // Uploader ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Dialog states for updating matches
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [courtNumber, setCourtNumber] = useState('');

  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventData();
    }
  }, [selectedEventId]);

  const fetchTournamentDetails = async () => {
    try {
      const tourRes = await api.get(`/tournaments/${tournamentId}`);
      setTournament(tourRes.data);

      const eventsRes = await api.get(`/tournaments/${tournamentId}/events`);
      setEvents(eventsRes.data);
      if (eventsRes.data.length > 0) {
        setSelectedEventId(eventsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load tournament detail info:', err);
    }
  };

  const fetchEventData = async () => {
    if (!selectedEventId) return;
    
    // Fetch participants
    setPartLoading(true);
    try {
      const res = await api.get(`/events/${selectedEventId}/participants`, {
        params: { page: 0, size: 500 }
      });
      setParticipants(res.data.content);
    } catch (err) {
      console.error('Failed to load participants list', err);
    } finally {
      setPartLoading(false);
    }

    // Fetch fixtures
    setFixLoading(true);
    try {
      const res = await api.get(`/events/${selectedEventId}/fixtures`);
      setFixtures(res.data);
    } catch (err) {
      console.error('Failed to load fixtures list', err);
    } finally {
      setFixLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedEventId) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        setPartLoading(true);
        await api.post(`/events/${selectedEventId}/participants/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Participants list successfully imported!');
        fetchEventData();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to upload participants.');
      } finally {
        setPartLoading(false);
      }
    }
  };

  const handleStartEditingSeed = (p: EventParticipant) => {
    setEditingPartId(p.id);
    setEditingSeed(p.seedNumber !== null ? p.seedNumber.toString() : '');
  };

  const handleSaveSeed = async (id: number) => {
    try {
      const seedVal = editingSeed === '' ? null : Number(editingSeed);
      await api.put(`/participants/${id}/seed`, null, {
        params: { seedNumber: seedVal }
      });
      setEditingPartId(null);
      fetchEventData();
    } catch (err) {
      console.error(err);
      alert('Failed to update seed rank.');
    }
  };

  const handleGenerateFixtures = async () => {
    if (!selectedEventId) return;
    if (participants.length < 2) {
      alert('At least 2 participants must be registered to generate fixtures.');
      return;
    }

    setFixLoading(true);
    try {
      await api.post(`/events/${selectedEventId}/fixtures/generate`);
      alert('Fixtures draw successfully generated!');
      fetchEventData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to generate fixtures draw.');
    } finally {
      setFixLoading(false);
    }
  };

  const handleOpenScheduleModal = (match: FixtureMatch) => {
    setSelectedMatch(match);
    setScheduledTime(match.scheduledTime ? match.scheduledTime.substring(0, 16) : '');
    setCourtNumber(match.courtNumber || '');
    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    try {
      await api.put(`/fixtures/${selectedMatch.id}/schedule`, null, {
        params: {
          scheduledTime: scheduledTime || null,
          courtNumber: courtNumber || null
        }
      });
      setScheduleDialogOpen(false);
      fetchEventData();
    } catch (err) {
      console.error(err);
      alert('Failed to update schedule.');
    }
  };

  const handleOpenWinnerModal = (match: FixtureMatch) => {
    setSelectedMatch(match);
    setWinnerDialogOpen(true);
  };

  const handleSelectWinner = async (winnerId: number) => {
    if (!selectedMatch) return;
    try {
      await api.put(`/fixtures/${selectedMatch.id}/winner`, null, {
        params: { winnerId }
      });
      setWinnerDialogOpen(false);
      fetchEventData();
    } catch (err) {
      console.error(err);
      alert('Failed to update winner.');
    }
  };

  const activeEvent = events.find(e => e.id === selectedEventId);

  // Group Knockout fixtures by Round for drawing tree columns
  const roundsMap = React.useMemo(() => {
    const rounds: Record<number, FixtureMatch[]> = {};
    fixtures.forEach(m => {
      if (!rounds[m.roundNumber]) {
        rounds[m.roundNumber] = [];
      }
      rounds[m.roundNumber].push(m);
    });
    return rounds;
  }, [fixtures]);

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBackClick} color="inherit">
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h3" color="primary">{tournament?.name}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, color: 'text.secondary', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}><MapPin size={14} /> <Typography variant="caption">{tournament?.venue}</Typography></Box>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}><Calendar size={14} /> <Typography variant="caption">{tournament?.startDate} to {tournament?.endDate}</Typography></Box>
            </Box>
          </Box>
        </Box>

        <FormControl size="small" sx={{ width: '220px' }}>
          <InputLabel id="event-selector-label">Event Category</InputLabel>
          <Select
            labelId="event-selector-label"
            value={selectedEventId}
            label="Event Category"
            onChange={(e) => setSelectedEventId(e.target.value as number)}
          >
            {events.map(ev => (
              <MenuItem key={ev.id} value={ev.id}>{ev.eventName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} color="primary" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', mb: 2 }}>
        <Tab label="Guidelines & Details" icon={<BookOpen size={16} />} iconPosition="start" />
        <Tab label="Registry (Participants)" icon={<Users size={16} />} iconPosition="start" />
        <Tab label="Fixtures Bracket Draw" icon={<Trophy size={16} />} iconPosition="start" />
      </Tabs>

      {/* TAB 0: GUIDELINES & DETAILS */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Grid container spacing={4}>
            {/* Left Column (70% width) */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 800 }}>
                    GUIDELINES & TOURNAMENT RULES
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                  {tournament?.description ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {parseMarkdownToJSX(tournament.description)}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No custom guidelines or rules have been entered by the tournament organizer yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column (30% width) */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card sx={{ border: '1px solid rgba(22, 224, 255, 0.1)' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                    EVENT DIRECTORY
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(22, 224, 255, 0.1)' }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(22, 224, 255, 0.1)', display: 'flex', alignItems: 'center' }}>
                        <MapPin size={20} color="#16E0FF" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>VENUE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tournament?.venue}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(22, 224, 255, 0.1)', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={20} color="#16E0FF" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>TIMELINE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tournament?.startDate} to {tournament?.endDate}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(22, 224, 255, 0.1)', display: 'flex', alignItems: 'center' }}>
                        <Coins size={20} color="#16E0FF" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>ENTRY FEE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{tournament?.entryFee}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(22, 224, 255, 0.1)', display: 'flex', alignItems: 'center' }}>
                        <Users size={20} color="#16E0FF" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>ORGANIZER</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tournament?.organizerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{tournament?.organizerContact}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 1: REGISTRY VIEW */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {activeEvent && (
            <Card variant="outlined" sx={{ p: 2, display: 'flex', gap: 4, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box><Typography variant="caption" color="text.secondary">Event Type:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{activeEvent.eventType}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Fixture Structure:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{activeEvent.fixtureType}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Scoring Format:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{activeEvent.scoringType}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Registered Size:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{activeEvent.participantsCount} entries</Typography></Box>
            </Card>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" color="secondary">Event Participant Registry</Typography>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {userRole === 'CREATOR' ? (
                <>
                  <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleFileChange} />
                  <Button variant="outlined" color="primary" startIcon={<Upload size={16} />} onClick={handleUploadClick}>
                    Upload Registry (Excel)
                  </Button>
                </>
              ) : (
                <Button variant="contained" color="primary" startIcon={<Plus size={16} />} onClick={() => setRegisterDialogOpen(true)}>
                  Register / Sign Up
                </Button>
              )}
            </Box>
          </Box>

          {partLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
          ) : participants.length === 0 ? (
            <Card sx={{ py: 8, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No participants registered for this event category yet.</Typography>
              {userRole === 'CREATOR' ? (
                <Button size="small" variant="outlined" startIcon={<Upload size={14} />} onClick={handleUploadClick}>
                  Import Mock spreadsheet
                </Button>
              ) : (
                <Button size="small" variant="contained" color="primary" startIcon={<Plus size={14} />} onClick={() => setRegisterDialogOpen(true)}>
                  Register for this Event
                </Button>
              )}
            </Card>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '70px' }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Participant Designation</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Club Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '180px' }}>Seed Rank</TableCell>
                    {userRole === 'CREATOR' && <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((p, idx) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.participantName}</Typography>
                        {p.player2Name && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            ({p.player1Name} and {p.player2Name})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{p.clubName || '—'}</TableCell>
                      <TableCell>
                        {editingPartId === p.id ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              label="Seed No"
                              type="number"
                              value={editingSeed}
                              onChange={(e) => setEditingSeed(e.target.value)}
                              sx={{ width: '80px' }}
                            />
                            <IconButton color="success" size="small" onClick={() => handleSaveSeed(p.id)}>
                              <Check size={16} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {p.seedNumber ? (
                              <Chip label={`Seed #${p.seedNumber}`} color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
                            ) : (
                              <Typography color="text.secondary" variant="caption">Unseeded</Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      {userRole === 'CREATOR' && (
                        <TableCell align="center">
                          <IconButton size="small" color="info" onClick={() => handleStartEditingSeed(p)}>
                            <Edit size={16} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* TAB 2: FIXTURES DRAW VIEW */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fixLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
          ) : fixtures.length === 0 ? (
            <Card sx={{ py: 8, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No fixtures matches generated yet.</Typography>
              {userRole === 'CREATOR' ? (
                <Button variant="contained" color="secondary" startIcon={<Trophy size={16} />} onClick={handleGenerateFixtures}>
                  Generate Fixture Draw Brackets
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  The fixture bracket has not been drawn by the organizer yet.
                </Typography>
              )}
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Header Action Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" color="primary">Generated Fixture List</Typography>
                
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Printer size={16} />}
                    href={`http://localhost:8084/api/events/${selectedEventId}/fixtures/pdf`}
                    target="_blank"
                  >
                    Print Fixtures Draw
                  </Button>
                  {userRole === 'CREATOR' && (
                    <Button variant="outlined" color="primary" startIcon={<Trophy size={16} />} onClick={handleGenerateFixtures}>
                      Regenerate Draw
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Draw Layout rendering depending on type */}
              {activeEvent?.fixtureType === 'Knockout' ? (
                <Box sx={{ overflowX: 'auto', py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 4, minWidth: '800px', alignItems: 'stretch' }}>
                    {Object.entries(roundsMap).map(([roundNum, roundMatches]) => (
                      <Box key={roundNum} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 3, flexGrow: 1, minWidth: '220px' }}>
                        <Typography variant="subtitle2" sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', pb: 0.5 }}>
                          ROUND {roundNum}
                        </Typography>

                        {roundMatches.map(m => (
                          <Paper
                            key={m.id}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              backgroundColor: 'rgba(18, 24, 41, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              position: 'relative'
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              Match #{m.matchNumber} {m.courtNumber ? `• Court ${m.courtNumber}` : ''}
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5, borderRadius: 1, bgcolor: m.winnerId === m.participant1?.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                                <Typography variant="caption" sx={{ fontWeight: m.winnerId === m.participant1?.id ? 'bold' : 'normal', color: m.participant1 ? 'text.primary' : 'text.secondary' }}>
                                  {m.participant1?.participantName || 'TBD'}
                                </Typography>
                              </Box>
                              
                              <Divider sx={{ my: 0.2 }} />

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5, borderRadius: 1, bgcolor: m.winnerId === m.participant2?.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                                <Typography variant="caption" sx={{ fontWeight: m.winnerId === m.participant2?.id ? 'bold' : 'normal', color: m.participant2 ? 'text.primary' : 'text.secondary' }}>
                                  {m.participant2?.participantName || 'TBD'}
                                </Typography>
                              </Box>
                            </Box>

                            {userRole === 'CREATOR' && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, justifyContent: 'flex-end' }}>
                                <Tooltip title="Assign Time/Court">
                                  <IconButton size="small" color="info" onClick={() => handleOpenScheduleModal(m)}>
                                    <Clock size={12} />
                                  </IconButton>
                                </Tooltip>
                                {(m.participant1 && m.participant2) && (
                                  <Tooltip title="Log Winner">
                                    <IconButton size="small" color="success" onClick={() => handleOpenWinnerModal(m)}>
                                      <Trophy size={12} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                // League View Table
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Match No</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Round</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Participant 1</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Participant 2</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Time & Court</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Winner Result</TableCell>
                        {userRole === 'CREATOR' && <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px' }}>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fixtures.map(m => (
                        <TableRow key={m.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{m.matchNumber}</TableCell>
                          <TableCell><Chip label={`Round ${m.roundNumber}`} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell sx={{ fontWeight: m.winnerId === m.participant1?.id ? 'bold' : 'normal' }}>
                            {m.participant1?.participantName}
                          </TableCell>
                          <TableCell sx={{ fontWeight: m.winnerId === m.participant2?.id ? 'bold' : 'normal' }}>
                            {m.participant2?.participantName}
                          </TableCell>
                          <TableCell>
                            {m.scheduledTime ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {m.scheduledTime.substring(11, 16)} hrs
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Date: {m.scheduledTime.substring(0, 10)} {m.courtNumber ? `• Court ${m.courtNumber}` : ''}
                                </Typography>
                              </Box>
                            ) : (
                              m.courtNumber ? `Court ${m.courtNumber}` : '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {m.winnerId ? (
                              <Typography color="success.main" variant="caption" sx={{ fontWeight: 'bold' }}>
                                Winner: {m.winnerName}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary" variant="caption">Unplayed</Typography>
                            )}
                          </TableCell>
                          {userRole === 'CREATOR' && (
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="Assign Time/Court">
                                  <IconButton size="small" color="info" onClick={() => handleOpenScheduleModal(m)}>
                                    <Clock size={15} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Log Winner">
                                  <IconButton size="small" color="success" onClick={() => handleOpenWinnerModal(m)}>
                                    <Trophy size={15} />
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
            </Box>
          )}
        </Box>
      )}

      {/* Schedule Match Modal */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleScheduleSubmit}>
          <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 'bold' }}>
            Schedule Match #{selectedMatch?.matchNumber}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
              <TextField
                label="Scheduled Time"
                type="datetime-local"
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true }
                }}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <TextField
                label="Court Number"
                fullWidth
                placeholder="e.g. Court 1, Court 2"
                value={courtNumber}
                onChange={(e) => setCourtNumber(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setScheduleDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Schedule</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Select Winner Modal */}
      <Dialog open={winnerDialogOpen} onClose={() => setWinnerDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 'bold' }}>
          Log Winner for Match #{selectedMatch?.matchNumber}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Select the winner of this match. Knockout brackets will advance the winner automatically.
            </Typography>
            
            <Button
              variant="outlined"
              fullWidth
              color="primary"
              onClick={() => handleSelectWinner(selectedMatch?.participant1?.id as number)}
              disabled={!selectedMatch?.participant1}
              sx={{ py: 1.5 }}
            >
              {selectedMatch?.participant1?.participantName || 'TBD Participant 1'}
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              color="secondary"
              onClick={() => handleSelectWinner(selectedMatch?.participant2?.id as number)}
              disabled={!selectedMatch?.participant2}
              sx={{ py: 1.5 }}
            >
              {selectedMatch?.participant2?.participantName || 'TBD Participant 2'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setWinnerDialogOpen(false)} color="inherit">Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Self Registration Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: '#ffffff' }}>Event Participant Signup</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleSelfRegister(); }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Enter details below to register for the **{activeEvent?.eventName}** ({activeEvent?.eventType}) category.
            </Typography>
            <TextField
              label="Player Name"
              required
              fullWidth
              value={regPlayer1}
              onChange={(e) => setRegPlayer1(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {activeEvent?.eventType === 'Doubles' && (
              <TextField
                label="Partner Name"
                required
                fullWidth
                value={regPlayer2}
                onChange={(e) => setRegPlayer2(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
            <TextField
              label="Club / Academy / City"
              fullWidth
              value={regClub}
              onChange={(e) => setRegClub(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setRegisterDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Register Now</Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};
