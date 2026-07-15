import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Divider,
  IconButton, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { ArrowLeft, Save, Plus, Trash2, Upload, AlertCircle, Maximize2, X } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface EventConfig {
  id?: number;
  eventName: string;
  eventType: 'Singles' | 'Doubles';
  fixtureType: 'Knockout' | 'League';
  scoringType: '21 Points - Best of 3' | '15 Points - Best of 3' | '30 Points - Single Set' | 'Custom';
  pointsPerSet?: number;
  numberOfSets?: number;
}

const replaceBold = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>{part}</strong> : part));
};

const parseMarkdownToJSX = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const rawLines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Robust Table Detection
    if (trimmed.includes('|') && i + 1 < rawLines.length && rawLines[i+1].trim().includes('|') && /^[\s-:|]+$/.test(rawLines[i+1].trim().replace(/[a-zA-Z0-9]/g, ''))) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().includes('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) => {
          let cleaned = rowStr;
          if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
          if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
          return cleaned.split('|').map(c => c.trim());
        };

        const headers = parseRow(tableLines[0]);
        const separatorRow = parseRow(tableLines[1]);
        const isSeparator = separatorRow.every(cell => /^[\s-:]+$/.test(cell));
        const dataRowsStart = isSeparator ? 2 : 1;

        const rows: string[][] = [];
        for (let r = dataRowsStart; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          while (cells.length < headers.length) {
            cells.push('');
          }
          rows.push(cells.slice(0, headers.length));
        }

        elements.push(
          <TableContainer component={Paper} key={`tbl-${i}`} sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableRow>
                  {headers.map((h, hIdx) => (
                    <TableCell key={hIdx} sx={{ fontWeight: 'bold', color: 'secondary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {replaceBold(h)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, rIdx) => (
                  <TableRow key={rIdx} hover>
                    {row.map((cell, cIdx) => (
                      <TableCell key={cIdx} sx={{ color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {replaceBold(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }
      continue;
    }

    // Divider
    if (trimmed === '---') {
      elements.push(<Divider key={`div-${i}`} sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />);
      i++;
      continue;
    }

    const leadingSpaces = line.search(/\S/);
    const indentMultiplier = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : 0;
    const paddingLeft = indentMultiplier * 3;

    // Headers
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <Typography key={`h4-${i}`} variant="h6" color="primary" sx={{ fontWeight: 700, mt: 1.5, mb: 1, pl: paddingLeft, fontSize: '0.95rem', opacity: 0.9 }}>
          {replaceBold(trimmed.substring(5))}
        </Typography>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Typography key={`h3-${i}`} variant="h5" color="primary" sx={{ fontWeight: 700, mt: 3, mb: 1.5, pl: paddingLeft }}>
          {replaceBold(trimmed.substring(4))}
        </Typography>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <Typography key={`h2-${i}`} variant="h4" color="secondary" sx={{ fontWeight: 800, mt: 3.5, mb: 2, pl: paddingLeft }}>
          {replaceBold(trimmed.substring(3))}
        </Typography>
      );
      i++;
      continue;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      const bulletStyle = indentMultiplier > 0 
        ? { minWidth: 6, height: 6, border: '1.5px solid #FF0A88', borderRadius: '50%', mt: 0.9 }
        : { minWidth: 6, height: 6, borderRadius: '50%', bgcolor: '#16E0FF', mt: 0.9 };

      elements.push(
        <Box key={`bullet-${i}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', ml: 2 + indentMultiplier * 2, mb: 1, pl: paddingLeft }}>
          <Box sx={bulletStyle} />
          <Typography variant="body2" sx={{ color: '#e2e8f0', lineHeight: 1.6 }}>
            {replaceBold(content)}
          </Typography>
        </Box>
      );
      i++;
      continue;
    }

    // Paragraph lines
    elements.push(
      <Typography key={`p-${i}`} variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.7, minHeight: trimmed === '' ? '12px' : 'auto', mb: 0.5, pl: paddingLeft }}>
        {replaceBold(line)}
      </Typography>
    );
    i++;
  }

  return elements;
};

interface TournamentFormViewProps {
  tournamentId: number | null;
  onBackClick: () => void;
  onSaveSuccess: () => void;
}

export const TournamentFormView: React.FC<TournamentFormViewProps> = ({
  tournamentId,
  onBackClick,
  onSaveSuccess
}) => {
  const isEdit = tournamentId !== null;

  // Form states
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const descriptionRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Table Builder State
  const [tableBuilderOpen, setTableBuilderOpen] = useState(false);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['Category', 'Playing', 'Reserve'],
    ["Men's", '5', '1'],
    ['Veteran (40+)', '3', '1'],
    ['Boys (U-19)', '2', '1']
  ]);

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const updated = tableRows.map((row, r) => 
      row.map((cell, c) => (r === rIdx && c === cIdx ? val : cell))
    );
    setTableRows(updated);
  };

  const handleAddRow = () => {
    const colCount = tableRows[0]?.length || 3;
    setTableRows([...tableRows, Array(colCount).fill('')]);
  };

  const handleRemoveRow = (rIdx: number) => {
    if (tableRows.length <= 2) return;
    setTableRows(tableRows.filter((_, idx) => idx !== rIdx));
  };

  const handleAddColumn = () => {
    setTableRows(tableRows.map(row => [...row, '']));
  };

  const handleRemoveColumn = (cIdx: number) => {
    if (tableRows[0].length <= 1) return;
    setTableRows(tableRows.map(row => row.filter((_, idx) => idx !== cIdx)));
  };

  const generateMarkdownTable = () => {
    if (tableRows.length === 0) return '';
    const headerRow = `| ${tableRows[0].join(' | ')} |`;
    const separatorRow = `| ${tableRows[0].map(() => '---').join(' | ')} |`;
    const dataRows = tableRows.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n');
    return `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;
  };

  const handleInsertTableSubmit = () => {
    const generatedMarkdown = generateMarkdownTable();
    handleInsertMarkup(generatedMarkdown);
    setTableBuilderOpen(false);
  };

  // Dynamic events configurator
  const [events, setEvents] = useState<EventConfig[]>([
    { eventName: "Men's Singles", eventType: 'Singles', fixtureType: 'Knockout', scoringType: '21 Points - Best of 3' }
  ]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      fetchTournamentDetails();
    }
  }, [tournamentId]);

  const fetchTournamentDetails = async () => {
    setPageLoading(true);
    setErrorMessage(null);
    try {
      const tourRes = await api.get(`/tournaments/${tournamentId}`);
      const t = tourRes.data;
      setName(t.name);
      setVenue(t.venue);
      setStartDate(t.startDate);
      setEndDate(t.endDate);
      setEntryFee(t.entryFee);
      setOrganizerName(t.organizerName);
      setOrganizerContact(t.organizerContact);
      setDescription(t.description || '');
      if (t.logoPath) {
        setLogoPreviewUrl(`${ASSET_BASE_URL}/${t.logoPath}`);
      }

      const eventsRes = await api.get(`/tournaments/${tournamentId}/events`);
      setEvents(eventsRes.data);

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load tournament details.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEvents([...events, {
      eventName: '',
      eventType: 'Singles',
      fixtureType: 'Knockout',
      scoringType: '21 Points - Best of 3'
    }]);
  };

  const handleInsertMarkup = (markupType: string) => {
    const textarea = descriptionRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selection = text.substring(start, end);
      
      let insertedText = '';
      let cursorOffset = 0;
      
      if (markupType === 'bold') {
        insertedText = `**${selection}**`;
        cursorOffset = selection ? selection.length + 4 : 2;
      } else if (markupType === 'heading2') {
        insertedText = `## ${selection}`;
        cursorOffset = selection.length + 3;
      } else if (markupType === 'heading3') {
        insertedText = `### ${selection}`;
        cursorOffset = selection.length + 4;
      } else if (markupType === 'heading4') {
        insertedText = `#### ${selection}`;
        cursorOffset = selection.length + 5;
      } else if (markupType === 'bullet') {
        if (selection.includes('\n')) {
          insertedText = selection.split('\n').map(line => `- ${line}`).join('\n');
        } else {
          insertedText = `- ${selection}`;
        }
        cursorOffset = insertedText.length;
      } else if (markupType === 'sub-bullet') {
        if (selection.includes('\n')) {
          insertedText = selection.split('\n').map(line => `  - ${line}`).join('\n');
        } else {
          insertedText = `  - ${selection}`;
        }
        cursorOffset = insertedText.length;
      } else if (markupType === 'table') {
        insertedText = `\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |\n`;
        cursorOffset = insertedText.length;
      } else if (markupType === 'divider') {
        insertedText = `\n---\n`;
        cursorOffset = 5;
      } else {
        insertedText = markupType;
        cursorOffset = insertedText.length;
      }

      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + insertedText + after;
      setDescription(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }, 10);
    } else {
      setDescription(prev => prev + (
        markupType === 'bold' ? '****' :
        markupType === 'heading2' ? '## ' :
        markupType === 'heading3' ? '### ' :
        markupType === 'heading4' ? '#### ' :
        markupType === 'bullet' ? '- ' :
        markupType === 'sub-bullet' ? '  - ' :
        markupType === 'table' ? '\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |\n' :
        markupType === 'divider' ? '\n---\n' :
        markupType
      ));
    }
  };

  const handleRemoveEvent = (index: number) => {
    if (events.length <= 1) {
      alert('Tournaments must have at least 1 event configured.');
      return;
    }
    const newEvents = [...events];
    newEvents.splice(index, 1);
    setEvents(newEvents);
  };

  const handleEventFieldChange = (index: number, field: keyof EventConfig, value: any) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value } as EventConfig;
    setEvents(newEvents);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validation
    const invalidEvents = events.filter(ev => ev.eventName.trim() === '');
    if (invalidEvents.length > 0) {
      setErrorMessage('All events must have a name configured.');
      setLoading(false);
      return;
    }

    const payload = {
      name,
      venue,
      startDate,
      endDate,
      entryFee,
      organizerName,
      organizerContact,
      description: description || null
    };

    try {
      let savedTourId = tournamentId;
      if (isEdit) {
        await api.put(`/tournaments/${tournamentId}`, payload);
      } else {
        const createRes = await api.post('/tournaments', payload);
        savedTourId = createRes.data.id;
      }

      // Upload logo if selected
      if (logoFile && savedTourId) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        const logoRes = await api.post(`/tournaments/${savedTourId}/logo`, logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update logo path
        await api.put(`/tournaments/${savedTourId}`, {
          ...payload,
          logoPath: logoRes.data
        });
      }

      // Configure event categories
      if (savedTourId) {
        for (const ev of events) {
          if (!ev.id) { // Create new events only
            const evPayload = {
              eventName: ev.eventName,
              eventType: ev.eventType,
              fixtureType: ev.fixtureType,
              scoringType: ev.scoringType,
              pointsPerSet: ev.scoringType === 'Custom' ? ev.pointsPerSet : null,
              numberOfSets: ev.scoringType === 'Custom' ? ev.numberOfSets : null
            };
            await api.post(`/tournaments/${savedTourId}/events`, evPayload);
          }
        }
      }

      alert(isEdit ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      onSaveSuccess();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Failed to save tournament configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBackClick} color="inherit">
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h3" color="primary">
          {isEdit ? 'Edit Tournament Settings' : 'Create New Tournament'}
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ border: '1px solid rgba(255, 0, 60, 0.2)' }}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Grid container spacing={4}>
          
          {/* LEFT COLUMN: Tournament Details */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h5" color="secondary">General Details</Typography>

                {/* Logo Upload */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 1 }}>
                  {logoPreviewUrl ? (
                    <Box
                      component="img"
                      src={logoPreviewUrl}
                      sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <Box sx={{ width: 80, height: 80, borderRadius: 2, border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} color="#94a3b8" />
                    </Box>
                  )}
                  <Box>
                    <Button variant="outlined" component="label" size="small" startIcon={<Upload size={14} />}>
                      Select Logo
                      <input type="file" hidden accept="image/*" onChange={handleLogoFileChange} />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                      PNG, JPG up to 10MB
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="Tournament Name"
                  required
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <TextField
                  label="Venue (Location)"
                  required
                  fullWidth
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      required
                      fullWidth
                      slotProps={{
                        inputLabel: { shrink: true }
                      }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="End Date"
                      type="date"
                      required
                      fullWidth
                      slotProps={{
                        inputLabel: { shrink: true }
                      }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Entry Fee Per Team (₹)"
                  type="number"
                  required
                  fullWidth
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                />

                <TextField
                  label="Organizer Contact Name"
                  required
                  fullWidth
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                />

                <TextField
                  label="Organizer Contact Number"
                  required
                  fullWidth
                  value={organizerContact}
                  onChange={(e) => setOrganizerContact(e.target.value)}
                />

                {/* Formatting & Emoji Toolbar */}
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      QUICK FORMATTING & EMOJIS
                    </Typography>
                    <Button
                      size="small"
                      color="secondary"
                      variant="text"
                      startIcon={<Maximize2 size={12} />}
                      onClick={() => setFocusModeOpen(true)}
                      sx={{ fontSize: '0.7rem', py: 0, minWidth: 0, textTransform: 'none' }}
                    >
                      Focus Mode Editor
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.8, mb: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('heading2')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      H2
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('heading3')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      H3
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('heading4')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      H4
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('bold')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      Bold
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('bullet')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      Bullet
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('sub-bullet')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      Sub-bullet
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => setTableBuilderOpen(true)} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      Table
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleInsertMarkup('divider')} sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}>
                      Divider
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.6, mb: 2, flexWrap: 'wrap', p: 0.8, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.04)' }}>
                    {['🏆', '🏸', '📅', '📍', '💰', '📢', '🕒', '📝', '💥', '🥪', '🧃', '🍎', '❌', '⛔️', '📞', '🔥', '🥇', '👑'].map((emoji) => (
                      <Button
                        key={emoji}
                        size="small"
                        onClick={() => handleInsertMarkup(emoji)}
                        sx={{
                          minWidth: '28px',
                          width: '28px',
                          height: '28px',
                          p: 0,
                          fontSize: '1rem',
                          borderRadius: 1,
                          color: '#ffffff',
                          '&:hover': { bgcolor: 'rgba(22, 224, 255, 0.1)' }
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <TextField
                  inputRef={descriptionRef}
                  label="Tournament Guidelines, Rules & Schedule"
                  fullWidth
                  multiline
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  helperText="Provide information regarding match timings, reporting rules, cash prizes, gear guidelines, or sponsor details."
                />
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT COLUMN: Events config */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" color="secondary">Configure Categories (Events)</Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddEvent}
                    size="small"
                  >
                    Add Category
                  </Button>
                </Box>
                
                <Divider />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '550px', overflowY: 'auto', pr: 1, py: 1 }}>
                  {events.map((ev, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative'
                      }}
                    >
                      {events.length > 1 && !ev.id && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveEvent(index)}
                          sx={{ position: 'absolute', top: 12, right: 12 }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Category (Event Name)"
                            required
                            fullWidth
                            disabled={!!ev.id}
                            value={ev.eventName}
                            onChange={(e) => handleEventFieldChange(index, 'eventName', e.target.value)}
                            placeholder="e.g. Under-13 Girls Singles, Men's Doubles"
                            size="small"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Event Type</InputLabel>
                            <Select
                              value={ev.eventType}
                              label="Event Type"
                              disabled={!!ev.id}
                              onChange={(e) => handleEventFieldChange(index, 'eventType', e.target.value)}
                            >
                              <MenuItem value="Singles">Singles Draw</MenuItem>
                              <MenuItem value="Doubles">Doubles Draw</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Fixture Type</InputLabel>
                            <Select
                              value={ev.fixtureType}
                              label="Fixture Type"
                              disabled={!!ev.id}
                              onChange={(e) => handleEventFieldChange(index, 'fixtureType', e.target.value)}
                            >
                              <MenuItem value="Knockout">Knockout Bracket</MenuItem>
                              <MenuItem value="League">Round Robin League</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Scoring Configuration</InputLabel>
                            <Select
                              value={ev.scoringType}
                              label="Scoring Configuration"
                              disabled={!!ev.id}
                              onChange={(e) => handleEventFieldChange(index, 'scoringType', e.target.value)}
                            >
                              <MenuItem value="21 Points - Best of 3">21 Points - Best of 3</MenuItem>
                              <MenuItem value="15 Points - Best of 3">15 Points - Best of 3</MenuItem>
                              <MenuItem value="30 Points - Single Set">30 Points - Single Set</MenuItem>
                              <MenuItem value="Custom">Custom Configuration</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {ev.scoringType === 'Custom' && (
                          <Grid size={{ xs: 12 }} container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <TextField
                                label="Points Per Set"
                                type="number"
                                required
                                fullWidth
                                disabled={!!ev.id}
                                value={ev.pointsPerSet || ''}
                                onChange={(e) => handleEventFieldChange(index, 'pointsPerSet', Number(e.target.value))}
                                size="small"
                              />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <TextField
                                label="Number of Sets"
                                type="number"
                                required
                                fullWidth
                                disabled={!!ev.id}
                                value={ev.numberOfSets || ''}
                                onChange={(e) => handleEventFieldChange(index, 'numberOfSets', Number(e.target.value))}
                                size="small"
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Row */}
          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" color="inherit" onClick={onBackClick}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Save size={18} />}
            >
              {isEdit ? 'Save Tournament' : 'Create Tournament'}
            </Button>
          </Grid>
        </Grid>
      </form>
      {/* Focus Mode Overlay Dialog */}
      <Dialog
        open={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            bgcolor: '#0a0f1d',
            border: '1px solid rgba(22, 224, 255, 0.1)',
            backgroundImage: 'none',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 800, fontSize: '1.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <span style={{ color: '#16E0FF' }}>🏆</span>
            RULES & GUIDELINES FOCUS EDITOR
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Quick Formatting toolbar inside Dialog header */}
            <Box sx={{ display: 'flex', gap: 0.6 }}>
              {['heading2', 'heading3', 'heading4', 'bold', 'bullet', 'sub-bullet', 'table', 'divider'].map((type) => (
                <Button
                  key={type}
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => type === 'table' ? setTableBuilderOpen(true) : handleInsertMarkup(type)}
                  sx={{ fontSize: '0.7rem', py: 0.3, px: 1, textTransform: 'none', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  {type === 'heading2' ? 'H2' : type === 'heading3' ? 'H3' : type === 'heading4' ? 'H4' : type === 'sub-bullet' ? 'Sub-bullet' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 1 }} />
            {/* Emojis selection inside dialog header */}
            <Box sx={{ display: 'flex', gap: 0.4 }}>
              {['🏆', '🏸', '📅', '📍', '💰', '📢', '🕒', '📝', '💥', '🥪', '🧃', '🍎', '❌', '⛔️', '📞'].map((emoji) => (
                <Button
                  key={emoji}
                  size="small"
                  onClick={() => handleInsertMarkup(emoji)}
                  sx={{ minWidth: 26, width: 26, height: 26, p: 0, fontSize: '0.9rem', borderRadius: 1 }}
                >
                  {emoji}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
          <Grid container spacing={3} sx={{ height: '100%', flexGrow: 1 }}>
            {/* Monospace Text Area Editor */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TextField
                inputRef={descriptionRef}
                fullWidth
                multiline
                placeholder="Write your tournament rules, guidelines, match timings, dress codes here using the toolbar helpers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                slotProps={{
                  input: {
                    style: {
                      fontFamily: '"Fira Code", "Courier New", monospace',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      height: '100%',
                      alignItems: 'flex-start'
                    }
                  }
                }}
                sx={{
                  flexGrow: 1,
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    p: 2,
                    alignItems: 'stretch',
                    bgcolor: 'rgba(0,0,0,0.2)'
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflowY: 'auto !important'
                  }
                }}
              />
            </Grid>

            {/* Live Rendered Markdown Preview */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  flexGrow: 1,
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  overflowY: 'auto',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2
                }}
              >
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  📺 Real-time Live Preview
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
                {description ? (
                  parseMarkdownToJSX(description)
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Type in the editor pane to preview the formatted rules.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setFocusModeOpen(false)} variant="contained" color="primary" sx={{ fontWeight: 'bold', px: 4 }}>
            Apply & Close Editor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table Builder Dialog */}
      <Dialog
        open={tableBuilderOpen}
        onClose={() => setTableBuilderOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#0a0f1d',
            border: '1px solid rgba(22, 224, 255, 0.15)',
            backgroundImage: 'none',
            color: '#ffffff',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: '"Rajdhani", sans-serif' }}>
            Interactive Table Builder
          </Typography>
          <IconButton onClick={() => setTableBuilderOpen(false)} sx={{ color: 'text.secondary' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify headers and cell values in the grid below. You can add or remove rows and columns.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" color="primary" onClick={handleAddRow} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
              + Add Row
            </Button>
            <Button size="small" variant="outlined" color="primary" onClick={handleAddColumn} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
              + Add Column
            </Button>
          </Box>

          <Box sx={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2, p: 2, bgcolor: 'rgba(255,255,255,0.01)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {tableRows[0].map((_, cIdx) => (
                    <TableCell key={cIdx} align="center" sx={{ borderBottom: '2px solid rgba(22,224,255,0.2)', py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>Col #{cIdx + 1}</Typography>
                        {tableRows[0].length > 1 && (
                          <IconButton size="small" color="error" onClick={() => handleRemoveColumn(cIdx)} sx={{ p: 0.2 }}>
                            <Trash2 size={12} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell sx={{ borderBottom: '2px solid rgba(22,224,255,0.2)', width: '40px' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row, rIdx) => (
                  <TableRow key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <TableCell key={cIdx} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={cell}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          placeholder={rIdx === 0 ? `Header ${cIdx + 1}` : `Cell ${rIdx}, ${cIdx + 1}`}
                          slotProps={{
                            input: {
                              style: {
                                fontFamily: rIdx === 0 ? '"Rajdhani", sans-serif' : 'inherit',
                                fontWeight: rIdx === 0 ? 700 : 'normal',
                                color: rIdx === 0 ? '#16E0FF' : '#ffffff',
                                fontSize: '0.88rem'
                              }
                            }
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', align: 'center', py: 1 }}>
                      {tableRows.length > 2 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveRow(rIdx)}>
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setTableBuilderOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleInsertTableSubmit} variant="contained" color="secondary">
            Insert Table
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
