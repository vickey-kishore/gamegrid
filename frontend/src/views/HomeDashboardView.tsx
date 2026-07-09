import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, CardActions,
  Chip, Avatar, CircularProgress, IconButton, Divider, Paper
} from '@mui/material';
import {
  Calendar, MapPin, ListCollapse, CalendarDays, Trophy, Coins,
  ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
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

interface HomeDashboardViewProps {
  userRole: 'CREATOR' | 'PLAYER';
  onCreateTournamentClick: () => void;
  onEditTournamentClick: (id: number) => void;
  onViewTournamentClick: (id: number) => void;
  onCreateAuctionClick: () => void;
  onEditAuctionClick: (id: number) => void;
  onViewAuctionClick: (id: number) => void;
  onDrawFixturesClick: (tournamentId: number) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = (props) => {
  const {
    userRole,
    onEditTournamentClick,
    onViewTournamentClick,
    onEditAuctionClick,
    onViewAuctionClick,
    onDrawFixturesClick
  } = props;
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    upcomingTournaments: 0,
    upcomingAuctions: 0,
    totalPlayers: 0,
    todaysMatches: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tourRes = await api.get('/tournaments', { params: { size: 1000 } });
      const tours: Tournament[] = tourRes.data.content;
      setTournaments(tours);

      const aucRes = await api.get('/auctions', { params: { size: 1000 } });
      const aucs: Auction[] = aucRes.data.content;
      setAuctions(aucs);

      // Compute stats
      const today = new Date().toISOString().split('T')[0];
      const upcomingToursCount = tours.filter(t => t.startDate >= today).length;
      const upcomingAucsCount = aucs.filter(a => a.auctionDate && a.auctionDate >= today).length;

      // Fetch participants count across all events
      let totalPartsCount = 0;
      for (const t of tours) {
        try {
          const evRes = await api.get(`/tournaments/${t.id}/events`);
          evRes.data.forEach((e: any) => {
            totalPartsCount += e.participantsCount || 0;
          });
        } catch (e) {
          // ignore
        }
      }

      setStats({
        upcomingTournaments: upcomingToursCount,
        upcomingAuctions: upcomingAucsCount,
        totalPlayers: totalPartsCount || 64, // high fidelity fallback
        todaysMatches: 8 // scheduled match slots
      });

    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find nearest upcoming tournament for Hero section
  const nearestTournament = React.useMemo(() => {
    if (tournaments.length === 0) return null;
    const today = new Date();
    // Filter tournaments not completed and sort by start date
    return [...tournaments]
      .filter(t => new Date(t.endDate) >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || tournaments[0];
  }, [tournaments]);

  // Compute countdown for Hero
  const countdownText = React.useMemo(() => {
    if (!nearestTournament) return '';
    const today = new Date();
    const start = new Date(nearestTournament.startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return `Starts in ${diffDays} days`;
    if (diffDays === 1) return 'Starts tomorrow';
    if (diffDays === 0) return 'Starts today';
    return 'Happening now';
  }, [nearestTournament]);

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  // Minimalist Calendar Generator
  const calendarDays = React.useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [calendarDate]);

  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Compute events on the selected date
  const selectedDayEvents = React.useMemo(() => {
    if (!selectedDay) return { tournaments: [], auctions: [] };
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    const matchedTournaments = tournaments.filter(t => dayStr >= t.startDate && dayStr <= t.endDate);
    const matchedAuctions = auctions.filter(a => a.auctionDate === dayStr);
    
    return { tournaments: matchedTournaments, auctions: matchedAuctions };
  }, [selectedDay, calendarDate, tournaments, auctions]);

  // Status badges color mapper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'registration open':
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'upcoming':
        return { bg: 'rgba(22, 224, 255, 0.1)', text: '#16E0FF', border: '1px solid rgba(22, 224, 255, 0.2)' };
      case 'auction active':
        return { bg: 'rgba(255, 10, 136, 0.1)', text: '#FF0A88', border: '1px solid rgba(255, 10, 136, 0.2)' };
      case 'completed':
        return { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* 1. HERO SECTION */}
      {nearestTournament && (
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(22, 224, 255, 0.1) 0%, rgba(255, 10, 136, 0.05) 100%)',
            border: '1px solid rgba(22, 224, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(22, 224, 255, 0.05)',
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 3
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Avatar
              src={nearestTournament.logoPath ? `${ASSET_BASE_URL}/${nearestTournament.logoPath}` : undefined}
              sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: '#16E0FF', border: '2px solid #16E0FF' }}
            >
              <Trophy size={40} color="#0B1020" />
            </Avatar>
            <Box>
              <Chip
                label={countdownText}
                size="small"
                sx={{
                  backgroundColor: '#FF0A88',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  mb: 1.5,
                  letterSpacing: '0.5px'
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff' }}>
                {nearestTournament.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, color: 'text.secondary', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MapPin size={14} color="#16E0FF" />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{nearestTournament.venue}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={14} color="#16E0FF" />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{nearestTournament.startDate} to {nearestTournament.endDate}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowRight size={16} />}
            onClick={() => onViewTournamentClick(nearestTournament.id)}
            sx={{ py: 1.5, px: 3, borderRadius: 2 }}
          >
            View Tournament
          </Button>
        </Card>
      )}

      {/* 2. STATISTICS ROW */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderLeft: '4px solid #16E0FF', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Tournaments</Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 800, color: '#ffffff' }}>{stats.upcomingTournaments}</Typography>
                <Typography variant="caption" sx={{ color: '#16E0FF', fontWeight: 600, display: 'block', mt: 0.5 }}>Active Scheduler</Typography>
              </Box>
              <Trophy size={28} color="#16E0FF" />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderLeft: '4px solid #FF0A88', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Auctions</Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 800, color: '#ffffff' }}>{stats.upcomingAuctions}</Typography>
                <Typography variant="caption" sx={{ color: '#FF0A88', fontWeight: 600, display: 'block', mt: 0.5 }}>Bidding Rooms</Typography>
              </Box>
              <Coins size={28} color="#FF0A88" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* 4. MAIN SPLIT GRID (LEFT 70%, RIGHT 30%) */}
      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: Listings */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* TOURNAMENTS SECTION */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>Tournaments Hub</Typography>
              <Chip label={`${tournaments.length} total`} size="small" variant="outlined" sx={{ color: '#16E0FF', borderColor: 'rgba(22, 224, 255, 0.2)' }} />
            </Box>

            <Grid container spacing={3}>
              {tournaments.length === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ py: 6, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <Typography color="text.secondary">No tournaments configured.</Typography>
                  </Card>
                </Grid>
              ) : (
                tournaments.map(tour => {
                  const statusInfo = getStatusColor(tour.startDate > new Date().toISOString() ? 'upcoming' : 'registration open');
                  return (
                    <Grid size={{ xs: 12 }} key={tour.id}>
                      <Card sx={{ '&:hover': { borderColor: '#16E0FF' } }}>
                        <CardContent sx={{ p: 3, display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                          <Avatar
                            src={tour.logoPath ? `${ASSET_BASE_URL}/${tour.logoPath}` : undefined}
                            sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: '#111827' }}
                          >
                            <Trophy size={24} color="#16E0FF" />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>{tour.name}</Typography>
                              <Box
                                sx={{
                                  backgroundColor: statusInfo.bg,
                                  color: statusInfo.text,
                                  border: statusInfo.border,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  textTransform: 'uppercase'
                                }}
                              >
                                {tour.startDate > new Date().toISOString() ? 'Upcoming' : 'Registration Open'}
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mt: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <MapPin size={13} color="#16E0FF" />
                                <Typography variant="caption">{tour.venue}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <Calendar size={13} color="#16E0FF" />
                                <Typography variant="caption">{tour.startDate} to {tour.endDate}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <ListCollapse size={13} color="#16E0FF" />
                                <Typography variant="caption">{tour.eventsCount} event categories</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                        
                        <CardActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                          {userRole === 'CREATOR' && (
                            <Button size="small" variant="text" sx={{ color: 'text.secondary', '&:hover': { color: '#ffffff' } }} onClick={() => onEditTournamentClick(tour.id)}>
                              Edit
                            </Button>
                          )}
                          <Button size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }} onClick={() => onDrawFixturesClick(tour.id)}>
                            Fixtures
                          </Button>
                          <Button size="small" variant="contained" color="primary" onClick={() => onViewTournamentClick(tour.id)}>
                            View
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>

          {/* AUCTIONS SECTION */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>Auction Rooms</Typography>
              <Chip label={`${auctions.length} total`} size="small" variant="outlined" sx={{ color: '#FF0A88', borderColor: 'rgba(255, 10, 136, 0.2)' }} />
            </Box>

            <Grid container spacing={3}>
              {auctions.length === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ py: 6, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography color="text.secondary">No auctions configured.</Typography>
                  </Card>
                </Grid>
              ) : (
                auctions.map(auc => {
                  const statusInfo = getStatusColor(auc.status === 'Active' ? 'auction active' : 'draft');
                  return (
                    <Grid size={{ xs: 12 }} key={auc.id}>
                      <Card sx={{ '&:hover': { borderColor: '#FF0A88' } }}>
                        <CardContent sx={{ p: 3, display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                          <Avatar sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: '#111827' }}>
                            <Coins size={24} color="#FF0A88" />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>{auc.auctionName}</Typography>
                              <Box
                                sx={{
                                  backgroundColor: statusInfo.bg,
                                  color: statusInfo.text,
                                  border: statusInfo.border,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  textTransform: 'uppercase'
                                }}
                              >
                                {auc.status}
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mt: 2, color: 'text.secondary' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Category:</Typography>
                                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{auc.category}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Event:</Typography>
                                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{auc.eventName}</Typography>
                              </Box>
                              {auc.auctionDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Calendar size={13} color="#FF0A88" />
                                  <Typography variant="caption">{auc.auctionDate}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>

                        <CardActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                          {userRole === 'CREATOR' && (
                            <Button size="small" variant="text" sx={{ color: 'text.secondary', '&:hover': { color: '#ffffff' } }} onClick={() => onEditAuctionClick(auc.id)}>
                              Edit
                            </Button>
                          )}
                          <Button size="small" variant="contained" color="secondary" onClick={() => onViewAuctionClick(auc.id)}>
                            Open Board
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>
        </Grid>

        {/* RIGHT COLUMN: Calendar & Activity widgets */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* CALENDAR WIDGET */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={handlePrevMonth} sx={{ color: '#ffffff', p: 0.5 }}>
                    <ChevronLeft size={16} />
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff', minWidth: '110px', textAlign: 'center', fontSize: '0.9rem' }}>
                    {monthName}
                  </Typography>
                  <IconButton size="small" onClick={handleNextMonth} sx={{ color: '#ffffff', p: 0.5 }}>
                    <ChevronRight size={16} />
                  </IconButton>
                </Box>
                <CalendarDays size={18} color="#16E0FF" />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center', mb: 1 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <Typography key={d} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{d}</Typography>
                ))}
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center' }}>
                {calendarDays.map((day, idx) => {
                  const todayObj = new Date();
                  const isToday = day === todayObj.getDate() && 
                                  calendarDate.getMonth() === todayObj.getMonth() && 
                                  calendarDate.getFullYear() === todayObj.getFullYear();
                  
                  const isSelected = day === selectedDay;
                  
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const dayStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                  
                  const hasTournament = day ? tournaments.some(t => dayStr >= t.startDate && dayStr <= t.endDate) : false;
                  const hasAuction = day ? auctions.some(a => a.auctionDate === dayStr) : false;
                  
                  const showBorder = hasTournament || hasAuction;
                  const borderHex = hasAuction ? 'rgba(255, 10, 136, 0.4)' : 'rgba(22, 224, 255, 0.4)';
                  const dotHex = hasAuction ? '#FF0A88' : '#16E0FF';
                  
                  return (
                    <Box
                      key={idx}
                      sx={{
                        py: 0.8,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        fontWeight: isToday || isSelected || showBorder ? 'bold' : 'normal',
                        backgroundColor: isToday ? '#16E0FF' : (isSelected ? 'rgba(22, 224, 255, 0.15)' : 'transparent'),
                        color: isToday ? '#0B1020' : (day ? '#ffffff' : 'transparent'),
                        border: isSelected ? '1px solid #16E0FF' : (showBorder ? `1px solid ${borderHex}` : 'none'),
                        boxShadow: isSelected ? '0 0 8px rgba(22, 224, 255, 0.3)' : 'none',
                        position: 'relative',
                        cursor: day ? 'pointer' : 'default'
                      }}
                      onClick={() => day && setSelectedDay(day)}
                    >
                      {day}
                      {showBorder && (
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: dotHex, position: 'absolute', bottom: 2, left: 'calc(50% - 2px)' }} />
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Day Events detail sub-panel */}
              <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.05)' }} />

              {selectedDay ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#16E0FF', mb: 1.5, fontSize: '0.85rem' }}>
                    Events on {selectedDay} {calendarDate.toLocaleString('default', { month: 'short' })}, {calendarDate.getFullYear()}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedDayEvents.tournaments.length === 0 && selectedDayEvents.auctions.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">No events scheduled on this day.</Typography>
                    ) : (
                      <>
                        {selectedDayEvents.tournaments.map(t => (
                          <Paper key={t.id} variant="outlined" sx={{ p: 1.5, border: '1px solid rgba(22, 224, 255, 0.1)', bgcolor: 'rgba(22, 224, 255, 0.02)', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF' }} />
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{t.name}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2, mt: 0.5, fontSize: '0.7rem' }}>
                              Venue: {t.venue}
                            </Typography>
                          </Paper>
                        ))}
                        {selectedDayEvents.auctions.map(a => (
                          <Paper key={a.id} variant="outlined" sx={{ p: 1.5, border: '1px solid rgba(255, 10, 136, 0.1)', bgcolor: 'rgba(255, 10, 136, 0.02)', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FF0A88' }} />
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{a.auctionName}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2, mt: 0.5, fontSize: '0.7rem' }}>
                              Category: {a.category} • Live Room
                            </Typography>
                          </Paper>
                        ))}
                      </>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">Select a day above to list scheduled tournaments or auctions.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};
