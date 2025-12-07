import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  Paper,
  Snackbar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useStore } from '../store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function JSONEditor() {
  const { clusters, pathways, importJSON, exportJSON } = useStore();
  const [tab, setTab] = useState(0);
  const [clustersJson, setClustersJson] = useState('');
  const [pathwaysJson, setPathwaysJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    setClustersJson(JSON.stringify(clusters, null, 2));
  }, [clusters]);

  useEffect(() => {
    setPathwaysJson(JSON.stringify(pathways, null, 2));
  }, [pathways]);

  const handleApplyClusters = () => {
    try {
      const parsed = JSON.parse(clustersJson);
      importJSON({ clusters: parsed });
      setError(null);
      setSnackbar('Clusters updated successfully!');
    } catch (e) {
      setError('Invalid JSON format for clusters');
    }
  };

  const handleApplyPathways = () => {
    try {
      const parsed = JSON.parse(pathwaysJson);
      importJSON({ pathways: parsed });
      setError(null);
      setSnackbar('Pathways updated successfully!');
    } catch (e) {
      setError('Invalid JSON format for pathways');
    }
  };

  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-referral-data.json';
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar('Data exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            importJSON(data);
            setSnackbar('Data imported successfully!');
          } catch (err) {
            setError('Failed to parse imported file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSnackbar('Copied to clipboard!');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">JSON Data Editor</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
            Import JSON
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export All
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Clusters (Health System)" />
          <Tab label="Pathways (Clinical Logic)" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(clustersJson)}
            >
              Copy
            </Button>
            <Button size="small" variant="contained" onClick={handleApplyClusters}>
              Apply Changes
            </Button>
          </Box>
          <TextField
            multiline
            fullWidth
            minRows={20}
            maxRows={30}
            value={clustersJson}
            onChange={(e) => setClustersJson(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Edit the health system hierarchy: clusters, networks, centers, and clinics
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(pathwaysJson)}
            >
              Copy
            </Button>
            <Button size="small" variant="contained" onClick={handleApplyPathways}>
              Apply Changes
            </Button>
          </Box>
          <TextField
            multiline
            fullWidth
            minRows={20}
            maxRows={30}
            value={pathwaysJson}
            onChange={(e) => setPathwaysJson(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Edit clinical pathways: nodes, conditions, specialties, and comorbidities
          </Typography>
        </TabPanel>
      </Paper>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Box>
  );
}
