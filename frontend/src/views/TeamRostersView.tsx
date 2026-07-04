import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  Avatar, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Landmark, User, FileSpreadsheet, Printer } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface RosterPlayer {
  playerId: number;
  name: string;
  photoPath: string | null;
  category: string;
  skillLevel: string | null;
  club: string | null;
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
  onBackClick?: () => void;
}

export const TeamRostersView: React.FC<TeamRostersViewProps> = ({
  auctionId
}) => {
  const [rosters, setRosters] = useState<TeamRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          <Button onClick={handlePrint} variant="contained" color="secondary" startIcon={<Printer size={18} />}>
            Print / PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="no-print">{error}</Alert>
      )}

      {/* Roster Cards (Screen Display) */}
      <Box className="no-print" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rosters.map((roster) => {
          const filtered = roster.players;
          
          // Calculate counts for each rule dynamically
          const ruleMetadata = auction?.rosterRules?.map((rule: any) => {
            const count = roster.players.filter(p => p.category?.trim().toLowerCase() === rule.category?.trim().toLowerCase()).length;
            return {
              category: rule.category,
              current: count,
              needed: rule.minCount
            };
          }) || [];
          
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
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Players Purchased: {roster.totalPlayersPurchased}
                      </Typography>
                      {ruleMetadata.map((meta: any, i: number) => (
                        <Chip
                          key={i}
                          size="small"
                          label={`${meta.category}: ${meta.current}/${meta.needed}`}
                          color={meta.current >= meta.needed ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {/* Team stats summary */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TOTAL BUDGET</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹{roster.purseAmount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TOTAL SPENT</Typography>
                    <Typography variant="body1" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>₹{roster.totalSpent}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>REMAINING PURSE</Typography>
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>₹{roster.remainingPurse}</Typography>
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
                          <TableCell sx={{ pl: 3, width: '60px' }}>S.No</TableCell>
                          <TableCell>Player Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Club</TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>Sold Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map((player, idx) => (
                          <TableRow key={player.playerId} hover>
                            <TableCell sx={{ pl: 3 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={player.photoPath ? (player.photoPath.startsWith('http') ? player.photoPath : `${ASSET_BASE_URL}/${player.photoPath}`) : undefined} sx={{ width: 30, height: 30 }}>
                                  <User size={14} />
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{player.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{player.category}</TableCell>
                            <TableCell>{player.club || '—'}</TableCell>
                            <TableCell align="right" sx={{ pr: 3, color: 'primary.main', fontWeight: 'bold' }}>
                              ₹{player.soldPrice}
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
        <Typography className="print-main-title" variant="h4" align="center" gutterBottom sx={{ mb: 4, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          {auction?.auctionName || 'Auction'} - Roster Summary
        </Typography>

        {rosters.map((roster) => (
          <Box key={roster.teamId} sx={{ mb: 5, pageBreakInside: 'avoid' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '2px solid #000', pb: 0.5 }}>
              {roster.teamName}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Total Budget: <strong>₹{roster.purseAmount}</strong></Typography>
              <Typography variant="body2">Spent: <strong>₹{roster.totalSpent}</strong></Typography>
              <Typography variant="body2">Remaining Purse: <strong>₹{roster.remainingPurse}</strong></Typography>
              <Typography variant="body2">Players: <strong>{roster.totalPlayersPurchased}</strong></Typography>
            </Box>

            {(() => {
              const ruleMetadata = auction?.rosterRules?.map((rule: any) => {
                const count = roster.players.filter(p => p.category?.trim().toLowerCase() === rule.category?.trim().toLowerCase()).length;
                return `${rule.category}: ${count}/${rule.minCount}`;
              }) || [];
              return ruleMetadata.length > 0 ? (
                <Typography variant="body2" sx={{ mb: 2, color: '#334155' }}>
                  Roster Quotas: {ruleMetadata.join('  |  ')}
                </Typography>
              ) : null;
            })()}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '6px', width: '40px' }}>S.No</th>
                  <th style={{ padding: '6px' }}>Player Name</th>
                  <th style={{ padding: '6px' }}>Category</th>
                  <th style={{ padding: '6px' }}>Club</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Sold Price</th>
                </tr>
              </thead>
              <tbody>
                {roster.players.map((player, idx) => (
                  <tr key={player.playerId} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px' }}>{idx + 1}</td>
                    <td style={{ padding: '6px' }}>{player.name}</td>
                    <td style={{ padding: '6px' }}>{player.category}</td>
                    <td style={{ padding: '6px' }}>{player.club || '—'}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{player.soldPrice}</td>
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
          @page {
            size: auto;
            margin: 0mm;
          }
          html, body {
            background-color: #0b0f19 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Print Watermark */
          body::after {
            content: "game grid";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(255, 255, 255, 0.03) !important;
            z-index: -1000;
            pointer-events: none;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 900;
            letter-spacing: 5px;
            text-transform: uppercase;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            background-color: #0b0f19 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            padding: 2.5cm !important;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .print-only * {
            color: #ffffff !important;
          }
          .print-main-title {
            color: #00f0ff !important;
            font-weight: 800 !important;
          }
          table {
            color: #ffffff !important;
            background-color: rgba(255, 255, 255, 0.02) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            width: 100%;
            border-collapse: collapse !important;
          }
          tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          }
          td {
            color: #ffffff !important;
            padding: 8px !important;
          }
          th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            font-size: 0.85rem !important;
            padding: 8px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

    </Box>
  );
};

export default TeamRostersView;
