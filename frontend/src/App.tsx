import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Landmark, Users, PlaySquare, Compass } from 'lucide-react';
import theme from './theme';
import AuctionsListView from './views/AuctionsListView';
import ImportPlayersView from './views/ImportPlayersView';
import AuctionFormView from './views/AuctionFormView';
import AuctionDashboardView from './views/AuctionDashboardView';
import TeamRostersView from './views/TeamRostersView';

type ViewState = 'auctions-list' | 'import-players' | 'create-auction' | 'edit-auction' | 'dashboard' | 'rosters';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('auctions-list');
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Top Banner Navigation */}
      <AppBar position="sticky" sx={{ background: 'rgba(18, 24, 41, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'none' }} className="no-print">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
            
            {/* Logo brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => handleNavigate('auctions-list')}>
              <Typography
                variant="h4"
                sx={{
                  background: 'linear-gradient(135deg, #00f0ff 0%, #ff007f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '1.75rem',
                  letterSpacing: '2px'
                }}
              >
                GAMEGRID
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)', pl: 1, textTransform: 'uppercase' }}>
                Auction Engine
              </Typography>
            </Box>

            {/* Menu options */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color={currentView === 'auctions-list' ? 'primary' : 'inherit'}
                startIcon={<Compass size={18} />}
                onClick={() => handleNavigate('auctions-list')}
              >
                Auctions
              </Button>
              
              <Button
                color={currentView === 'import-players' ? 'primary' : 'inherit'}
                startIcon={<Users size={18} />}
                onClick={() => handleNavigate('import-players')}
              >
                Players Directory
              </Button>

              {selectedAuctionId && (currentView === 'dashboard' || currentView === 'rosters') && (
                <>
                  <Button
                    color={currentView === 'dashboard' ? 'primary' : 'inherit'}
                    startIcon={<PlaySquare size={18} />}
                    onClick={() => handleNavigate('dashboard')}
                  >
                    Bidding Board
                  </Button>
                  <Button
                    color={currentView === 'rosters' ? 'primary' : 'inherit'}
                    startIcon={<Landmark size={18} />}
                    onClick={() => handleNavigate('rosters')}
                  >
                    Rosters
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main body content container */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, pb: 6 }}>
        {currentView === 'auctions-list' && (
          <AuctionsListView
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
    </ThemeProvider>
  );
};

export default App;
