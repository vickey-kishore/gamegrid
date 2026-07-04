import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  InputAdornment, TablePagination, Alert, CircularProgress, Accordion,
  AccordionSummary, AccordionDetails
} from '@mui/material';
import { Upload, Search, Users, AlertTriangle, CheckCircle, Copy, ChevronDown } from 'lucide-react';
import { api } from '../api';

interface ImportSummary {
  totalRows: number;
  successfullyImported: number;
  duplicateRecords: number;
  failedRecords: number;
  errors: string[];
}

interface Player {
  id: number;
  name: String;
  phoneNumber: string;
  email: string | null;
  gender: string | null;
  age: number | null;
  category: string;
  city: string | null;
  state: string | null;
  skillLevel: string | null;
}

export const ImportPlayersView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Players listing states
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [search, category, page, rowsPerPage]);

  const fetchPlayers = async () => {
    setListLoading(true);
    try {
      const response = await api.get('/players', {
        params: {
          search,
          category,
          page,
          size: rowsPerPage,
          sortBy: 'id',
          direction: 'DESC'
        }
      });
      setPlayers(response.data.content);
      setTotalPlayers(response.data.totalElements);
    } catch (err: any) {
      console.error('Error fetching players:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/players/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadResult(response.data);
      setFile(null);
      fetchPlayers(); // Refresh table
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to upload and import player sheet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Typography variant="h3" color="primary">Import Registered Players</Typography>
        <Typography variant="body1" color="text.secondary">
          Upload an Excel worksheet (.xlsx) containing tournament players to register them into the system.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 4 }}>
        {/* Upload Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h5" color="secondary" gutterBottom>Upload Player File</Typography>
              
              <Box
                sx={{
                  border: '2px dashed rgba(0, 240, 255, 0.3)',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(0, 240, 255, 0.02)',
                  transition: 'border 0.3s ease',
                  '&:hover': {
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.05)'
                  }
                }}
                onClick={() => document.getElementById('excel-file-input')?.click()}
              >
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Upload size={36} color="#00f0ff" style={{ marginBottom: 8 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {file ? file.name : 'Select Excel Worksheet'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports .xlsx files
                </Typography>
              </Box>

              {errorMessage && (
                <Alert severity="error" sx={{ mt: 1 }}>{errorMessage}</Alert>
              )}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={!file || loading}
                onClick={handleUpload}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Upload size={20} />}
              >
                {loading ? 'Processing...' : 'Upload & Import'}
              </Button>
            </CardContent>
          </Card>

          {/* Import Summary Card */}
          {uploadResult && (
            <Card sx={{ border: '1px solid rgba(0, 255, 102, 0.2)' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" color="success.main">Import Summary</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Users size={16} color="#94a3b8" />
                      <Typography variant="body2">Total Rows Analyzed</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{uploadResult.totalRows}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CheckCircle size={16} color="#00ff66" />
                      <Typography variant="body2">Successfully Imported</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{uploadResult.successfullyImported}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Copy size={16} color="#ffab00" />
                      <Typography variant="body2">Duplicate Records Skipped</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{uploadResult.duplicateRecords}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <AlertTriangle size={16} color="#ff003c" />
                      <Typography variant="body2">Failed Records</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{uploadResult.failedRecords}</Typography>
                  </Box>
                </Box>

                {uploadResult.errors.length > 0 && (
                  <Accordion sx={{ backgroundColor: 'rgba(255, 0, 60, 0.03)', border: '1px solid rgba(255, 0, 60, 0.1)' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        View Error Logs ({uploadResult.errors.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ maxHeight: 150, overflowY: 'auto' }}>
                      {uploadResult.errors.map((err, idx) => (
                        <Typography key={idx} variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                          • {err}
                        </Typography>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Database Players Table */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by Name, Phone, or Email..."
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
            <TextField
              placeholder="Filter by Category (e.g. Cricket)"
              variant="outlined"
              size="small"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(0); }}
              sx={{ width: '220px' }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Skill Level</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">No players found in database.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id} hover>
                      <TableCell>{player.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{player.name}</TableCell>
                      <TableCell>{player.category}</TableCell>
                      <TableCell>{player.phoneNumber}</TableCell>
                      <TableCell>{player.email || '—'}</TableCell>
                      <TableCell>{player.skillLevel || '—'}</TableCell>
                      <TableCell>
                        {player.city && player.state ? `${player.city}, ${player.state}` : player.city || player.state || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalPlayers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default ImportPlayersView;
