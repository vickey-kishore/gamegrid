import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, InputAdornment, TablePagination,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, CircularProgress, Tooltip, Avatar
} from '@mui/material';
import { Search, Plus, Trash2, Edit2, Eye, Calendar, MapPin, Award } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface Tournament {
  id: number;
  name: string;
  venue: string;
  logoPath: string | null;
  startDate: string;
  endDate: string;
  entryFee: number;
  organizerName: string;
  organizerContact: string;
  description: string | null;
  eventsCount: number;
}

interface TournamentsListViewProps {
  userRole: 'CREATOR' | 'PLAYER';
  onCreateClick: () => void;
  onEditClick: (id: number) => void;
  onViewClick: (id: number) => void;
  onDrawFixturesClick: (id: number) => void;
}

export const TournamentsListView: React.FC<TournamentsListViewProps> = ({
  userRole,
  onCreateClick,
  onEditClick,
  onViewClick,
  onDrawFixturesClick
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, [search, page, rowsPerPage]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tournaments', {
        params: {
          search,
          page,
          size: rowsPerPage,
          sortBy: 'id',
          direction: 'DESC'
        }
      });
      setTournaments(response.data.content);
      setTotalTournaments(response.data.totalElements);
    } catch (err: any) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedTournamentId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTournamentId === null) return;
    try {
      await api.delete(`/tournaments/${selectedTournamentId}`);
      setDeleteDialogOpen(false);
      fetchTournaments();
    } catch (err: any) {
      alert('Failed to delete tournament: ' + (err.response?.data?.message || err.message));
    }
  };

  const getTournamentStatus = (tour: Tournament) => {
    const today = new Date().toISOString().split('T')[0];
    if (today < tour.startDate) {
      return { label: 'Upcoming', color: 'info' as const };
    } else if (today > tour.endDate) {
      return { label: 'Completed', color: 'success' as const };
    } else {
      return { label: 'Ongoing', color: 'warning' as const };
    }
  };

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h3" color="primary">Tournaments Directory</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your sports event registries, details, and schedules.
          </Typography>
        </Box>
        {userRole === 'CREATOR' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={onCreateClick}
          >
            Create Tournament
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search by Tournament Name, Venue, or Organizer..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
            }
          }}
        />
      </Box>

      {/* Directory Table */}
      {loading && tournaments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tournament</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Organizer</TableCell>
                <TableCell align="center">Events</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No tournaments found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tournaments.map((tour) => {
                  const status = getTournamentStatus(tour);
                  return (
                    <TableRow key={tour.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={tour.logoPath ? `${ASSET_BASE_URL}/${tour.logoPath}` : undefined}
                            sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#111827' }}
                          >
                            <Award size={20} color="#16E0FF" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                              {tour.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={14} color="#16E0FF" style={{ flexShrink: 0 }} />
                          <Typography variant="body2">{tour.venue}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={14} color="#16E0FF" style={{ flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">
                            {tour.startDate} to {tour.endDate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{tour.organizerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{tour.organizerContact}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tour.eventsCount}
                          size="small"
                          sx={{ fontWeight: 'bold', minWidth: '30px' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => onViewClick(tour.id)} sx={{ color: '#16E0FF' }}>
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                          {userRole === 'CREATOR' && (
                            <>
                              <Tooltip title="Draw Fixtures">
                                <IconButton size="small" onClick={() => onDrawFixturesClick(tour.id)} sx={{ color: '#FF0A88' }}>
                                  <Calendar size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Tournament">
                                <IconButton size="small" onClick={() => onEditClick(tour.id)} sx={{ color: '#94a3b8' }}>
                                  <Edit2 size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Tournament">
                                <IconButton size="small" onClick={() => handleDeleteClick(tour.id)} sx={{ color: 'error.main' }}>
                                  <Trash2 size={16} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalTournaments}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#ffffff' }}>Confirm Tournament Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete this tournament? This will permanently remove the tournament registration details, event categories, and fixture charts.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
