import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Divider,
  IconButton, Alert, CircularProgress, Grid, Paper, FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { ArrowLeft, Save, Plus, Trash2, Upload, AlertCircle, Maximize2, X } from 'lucide-react';
import { api, ASSET_BASE_URL } from '../api';

interface TeamConfig {
  id?: number;
  teamName: string;
  logoPath: string | null;
  purseAmount: number;
  minimumPlayers: number;
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
    if (trimmed.includes('|') && i + 1 < rawLines.length && rawLines[i + 1].trim().includes('|') && /^[\s-:|]+$/.test(rawLines[i + 1].trim().replace(/[a-zA-Z0-9]/g, ''))) {
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

interface AuctionFormViewProps {
  auctionId: number | null; // Null means creating
  onBackClick: () => void;
  onSaveSuccess: () => void;
}

export const AuctionFormView: React.FC<AuctionFormViewProps> = ({
  auctionId,
  onBackClick,
  onSaveSuccess
}) => {
  const isEdit = auctionId !== null;

  // Form states
  const [auctionName, setAuctionName] = useState('');
  const [events, setEvents] = useState<string[]>(['']);
  const [auctionDate, setAuctionDate] = useState('');
  const [description, setDescription] = useState('');
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
  const [minimumBid, setMinimumBid] = useState<number>(1000);
  const [bidIncrement, setBidIncrement] = useState<number>(500);
  const [maximumBid, setMaximumBid] = useState<number | ''>('');
  const [rosterRules, setRosterRules] = useState<{ category: string; minCount: number; maxCount: number; maxRetentionLimit: number }[]>([]);
  const [allowRetention, setAllowRetention] = useState(false);
  const [maxRetainedPlayers, setMaxRetainedPlayers] = useState<number>(0);
  const [retentionPrice, setRetentionPrice] = useState<number>(0);

  const [teams, setTeams] = useState<TeamConfig[]>([
    { teamName: 'Team A', logoPath: null, purseAmount: 100000, minimumPlayers: 8 },
    { teamName: 'Team B', logoPath: null, purseAmount: 100000, minimumPlayers: 8 }
  ]);

  // Common franchise settings
  const [commonPurse, setCommonPurse] = useState<number>(100000);

  const handleCommonPurseChange = (val: number) => {
    setCommonPurse(val);
    setTeams(prev => prev.map(t => ({ ...t, purseAmount: val })));
  };

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbEvents, setDbEvents] = useState<string[]>([]);
  const [dbRosterCategories, setDbRosterCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const eventsRes = await api.get('/options/events');
        setDbEvents(eventsRes.data || []);
      } catch (err) {
        console.error('Failed to load event options:', err);
      }
      try {
        const rulesRes = await api.get('/options/roster-categories');
        setDbRosterCategories(rulesRes.data || []);
      } catch (err) {
        console.error('Failed to load roster categories:', err);
      }
    };
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    if (isEdit) {
      fetchAuctionDetails();
    }
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    setPageLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get(`/auctions/${auctionId}`);
      const data = response.data;
      setAuctionName(data.auctionName);
      setEvents(data.events && data.events.length > 0 ? data.events : ['']);
      setAuctionDate(data.auctionDate || '');
      setDescription(data.description || '');
      setMinimumBid(data.minimumBid);
      setBidIncrement(data.bidIncrement);
      setMaximumBid(data.maximumBid || '');
      setRosterRules(data.rosterRules?.map((r: any) => ({
        category: r.category,
        minCount: r.minCount,
        maxCount: r.maxCount ?? 99,
        maxRetentionLimit: r.maxRetentionLimit || 0
      })) || []);
      setAllowRetention(data.allowRetention || false);
      setMaxRetainedPlayers(data.maxRetainedPlayers || 0);
      setRetentionPrice(data.retentionPrice || 0);

      if (data.teams && data.teams.length > 0) {
        setCommonPurse(data.teams[0].purseAmount);

        const formattedTeams = data.teams.map((t: any) => ({
          ...t
        }));
        setTeams(formattedTeams);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to load auction configuration details.');
    } finally {
      setPageLoading(false);
    }
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

  const handleAddTeam = () => {
    setTeams([...teams, {
      teamName: `Team ${String.fromCharCode(65 + teams.length)}`,
      logoPath: null,
      purseAmount: commonPurse,
      minimumPlayers: 8
    }]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) {
      alert('Auctions must have at least 2 teams.');
      return;
    }
    const newTeams = [...teams];
    newTeams.splice(index, 1);
    setTeams(newTeams);
  };

  const handleTeamChange = (index: number, field: keyof TeamConfig, value: any) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], [field]: value };
    setTeams(newTeams);
  };

  const handleLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logos');

      try {
        const response = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        handleTeamChange(index, 'logoPath', response.data.path);
      } catch (err: any) {
        alert('Logo upload failed.');
      }
    }
  };

  const handleAddEvent = () => {
    setEvents([...events, '']);
  };

  const handleRemoveEvent = (index: number) => {
    if (events.length <= 1) return;
    const newEvents = [...events];
    newEvents.splice(index, 1);
    setEvents(newEvents);
  };

  const handleEventChange = (index: number, val: string) => {
    const newEvents = [...events];
    newEvents[index] = val;
    setEvents(newEvents);
  };

  const handleAddRosterRule = () => {
    setRosterRules([...rosterRules, { category: '', minCount: 1, maxCount: 99, maxRetentionLimit: 0 }]);
  };

  const handleRemoveRosterRule = (index: number) => {
    const newRules = [...rosterRules];
    newRules.splice(index, 1);
    setRosterRules(newRules);
  };

  const handleRosterRuleChange = (index: number, field: 'category' | 'minCount' | 'maxCount' | 'maxRetentionLimit', value: any) => {
    const newRules = [...rosterRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRosterRules(newRules);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validate unique team names client-side
    const names = teams.map(t => t.teamName.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      setErrorMessage('Team names should be unique within an auction.');
      setLoading(false);
      return;
    }

    const validEvents = events.filter(ev => ev.trim() !== '');
    if (validEvents.length === 0) {
      setErrorMessage('At least one auction event category is required.');
      setLoading(false);
      return;
    }

    const payload = {
      auctionName,
      eventName: auctionName,
      category: validEvents[0],
      events: validEvents,
      rosterRules: rosterRules.filter(r => r.category.trim() !== ''),
      allowRetention,
      maxRetainedPlayers: allowRetention ? maxRetainedPlayers : 0,
      retentionPrice: allowRetention ? retentionPrice : 0,
      auctionDate: auctionDate || null,
      description: description || null,
      minimumBid,
      bidIncrement,
      maximumBid: maximumBid === '' ? null : maximumBid,
      teams: teams.map(t => ({
        ...t
      }))
    };

    try {
      if (isEdit) {
        await api.put(`/auctions/${auctionId}`, payload);
      } else {
        await api.post('/auctions', payload);
      }
      onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.details) {
        // Validation messages
        const details = err.response.data.details;
        const msg = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ');
        setErrorMessage(`Validation error: ${msg}`);
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to save auction configuration settings.');
      }
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
          {isEdit ? 'Configure Auction' : 'Create New Auction'}
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ border: '1px solid rgba(255, 0, 60, 0.2)' }}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Grid container spacing={4}>
          {/* Settings Left Column */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Details Card */}
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h5" color="secondary">Auction Information</Typography>

                <TextField
                  label="Auction Name"
                  required
                  fullWidth
                  variant="outlined"
                  value={auctionName}
                  onChange={(e) => setAuctionName(e.target.value)}
                />


                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Auction Events (Categories)</Typography>
                  {events.map((evt, idx) => {
                    const fallbackEvents = [
                      "Men Doubles",
                      "Reverse Men Doubles",
                      "Veteran Doubles",
                      "Jumbled Doubles",
                      "Mixed Doubles",
                      "Under 17 Boys Singles",
                      "Under 17 Boys Doubles",
                      "Under 19 Singles Singles",
                      "Under 19 Boys Doubles",
                      "Women Doubles"
                    ];
                    const eventsList = [...dbEvents.length > 0 ? dbEvents : fallbackEvents];
                    if (evt && !eventsList.includes(evt)) {
                      eventsList.push(evt);
                    }
                    return (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel id={`event-select-label-${idx}`}>Event Category #{idx + 1}</InputLabel>
                          <Select
                            labelId={`event-select-label-${idx}`}
                            value={evt}
                            label={`Event Category #${idx + 1}`}
                            onChange={(e) => handleEventChange(idx, e.target.value)}
                          >
                            {eventsList.map((dbEvt) => (
                              <MenuItem key={dbEvt} value={dbEvt}>
                                {dbEvt}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {events.length > 1 && (
                          <IconButton color="error" size="small" onClick={() => handleRemoveEvent(idx)}>
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                    );
                  })}
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddEvent}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add Event
                  </Button>
                </Box>

                <TextField
                  label="Auction Date"
                  type="date"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                  value={auctionDate}
                  onChange={(e) => setAuctionDate(e.target.value)}
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
                  label="Auction Rules, Guidelines & Information"
                  fullWidth
                  multiline
                  rows={5}
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Rules Card */}
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h5" color="secondary">Auction Rules</Typography>

                <TextField
                  label="Minimum Bid (Base Price)"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={minimumBid}
                  onChange={(e) => setMinimumBid(Number(e.target.value))}
                />

                <TextField
                  label="Bid Increment Amount"
                  type="number"
                  required
                  fullWidth
                  variant="outlined"
                  value={bidIncrement}
                  onChange={(e) => setBidIncrement(Number(e.target.value))}
                />

                <TextField
                  label="Maximum Bid (Optional)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={maximumBid}
                  onChange={(e) => setMaximumBid(e.target.value === '' ? '' : Number(e.target.value))}
                />

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: -0.5 }}>Player Retention</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allowRetention}
                      onChange={(e) => setAllowRetention(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Allow Teams to Retain Players"
                />

                {allowRetention && (
                  <>
                    <TextField
                      label="Maximum Retained Players per Team"
                      type="number"
                      required
                      fullWidth
                      variant="outlined"
                      value={maxRetainedPlayers}
                      onChange={(e) => setMaxRetainedPlayers(Number(e.target.value))}
                      helperText="Total limit of retained players each team can have"
                    />
                    <TextField
                      label="Retention Player Price"
                      type="number"
                      required
                      fullWidth
                      variant="outlined"
                      value={retentionPrice}
                      onChange={(e) => setRetentionPrice(Number(e.target.value))}
                      helperText="Price at which teams can retain their players"
                    />
                  </>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Roster Category Constraints</Typography>
                  {rosterRules.map((rule, idx) => {
                    const fallbackRosterCats = [
                      "Men",
                      "Women",
                      "Veteran",
                      "45+",
                      "35+",
                      "U-17 Boys",
                      "U-19 Boys",
                      "U-19 Girls",
                      "U-17 Girls"
                    ];
                    const categoriesList = [...dbRosterCategories.length > 0 ? dbRosterCategories : fallbackRosterCats];
                    if (rule.category && !categoriesList.includes(rule.category)) {
                      categoriesList.push(rule.category);
                    }
                    return (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl size="small" required sx={{ flexGrow: 2, minWidth: '150px' }}>
                          <InputLabel id={`roster-cat-label-${idx}`}>Category</InputLabel>
                          <Select
                            labelId={`roster-cat-label-${idx}`}
                            value={rule.category}
                            label="Category"
                            onChange={(e) => handleRosterRuleChange(idx, 'category', e.target.value)}
                          >
                            {categoriesList.map((cat) => (
                              <MenuItem key={cat} value={cat}>
                                {cat}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Min Count"
                          type="number"
                          required
                          variant="outlined"
                          value={rule.minCount}
                          onChange={(e) => handleRosterRuleChange(idx, 'minCount', Number(e.target.value))}
                          size="small"
                          sx={{ width: '90px' }}
                        />
                        <TextField
                          label="Max Count"
                          type="number"
                          required
                          variant="outlined"
                          value={rule.maxCount}
                          onChange={(e) => handleRosterRuleChange(idx, 'maxCount', Number(e.target.value))}
                          size="small"
                          sx={{ width: '90px' }}
                        />
                        {allowRetention && (
                          <TextField
                            label="Max Retain"
                            type="number"
                            variant="outlined"
                            value={rule.maxRetentionLimit || 0}
                            onChange={(e) => handleRosterRuleChange(idx, 'maxRetentionLimit', Number(e.target.value))}
                            size="small"
                            sx={{ width: '100px' }}
                          />
                        )}
                        <IconButton color="error" size="small" onClick={() => handleRemoveRosterRule(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    );
                  })}
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddRosterRule}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add Constraint
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Teams Config Column */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" color="secondary">Participating Teams</Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddTeam}
                    size="small"
                  >
                    Add Team
                  </Button>
                </Box>

                <Divider />

                {/* Common Team Settings Panel */}
                <Paper variant="outlined" sx={{ p: 2, mb: 1.5, mt: 1, bgcolor: 'rgba(22, 224, 255, 0.02)', borderColor: 'rgba(22, 224, 255, 0.15)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ width: '100%', fontWeight: 700, color: 'primary.main', mb: -0.5 }}>
                    Common Team Settings (Applies to all franchises)
                  </Typography>
                  <TextField
                    label="Purse Amount"
                    type="number"
                    size="small"
                    value={commonPurse}
                    onChange={(e) => handleCommonPurseChange(Number(e.target.value))}
                    sx={{ flex: 1, minWidth: '140px' }}
                  />
                </Paper>

                <Grid container spacing={2} sx={{ maxHeight: '420px', overflowY: 'auto', pr: 1, py: 1 }}>
                  {teams.map((team, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          position: 'relative',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5
                        }}
                      >
                        {teams.length > 2 && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveTeam(index)}
                            sx={{ position: 'absolute', top: 12, right: 12 }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}

                        <Typography variant="h6" color="primary" sx={{ mb: 0.5, fontWeight: 700, fontFamily: '"Rajdhani", sans-serif' }}>
                          Team #{index + 1}
                        </Typography>

                        <TextField
                          label="Team Name"
                          required
                          fullWidth
                          size="small"
                          value={team.teamName}
                          onChange={(e) => handleTeamChange(index, 'teamName', e.target.value)}
                        />

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                          {team.logoPath ? (
                            <Box
                              component="img"
                              src={`${ASSET_BASE_URL}/${team.logoPath}`}
                              alt="logo"
                              sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            />
                          ) : (
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Logo</Typography>
                            </Box>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<Upload size={12} />}
                            sx={{ py: 0.5, fontSize: '0.72rem' }}
                          >
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => handleLogoUpload(index, e)}
                            />
                          </Button>
                        </Box>

                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={onBackClick} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
          >
            Save Configuration
          </Button>
        </Box>
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
                placeholder="Write your auction rules, guidelines, match timings, roster slots configuration here using the toolbar helpers..."
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

export default AuctionFormView;
