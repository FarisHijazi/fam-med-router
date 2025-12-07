# Family Medicine Referral Router

No-code builder for medical referral pathways with two-way JSON sync.

## Features

- **Visual Pathway Editor**: Drag-and-drop flowchart editor using React Flow
  - Add, edit, delete pathway nodes
  - Connect nodes visually
  - Color-coded node types (assessment, decision, treatment, referral, etc.)

- **Health System Editor**: Edit the hierarchical structure
  - Clusters, Networks, Centers, Clinics
  - Add/edit/delete clinics with constraints (age, gender, status)

- **JSON Editor**: Direct JSON editing with two-way sync
  - Edit raw JSON for clusters and pathways
  - Import/Export full data
  - Changes sync to visual editor immediately

## Data Structure

```
Cluster (التجمع الصحي)
└── Network (الشبكة)
    └── Center (المركز)
        └── Clinic (العيادة)
```

### Layers
- **Layer 1 (PHC)**: Primary Health Centers - First point of contact
- **Layer 2 (Mega)**: Mega Centers - Specialized clinics
- **Layer 3 (Hospital)**: Hospitals - Advanced care and surgery

## Installation

```bash
cd frontend
npm install
```

## Running the App

```bash
cd frontend
npm run dev
```

The app will open in your browser at `http://localhost:5173`

## Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Data Files

- `data/clusters.json` - Health system hierarchy (clusters, networks, centers, clinics)
- `data/pathways.json` - Clinical pathways with decision nodes and rules

## Tech Stack

- **React 19** + TypeScript
- **Vite** - Build tool
- **React Flow** - Visual flowchart editor
- **MUI (Material UI)** - UI components
- **Zustand** - State management with two-way sync

## Two-Way JSON Sync

The application maintains synchronization between:
1. Visual editors (Pathway Editor, Health System Editor)
2. Raw JSON data

Changes in either direction are immediately reflected:
- Edit a node in the visual editor → JSON updates
- Edit JSON directly → Visual editor updates
- Export/Import JSON to save/restore full state

## Adult Obesity Pathway

The implemented pathway follows this decision tree:

1. **Screening** (PHC): BMI & Waist Circumference measurement
2. **BMI Check**:
   - BMI < 25 → No intervention needed
   - BMI ≥ 25 with secondary cause → Refer to specialty
   - BMI ≥ 25 without secondary cause → Diagnostic tests
3. **Severity Assessment**:
   - BMI ≥ 40 → Obesity Clinic (Mega Center)
   - BMI 35-39.9 with comorbidities → Obesity Clinic
   - BMI 25-34.9 without comorbidities → Manage in PHC
4. **PHC Management**: 3-month evaluation, target 5% weight loss
5. **Mega Center**: 6-month evaluation if PHC goals not met
6. **Hospital (DMC)**: Bariatric surgery evaluation if Mega Center goals not met

## Project Structure

```
fam-med-router/
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with tabs
│   │   ├── store.ts          # Zustand store with two-way sync
│   │   └── components/
│   │       ├── PathwayEditor.tsx    # React Flow visual editor
│   │       ├── PathwayNode.tsx      # Custom node component
│   │       ├── ClustersEditor.tsx   # Health system editor
│   │       └── JSONEditor.tsx       # Raw JSON editor
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── clusters.json    # Health system structure
│   └── pathways.json    # Clinical pathways
└── README.md
```
