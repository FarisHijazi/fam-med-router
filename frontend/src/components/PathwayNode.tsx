import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useStore } from '../store';
import type { PathwayNode as PathwayNodeType } from '../store';

const layerColors: Record<string, string> = {
  phc: '#1976d2',
  mega: '#f57c00',
  hospital: '#c62828',
};

const layerLabels: Record<string, string> = {
  phc: 'PHC',
  mega: 'Mega Center',
  hospital: 'Hospital',
};

const typeIcons: Record<string, string> = {
  assessment: '📋',
  decision: '🔀',
  treatment: '💊',
  referral: '🔗',
  evaluation: '📊',
  endpoint: '🏁',
};

interface PathwayNodeData extends PathwayNodeType {
  backgroundColor: string;
}

function PathwayNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as PathwayNodeData;
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<PathwayNodeType>>({});
  const { updatePathwayNode, deletePathwayNode, selectedPathway } = useStore();

  const handleEdit = () => {
    setEditData({ ...nodeData });
    setEditOpen(true);
  };

  const handleSave = () => {
    updatePathwayNode(selectedPathway, id, editData);
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      deletePathwayNode(selectedPathway, id);
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        sx={{
          backgroundColor: nodeData.backgroundColor,
          borderRadius: 2,
          padding: 2,
          minWidth: 220,
          maxWidth: 280,
          boxShadow: 2,
          border: '1px solid #ddd',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handleEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2">{typeIcons[nodeData.type]}</Typography>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
            {nodeData.name}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {nodeData.description}
        </Typography>

        <Chip
          label={layerLabels[nodeData.layer]}
          size="small"
          sx={{
            backgroundColor: layerColors[nodeData.layer],
            color: 'white',
            fontSize: '0.7rem',
          }}
        />

        {nodeData.conditions && nodeData.conditions.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Conditions: {nodeData.conditions.length}
            </Typography>
          </Box>
        )}

        {nodeData.target_specialty && (
          <Chip
            label={`→ ${nodeData.target_specialty}`}
            size="small"
            variant="outlined"
            sx={{ mt: 1, ml: 0.5 }}
          />
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Node: {nodeData.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editData.type || ''}
                label="Type"
                onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
              >
                <MenuItem value="assessment">Assessment</MenuItem>
                <MenuItem value="decision">Decision</MenuItem>
                <MenuItem value="treatment">Treatment</MenuItem>
                <MenuItem value="referral">Referral</MenuItem>
                <MenuItem value="evaluation">Evaluation</MenuItem>
                <MenuItem value="endpoint">Endpoint</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Layer</InputLabel>
              <Select
                value={editData.layer || ''}
                label="Layer"
                onChange={(e) => setEditData({ ...editData, layer: e.target.value as any })}
              >
                <MenuItem value="phc">PHC (Layer 1)</MenuItem>
                <MenuItem value="mega">Mega Center (Layer 2)</MenuItem>
                <MenuItem value="hospital">Hospital (Layer 3)</MenuItem>
              </Select>
            </FormControl>
            {editData.type === 'referral' && (
              <TextField
                label="Target Specialty"
                value={editData.target_specialty || ''}
                onChange={(e) => setEditData({ ...editData, target_specialty: e.target.value })}
                fullWidth
              />
            )}
            {editData.type === 'endpoint' && (
              <TextField
                label="Outcome"
                value={editData.outcome || ''}
                onChange={(e) => setEditData({ ...editData, outcome: e.target.value })}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default memo(PathwayNodeComponent);
