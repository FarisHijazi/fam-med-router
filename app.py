"""
Family Medicine Referral Router - Web UI
Interactive pathway navigation for medical referrals
"""

import json
import streamlit as st
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Page config
st.set_page_config(
    page_title="Medical Referral Router",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load data
@st.cache_data
def load_clusters():
    with open(Path(__file__).parent / "data" / "clusters.json") as f:
        return json.load(f)

@st.cache_data
def load_pathways():
    with open(Path(__file__).parent / "data" / "pathways.json") as f:
        return json.load(f)

clusters_data = load_clusters()
pathways_data = load_pathways()

# Styles
st.markdown("""
<style>
    .pathway-node {
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .node-assessment { background-color: #e3f2fd; border-left: 4px solid #1976d2; }
    .node-decision { background-color: #fff3e0; border-left: 4px solid #f57c00; }
    .node-treatment { background-color: #e8f5e9; border-left: 4px solid #388e3c; }
    .node-referral { background-color: #fce4ec; border-left: 4px solid #c2185b; }
    .node-evaluation { background-color: #f3e5f5; border-left: 4px solid #7b1fa2; }
    .node-endpoint { background-color: #e0f2f1; border-left: 4px solid #00796b; }
    .node-active { border: 3px solid #ff5722 !important; box-shadow: 0 0 10px rgba(255,87,34,0.5); }

    .layer-phc { color: #1565c0; }
    .layer-mega { color: #ff8f00; }
    .layer-hospital { color: #c62828; }

    .center-card {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: 10px 0;
    }

    .clinic-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85em;
        margin: 2px;
    }

    .status-open { background-color: #c8e6c9; color: #2e7d32; }
    .status-closed { background-color: #ffcdd2; color: #c62828; }
    .status-limited { background-color: #fff9c4; color: #f9a825; }
</style>
""", unsafe_allow_html=True)


def get_node_style(node_type: str, is_active: bool = False) -> str:
    """Get CSS class for node type"""
    active = " node-active" if is_active else ""
    return f"pathway-node node-{node_type}{active}"


def evaluate_condition(expression: str, patient_data: dict) -> bool:
    """Evaluate a pathway condition against patient data"""
    # Simple expression evaluator
    expr = expression.upper()

    # Replace variable names with values
    bmi = patient_data.get("bmi", 0)
    has_secondary = patient_data.get("has_secondary_cause", False)
    has_comorbidities = patient_data.get("has_comorbidities", False)
    weight_loss = patient_data.get("weight_loss_percent", 0)

    # Handle different expressions
    if "BMI < 25" in expr:
        return bmi < 25
    elif "BMI >= 40" in expr:
        return bmi >= 40
    elif "BMI >= 35" in expr and "BMI < 40" in expr:
        if "HAS_COMORBIDITIES == TRUE" in expr:
            return 35 <= bmi < 40 and has_comorbidities
        elif "HAS_COMORBIDITIES == FALSE" in expr:
            return 35 <= bmi < 40 and not has_comorbidities
        return 35 <= bmi < 40
    elif "BMI >= 25" in expr and "BMI < 35" in expr:
        if "HAS_COMORBIDITIES == FALSE" in expr:
            return 25 <= bmi < 35 and not has_comorbidities
        return 25 <= bmi < 35
    elif "BMI >= 25" in expr:
        if "HAS_SECONDARY_CAUSE == TRUE" in expr:
            return bmi >= 25 and has_secondary
        elif "HAS_SECONDARY_CAUSE == FALSE" in expr:
            return bmi >= 25 and not has_secondary
        return bmi >= 25
    elif "WEIGHT_LOSS_PERCENT >= 5" in expr:
        return weight_loss >= 5
    elif "WEIGHT_LOSS_PERCENT < 5" in expr:
        return weight_loss < 5

    return False


def traverse_pathway(pathway: dict, patient_data: dict) -> list:
    """Traverse the pathway based on patient data and return path taken"""
    path = []
    nodes = pathway["nodes"]
    current_node_id = pathway["entry_point"]

    while current_node_id:
        if current_node_id not in nodes:
            break

        node = nodes[current_node_id]
        path.append(node)

        # Check node type
        if node["type"] == "endpoint":
            break
        elif node["type"] == "decision":
            # Evaluate conditions
            next_node = None
            for condition in node.get("conditions", []):
                if evaluate_condition(condition["expression"], patient_data):
                    next_node = condition.get("next")
                    break
            current_node_id = next_node
        else:
            current_node_id = node.get("next")

    return path


def find_matching_clinics(clusters_data: dict, target_specialty: str,
                          target_center_type: str = None,
                          network_id: str = None) -> list:
    """Find clinics matching criteria"""
    results = []

    for cluster in clusters_data["clusters"]:
        for network in cluster["networks"]:
            if network_id and network["id"] != network_id:
                continue

            for center in network["centers"]:
                if target_center_type and center["type"] != target_center_type:
                    continue

                for clinic in center["clinics"]:
                    if clinic["specialty"] == target_specialty:
                        results.append({
                            "cluster": cluster["name"],
                            "network": network["name"],
                            "center": center["name"],
                            "center_type": center["type"],
                            "clinic": clinic["name"],
                            "status": clinic["status"],
                            "constraints": clinic.get("constraints", {}),
                            "services": clinic.get("services", [])
                        })

    return results


# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Select View",
    ["Pathway Navigator", "Data Structure Explorer", "Referral Assistant"]
)

# Page: Pathway Navigator
if page == "Pathway Navigator":
    st.title("Adult Obesity Pathway Navigator")
    st.markdown("### Interactive pathway based on clinical guidelines")

    # Patient input section
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Patient Information")

        with st.form("patient_form"):
            age = st.number_input("Age (years)", min_value=0, max_value=120, value=35)
            gender = st.selectbox("Gender", ["Male", "Female"])

            st.markdown("---")
            st.markdown("**Measurements**")
            weight = st.number_input("Weight (kg)", min_value=1.0, max_value=500.0, value=95.0)
            height = st.number_input("Height (cm)", min_value=50.0, max_value=250.0, value=170.0)
            waist = st.number_input("Waist Circumference (cm)", min_value=30.0, max_value=250.0, value=102.0)

            # Calculate BMI
            bmi = weight / ((height / 100) ** 2)
            st.metric("Calculated BMI", f"{bmi:.1f}")

            st.markdown("---")
            st.markdown("**Clinical Assessment**")
            has_secondary = st.checkbox("Has Secondary Cause of Obesity")

            if has_secondary:
                secondary_cause = st.selectbox(
                    "Secondary Cause",
                    [s["name"] for s in pathways_data["secondary_causes"]]
                )

            has_comorbidities = st.checkbox("Has Comorbidities")

            if has_comorbidities:
                selected_comorbidities = st.multiselect(
                    "Select Comorbidities",
                    [c["name"] for c in pathways_data["comorbidities"]]
                )

            st.markdown("---")
            st.markdown("**Follow-up Data** (if applicable)")
            weight_loss_percent = st.slider("Weight Loss Achieved (%)", 0, 20, 0)

            submitted = st.form_submit_button("Navigate Pathway", type="primary")

    with col2:
        st.subheader("Pathway Visualization")

        # Patient data for evaluation
        patient_data = {
            "age": age,
            "gender": gender.lower(),
            "bmi": bmi,
            "waist_circumference": waist,
            "has_secondary_cause": has_secondary,
            "has_comorbidities": has_comorbidities,
            "weight_loss_percent": weight_loss_percent
        }

        # Age check
        if age < 15:
            st.warning("This pathway is for adults (age >= 15 years). Please use the Pediatric Obesity Pathway.")
        else:
            pathway = pathways_data["pathways"]["adult_obesity"]
            path_taken = traverse_pathway(pathway, patient_data)

            # Show pathway visualization
            st.markdown("#### Your pathway based on entered data:")

            for i, node in enumerate(path_taken):
                node_type = node["type"]
                is_last = (i == len(path_taken) - 1)

                # Layer indicator
                layer = node.get("layer", "phc")
                layer_emoji = {"phc": "🏥", "mega": "🏢", "hospital": "🏨"}.get(layer, "📍")
                layer_label = {"phc": "PHC", "mega": "Mega Center", "hospital": "Hospital"}.get(layer, layer)

                # Node display
                with st.container():
                    st.markdown(f"""
                    <div class="{get_node_style(node_type, is_last)}">
                        <strong>{layer_emoji} {node['name']}</strong>
                        <span style="float: right; font-size: 0.8em; color: gray;">
                            Layer: {layer_label}
                        </span>
                        <br><small>{node['description']}</small>
                    </div>
                    """, unsafe_allow_html=True)

                    # Show additional info for specific node types
                    if node_type == "assessment" and "required_tests" in node:
                        with st.expander("Required Tests"):
                            for test in node["required_tests"]:
                                st.write(f"- {test['name']} ({test['code']})")

                    if node_type == "treatment" and "services" in node:
                        with st.expander("Services"):
                            for svc in node["services"]:
                                st.write(f"- {svc['name']}")

                    if node_type == "referral":
                        specialty = node.get("target_specialty")
                        center_type = node.get("target_center_type")
                        if specialty:
                            st.info(f"**Referral to:** {specialty.replace('_', ' ').title()}")

                            # Find matching clinics
                            matches = find_matching_clinics(
                                clusters_data, specialty, center_type, "dammam"
                            )
                            if matches:
                                with st.expander(f"Available Clinics ({len(matches)})"):
                                    for m in matches:
                                        status_color = {
                                            "open": "🟢",
                                            "closed": "🔴",
                                            "limited": "🟡"
                                        }.get(m["status"], "⚪")
                                        st.write(f"{status_color} **{m['clinic']}** at {m['center']}")

                    if node_type == "endpoint":
                        outcome = node.get("outcome", "")
                        if "discharge" in outcome or "success" in outcome:
                            st.success(f"Outcome: {outcome.replace('_', ' ').title()}")
                        else:
                            st.info(f"Outcome: {outcome.replace('_', ' ').title()}")

                # Arrow between nodes
                if not is_last:
                    st.markdown("<div style='text-align: center; color: #666;'>↓</div>",
                               unsafe_allow_html=True)


# Page: Data Structure Explorer
elif page == "Data Structure Explorer":
    st.title("Health System Data Structure")
    st.markdown("Explore the hierarchical structure of clusters, networks, centers, and clinics")

    tab1, tab2, tab3 = st.tabs(["Hierarchy View", "JSON View", "Statistics"])

    with tab1:
        for cluster in clusters_data["clusters"]:
            with st.expander(f"📊 {cluster['name']} ({cluster['name_ar']})", expanded=True):
                for network in cluster["networks"]:
                    st.markdown(f"### 🌐 {network['name']}")

                    # Group centers by type
                    phc_centers = [c for c in network["centers"] if c["type"] == "phc"]
                    mega_centers = [c for c in network["centers"] if c["type"] == "mega"]
                    hospitals = [c for c in network["centers"] if c["type"] == "hospital"]

                    col1, col2, col3 = st.columns(3)

                    with col1:
                        st.markdown("#### Layer 1: PHCs")
                        for center in phc_centers:
                            with st.container():
                                st.markdown(f"""
                                <div class="center-card">
                                    <strong>🏥 {center['name']}</strong><br>
                                    <small>{center['name_ar']}</small><br>
                                    <small>📍 {center['location']['district']}</small>
                                </div>
                                """, unsafe_allow_html=True)
                                for clinic in center["clinics"]:
                                    status_class = f"status-{clinic['status']}"
                                    st.markdown(f"""
                                    <span class="clinic-badge {status_class}">
                                        {clinic['name']}
                                    </span>
                                    """, unsafe_allow_html=True)

                    with col2:
                        st.markdown("#### Layer 2: Mega Centers")
                        for center in mega_centers:
                            with st.container():
                                st.markdown(f"""
                                <div class="center-card">
                                    <strong>🏢 {center['name']}</strong><br>
                                    <small>{center['name_ar']}</small><br>
                                    <small>📍 {center['location']['district']}</small>
                                </div>
                                """, unsafe_allow_html=True)
                                for clinic in center["clinics"]:
                                    status_class = f"status-{clinic['status']}"
                                    st.markdown(f"""
                                    <span class="clinic-badge {status_class}">
                                        {clinic['name']}
                                    </span>
                                    """, unsafe_allow_html=True)

                    with col3:
                        st.markdown("#### Layer 3: Hospitals")
                        for center in hospitals:
                            with st.container():
                                st.markdown(f"""
                                <div class="center-card">
                                    <strong>🏨 {center['name']}</strong><br>
                                    <small>{center['name_ar']}</small><br>
                                    <small>📍 {center['location']['district']}</small>
                                </div>
                                """, unsafe_allow_html=True)
                                for clinic in center["clinics"]:
                                    status_class = f"status-{clinic['status']}"
                                    st.markdown(f"""
                                    <span class="clinic-badge {status_class}">
                                        {clinic['name']}
                                    </span>
                                    """, unsafe_allow_html=True)

                    st.markdown("---")

    with tab2:
        st.subheader("Raw JSON Data")
        json_tab1, json_tab2 = st.tabs(["Clusters", "Pathways"])

        with json_tab1:
            st.json(clusters_data)

        with json_tab2:
            st.json(pathways_data)

    with tab3:
        st.subheader("Statistics")

        # Count statistics
        total_networks = sum(len(c["networks"]) for c in clusters_data["clusters"])
        total_centers = sum(
            len(n["centers"])
            for c in clusters_data["clusters"]
            for n in c["networks"]
        )
        total_clinics = sum(
            len(center["clinics"])
            for c in clusters_data["clusters"]
            for n in c["networks"]
            for center in n["centers"]
        )

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Clusters", len(clusters_data["clusters"]))
        col2.metric("Networks", total_networks)
        col3.metric("Centers", total_centers)
        col4.metric("Clinics", total_clinics)

        # Specialty distribution
        st.markdown("### Specialties Available")
        specialty_counts = {}
        for c in clusters_data["clusters"]:
            for n in c["networks"]:
                for center in n["centers"]:
                    for clinic in center["clinics"]:
                        spec = clinic["specialty"]
                        specialty_counts[spec] = specialty_counts.get(spec, 0) + 1

        st.bar_chart(specialty_counts)


# Page: Referral Assistant
elif page == "Referral Assistant":
    st.title("Referral Assistant")
    st.markdown("Get referral recommendations based on patient information")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Patient Details")

        # Network selection
        network_options = []
        for c in clusters_data["clusters"]:
            for n in c["networks"]:
                network_options.append(n["name"])

        selected_network_name = st.selectbox("Current Network", network_options)

        # Find network ID
        selected_network_id = None
        for c in clusters_data["clusters"]:
            for n in c["networks"]:
                if n["name"] == selected_network_name:
                    selected_network_id = n["id"]
                    break

        # Specialty selection
        specialty_options = [(s["id"], s["name"]) for s in pathways_data["specialties"]]
        selected_specialty = st.selectbox(
            "Required Specialty",
            options=[s[0] for s in specialty_options],
            format_func=lambda x: next(s[1] for s in specialty_options if s[0] == x)
        )

        # Patient constraints
        st.markdown("**Patient Constraints**")
        patient_age = st.number_input("Patient Age", min_value=0, max_value=120, value=30)
        patient_gender = st.selectbox("Patient Gender", ["Male", "Female"])

        # Search
        if st.button("Find Available Clinics", type="primary"):
            matches = find_matching_clinics(
                clusters_data,
                selected_specialty,
                network_id=selected_network_id
            )

            # Filter by patient constraints
            filtered = []
            for m in matches:
                constraints = m["constraints"]
                age_ok = constraints.get("age_min", 0) <= patient_age <= constraints.get("age_max", 120)
                gender_ok = constraints.get("gender", "all") in ["all", patient_gender.lower()]
                status_ok = m["status"] != "closed"

                if age_ok and gender_ok and status_ok:
                    filtered.append(m)

            st.session_state["search_results"] = filtered

    with col2:
        st.subheader("Available Options")

        if "search_results" in st.session_state:
            results = st.session_state["search_results"]

            if not results:
                st.warning("No matching clinics found. Consider expanding search criteria.")
            else:
                st.success(f"Found {len(results)} matching clinic(s)")

                for i, result in enumerate(results):
                    status_icon = {
                        "open": "🟢",
                        "limited": "🟡",
                        "closed": "🔴"
                    }.get(result["status"], "⚪")

                    center_icon = {
                        "phc": "🏥",
                        "mega": "🏢",
                        "hospital": "🏨"
                    }.get(result["center_type"], "📍")

                    with st.container():
                        st.markdown(f"""
                        <div class="center-card">
                            <h4>{status_icon} {result['clinic']}</h4>
                            <p>{center_icon} <strong>{result['center']}</strong></p>
                            <p>📍 {result['network']}</p>
                            <p>Status: {result['status'].title()}</p>
                        </div>
                        """, unsafe_allow_html=True)

                        if result.get("services"):
                            st.write("**Services:**", ", ".join(result["services"]))

                        constraints = result["constraints"]
                        st.caption(
                            f"Age: {constraints.get('age_min', 0)}-{constraints.get('age_max', 120)} | "
                            f"Gender: {constraints.get('gender', 'all').title()}"
                        )

                        st.markdown("---")
        else:
            st.info("Enter patient details and click 'Find Available Clinics' to search")


# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: gray;'>"
    "Medical Referral Router v0.1 | Eastern Health Cluster"
    "</div>",
    unsafe_allow_html=True
)
