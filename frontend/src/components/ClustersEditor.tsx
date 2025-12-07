import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useStore } from '../store';
import type { Clinic } from '../store';

const statusColors: Record<string, string> = {
  open: '#4caf50',
  closed: '#f44336',
  limited: '#ff9800',
};

const layerColors: Record<string, string> = {
  phc: '#1976d2',
  mega: '#f57c00',
  hospital: '#c62828',
};

export default function ClustersEditor() {
  const { clusters, updateClinic, addClinic, deleteClinic } = useStore();

  const [editClinicOpen, setEditClinicOpen] = useState(false);
  const [addClinicOpen, setAddClinicOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    clusterId: string;
    networkId: string;
    centerId: string;
    clinicId?: string;
  } | null>(null);
  const [clinicForm, setClinicForm] = useState<Partial<Clinic>>({});

  const handleEditClinic = (
    clusterId: string,
    networkId: string,
    centerId: string,
    clinic: Clinic
  ) => {
    setSelectedContext({ clusterId, networkId, centerId, clinicId: clinic.id });
    setClinicForm({ ...clinic });
    setEditClinicOpen(true);
  };

  const handleAddClinic = (clusterId: string, networkId: string, centerId: string) => {
    setSelectedContext({ clusterId, networkId, centerId });
    setClinicForm({
      id: `clinic_${Date.now()}`,
      name: '',
      specialty: '',
      status: 'open',
      constraints: { age_min: 0, age_max: 120, gender: 'all' },
    });
    setAddClinicOpen(true);
  };

  const handleSaveClinic = () => {
    if (selectedContext && clinicForm.id) {
      updateClinic(
        selectedContext.clusterId,
        selectedContext.networkId,
        selectedContext.centerId,
        selectedContext.clinicId!,
        clinicForm
      );
    }
    setEditClinicOpen(false);
  };

  const handleCreateClinic = () => {
    if (selectedContext && clinicForm.id) {
      addClinic(
        selectedContext.clusterId,
        selectedContext.networkId,
        selectedContext.centerId,
        clinicForm as Clinic
      );
    }
    setAddClinicOpen(false);
  };

  const handleDeleteClinic = (
    clusterId: string,
    networkId: string,
    centerId: string,
    clinicId: string
  ) => {
    if (confirm('Delete this clinic?')) {
      deleteClinic(clusterId, networkId, centerId, clinicId);
    }
  };

  const ClinicFormDialog = ({
    open,
    onClose,
    onSave,
    title,
  }: {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    title: string;
  }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Clinic ID"
            value={clinicForm.id || ''}
            onChange={(e) => setClinicForm({ ...clinicForm, id: e.target.value })}
            fullWidth
            disabled={!!selectedContext?.clinicId}
          />
          <TextField
            label="Name"
            value={clinicForm.name || ''}
            onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Specialty"
            value={clinicForm.specialty || ''}
            onChange={(e) => setClinicForm({ ...clinicForm, specialty: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={clinicForm.status || 'open'}
              label="Status"
              onChange={(e) => setClinicForm({ ...clinicForm, status: e.target.value as any })}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="limited">Limited</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="subtitle2">Constraints</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Min Age"
              type="number"
              value={clinicForm.constraints?.age_min || 0}
              onChange={(e) =>
                setClinicForm({
                  ...clinicForm,
                  constraints: {
                    ...clinicForm.constraints!,
                    age_min: parseInt(e.target.value),
                  },
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="Max Age"
              type="number"
              value={clinicForm.constraints?.age_max || 120}
              onChange={(e) =>
                setClinicForm({
                  ...clinicForm,
                  constraints: {
                    ...clinicForm.constraints!,
                    age_max: parseInt(e.target.value),
                  },
                })
              }
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={clinicForm.constraints?.gender || 'all'}
                label="Gender"
                onChange={(e) =>
                  setClinicForm({
                    ...clinicForm,
                    constraints: {
                      ...clinicForm.constraints!,
                      gender: e.target.value as any,
                    },
                  })
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="male">Male Only</MenuItem>
                <MenuItem value="female">Female Only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Health System Structure
      </Typography>

      {clusters.clusters.map((cluster) => (
        <Accordion key={cluster.id} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {cluster.name} <Typography component="span" color="text.secondary">({cluster.name_ar})</Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {cluster.networks.map((network) => (
              <Accordion key={network.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {network.name} <Typography component="span" color="text.secondary">({network.name_ar})</Typography>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {network.centers.map((center) => (
                      <Box key={center.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                        <Card elevation={2}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {center.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" dir="rtl">
                                  {center.name_ar}
                                </Typography>
                              </Box>
                              <Chip
                                label={`Layer ${center.layer}`}
                                size="small"
                                sx={{ bgcolor: layerColors[center.type], color: 'white' }}
                              />
                            </Box>
                            <Typography variant="caption" display="block" mb={2}>
                              {center.location.district}, {center.location.city}
                            </Typography>

                            <Typography variant="subtitle2" gutterBottom>
                              Clinics ({center.clinics.length})
                            </Typography>
                            {center.clinics.map((clinic) => (
                              <Box
                                key={clinic.id}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 1,
                                  mb: 0.5,
                                  bgcolor: '#f5f5f5',
                                  borderRadius: 1,
                                  borderLeft: `3px solid ${statusColors[clinic.status]}`,
                                }}
                              >
                                <Box>
                                  <Typography variant="body2">{clinic.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {clinic.specialty} | Age: {clinic.constraints.age_min}-{clinic.constraints.age_max}
                                  </Typography>
                                </Box>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditClinic(cluster.id, network.id, center.id, clinic)
                                    }
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDeleteClinic(cluster.id, network.id, center.id, clinic.id)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddClinic(cluster.id, network.id, center.id)}
                            >
                              Add Clinic
                            </Button>
                          </CardActions>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <ClinicFormDialog
        open={editClinicOpen}
        onClose={() => setEditClinicOpen(false)}
        onSave={handleSaveClinic}
        title="Edit Clinic"
      />
      <ClinicFormDialog
        open={addClinicOpen}
        onClose={() => setAddClinicOpen(false)}
        onSave={handleCreateClinic}
        title="Add New Clinic"
      />
    </Box>
  );
}
