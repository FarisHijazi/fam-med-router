import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
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
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PathwayNodeComponent from './PathwayNode';
import { useStore } from '../store';
import type { PathwayNode } from '../store';

const nodeTypes = {
  pathwayNode: PathwayNodeComponent,
};

const nodeTypeColors: Record<string, string> = {
  assessment: '#e3f2fd',
  decision: '#fff3e0',
  treatment: '#e8f5e9',
  referral: '#fce4ec',
  evaluation: '#f3e5f5',
  endpoint: '#e0f2f1',
};

export default function PathwayEditor() {
  const {
    nodes,
    edges,
    setNodes,
    selectedPathway,
    pathways,
    addPathwayNode,
    updatePathwayConnection,
  } = useStore();

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
  const [, setLocalEdges, onEdgesChange] = useEdgesState(edges);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNode, setNewNode] = useState<Partial<PathwayNode>>({
    type: 'assessment',
    layer: 'phc',
    name: '',
    description: '',
  });

  // Sync local state with store
  useEffect(() => {
    setLocalNodes(nodes);
    setLocalEdges(edges);
  }, [nodes, edges, setLocalNodes, setLocalEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setLocalEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
      if (params.source && params.target) {
        updatePathwayConnection(selectedPathway, params.source, params.target);
      }
    },
    [selectedPathway, updatePathwayConnection]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: any) => {
      setNodes(
        localNodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
      );
    },
    [localNodes, setNodes]
  );

  const handleAddNode = () => {
    const id = `node_${Date.now()}`;
    const node: PathwayNode = {
      id,
      type: newNode.type as any,
      layer: newNode.layer as any,
      name: newNode.name || 'New Node',
      description: newNode.description || '',
    };
    addPathwayNode(selectedPathway, node);
    setAddNodeOpen(false);
    setNewNode({ type: 'assessment', layer: 'phc', name: '', description: '' });
  };

  const pathway = pathways.pathways[selectedPathway];

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => (node.data as any)?.backgroundColor || '#eee'}
          maskColor="rgba(0,0,0,0.1)"
        />
        <Panel position="top-left">
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="subtitle2">
              {pathway?.name || 'Select a pathway'}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddNodeOpen(true)}
            >
              Add Node
            </Button>
          </Box>
        </Panel>
        <Panel position="top-right">
          <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
            {Object.entries(nodeTypeColors).map(([type, color]) => (
              <Chip
                key={type}
                label={type}
                size="small"
                sx={{ bgcolor: color, fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Panel>
      </ReactFlow>

      <Dialog open={addNodeOpen} onClose={() => setAddNodeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Node</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={newNode.name || ''}
              onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newNode.description || ''}
              onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newNode.type || 'assessment'}
                label="Type"
                onChange={(e) => setNewNode({ ...newNode, type: e.target.value as any })}
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
                value={newNode.layer || 'phc'}
                label="Layer"
                onChange={(e) => setNewNode({ ...newNode, layer: e.target.value as any })}
              >
                <MenuItem value="phc">PHC (Layer 1)</MenuItem>
                <MenuItem value="mega">Mega Center (Layer 2)</MenuItem>
                <MenuItem value="hospital">Hospital (Layer 3)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNodeOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNode} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
