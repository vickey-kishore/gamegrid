import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Typography, Button, Container, Box, Avatar, IconButton, InputBase, Badge, Tooltip } from '@mui/material';
import {
  Home, Trophy, Coins, Target, FileText, Settings,
  HelpCircle, Bell, Search, PlaySquare, Landmark
} from 'lucide-react';
import theme from './theme';
import { AuctionsListView } from './views/AuctionsListView';
import ImportPlayersView from './views/ImportPlayersView';
import { AuctionFormView } from './views/AuctionFormView';
import { AuctionDashboardView } from './views/AuctionDashboardView';
import { TeamRostersView } from './views/TeamRostersView';
import { HomeDashboardView } from './views/HomeDashboardView';
import { TournamentFormView } from './views/TournamentFormView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { TournamentsListView } from './views/TournamentsListView';


type ViewState = 'home-dashboard' | 'auctions-list' | 'tournaments-list' | 'import-players' | 'create-auction' | 'edit-auction' | 'dashboard' | 'rosters' | 'create-tournament' | 'edit-tournament' | 'tournament-detail';

export const App: React.FC = () => {
  const [currentUser] = useState<{ name: string; email: string; picture: string | null; role: 'CREATOR' | 'PLAYER' }>({
    name: "Admin Hub",
    email: "organizer@gamegrid.com",
    picture: null,
    role: "CREATOR"
  });
  const [currentView, setCurrentView] = useState<ViewState>('home-dashboard');
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [fixturesTabInitial, setFixturesTabInitial] = useState<number>(0);
  const [globalSearchText, setGlobalSearchText] = useState('');

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };



  const handleEditAuction = (id: number) => {
    setSelectedAuctionId(id);
    setCurrentView('edit-auction');
  };

  const handleViewAuction = (id: number) => {
    setSelectedAuctionId(id);
    setCurrentView('dashboard');
  };

  const handleSidebarTournamentClick = () => {
    handleNavigate('tournaments-list');
  };

  const handleSidebarFixturesClick = () => {
    if (selectedTournamentId) {
      setFixturesTabInitial(1);
      handleNavigate('tournament-detail');
    } else {
      handleNavigate('home-dashboard');
      alert('Select a tournament from the registry list to view and draw fixtures.');
    }
  };

  const handleFeaturePlaceholderClick = (featureName: string) => {
    alert(`${featureName} module is under development and will be released in the upcoming update.`);
  };



  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B1020' }}>
        
        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            width: 260,
            backgroundColor: '#111827',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 1200,
            overflowY: 'auto'
          }}
          className="no-print"
        >
          {/* Logo brand section */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigate('home-dashboard')}
          >
            <Typography
              variant="h4"
              sx={{
                background: 'linear-gradient(135deg, #16E0FF 0%, #FF0A88 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: '1.65rem',
                letterSpacing: '2px'
              }}
            >
              GAMEGRID
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#16E0FF',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              SPORTS HUB
            </Typography>
          </Box>

          {/* Navigation Links list */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: currentView === 'home-dashboard' ? '#16E0FF' : 'text.secondary',
                backgroundColor: currentView === 'home-dashboard' ? 'rgba(22, 224, 255, 0.05)' : 'transparent',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<Home size={18} />}
              onClick={() => handleNavigate('home-dashboard')}
            >
              Dashboard
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: currentView === 'tournaments-list' || currentView === 'create-tournament' || currentView === 'edit-tournament' || (currentView === 'tournament-detail' && fixturesTabInitial === 0) ? '#16E0FF' : 'text.secondary',
                backgroundColor: currentView === 'tournaments-list' || currentView === 'create-tournament' || currentView === 'edit-tournament' || (currentView === 'tournament-detail' && fixturesTabInitial === 0) ? 'rgba(22, 224, 255, 0.05)' : 'transparent',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<Trophy size={18} />}
              onClick={handleSidebarTournamentClick}
            >
              Tournaments
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: currentView === 'auctions-list' || currentView === 'create-auction' || currentView === 'edit-auction' || currentView === 'dashboard' || currentView === 'rosters' ? '#16E0FF' : 'text.secondary',
                backgroundColor: currentView === 'auctions-list' || currentView === 'create-auction' || currentView === 'edit-auction' || currentView === 'dashboard' || currentView === 'rosters' ? 'rgba(22, 224, 255, 0.05)' : 'transparent',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<Coins size={18} />}
              onClick={() => handleNavigate('auctions-list')}
            >
              Auctions
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: currentView === 'tournament-detail' && fixturesTabInitial === 1 ? '#16E0FF' : 'text.secondary',
                backgroundColor: currentView === 'tournament-detail' && fixturesTabInitial === 1 ? 'rgba(22, 224, 255, 0.05)' : 'transparent',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<Target size={18} />}
              onClick={handleSidebarFixturesClick}
            >
              Fixtures
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: 'text.secondary',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<FileText size={18} />}
              onClick={() => handleFeaturePlaceholderClick('Reports')}
            >
              Reports
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                color: 'text.secondary',
                gap: 1.5,
                py: 1.2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff'
                }
              }}
              startIcon={<Settings size={18} />}
              onClick={() => handleFeaturePlaceholderClick('Settings')}
            >
              Settings
            </Button>

            {/* Quick routes back to active bidding board/roster */}
            {selectedAuctionId && (currentView === 'dashboard' || currentView === 'rosters') && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                  Active Bidding Room
                </Typography>
                <Button
                  fullWidth
                  variant="text"
                  sx={{
                    justifyContent: 'flex-start',
                    color: currentView === 'dashboard' ? '#FF0A88' : 'text.secondary',
                    backgroundColor: currentView === 'dashboard' ? 'rgba(255, 10, 136, 0.05)' : 'transparent',
                    gap: 1.5,
                    py: 1,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }
                  }}
                  startIcon={<PlaySquare size={16} />}
                  onClick={() => handleNavigate('dashboard')}
                >
                  Live Board
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  sx={{
                    justifyContent: 'flex-start',
                    color: currentView === 'rosters' ? '#FF0A88' : 'text.secondary',
                    backgroundColor: currentView === 'rosters' ? 'rgba(255, 10, 136, 0.05)' : 'transparent',
                    gap: 1.5,
                    py: 1,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }
                  }}
                  startIcon={<Landmark size={16} />}
                  onClick={() => handleNavigate('rosters')}
                >
                  Roster Table
                </Button>
              </Box>
            )}
          </Box>

          {/* Sidebar Footer Section */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<HelpCircle size={16} />}
              sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', textTransform: 'none', py: 1 }}
              onClick={() => alert('Support ticket center is opening. Contact us at support@gamegrid.com')}
            >
              Need Help?
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'center', color: 'text.secondary', fontSize: '0.65rem' }}>
              GameGrid v1.0.0
            </Typography>
          </Box>
        </Box>

        {/* MAIN PANEL CONTENT WRAPPER */}
        <Box
          sx={{
            flexGrow: 1,
            marginLeft: '260px',
            width: 'calc(100% - 260px)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#0B1020'
          }}
        >
          {/* TOP BAR NAVIGATION */}
          <Box
            sx={{
              height: 70,
              backgroundColor: 'rgba(11, 16, 32, 0.85)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 4,
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}
            className="no-print"
          >
            {/* Search Input Box */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                width: '320px',
                '&:focus-within': {
                  borderColor: '#16E0FF',
                  boxShadow: '0 0 8px rgba(22, 224, 255, 0.2)'
                }
              }}
            >
              <Search size={16} color="#94a3b8" />
              <InputBase
                placeholder="Search tournaments, auctions, players..."
                value={globalSearchText}
                onChange={(e) => setGlobalSearchText(e.target.value)}
                sx={{ ml: 1.5, fontSize: '0.85rem', width: '100%', color: '#ffffff' }}
              />
            </Box>

            {/* Topbar Right Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="View Notifications">
                <IconButton color="inherit" sx={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Badge color="error" variant="dot">
                    <Bell size={18} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '1px solid rgba(255,255,255,0.1)', pl: 2 }}>
                <Avatar
                  src={currentUser?.picture || undefined}
                  sx={{ bgcolor: currentUser?.role === 'CREATOR' ? '#16E0FF' : '#FF0A88', color: '#0B1020', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'GG'}
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentUser?.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {currentUser?.role === 'CREATOR' ? 'Organizer' : 'Player'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* MAIN PAGE CONTAINER VIEWPORT */}
          <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4, px: { xs: 2, md: 4 } }}>
            {currentView === 'home-dashboard' && (
              <HomeDashboardView
                userRole={currentUser.role}
                onCreateTournamentClick={() => handleNavigate('create-tournament')}
                onEditTournamentClick={(id) => { setSelectedTournamentId(id); handleNavigate('edit-tournament'); }}
                onViewTournamentClick={(id) => { setSelectedTournamentId(id); setFixturesTabInitial(0); handleNavigate('tournament-detail'); }}
                onCreateAuctionClick={() => handleNavigate('create-auction')}
                onEditAuctionClick={handleEditAuction}
                onViewAuctionClick={handleViewAuction}
                onDrawFixturesClick={(id) => { setSelectedTournamentId(id); setFixturesTabInitial(1); handleNavigate('tournament-detail'); }}
              />
            )}

            {currentView === 'create-tournament' && (
              <TournamentFormView
                tournamentId={null}
                onBackClick={() => handleNavigate('tournaments-list')}
                onSaveSuccess={() => handleNavigate('tournaments-list')}
              />
            )}

            {currentView === 'edit-tournament' && (
              <TournamentFormView
                tournamentId={selectedTournamentId}
                onBackClick={() => handleNavigate('tournaments-list')}
                onSaveSuccess={() => handleNavigate('tournaments-list')}
              />
            )}

            {currentView === 'tournament-detail' && selectedTournamentId !== null && (
              <TournamentDetailView
                userRole={currentUser.role}
                tournamentId={selectedTournamentId}
                onBackClick={() => handleNavigate('tournaments-list')}
                initialTab={fixturesTabInitial}
              />
            )}

            {currentView === 'tournaments-list' && (
              <TournamentsListView
                userRole={currentUser.role}
                onCreateClick={() => handleNavigate('create-tournament')}
                onEditClick={(id) => { setSelectedTournamentId(id); handleNavigate('edit-tournament'); }}
                onViewClick={(id) => { setSelectedTournamentId(id); setFixturesTabInitial(0); handleNavigate('tournament-detail'); }}
                onDrawFixturesClick={(id) => { setSelectedTournamentId(id); setFixturesTabInitial(1); handleNavigate('tournament-detail'); }}
              />
            )}

            {currentView === 'auctions-list' && (
              <AuctionsListView
                userRole={currentUser.role}
                onCreateClick={() => handleNavigate('create-auction')}
                onEditClick={handleEditAuction}
                onViewClick={handleViewAuction}
              />
            )}

            {currentView === 'import-players' && (
              <ImportPlayersView />
            )}

            {currentView === 'create-auction' && (
              <AuctionFormView
                auctionId={null}
                onBackClick={() => handleNavigate('auctions-list')}
                onSaveSuccess={() => handleNavigate('auctions-list')}
              />
            )}

            {currentView === 'edit-auction' && (
              <AuctionFormView
                auctionId={selectedAuctionId}
                onBackClick={() => handleNavigate('auctions-list')}
                onSaveSuccess={() => handleNavigate('auctions-list')}
              />
            )}

            {currentView === 'dashboard' && selectedAuctionId !== null && (
              <AuctionDashboardView
                userRole={currentUser.role}
                auctionId={selectedAuctionId}
                onBackClick={() => handleNavigate('auctions-list')}
              />
            )}

            {currentView === 'rosters' && selectedAuctionId !== null && (
              <TeamRostersView
                auctionId={selectedAuctionId}
                onBackClick={() => handleNavigate('auctions-list')}
              />
            )}
          </Container>
        </Box>

      </Box>
    </ThemeProvider>
  );
};

export default App;
