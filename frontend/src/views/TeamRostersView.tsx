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
  isRetained: boolean;
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-ups are blocked. Please enable pop-ups to print rosters.');
      return;
    }



    const auctionName = auction?.auctionName || 'Auction Roster';

    const rostersHtml = rosters.map((roster) => {
      const ruleMetadataHtml = auction?.rosterRules?.map((rule: any) => {
        const count = roster.players.filter((p: any) => p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === rule.category?.replace(/\s+/g, ' ').trim().toLowerCase()).length;
        const met = count >= rule.minCount;
        return `
          <span class="quota-badge" style="color: ${met ? '#16a34a' : '#d97706'}; border-color: ${met ? '#bbf7d0' : '#fef3c7'}; background-color: ${met ? '#f0fdf4' : '#fffbeb'};">
            ${rule.category}: ${count}/${rule.minCount}
          </span>
        `;
      }).join('') || '';

      const playersRowsHtml = roster.players.map((p, idx) => `
        <tr>
          <td class="sno">${idx + 1}</td>
          <td class="name">${p.name} ${p.isRetained ? '<span style="font-size: 0.65rem; color: #7c3aed; background: #f3e8ff; border: 1px solid #e9d5ff; padding: 1px 4px; border-radius: 3px; margin-left: 5px; font-weight: 600;">Retained</span>' : ''}</td>
          <td>${p.category}</td>
          <td>${p.club || '—'}</td>
          <td class="price">₹${(p.soldPrice || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('') || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">No players purchased yet.</td></tr>`;

      const logoSrc = roster.logoPath ? (roster.logoPath.startsWith('http') ? roster.logoPath : `${ASSET_BASE_URL}/${roster.logoPath}`) : '';

      return `
        <div class="team-section">
          <div class="team-header">
            ${logoSrc ? `<img src="${logoSrc}" class="team-logo" alt="${roster.teamName}" />` : ''}
            <h2 class="team-name">${roster.teamName}</h2>
          </div>

          <div class="team-summary">
            <span>Total Budget: <strong>₹${roster.purseAmount.toLocaleString('en-IN')}</strong></span>
            <span>Spent: <strong>₹${roster.totalSpent.toLocaleString('en-IN')}</strong></span>
            <span>Remaining Purse: <strong style="color: #16a34a;">₹${roster.remainingPurse.toLocaleString('en-IN')}</strong></span>
            <span>Squad Size: <strong>${roster.totalPlayersPurchased}</strong></span>
          </div>

          ${ruleMetadataHtml ? `<div class="category-quotas">${ruleMetadataHtml}</div>` : ''}

          <table class="players-table">
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Player Name</th>
                <th style="width: 150px;">Category</th>
                <th style="width: 150px;">Club</th>
                <th style="text-align: right; width: 120px;">Sold Price</th>
              </tr>
            </thead>
            <tbody>
              ${playersRowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${auctionName} - Roster Summary</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
            html, body {
              font-family: 'Inter', sans-serif;
              color: #ffffff;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              margin: 0;
              padding: 0;
            }
            @page {
              size: auto;
              margin: 0;
            }
            body {
              margin: 0 1.6cm;
              padding-top: 1.5cm;
              padding-bottom: 1.5cm;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
            }
            .print-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 8rem;
              color: rgba(99, 102, 241, 0.08);
              font-family: 'Rajdhani', sans-serif;
              font-weight: 900;
              letter-spacing: 8px;
              text-transform: uppercase;
              white-space: nowrap;
              z-index: -1000;
              pointer-events: none;
            }
            .header {
              text-align: center;
              margin-bottom: 2.5rem;
              position: relative;
            }
            .header h1 {
              font-family: 'Rajdhani', sans-serif;
              font-weight: 800;
              font-size: 2.5rem;
              margin: 0;
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .header p {
              font-size: 1rem;
              color: #94a3b8;
              margin: 8px 0 0 0;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            .header::after {
              content: '';
              display: block;
              width: 200px;
              height: 3px;
              background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
              margin: 20px auto 0;
              border-radius: 2px;
            }

            .team-section {
              margin-top: 1.5cm;
              margin-bottom: 3.5rem;
              page-break-inside: avoid;
              page-break-after: always;
              border: 1px solid rgba(99, 102, 241, 0.2);
              border-radius: 12px;
              padding: 2rem;
              background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
              box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .team-section:first-child {
              margin-top: 0;
            }
            .team-section:last-child {
              page-break-after: auto;
            }
            .team-header {
              display: flex;
              align-items: center;
              gap: 1.5rem;
              border-bottom: 2px solid rgba(99, 102, 241, 0.2);
              padding-bottom: 1.2rem;
              margin-bottom: 1.2rem;
            }
            .team-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              border-radius: 12px;
              border: 2px solid rgba(99, 102, 241, 0.4);
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
              box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
            }
            .team-name {
              font-family: 'Rajdhani', sans-serif;
              font-weight: 800;
              font-size: 2rem;
              margin: 0;
              background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .team-summary {
              display: flex;
              gap: 2.5rem;
              font-size: 0.9rem;
              color: #cbd5e1;
              margin-bottom: 1.2rem;
              flex-wrap: wrap;
              padding: 1rem;
              background: rgba(99, 102, 241, 0.05);
              border-radius: 8px;
              border: 1px solid rgba(99, 102, 241, 0.1);
            }
            .team-summary span strong {
              color: #ffffff;
              font-weight: 600;
            }

            .category-quotas {
              display: flex;
              flex-wrap: wrap;
              gap: 0.8rem;
              margin-bottom: 1.5rem;
            }
            .quota-badge {
              font-size: 0.75rem;
              font-weight: 700;
              padding: 6px 12px;
              border-radius: 6px;
              border: 1px solid rgba(99, 102, 241, 0.2);
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .players-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0.5rem;
              border-radius: 8px;
              overflow: hidden;
            }
            .players-table th {
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
              color: #e2e8f0;
              font-size: 0.8rem;
              font-weight: 700;
              text-transform: uppercase;
              padding: 12px 14px;
              border-bottom: 2px solid rgba(99, 102, 241, 0.3);
              text-align: left;
              letter-spacing: 0.5px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .players-table td {
              padding: 12px 14px;
              border-bottom: 1px solid rgba(99, 102, 241, 0.1);
              font-size: 0.85rem;
              color: #e2e8f0;
            }
            .players-table tr:hover {
              background: rgba(99, 102, 241, 0.05);
            }
            .players-table tr:last-child td {
              border-bottom: none;
            }
            .players-table .sno {
              color: #94a3b8;
              font-weight: 600;
              width: 50px;
            }
            .players-table .name {
              font-weight: 600;
              color: #ffffff;
            }
            .players-table .price {
              font-weight: 700;
              color: #6366f1;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="print-watermark">Game Grid</div>

          <div class="header">
            <h1>${auctionName}</h1>
            <p>Official Franchise Roster Summary Sheet</p>
          </div>

          ${rostersHtml}

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
            const count = roster.players.filter(p => p.category?.replace(/\s+/g, ' ').trim().toLowerCase() === rule.category?.replace(/\s+/g, ' ').trim().toLowerCase()).length;
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{player.name}</Typography>
                                  {player.isRetained && (
                                    <Chip
                                      label="Retained"
                                      size="small"
                                      color="secondary"
                                      sx={{ fontSize: '0.65rem', height: 16, px: 0.5 }}
                                    />
                                  )}
                                </Box>
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

    </Box>
  );
};

export default TeamRostersView;
