import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';

// Types
export interface Clinic {
  id: string;
  name: string;
  specialty: string;
  status: 'open' | 'closed' | 'limited';
  constraints: {
    age_min: number;
    age_max: number;
    gender: 'all' | 'male' | 'female';
  };
  services?: string[];
}

export interface Center {
  id: string;
  name: string;
  name_ar: string;
  type: 'phc' | 'mega' | 'hospital';
  layer: number;
  location: {
    city: string;
    district: string;
  };
  clinics: Clinic[];
}

export interface Network {
  id: string;
  name: string;
  name_ar: string;
  centers: Center[];
}

export interface Cluster {
  id: string;
  name: string;
  name_ar: string;
  networks: Network[];
}

export interface PathwayCondition {
  id: string;
  expression: string;
  description: string;
  next: string | null;
}

export interface PathwayNode {
  id: string;
  type: 'assessment' | 'decision' | 'treatment' | 'referral' | 'evaluation' | 'endpoint';
  name: string;
  description: string;
  layer: 'phc' | 'mega' | 'hospital';
  next?: string | null;
  conditions?: PathwayCondition[];
  required_tests?: { code: string; name: string }[];
  services?: { type: string; name: string }[];
  target_specialty?: string;
  target_center_type?: string;
  outcome?: string;
}

export interface Pathway {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  entry_point: string;
  nodes: Record<string, PathwayNode>;
}

export interface Specialty {
  id: string;
  name: string;
  name_ar: string;
}

// Store state
interface StoreState {
  // Data
  clusters: { clusters: Cluster[] };
  pathways: { pathways: Record<string, Pathway>; specialties: Specialty[] };

  // UI State
  selectedPathway: string;
  selectedTab: 'pathway' | 'clusters' | 'json';

  // React Flow state
  nodes: Node[];
  edges: Edge[];

  // Actions
  setClusters: (clusters: { clusters: Cluster[] }) => void;
  setPathways: (pathways: { pathways: Record<string, Pathway>; specialties: Specialty[] }) => void;
  setSelectedPathway: (id: string) => void;
  setSelectedTab: (tab: 'pathway' | 'clusters' | 'json') => void;

  // Pathway editing
  updatePathwayNode: (pathwayId: string, nodeId: string, updates: Partial<PathwayNode>) => void;
  addPathwayNode: (pathwayId: string, node: PathwayNode) => void;
  deletePathwayNode: (pathwayId: string, nodeId: string) => void;
  updatePathwayConnection: (pathwayId: string, sourceId: string, targetId: string, conditionId?: string) => void;

  // Cluster editing
  updateCenter: (clusterId: string, networkId: string, centerId: string, updates: Partial<Center>) => void;
  updateClinic: (clusterId: string, networkId: string, centerId: string, clinicId: string, updates: Partial<Clinic>) => void;
  addClinic: (clusterId: string, networkId: string, centerId: string, clinic: Clinic) => void;
  deleteClinic: (clusterId: string, networkId: string, centerId: string, clinicId: string) => void;

  // React Flow sync
  syncFlowFromPathway: (pathwayId: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Import/Export
  exportJSON: () => { clusters: any; pathways: any };
  importJSON: (data: { clusters?: any; pathways?: any }) => void;
}

// Helper to convert pathway to React Flow nodes/edges
const pathwayToFlow = (pathway: Pathway): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodeTypeColors: Record<string, string> = {
    assessment: '#e3f2fd',
    decision: '#fff3e0',
    treatment: '#e8f5e9',
    referral: '#fce4ec',
    evaluation: '#f3e5f5',
    endpoint: '#e0f2f1',
  };

  const visited = new Set<string>();
  const positions: Record<string, { x: number; y: number }> = {};

  // BFS to layout nodes
  const queue: string[] = [pathway.entry_point];
  let level = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    let x = 0;

    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const pathwayNode = pathway.nodes[nodeId];
      if (!pathwayNode) continue;

      positions[nodeId] = { x: x * 300, y: level * 150 };
      x++;

      // Add next nodes to queue
      if (pathwayNode.conditions) {
        pathwayNode.conditions.forEach((cond) => {
          if (cond.next && !visited.has(cond.next)) {
            queue.push(cond.next);
          }
        });
      } else if (pathwayNode.next && !visited.has(pathwayNode.next)) {
        queue.push(pathwayNode.next);
      }
    }
    level++;
  }

  // Create nodes
  Object.entries(pathway.nodes).forEach(([id, pathwayNode]) => {
    nodes.push({
      id,
      type: 'pathwayNode',
      position: positions[id] || { x: 0, y: 0 },
      data: {
        ...pathwayNode,
        backgroundColor: nodeTypeColors[pathwayNode.type] || '#ffffff',
      },
    });
  });

  // Create edges
  Object.entries(pathway.nodes).forEach(([id, pathwayNode]) => {
    if (pathwayNode.conditions) {
      pathwayNode.conditions.forEach((cond, idx) => {
        if (cond.next) {
          edges.push({
            id: `${id}-${cond.next}-${idx}`,
            source: id,
            target: cond.next,
            label: cond.description,
            type: 'smoothstep',
            animated: true,
          });
        }
      });
    } else if (pathwayNode.next) {
      edges.push({
        id: `${id}-${pathwayNode.next}`,
        source: id,
        target: pathwayNode.next,
        type: 'smoothstep',
        animated: true,
      });
    }
  });

  return { nodes, edges };
};

export const useStore = create<StoreState>((set, get) => ({
  clusters: { clusters: [] },
  pathways: { pathways: {}, specialties: [] },
  selectedPathway: 'adult_obesity',
  selectedTab: 'pathway',
  nodes: [],
  edges: [],

  setClusters: (clusters) => set({ clusters }),
  setPathways: (pathways) => set({ pathways }),
  setSelectedPathway: (id) => {
    set({ selectedPathway: id });
    get().syncFlowFromPathway(id);
  },
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  updatePathwayNode: (pathwayId, nodeId, updates) => {
    set((state) => {
      const newPathways = { ...state.pathways };
      if (newPathways.pathways[pathwayId]?.nodes[nodeId]) {
        newPathways.pathways[pathwayId].nodes[nodeId] = {
          ...newPathways.pathways[pathwayId].nodes[nodeId],
          ...updates,
        };
      }
      return { pathways: newPathways };
    });
    get().syncFlowFromPathway(pathwayId);
  },

  addPathwayNode: (pathwayId, node) => {
    set((state) => {
      const newPathways = { ...state.pathways };
      if (newPathways.pathways[pathwayId]) {
        newPathways.pathways[pathwayId].nodes[node.id] = node;
      }
      return { pathways: newPathways };
    });
    get().syncFlowFromPathway(pathwayId);
  },

  deletePathwayNode: (pathwayId, nodeId) => {
    set((state) => {
      const newPathways = { ...state.pathways };
      if (newPathways.pathways[pathwayId]?.nodes[nodeId]) {
        delete newPathways.pathways[pathwayId].nodes[nodeId];
        // Remove references to this node
        Object.values(newPathways.pathways[pathwayId].nodes).forEach((node) => {
          if (node.next === nodeId) node.next = null;
          if (node.conditions) {
            node.conditions = node.conditions.map((c) =>
              c.next === nodeId ? { ...c, next: null } : c
            );
          }
        });
      }
      return { pathways: newPathways };
    });
    get().syncFlowFromPathway(pathwayId);
  },

  updatePathwayConnection: (pathwayId, sourceId, targetId, conditionId) => {
    set((state) => {
      const newPathways = { ...state.pathways };
      const node = newPathways.pathways[pathwayId]?.nodes[sourceId];
      if (node) {
        if (conditionId && node.conditions) {
          const condIdx = node.conditions.findIndex((c) => c.id === conditionId);
          if (condIdx >= 0) {
            node.conditions[condIdx].next = targetId;
          }
        } else {
          node.next = targetId;
        }
      }
      return { pathways: newPathways };
    });
    get().syncFlowFromPathway(pathwayId);
  },

  updateCenter: (clusterId, networkId, centerId, updates) => {
    set((state) => {
      const newClusters = { ...state.clusters };
      const cluster = newClusters.clusters.find((c) => c.id === clusterId);
      const network = cluster?.networks.find((n) => n.id === networkId);
      const center = network?.centers.find((c) => c.id === centerId);
      if (center) {
        Object.assign(center, updates);
      }
      return { clusters: newClusters };
    });
  },

  updateClinic: (clusterId, networkId, centerId, clinicId, updates) => {
    set((state) => {
      const newClusters = { ...state.clusters };
      const cluster = newClusters.clusters.find((c) => c.id === clusterId);
      const network = cluster?.networks.find((n) => n.id === networkId);
      const center = network?.centers.find((c) => c.id === centerId);
      const clinic = center?.clinics.find((c) => c.id === clinicId);
      if (clinic) {
        Object.assign(clinic, updates);
      }
      return { clusters: newClusters };
    });
  },

  addClinic: (clusterId, networkId, centerId, clinic) => {
    set((state) => {
      const newClusters = { ...state.clusters };
      const cluster = newClusters.clusters.find((c) => c.id === clusterId);
      const network = cluster?.networks.find((n) => n.id === networkId);
      const center = network?.centers.find((c) => c.id === centerId);
      if (center) {
        center.clinics.push(clinic);
      }
      return { clusters: newClusters };
    });
  },

  deleteClinic: (clusterId, networkId, centerId, clinicId) => {
    set((state) => {
      const newClusters = { ...state.clusters };
      const cluster = newClusters.clusters.find((c) => c.id === clusterId);
      const network = cluster?.networks.find((n) => n.id === networkId);
      const center = network?.centers.find((c) => c.id === centerId);
      if (center) {
        center.clinics = center.clinics.filter((c) => c.id !== clinicId);
      }
      return { clusters: newClusters };
    });
  },

  syncFlowFromPathway: (pathwayId) => {
    const pathway = get().pathways.pathways[pathwayId];
    if (pathway) {
      const { nodes, edges } = pathwayToFlow(pathway);
      set({ nodes, edges });
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  exportJSON: () => ({
    clusters: get().clusters,
    pathways: get().pathways,
  }),

  importJSON: (data) => {
    if (data.clusters) set({ clusters: data.clusters });
    if (data.pathways) set({ pathways: data.pathways });
    get().syncFlowFromPathway(get().selectedPathway);
  },
}));
