# Family Medicine Referral Router

Interactive web application for navigating medical referral pathways in the Eastern Health Cluster.

## Features

- **Pathway Navigator**: Interactive navigation through clinical pathways (e.g., Adult Obesity Pathway)
- **Data Structure Explorer**: View the hierarchical structure of clusters, networks, centers, and clinics
- **Referral Assistant**: Find available clinics based on specialty and patient constraints

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
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running the App

```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

## Data Files

- `data/clusters.json` - Health system hierarchy (clusters, networks, centers, clinics)
- `data/pathways.json` - Clinical pathways with decision nodes and rules

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
├── app.py              # Streamlit web application
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── data/
    ├── clusters.json  # Health system structure
    └── pathways.json  # Clinical pathways
```
