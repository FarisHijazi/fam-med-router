import { useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BusinessIcon from '@mui/icons-material/Business';
import CodeIcon from '@mui/icons-material/Code';
import PathwayEditor from './components/PathwayEditor';
import ClustersEditor from './components/ClustersEditor';
import JSONEditor from './components/JSONEditor';
import { useStore } from './store';

// Import data
import clustersData from '../../data/clusters.json';
import pathwaysData from '../../data/pathways.json';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  const { selectedTab, setSelectedTab, setClusters, setPathways, syncFlowFromPathway } = useStore();

  useEffect(() => {
    // Load initial data
    setClusters(clustersData as any);
    setPathways(pathwaysData as any);
    syncFlowFromPathway('adult_obesity');
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue as 'pathway' | 'clusters' | 'json');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Medical Referral Router - No-Code Builder
            </Typography>
          </Toolbar>
          <Box sx={{ bgcolor: 'white' }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ px: 2 }}
            >
              <Tab
                icon={<AccountTreeIcon />}
                iconPosition="start"
                label="Pathway Editor"
                value="pathway"
              />
              <Tab
                icon={<BusinessIcon />}
                iconPosition="start"
                label="Health System"
                value="clusters"
              />
              <Tab
                icon={<CodeIcon />}
                iconPosition="start"
                label="JSON Editor"
                value="json"
              />
            </Tabs>
          </Box>
        </AppBar>

        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5' }}>
          {selectedTab === 'pathway' && <PathwayEditor />}
          {selectedTab === 'clusters' && <ClustersEditor />}
          {selectedTab === 'json' && <JSONEditor />}
        </Box>

        <Box
          component="footer"
          sx={{ py: 1, textAlign: 'center', bgcolor: 'white', borderTop: '1px solid #eee' }}
        >
          <Typography variant="caption" color="text.secondary">
            Medical Referral Router v0.2 | Eastern Health Cluster | Two-way JSON Sync Enabled
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
