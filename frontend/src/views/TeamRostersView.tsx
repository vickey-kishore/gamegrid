import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Avatar, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Landmark, User, FileSpreadsheet, Printer, Search } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface RosterPlayer {
  playerId: number;
  name: string;
  photoPath: string | null;
  category: string;
  skillLevel: string | null;
  soldPrice: number;
}

interface TeamRoster {
  teamId: number;
  teamName: string;
  logoPath: string | null;
  purseAmount: number;
  remainingPurse: number;
  totalSpent: number;
  totalPlayersPurchased: number;
  players: RosterPlayer[];
}

interface TeamRostersViewProps {
  auctionId: number;
  onBackClick: () => void;
}

export const TeamRostersView: React.FC<TeamRostersViewProps> = ({
  auctionId,
  onBackClick
}) => {
  const [rosters, setRosters] = useState<TeamRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side search & category filtering
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [auction, setAuction] = useState<any>(null);

  useEffect(() => {
    loadRosters();
  }, [auctionId]);

  const loadRosters = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get auction details
      const auctionRes = await api.get(`/auctions/${auctionId}`);
      setAuction(auctionRes.data);

      // Get all teams in this auction
      const teamsRes = await api.get(`/auctions/${auctionId}/teams`);
      const teamsList = teamsRes.data;

      // Fetch roster details for each team in parallel
      const rosterPromises = teamsList.map(async (team: any) => {
        const res = await api.get(`/teams/${team.id}/roster`);
        return res.data as TeamRoster;
      });

      const results = await Promise.all(rosterPromises);
      setRosters(results);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load team rosters.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (teamId: number, teamName: string) => {
    try {
      const response = await api.get(`/teams/${teamId}/roster/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${teamName.replace(/\s+/g, '_')}_roster.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export roster to Excel.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter roster players client-side
  const getFilteredPlayers = (players: RosterPlayer[]) => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter ? p.category.toLowerCase() === categoryFilter.toLowerCase() : true;
      return matchesSearch && matchesCategory;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* Header (Hidden during Print) */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h3" color="primary">Team Rosters</Typography>
          <Typography variant="body1" color="text.secondary">
            View details, budgets spent, player lists, print rosters, or download spreadsheets.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={onBackClick} variant="outlined" color="inherit">
            Back
          </Button>
          <Button onClick={handlePrint} variant="contained" color="secondary" startIcon={<Printer size={18} />}>
            Print / PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="no-print">{error}</Alert>
      )}

      {/* Filter bar (Hidden during Print) */}
      <Box className="no-print" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search players across all rosters..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <Search size={16} style={{ marginRight: 8, color: '#94a3b8' }} />
              )
            }
          }}
        />
        {auction?.events && auction.events.length > 0 ? (
          <FormControl size="small" sx={{ width: '220px' }}>
            <InputLabel id="roster-category-filter-label">Filter by Event Category</InputLabel>
            <Select
              labelId="roster-category-filter-label"
              value={categoryFilter}
              label="Filter by Event Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Events</MenuItem>
              {auction.events.map((ev: string) => (
                <MenuItem key={ev} value={ev}>{ev}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            placeholder="Filter by category (e.g. Cricket)"
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ width: '220px' }}
          />
        )}
      </Box>

      {/* Roster Cards (Screen Display) */}
      <Box className="no-print" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rosters.map((roster) => {
          const filtered = getFilteredPlayers(roster.players);
          
          return (
            <Card key={roster.teamId} sx={{ overflow: 'hidden' }}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(255, 0, 127, 0.02) 100%)',
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={roster.logoPath ? `${ASSET_BASE_URL}/${roster.logoPath}` : undefined} sx={{ width: 45, height: 45 }}>
                    <Landmark size={22} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>{roster.teamName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Players Purchased: {roster.totalPlayersPurchased}
                    </Typography>
                  </Box>
                </Box>

                {/* Team stats summary */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TOTAL BUDGET</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>${roster.purseAmount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TOTAL SPENT</Typography>
                    <Typography variant="body1" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>${roster.totalSpent}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>REMAINING PURSE</Typography>
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>${roster.remainingPurse}</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<FileSpreadsheet size={14} />}
                    onClick={() => handleExportExcel(roster.teamId, roster.teamName)}
                  >
                    Export Excel
                  </Button>
                </Box>
              </Box>

              <CardContent sx={{ p: 0 }}>
                {filtered.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No players matching filters in this team roster.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ pl: 3 }}>Player Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Skill Level</TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>Sold Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map((player) => (
                          <TableRow key={player.playerId} hover>
                            <TableCell sx={{ pl: 3, py: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={player.photoPath ? `${ASSET_BASE_URL}/${player.photoPath}` : undefined} sx={{ width: 30, height: 30 }}>
                                  <User size={14} />
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{player.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{player.category}</TableCell>
                            <TableCell>{player.skillLevel || '—'}</TableCell>
                            <TableCell align="right" sx={{ pr: 3, color: 'primary.main', fontWeight: 'bold' }}>
                              ${player.soldPrice}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* PRINT-ONLY SECTION (Styled cleanly for print output / PDF generator) */}
      <Box className="print-only" sx={{ display: 'none' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          GameGrid Tournament Auction - Roster Summary
        </Typography>

        {rosters.map((roster) => (
          <Box key={roster.teamId} sx={{ mb: 5, pageBreakInside: 'avoid' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '2px solid #000', pb: 0.5 }}>
              {roster.teamName}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Total Budget: <strong>${roster.purseAmount}</strong></Typography>
              <Typography variant="body2">Spent: <strong>${roster.totalSpent}</strong></Typography>
              <Typography variant="body2">Remaining Purse: <strong>${roster.remainingPurse}</strong></Typography>
              <Typography variant="body2">Players: <strong>{roster.totalPlayersPurchased}</strong></Typography>
            </Box>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Player Name</th>
                  <th style={{ padding: '6px' }}>Category</th>
                  <th style={{ padding: '6px' }}>Skill Level</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Sold Price</th>
                </tr>
              </thead>
              <tbody>
                {roster.players.map((player) => (
                  <tr key={player.playerId} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px' }}>{player.name}</td>
                    <td style={{ padding: '6px' }}>{player.category}</td>
                    <td style={{ padding: '6px' }}>{player.skillLevel || 'N/A'}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>${player.soldPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ))}
      </Box>

      {/* Global CSS injection for printing */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          table {
            color: #000000 !important;
          }
          tr, td, th {
            color: #000000 !important;
            border-color: #000000 !important;
          }
        }
      `}</style>

    </Box>
  );
};

export default TeamRostersView;
