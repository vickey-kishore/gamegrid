import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, InputAdornment, TablePagination,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Tooltip
} from '@mui/material';
import { Search, Plus, Trash2, Edit2, Play, Eye, Calendar, Award } from 'lucide-react';
import { api } from '../api';

interface Auction {
  id: number;
  auctionName: string;
  eventName: string;
  category: string;
  auctionDate: string | null;
  minimumBid: number;
  bidIncrement: number;
  maximumBid: number | null;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
}

interface AuctionsListViewProps {
  onCreateClick: () => void;
  onEditClick: (id: number) => void;
  onViewClick: (id: number) => void;
}

export const AuctionsListView: React.FC<AuctionsListViewProps> = ({
  onCreateClick,
  onEditClick,
  onViewClick
}) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);

  useEffect(() => {
    fetchAuctions();
  }, [search, statusFilter, page, rowsPerPage]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auctions', {
        params: {
          search,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          size: rowsPerPage,
          sortBy: 'id',
          direction: 'DESC'
        }
      });
      setAuctions(response.data.content);
      setTotalAuctions(response.data.totalElements);
    } catch (err: any) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = async (id: number) => {
    try {
      await api.post(`/auctions/${id}/start`);
      fetchAuctions();
      onViewClick(id); // Transition directly to dashboard
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start auction.');
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedAuctionId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAuctionId === null) return;
    try {
      await api.delete(`/auctions/${selectedAuctionId}`);
      setDeleteDialogOpen(false);
      fetchAuctions();
    } catch (err: any) {
      alert('Failed to delete auction: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusChipColor = (status: Auction['status']) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Active': return 'info';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
    }
  };

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h3" color="primary">Auctions Directory</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your local sports tournament bidding campaigns.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Plus size={18} />}
          onClick={onCreateClick}
        >
          Create Auction
        </Button>
      </Box>

      {/* Filters bar */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by Auction Name or Event..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flexGrow: 1, minWidth: '250px' }}
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

        <FormControl size="small" sx={{ width: '180px' }}>
          <InputLabel id="status-filter-label">Status Filter</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Auction Name</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Auction Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : auctions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No auctions found matching criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              auctions.map((auction) => (
                <TableRow key={auction.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {auction.auctionName}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Award size={16} color="#94a3b8" />
                      {auction.eventName}
                    </Box>
                  </TableCell>
                  <TableCell>{auction.category}</TableCell>
                  <TableCell>
                    {auction.auctionDate ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} color="#94a3b8" />
                        {auction.auctionDate}
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={auction.status}
                      color={getStatusChipColor(auction.status)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Roster / Dashboard">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => onViewClick(auction.id)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>

                      {auction.status === 'Draft' ? (
                        <>
                          <Tooltip title="Edit Auction Settings">
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => onEditClick(auction.id)}
                            >
                              <Edit2 size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Start Auction Bidding">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleStartAuction(auction.id)}
                            >
                              <Play size={18} />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}

                      <Tooltip title="Soft Delete Auction">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(auction.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalAuctions}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', color: 'error.main' }}>
          Confirm Auction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this auction? Deleting will cancel the auction and remove all participating team registrations and player assignments. This action is irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionsListView;
