import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Divider, Alert, CircularProgress, TextField } from '@mui/material';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

// Declare google global type
declare global {
  interface Window {
    google: any;
  }
}

interface LoginViewProps {
  onLoginSuccess: (user: { name: String; email: String; picture: string | null; role: 'CREATOR' | 'PLAYER' }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [customEmail, setCustomEmail] = useState('vickeyvickey6666@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialise Google sign-in button if SDK is loaded
    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: '999999999999-dummyclientid.apps.googleusercontent.com', // Placeholder for verification APIs
            callback: handleCredentialResponse,
            auto_select: false
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'filled_dark', size: 'large', width: 280 }
          );
        } catch (err) {
          console.warn('Google GSI initialization warning:', err);
        }
      }
    };

    // Retry checking if script loads late
    const timer = setInterval(() => {
      if (window.google) {
        initGoogleSignIn();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google', {
        idToken: response.credential
      });
      if (res.data.success) {
        onLoginSuccess(res.data);
      } else {
        setError(res.data.message || 'Verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Google Auth Verification failed. Try Bypass login for local testing.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = async (role: 'CREATOR' | 'PLAYER') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google', {
        bypassRole: role
      });
      if (res.data.success) {
        onLoginSuccess(res.data);
      } else {
        setError('Bypass authentication failed');
      }
    } catch (err: any) {
      console.error(err);
      setError('Bypass sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google', {
        bypassEmail: customEmail.trim()
      });
      if (res.data.success) {
        onLoginSuccess(res.data);
      } else {
        setError('Sandbox email verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setError('Sandbox sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #141B2D 0%, #0B1020 100%)',
        p: 3
      }}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          backgroundColor: '#111827',
          border: '1px solid rgba(22, 224, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(22, 224, 255, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Left Side: Esports branding and list features */}
        <Box
          sx={{
            flex: 1.1,
            p: 5,
            background: 'linear-gradient(135deg, rgba(22, 224, 255, 0.15) 0%, rgba(255, 10, 136, 0.05) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#16E0FF', display: 'flex', alignItems: 'center' }}>
              <Trophy size={32} color="#0B1020" />
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: '1px', color: '#ffffff' }}>
              GAME<span style={{ color: '#16E0FF' }}>GRID</span>
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Premium digital league software for badminton organizers, players, and auctioneers. Complete fixtures draws, live player drafts, and results tracking.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <CheckCircle2 size={18} color="#16E0FF" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Esports-grade Live Auction Board</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <CheckCircle2 size={18} color="#16E0FF" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Badminton Seeding & Byes Fixtures</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <CheckCircle2 size={18} color="#16E0FF" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Player Registries & Self-Signups</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Login triggers */}
        <Box sx={{ flex: 1, p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3.5 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 1 }}>Sign In</Typography>
            <Typography variant="body2" color="text.secondary">Select an identity provider to enter the dashboard.</Typography>
          </Box>

          {error && (
            <Alert severity="warning" variant="outlined" sx={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={40} color="primary" />
              <Typography variant="caption" color="text.secondary">Authenticating session...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: 'center' }}>
              {/* Native Google Login button container */}
              <Box id="google-signin-btn" sx={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
              
              <Divider sx={{ width: '100%', borderColor: 'rgba(255,255,255,0.06)', my: 1 }}>
                <Typography variant="caption" color="text.secondary">OR TEST LOCALLY</Typography>
              </Divider>

              {/* High fidelity Bypass controls */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleBypassLogin('CREATOR')}
                  sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}
                >
                  Login as Organizer (Creator)
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={() => handleBypassLogin('PLAYER')}
                  sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}
                >
                  Login as Player (User)
                </Button>
              </Box>

              <Divider sx={{ width: '100%', borderColor: 'rgba(255,255,255,0.06)', my: 1 }}>
                <Typography variant="caption" color="text.secondary">SANDBOX EMAIL SIGN-IN</Typography>
              </Divider>

              <Box component="form" onSubmit={handleCustomEmailLogin} sx={{ width: '100%', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Enter Whitelisted Email"
                  placeholder="name@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  color="primary"
                  sx={{ px: 3, fontWeight: 'bold', textTransform: 'none' }}
                >
                  Go
                </Button>
              </Box>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 2 }}>
            Developer Sandbox Mode • Built for GameGrid League Management.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
