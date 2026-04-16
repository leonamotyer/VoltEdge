"""
VoltEdge MDC — Renewable Curtailment & Modular Data Centre Sizing Tool
Investor & Partner Edition
Run with:  streamlit run voltedge_app.py
"""

from __future__ import annotations
import math, io, warnings
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="VoltEdge MDC | Investment Analysis",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────────────────────────────────────
# STYLING
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
html, body, [class*="css"] { font-family: 'Segoe UI', sans-serif; }
.main { background: #F0F4F8; }
.ve-header {
    background: linear-gradient(135deg, #0D2137 0%, #1A4A72 60%, #0E6E4A 100%);
    border-radius: 14px; padding: 2rem 2.5rem; margin-bottom: 1.5rem; color: white;
}
.ve-header h1 { color: white; margin: 0; font-size: 2rem; font-weight: 700; }
.ve-header p  { color: rgba(255,255,255,0.75); margin: 0.3rem 0 0; font-size: 1rem; }
.kpi-card {
    background: white; border-radius: 12px; padding: 1.2rem 1.4rem 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06); border-top: 4px solid #27AE60; height: 100%;
}
.kpi-card.blue  { border-top-color: #1A4A72; }
.kpi-card.amber { border-top-color: #E67E22; }
.kpi-card.teal  { border-top-color: #0E9E6A; }
.kpi-card.red   { border-top-color: #E74C3C; }
.kpi-label { font-size: 0.70rem; color: #888; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; }
.kpi-value { font-size: 1.9rem; font-weight: 700; color: #1A3050; line-height: 1.1; margin: 0.15rem 0; }
.kpi-sub   { font-size: 0.80rem; color: #555; }
.section-header {
    font-size: 1.05rem; font-weight: 700; color: #1A3050;
    border-bottom: 2px solid #E8ECF0; padding-bottom: 0.4rem; margin-bottom: 0.9rem;
}
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS  (from notebook finance layer)
# ─────────────────────────────────────────────────────────────────────────────
USD_TO_CAD        = 1.38
GPUS_PER_RACK     = 8
RACK_PRICE_CAD    = 8_000  * USD_TO_CAD
BATT_COST_PER_KWH = 220    * USD_TO_CAD   # energy component  $/kWh
BATT_COST_PER_KW  = 130    * USD_TO_CAD   # power / PCS       $/kW
FIXED_OM_FRAC     = 0.05                  # 5 % of CAPEX/yr

GPU_SPECS = {
    "RTX 3090":  {"power_kw": 0.350, "unit_price_cad": 900  * USD_TO_CAD, "rental_hr_cad": 0.13 * USD_TO_CAD, "label": "RTX 3090 (Entry / Inference)"},
    "RTX 5090":  {"power_kw": 0.575, "unit_price_cad": 5_000,             "rental_hr_cad": 0.37 * USD_TO_CAD, "label": "RTX 5090 (Mid-tier / AI)"},
    "A6000":     {"power_kw": 0.300, "unit_price_cad": 6_000 * USD_TO_CAD,"rental_hr_cad": 0.37 * USD_TO_CAD, "label": "A6000 (Pro / Data Science)"},
    "PRO 6000":  {"power_kw": 0.600, "unit_price_cad": 15_000,            "rental_hr_cad": 0.80 * USD_TO_CAD, "label": "PRO 6000 (High-perf / LLM)"},
}

# ─────────────────────────────────────────────────────────────────────────────
# DEMO DATA  (realistic synthetic 10-min wind curtailment time-series)
# ─────────────────────────────────────────────────────────────────────────────
@st.cache_data
def generate_demo_data(seed: int = 42) -> pd.DataFrame:
    rng     = np.random.default_rng(seed)
    periods = 24 * 6 * 366          # 2024 leap year
    ts      = pd.date_range("2024-01-01", periods=periods, freq="10min")
    doy     = ts.dayofyear.to_numpy()
    hour    = ts.hour.to_numpy() + ts.minute.to_numpy() / 60

    seasonal  = 0.55 + 0.25 * np.cos(2 * np.pi * (doy - 30) / 366)
    diurnal   = 1.00 - 0.15 * np.sin(2 * np.pi * hour / 24)
    noise     = pd.Series(rng.normal(0, 0.10, periods)).rolling(6, center=True, min_periods=1).mean().to_numpy()
    potential = np.clip(seasonal * diurnal + noise, 0.05, 1.0)

    cong_prob = 0.18 + 0.12 * np.sin(2 * np.pi * (doy - 90) / 366)
    cong_prob += 0.08 * (1 - np.cos(2 * np.pi * hour / 24)) / 2
    is_curt   = rng.random(periods) < cong_prob
    curt_frac = rng.beta(2.0, 5.0, periods) * 0.6
    curt_raw  = np.where(is_curt, potential * curt_frac, 0.0)
    curtailed = np.clip(pd.Series(curt_raw).rolling(3, min_periods=1).mean().to_numpy(), 0, potential)

    base_price = 55 + 25 * np.sin(2 * np.pi * (doy - 150) / 366)
    pool_price = np.clip(base_price * rng.lognormal(0, 0.35, periods), 5, 350)

    dt_h = 1 / 6
    return pd.DataFrame({
        "t_stamp":    ts,
        "p_pot_mw":   potential,
        "p_curt_mw":  curtailed,
        "p_real_mw":  np.clip(potential - curtailed, 0, None),
        "e_pot_mwh":  potential  * dt_h,
        "e_curt_mwh": curtailed  * dt_h,
        "e_real_mwh": np.clip(potential - curtailed, 0, None) * dt_h,
        "pool_price": pool_price,
        "dt_h":       dt_h,
        "month":      ts.to_period("M").astype(str),
        "hour":       ts.hour,
    })

# ─────────────────────────────────────────────────────────────────────────────
# DATA LOADER  (real XLSX + CSV — mirrors original notebook parsing)
# ─────────────────────────────────────────────────────────────────────────────
def load_real_data(excel_file, price_file) -> pd.DataFrame | None:
    try:
        df_raw = pd.read_excel(excel_file, sheet_name="10 Min Data", header=7)
        df_raw = df_raw.iloc[:, :9]
        df_raw.columns = [" ".join(str(c).replace("\n", " ").split()).strip() for c in df_raw.columns]

        COL_TS   = "t_stamp"
        COL_POT  = "Potential Production Quantity (MW)"
        COL_CURT = "Curtailed Production Qty (MW)"

        df = df_raw.copy()
        for c in [COL_POT, COL_CURT]:
            df[c] = pd.to_numeric(df[c], errors="coerce")

        df[COL_TS]  = pd.to_datetime(df[COL_TS]).dt.floor("s")
        df          = df.sort_values(COL_TS).reset_index(drop=True)
        dt_series   = df[COL_TS].diff().dt.total_seconds().div(3600)
        step_h      = dt_series.dropna().round(6).mode().iloc[0]
        df["dt_h"]  = dt_series.fillna(step_h)

        df["p_pot_mw"]   = df[COL_POT]
        df["p_curt_mw"]  = df[COL_CURT].clip(lower=0)
        df["p_real_mw"]  = (df["p_pot_mw"] - df["p_curt_mw"]).clip(lower=0)
        df["e_pot_mwh"]  = df["p_pot_mw"]  * df["dt_h"]
        df["e_curt_mwh"] = df["p_curt_mw"] * df["dt_h"]
        df["e_real_mwh"] = df["p_real_mw"] * df["dt_h"]

        raw   = price_file.read().decode("utf-8-sig")
        lines = raw.splitlines()
        hdr   = next((i for i, l in enumerate(lines) if "Date (HE)" in l), None)
        if hdr is not None:
            df_price     = pd.read_csv(io.StringIO("\n".join(lines[hdr:])))
            df_price.columns = [c.strip() for c in df_price.columns]
            price_10min  = np.repeat(df_price["Price ($)"].to_numpy(), 6)
            n            = min(len(df), len(price_10min))
            df           = df.iloc[:n].copy()
            df["pool_price"] = price_10min[:n]
        else:
            df["pool_price"] = 55.0

        df["month"] = df[COL_TS].dt.to_period("M").astype(str)
        df["hour"]  = df[COL_TS].dt.hour
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None

# ─────────────────────────────────────────────────────────────────────────────
# DISPATCH SIMULATION  (mirrors dispatch.py logic from voltedge_curtailment)
# Priority: curtailed wind → battery discharge → BTF → grid
# ─────────────────────────────────────────────────────────────────────────────
def run_dispatch(curtailed_mw, pool_price, dt_h,
                 gpu_mw, batt_mwh, batt_p_mw,
                 grid_cap_mw, btf_cap_mw, btf_price, curt_price,
                 eta_c=0.95, eta_d=0.95):
    n           = len(curtailed_mw)
    soc         = 0.0
    batt_p_mwh  = batt_p_mw * dt_h
    demand_mwh  = gpu_mw    * dt_h

    direct_curt = np.zeros(n); batt_used = np.zeros(n)
    grid_used   = np.zeros(n); btf_used  = np.zeros(n)
    unmet       = np.zeros(n); spilled   = np.zeros(n)
    soc_arr     = np.zeros(n); served    = np.zeros(n, dtype=bool)

    for i in range(n):
        avail = curtailed_mw[i] * dt_h
        need  = demand_mwh

        # 1) Curtailed wind
        u_c = min(avail, need); direct_curt[i] = u_c; need -= u_c; avail -= u_c

        # Charge battery with surplus
        head   = max((batt_mwh - soc) / eta_c, 0.0)
        charge = min(avail, batt_p_mwh, head)
        soc   += charge * eta_c; spilled[i] = avail - charge

        # 2) Battery discharge
        if need > 0 and soc > 1e-9:
            u_b = min(soc * eta_d, batt_p_mwh, need)
            batt_used[i] = u_b; soc -= u_b / eta_d; need -= u_b

        # 3) BTF
        if need > 0 and btf_cap_mw > 0:
            u_btf = min(btf_cap_mw * dt_h, need); btf_used[i] = u_btf; need -= u_btf

        # 4) Grid
        if need > 0 and grid_cap_mw > 0:
            u_g = min(grid_cap_mw * dt_h, need); grid_used[i] = u_g; need -= u_g

        unmet[i] = max(need, 0.0); soc_arr[i] = soc; served[i] = need < 1e-9

    total_demand = demand_mwh * n
    total_served = float(direct_curt.sum() + batt_used.sum() + grid_used.sum() + btf_used.sum())
    e_cost = float((grid_used * pool_price).sum()) + btf_used.sum()*btf_price + direct_curt.sum()*curt_price

    return {
        "full_supply_interval_share":  float(served.mean()),
        "coverage_energy":             total_served / total_demand if total_demand > 0 else 0.0,
        "annual_unmet_mwh":            float(unmet.sum()),
        "annual_served_mwh":           total_served,
        "annual_gpu_demand_mwh":       total_demand,
        "annual_direct_curt_used_mwh": float(direct_curt.sum()),
        "annual_batt_used_mwh":        float(batt_used.sum()),
        "annual_grid_used_mwh":        float(grid_used.sum()),
        "annual_btf_used_mwh":         float(btf_used.sum()),
        "annual_spilled_curt_mwh":     float(spilled.sum()),
        "annual_grid_cost_$":          float((grid_used * pool_price).sum()),
        "annual_btf_cost_$":           float(btf_used.sum() * btf_price),
        "annual_curt_cost_$":          float(direct_curt.sum() * curt_price),
        "annual_total_energy_cost_$":  e_cost,
        "avg_energy_cost_$/mwh":       e_cost / total_served if total_served > 0 else 0.0,
        "_soc":    soc_arr,
        "_served": served.astype(int),
        "_unmet":  unmet,
    }

# ─────────────────────────────────────────────────────────────────────────────
# FINANCE MODEL  (mirrors notebook 2-Run Simulation with Finance)
# ─────────────────────────────────────────────────────────────────────────────
def crf(r, n):
    return r * (1+r)**n / ((1+r)**n - 1) if r > 1e-9 else 1.0/n

def compute_capex(gpu_mw, batt_mwh, batt_p_mw, gpu_type, discount_rate=0.08, project_life=12,
                  unit_price_override=None, rental_hr_override=None):
    """
    unit_price_override : CAD — replaces GPU_SPECS unit price when set
    rental_hr_override  : CAD/hr — replaces GPU_SPECS rental rate when set
    """
    spec       = GPU_SPECS[gpu_type]
    n_gpus     = max(1, int(gpu_mw * 1000 / spec["power_kw"]))
    n_racks    = math.ceil(n_gpus / GPUS_PER_RACK)
    cap_batt_e = batt_mwh  * 1000 * BATT_COST_PER_KWH
    cap_batt_p = batt_p_mw * 1000 * BATT_COST_PER_KW
    unit_price = unit_price_override if unit_price_override is not None else spec["unit_price_cad"]
    rental_hr  = rental_hr_override  if rental_hr_override  is not None else spec["rental_hr_cad"]
    cap_gpu    = n_gpus  * unit_price
    cap_rack   = n_racks * RACK_PRICE_CAD
    cap_total  = cap_batt_e + cap_batt_p + cap_gpu + cap_rack
    ann_capex  = cap_total * crf(discount_rate, project_life)
    fixed_om   = cap_total * FIXED_OM_FRAC
    return {
        "n_gpus": n_gpus, "n_racks": n_racks,
        "capex_batt_energy_$": cap_batt_e, "capex_batt_power_$": cap_batt_p,
        "capex_gpu_$": cap_gpu, "capex_rack_$": cap_rack,
        "capex_total_$": cap_total, "annualized_capex_$": ann_capex,
        "annual_fixed_om_$": fixed_om,
        "annual_rental_price_$": n_gpus * rental_hr * 8760,
        # store effective values so downstream code can display them
        "_unit_price_cad": unit_price,
        "_rental_hr_cad":  rental_hr,
    }

def compute_financials(dispatch, capex, uptime_frac):
    rev       = capex["annual_rental_price_$"] * uptime_frac
    e_cost    = dispatch["annual_total_energy_cost_$"]
    ann_cap   = capex["annualized_capex_$"]
    om        = capex["annual_fixed_om_$"]
    total_c   = e_cost + ann_cap + om
    net       = rev - total_c
    served    = dispatch["annual_served_mwh"]
    ann_cf    = rev - e_cost - om
    payback   = capex["capex_total_$"] / ann_cf if ann_cf > 0 else float("inf")
    roi       = (net / capex["capex_total_$"]) * 100 if capex["capex_total_$"] > 0 else 0.0
    return {
        "annual_revenue_$":    rev,  "annual_energy_cost_$": e_cost,
        "annualized_capex_$":  ann_cap, "annual_fixed_om_$":    om,
        "annual_total_cost_$": total_c, "annual_net_profit_$":  net,
        "payback_years": payback, "roi_%": roi,
        "net_profit_per_mwh_$": net / served if served > 0 else 0.0,
    }

# ─────────────────────────────────────────────────────────────────────────────
# BATTERY SWEEP  (cached — runs multiple simulations)
# ─────────────────────────────────────────────────────────────────────────────
@st.cache_data(show_spinner=False)
def battery_sweep(curt_bytes, price_bytes, dt_h, gpu_mw,
                  grid_cap_mw, btf_cap_mw, btf_price, curt_price,
                  gpu_type, discount_rate, project_life,
                  unit_price_override=None, rental_hr_override=None):
    ca  = np.frombuffer(curt_bytes,  dtype=np.float64)
    pa  = np.frombuffer(price_bytes, dtype=np.float64)
    rows = []
    for bm in [0.0, 0.5, 1.0, 2.0, 3.3, 5.0, 6.6, 9.9, 13.2, 20.0]:
        d = run_dispatch(ca, pa, dt_h, gpu_mw=gpu_mw, batt_mwh=bm, batt_p_mw=bm,
                         grid_cap_mw=grid_cap_mw, btf_cap_mw=btf_cap_mw,
                         btf_price=btf_price, curt_price=curt_price)
        c = compute_capex(gpu_mw, bm, bm, gpu_type, discount_rate, project_life,
                          unit_price_override=unit_price_override,
                          rental_hr_override=rental_hr_override)
        f = compute_financials(d, c, d["full_supply_interval_share"])
        rows.append({"batt_mwh": bm, "uptime_%": d["full_supply_interval_share"]*100,
                     "coverage_%": d["coverage_energy"]*100,
                     "net_profit_$M": f["annual_net_profit_$"]/1e6,
                     "capex_$M": c["capex_total_$"]/1e6,
                     "payback_yrs": min(f["payback_years"], 25),
                     "roi_%": f["roi_%"],
                     "avg_cost_$/mwh": d["avg_energy_cost_$/mwh"]})
    return pd.DataFrame(rows)

# ─────────────────────────────────────────────────────────────────────────────
# CHART HELPER
# ─────────────────────────────────────────────────────────────────────────────
def fmt(fig, h=350):
    fig.update_layout(height=h, margin=dict(l=10,r=10,t=35,b=10),
                      paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                      font=dict(family="Segoe UI", size=12),
                      legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
    fig.update_xaxes(showgrid=True, gridcolor="#EAEEF2", zeroline=False)
    fig.update_yaxes(showgrid=True, gridcolor="#EAEEF2", zeroline=False)
    return fig

def kpi(col, label, value, sub, color=""):
    col.markdown(f"""<div class="kpi-card {color}">
      <div class="kpi-label">{label}</div>
      <div class="kpi-value">{value}</div>
      <div class="kpi-sub">{sub}</div></div>""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### ⚡ VoltEdge MDC")
    st.caption("Renewable Curtailment + MDC Sizing Tool")
    st.divider()

    st.markdown("#### 📂 Data Source")
    use_demo = st.toggle("Use demo / synthetic data", value=True)
    if not use_demo:
        excel_up = st.file_uploader("Wind curtailment XLSX", type=["xlsx"],
            help="2024_Annual_10min_ES_Analysis_R4_1MW.xlsx")
        price_up = st.file_uploader("AESO Pool Price CSV",   type=["csv"],
            help="AESO_PoolPrice_2024.csv")
    else:
        excel_up = price_up = None
    st.divider()

    st.markdown("#### 🖥️ Compute Configuration")

    # GPU type selector + override toggle on the same row
    gpu_col, chk_col = st.columns([3, 2])
    with gpu_col:
        gpu_type = st.selectbox("GPU Type", list(GPU_SPECS.keys()),
                                format_func=lambda k: GPU_SPECS[k]["label"],
                                label_visibility="visible")
    with chk_col:
        st.markdown("<div style='height:28px'></div>", unsafe_allow_html=True)   # align vertically
        custom_pricing = st.checkbox("Override pricing", value=False,
                                     help="Enable to manually adjust GPU unit cost and hourly rental rate")

    spec = GPU_SPECS[gpu_type]

    # ── Custom pricing sliders (only active when checkbox is ticked) ──
    default_unit_price = spec["unit_price_cad"]
    default_rental_hr  = spec["rental_hr_cad"]

    if custom_pricing:
        st.markdown(
            "<div style='background:#FDF3E5;border-left:3px solid #E67E22;"
            "border-radius:6px;padding:.5rem .8rem;margin:.4rem 0;"
            "font-size:.8rem;color:#7D4E00'>"
            "✏️ <strong>Custom pricing active</strong> — overrides default spec values</div>",
            unsafe_allow_html=True)

        # Unit cost slider: range from 25 % to 300 % of default
        price_lo = max(100.0, round(default_unit_price * 0.25 / 100) * 100)
        price_hi = max(price_lo * 2, round(default_unit_price * 3.0 / 100) * 100)
        gpu_unit_price_in = st.slider(
            "GPU Unit Cost (CAD / unit)",
            min_value=float(price_lo),
            max_value=float(price_hi),
            value=float(round(default_unit_price / 100) * 100),
            step=100.0,
            help=f"Default for {gpu_type}: ${default_unit_price:,.0f} CAD")
        delta_price_pct = (gpu_unit_price_in - default_unit_price) / default_unit_price * 100
        st.caption(f"Default: ${default_unit_price:,.0f}  →  {delta_price_pct:+.1f}% vs default")

        # Rental rate slider: range from 10 % to 300 % of default
        rent_lo = max(0.01, round(default_rental_hr * 0.10, 3))
        rent_hi = round(default_rental_hr * 3.0, 3)
        gpu_rental_hr_in = st.slider(
            "GPU Rental Rate (CAD / hr)",
            min_value=float(rent_lo),
            max_value=float(rent_hi),
            value=float(round(default_rental_hr, 3)),
            step=0.01,
            help=f"Default for {gpu_type}: ${default_rental_hr:.3f} CAD/hr")
        delta_rent_pct = (gpu_rental_hr_in - default_rental_hr) / default_rental_hr * 100
        st.caption(f"Default: ${default_rental_hr:.3f}  →  {delta_rent_pct:+.1f}% vs default")

    else:
        # Show locked values — visually dimmed
        gpu_unit_price_in = None   # signals "use spec default"
        gpu_rental_hr_in  = None
        st.markdown(
            f"<div style='background:#F5F7FA;border-radius:6px;padding:.5rem .8rem;"
            f"margin:.3rem 0;font-size:.8rem;color:#999'>"
            f"🔒 Unit cost: <strong>${default_unit_price:,.0f} CAD</strong><br>"
            f"🔒 Rental rate: <strong>${default_rental_hr:.3f} CAD/hr</strong><br>"
            f"<em>Check 'Override pricing' to adjust</em></div>",
            unsafe_allow_html=True)

    n_racks_in   = st.slider("GPU Racks", 1, 50, 6)
    n_gpus_in    = n_racks_in * GPUS_PER_RACK
    gpu_mw_in    = n_gpus_in * spec["power_kw"] / 1000
    st.caption(f"→ {n_gpus_in} GPUs · **{gpu_mw_in:.3f} MW** load")
    st.divider()

    st.markdown("#### 🔋 Battery Storage")
    batt_mwh_in  = st.slider("Battery Capacity (MWh)", 0.0, 25.0, 6.6, 0.5)
    batt_p_in    = st.slider("Battery Power (MW)",      0.0, 25.0, max(batt_mwh_in, 0.1), 0.5)
    st.divider()

    st.markdown("#### 🔌 Grid & BTF")
    grid_cap_in  = st.slider("Grid Import Cap (MW)",  0.0, 5.0, round(gpu_mw_in/2, 2), 0.05)
    btf_cap_in   = st.slider("BTF Supply Cap (MW)",   0.0, 5.0, round(gpu_mw_in/2, 2), 0.05)
    btf_price_in = st.slider("BTF Price (CAD/MWh)",  30.0, 80.0, 45.0, 1.0)
    curt_price_in= st.slider("Curtailment Price (USD/MWh)", 10.0, 60.0, 25.0, 1.0)
    st.divider()

    st.markdown("#### 💰 Financial Parameters")
    disc_rate_in = st.slider("Discount Rate (%)", 4.0, 15.0, 8.0, 0.5) / 100
    proj_life_in = st.slider("Project Life (yrs)", 5, 20, 12)
    st.divider()
    st.caption("© 2025 VoltEdge MDC · ss@voltedgemdc.com")

# ─────────────────────────────────────────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────────────────────────────────────────
if use_demo or excel_up is None or price_up is None:
    df         = generate_demo_data()
    data_label = "⚠️ Demo / synthetic data"
else:
    with st.spinner("Loading data files…"):
        df = load_real_data(excel_up, price_up)
    if df is None: st.stop()
    data_label = "✅ Live project data"

curt_np  = df["p_curt_mw"].to_numpy().astype(np.float64)
price_np = df["pool_price"].to_numpy().astype(np.float64)
dt_h     = float(df["dt_h"].iloc[0])

# ─────────────────────────────────────────────────────────────────────────────
# RUN SIMULATION
# ─────────────────────────────────────────────────────────────────────────────
with st.spinner("Running dispatch simulation…"):
    D = run_dispatch(curt_np, price_np, dt_h,
                     gpu_mw=gpu_mw_in, batt_mwh=batt_mwh_in, batt_p_mw=batt_p_in,
                     grid_cap_mw=grid_cap_in, btf_cap_mw=btf_cap_in,
                     btf_price=btf_price_in, curt_price=curt_price_in)
    C = compute_capex(gpu_mw_in, batt_mwh_in, batt_p_in, gpu_type, disc_rate_in, proj_life_in,
                      unit_price_override=gpu_unit_price_in,
                      rental_hr_override=gpu_rental_hr_in)
    F = compute_financials(D, C, D["full_supply_interval_share"])

# ─────────────────────────────────────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────────────────────────────────────
st.markdown(f"""<div class="ve-header">
  <h1>⚡ VoltEdge MDC — Investment Analysis Platform</h1>
  <p>Renewable Curtailment · Battery Storage · Modular Data Centre Sizing · ROI Modelling &nbsp;|&nbsp; {data_label}</p>
</div>""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# KPI ROW
# ─────────────────────────────────────────────────────────────────────────────
uptime_pct   = D["full_supply_interval_share"] * 100
coverage_pct = D["coverage_energy"] * 100
net_profit   = F["annual_net_profit_$"]
payback      = F["payback_years"]
curt_rate    = df["e_curt_mwh"].sum() / df["e_pot_mwh"].sum() * 100

c1,c2,c3,c4,c5 = st.columns(5)
kpi(c1,"Annual Net Profit",    f"${net_profit/1e6:+.2f}M",
    f"{C['n_gpus']} GPUs · {C['n_racks']} racks",
    "teal" if net_profit>0 else "red")
kpi(c2,"Full-Interval Uptime", f"{uptime_pct:.1f}%",
    f"Energy coverage: {coverage_pct:.1f}%", "blue")
kpi(c3,"Simple Payback",       f"{payback:.1f} yrs" if payback<99 else ">25 yrs",
    f"ROI: {F['roi_%']:.1f}%", "amber")
kpi(c4,"Total CAPEX",          f"${C['capex_total_$']/1e6:.2f}M",
    f"Batt ${C['capex_batt_energy_$']/1e6:.2f}M · GPU ${C['capex_gpu_$']/1e6:.2f}M","blue")
kpi(c5,"Site Curtailment",     f"{df['e_curt_mwh'].sum():,.0f} MWh",
    f"{curt_rate:.1f}% of potential · available to absorb","amber")

st.markdown("<br>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# TABS
# ─────────────────────────────────────────────────────────────────────────────
tab1,tab2,tab3,tab4,tab5 = st.tabs([
    "📊 Executive Summary","🌬️ Curtailment Analysis",
    "🔋 System Sizing","💰 Financial Model","⚙️ Energy Dispatch"])

# ══════════════════════ TAB 1 — EXECUTIVE SUMMARY ════════════════════════════
with tab1:
    cl, cr = st.columns([1.1,1], gap="large")

    with cl:
        st.markdown('<div class="section-header">Energy Sourcing Mix</div>', unsafe_allow_html=True)
        labels = ["Curtailed Wind","Battery","BTF","Grid","Unmet (Downtime)"]
        vals   = [D["annual_direct_curt_used_mwh"], D["annual_batt_used_mwh"],
                  D["annual_btf_used_mwh"],         D["annual_grid_used_mwh"],
                  D["annual_unmet_mwh"]]
        fig_pie = go.Figure(go.Pie(labels=labels, values=vals, hole=0.55,
            marker_colors=["#27AE60","#2E86C1","#8E44AD","#7F8C8D","#E67E22"],
            textinfo="label+percent", textfont_size=11))
        fig_pie.update_layout(height=300, margin=dict(l=5,r=5,t=10,b=5),
            paper_bgcolor="white", showlegend=False,
            annotations=[dict(text=f"{uptime_pct:.0f}%<br>Uptime",
                x=0.5,y=0.5,font_size=18,showarrow=False,font_color="#1A3050")])
        st.plotly_chart(fig_pie, use_container_width=True)

    with cr:
        st.markdown('<div class="section-header">Annual P&L Waterfall</div>', unsafe_allow_html=True)
        wf_y   = [F["annual_revenue_$"], -F["annual_energy_cost_$"],
                  -F["annualized_capex_$"], -F["annual_fixed_om_$"], F["annual_net_profit_$"]]
        fig_wf = go.Figure(go.Waterfall(
            measure=["absolute","relative","relative","relative","total"],
            x=["Revenue","Energy Cost","CAPEX","O&M","Net Profit"],
            y=[v/1e3 for v in wf_y],
            connector={"line":{"color":"rgba(0,0,0,0.15)"}},
            increasing={"marker":{"color":"#27AE60"}},
            decreasing={"marker":{"color":"#E74C3C"}},
            totals={"marker":{"color":"#1A4A72"}},
            texttemplate="%{y:+.0f}K", textposition="outside"))
        fig_wf = fmt(fig_wf, 300)
        fig_wf.update_layout(showlegend=False)
        fig_wf.update_yaxes(title_text="CAD $000s")
        st.plotly_chart(fig_wf, use_container_width=True)

    st.markdown('<div class="section-header">Key Performance Indicators</div>', unsafe_allow_html=True)
    rows_kpi = [
        ["GPU Type",              GPU_SPECS[gpu_type]["label"] + (" (custom pricing ✏️)" if custom_pricing else "")],
        ["GPU Unit Cost",         f"${C['_unit_price_cad']:,.0f} CAD" + (" ✏️ overridden" if custom_pricing else " (default)")],
        ["GPU Rental Rate",       f"${C['_rental_hr_cad']:.3f} CAD/hr" + (" ✏️ overridden" if custom_pricing else " (default)")],
        ["GPU Count / Racks",     f"{C['n_gpus']:,} GPUs · {C['n_racks']} racks"],
        ["GPU Electrical Load",   f"{gpu_mw_in:.3f} MW"],
        ["Battery",               f"{batt_mwh_in:.1f} MWh @ {batt_p_in:.1f} MW"],
        ["Grid / BTF Cap",        f"{grid_cap_in:.2f} MW / {btf_cap_in:.2f} MW @ ${btf_price_in:.0f} CAD/MWh"],
        ["",""],
        ["Full-Interval Uptime",  f"{uptime_pct:.2f}%"],
        ["Energy Coverage",       f"{coverage_pct:.2f}%"],
        ["Annual GPU Demand",     f"{D['annual_gpu_demand_mwh']:,.0f} MWh"],
        ["  From Curtailed Wind", f"{D['annual_direct_curt_used_mwh']:,.0f} MWh  ({D['annual_direct_curt_used_mwh']/D['annual_gpu_demand_mwh']*100:.1f}%)"],
        ["  From Battery",        f"{D['annual_batt_used_mwh']:,.0f} MWh  ({D['annual_batt_used_mwh']/D['annual_gpu_demand_mwh']*100:.1f}%)"],
        ["  From Grid",           f"{D['annual_grid_used_mwh']:,.0f} MWh  ({D['annual_grid_used_mwh']/D['annual_gpu_demand_mwh']*100:.1f}%)"],
        ["  From BTF",            f"{D['annual_btf_used_mwh']:,.0f} MWh  ({D['annual_btf_used_mwh']/D['annual_gpu_demand_mwh']*100:.1f}%)"],
        ["Annual Unmet Energy",   f"{D['annual_unmet_mwh']:,.0f} MWh"],
        ["Spilled Curtailment",   f"{D['annual_spilled_curt_mwh']:,.0f} MWh"],
        ["",""],
        ["Annual Revenue",        f"${F['annual_revenue_$']:,.0f}"],
        ["Annual Energy Cost",    f"${F['annual_energy_cost_$']:,.0f}"],
        ["Annualized CAPEX",      f"${F['annualized_capex_$']:,.0f}"],
        ["Fixed O&M",             f"${F['annual_fixed_om_$']:,.0f}"],
        ["Annual Net Profit",     f"${F['annual_net_profit_$']:,.0f}"],
        ["Payback Period",        f"{payback:.1f} years" if payback<99 else ">25 years"],
        ["ROI",                   f"{F['roi_%']:.1f}%"],
    ]
    st.dataframe(pd.DataFrame(rows_kpi, columns=["Metric","Value"]),
                 use_container_width=True, hide_index=True, height=500)

# ══════════════════════ TAB 2 — CURTAILMENT ANALYSIS ═════════════════════════
with tab2:
    monthly = df.groupby("month", as_index=False).agg(
        pot_mwh=("e_pot_mwh","sum"), curt_mwh=("e_curt_mwh","sum"), real_mwh=("e_real_mwh","sum"))
    monthly["curt_rate_%"] = monthly["curt_mwh"] / monthly["pot_mwh"] * 100

    st.markdown('<div class="section-header">Monthly Curtailment Profile</div>', unsafe_allow_html=True)
    fig_m = make_subplots(specs=[[{"secondary_y":True}]])
    fig_m.add_bar(x=monthly["month"], y=monthly["curt_mwh"], name="Curtailed (MWh)",
                  marker_color="#E74C3C", secondary_y=False)
    fig_m.add_bar(x=monthly["month"], y=monthly["real_mwh"],  name="Realized (MWh)",
                  marker_color="#2E86C1", opacity=0.55, secondary_y=False)
    fig_m.add_scatter(x=monthly["month"], y=monthly["curt_rate_%"], name="Curtailment Rate (%)",
                      mode="lines+markers", line=dict(color="#E67E22",width=2),
                      marker_size=6, secondary_y=True)
    fig_m.update_layout(barmode="stack", height=340,
                        margin=dict(l=10,r=10,t=35,b=10),
                        paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                        font=dict(family="Segoe UI"))
    fig_m.update_yaxes(title_text="Energy (MWh)", secondary_y=False)
    fig_m.update_yaxes(title_text="Curtailment Rate (%)", secondary_y=True)
    st.plotly_chart(fig_m, use_container_width=True)

    col_l, col_r = st.columns(2, gap="large")
    with col_l:
        st.markdown('<div class="section-header">Avg Curtailment by Hour of Day</div>', unsafe_allow_html=True)
        hourly = df.groupby("hour", as_index=False).agg(
            curt_mwh=("e_curt_mwh","sum"), pot_mwh=("e_pot_mwh","sum"))
        hourly["curt_rate_%"] = hourly["curt_mwh"] / hourly["pot_mwh"] * 100
        fig_h = go.Figure(go.Bar(x=hourly["hour"], y=hourly["curt_rate_%"],
                                  marker_color="#E74C3C", opacity=0.85))
        fig_h = fmt(fig_h, 280)
        fig_h.update_xaxes(title_text="Hour of Day"); fig_h.update_yaxes(title_text="Curtailment Rate (%)")
        st.plotly_chart(fig_h, use_container_width=True)

    with col_r:
        st.markdown('<div class="section-header">Curtailment Event Duration</div>', unsafe_allow_html=True)
        is_c   = df["p_curt_mw"] > 0
        ev_id  = (is_c & ~is_c.shift(1, fill_value=False)).cumsum()
        ev_id[~is_c] = 0
        events = (df[is_c].assign(event_id=ev_id[is_c])
                  .groupby("event_id", as_index=False)
                  .agg(duration_h=("dt_h","sum"), curt_mwh=("e_curt_mwh","sum")))
        fig_ev = go.Figure(go.Histogram(x=events["duration_h"].clip(upper=24),
                                         nbinsx=30, marker_color="#27AE60", opacity=0.8))
        fig_ev = fmt(fig_ev, 280)
        fig_ev.update_xaxes(title_text="Event Duration (hrs, capped 24h)")
        fig_ev.update_yaxes(title_text="Event Count")
        st.plotly_chart(fig_ev, use_container_width=True)

    n_ev  = len(events)
    top10 = events.nlargest(max(1,n_ev//10),"curt_mwh")
    s10   = top10["curt_mwh"].sum() / events["curt_mwh"].sum() * 100 if n_ev else 0
    e1,e2,e3,e4 = st.columns(4)
    e1.metric("Total Curtailment Events",   f"{n_ev:,}")
    e2.metric("Median Duration",            f"{events['duration_h'].median()*60:.0f} min")
    e3.metric("Longest Event",              f"{events['duration_h'].max():.1f} hrs")
    e4.metric("Top 10% Share of Curtailment",f"{s10:.1f}%")

# ══════════════════════ TAB 3 — SYSTEM SIZING ════════════════════════════════
with tab3:
    st.markdown('<div class="section-header">Battery Size Sweep — Find the Optimal Configuration</div>', unsafe_allow_html=True)
    st.caption("Holding GPU load and grid/BTF caps fixed; sweeping battery capacity to maximise net profit.")

    with st.spinner("Running battery sweep (10 simulations)…"):
        sw = battery_sweep(curt_np.tobytes(), price_np.tobytes(), dt_h,
                           gpu_mw_in, grid_cap_in, btf_cap_in, btf_price_in,
                           curt_price_in, gpu_type, disc_rate_in, proj_life_in,
                           unit_price_override=gpu_unit_price_in,
                           rental_hr_override=gpu_rental_hr_in)

    best  = sw.loc[sw["net_profit_$M"].idxmax()]

    sl, sr = st.columns(2, gap="large")
    with sl:
        fig_s1 = make_subplots(specs=[[{"secondary_y":True}]])
        fig_s1.add_scatter(x=sw["batt_mwh"], y=sw["net_profit_$M"],
                           name="Net Profit ($M)", mode="lines+markers",
                           line=dict(color="#1A7A48",width=3), marker_size=8, secondary_y=False)
        fig_s1.add_scatter(x=sw["batt_mwh"], y=sw["uptime_%"],
                           name="Uptime (%)", mode="lines+markers",
                           line=dict(color="#2E86C1",width=2,dash="dot"), marker_size=6, secondary_y=True)
        fig_s1.add_vline(x=batt_mwh_in, line_dash="dash", line_color="#E67E22",
                         annotation_text=f"Current {batt_mwh_in:.1f} MWh", annotation_position="top right")
        fig_s1.add_vline(x=best["batt_mwh"], line_dash="dot", line_color="#27AE60",
                         annotation_text=f"Optimal {best['batt_mwh']:.1f} MWh", annotation_position="top left")
        fig_s1.update_layout(height=350, margin=dict(l=10,r=10,t=40,b=10),
                             paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                             font=dict(family="Segoe UI"),
                             title="Net Profit & Uptime vs Battery Size")
        fig_s1.update_yaxes(title_text="Annual Net Profit ($M CAD)", secondary_y=False)
        fig_s1.update_yaxes(title_text="Full-Interval Uptime (%)",   secondary_y=True)
        st.plotly_chart(fig_s1, use_container_width=True)

    with sr:
        fig_s2 = make_subplots(specs=[[{"secondary_y":True}]])
        fig_s2.add_scatter(x=sw["batt_mwh"], y=sw["capex_$M"],
                           name="Total CAPEX ($M)", mode="lines+markers",
                           line=dict(color="#E74C3C",width=3), marker_size=8, secondary_y=False)
        fig_s2.add_scatter(x=sw["batt_mwh"], y=sw["payback_yrs"],
                           name="Payback (yrs)", mode="lines+markers",
                           line=dict(color="#E67E22",width=2,dash="dot"), marker_size=6, secondary_y=True)
        fig_s2.add_vline(x=batt_mwh_in, line_dash="dash", line_color="#E67E22")
        fig_s2.update_layout(height=350, margin=dict(l=10,r=10,t=40,b=10),
                             paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                             font=dict(family="Segoe UI"),
                             title="CAPEX & Payback vs Battery Size")
        fig_s2.update_yaxes(title_text="Total CAPEX ($M CAD)", secondary_y=False)
        fig_s2.update_yaxes(title_text="Payback (years)",       secondary_y=True)
        st.plotly_chart(fig_s2, use_container_width=True)

    st.success(f"**Optimal battery: {best['batt_mwh']:.1f} MWh** — "
               f"Net profit ${best['net_profit_$M']:.2f}M/yr · "
               f"Uptime {best['uptime_%']:.1f}% · Payback {best['payback_yrs']:.1f} yrs")

    st.markdown('<div class="section-header">Full Sweep Table</div>', unsafe_allow_html=True)
    st.dataframe(sw.rename(columns={
        "batt_mwh":"Battery (MWh)","uptime_%":"Uptime (%)","coverage_%":"Coverage (%)",
        "net_profit_$M":"Net Profit ($M)","capex_$M":"CAPEX ($M)","payback_yrs":"Payback (yrs)",
        "roi_%":"ROI (%)","avg_cost_$/mwh":"Avg Energy Cost ($/MWh)"}
    ).style.format({
        "Uptime (%)":"{:.1f}","Coverage (%)":"{:.1f}","Net Profit ($M)":"{:+.3f}",
        "CAPEX ($M)":"{:.3f}","Payback (yrs)":"{:.1f}","ROI (%)":"{:.1f}",
        "Avg Energy Cost ($/MWh)":"{:.2f}"
    }).background_gradient(subset=["Net Profit ($M)"], cmap="RdYlGn"),
    use_container_width=True, hide_index=True)

    # GPU rack scale sweep
    st.divider()
    st.markdown('<div class="section-header">GPU Load Sensitivity (rack count)</div>', unsafe_allow_html=True)
    with st.spinner("Running GPU load sweep…"):
        grows = []
        for nr in range(1, 41, 2):
            g_mw = nr * GPUS_PER_RACK * spec["power_kw"] / 1000
            gd = run_dispatch(curt_np, price_np, dt_h, gpu_mw=g_mw,
                              batt_mwh=batt_mwh_in, batt_p_mw=batt_p_in,
                              grid_cap_mw=g_mw/2, btf_cap_mw=g_mw/2,
                              btf_price=btf_price_in, curt_price=curt_price_in)
            gc = compute_capex(g_mw, batt_mwh_in, batt_p_in, gpu_type, disc_rate_in, proj_life_in,
                               unit_price_override=gpu_unit_price_in,
                               rental_hr_override=gpu_rental_hr_in)
            gf = compute_financials(gd, gc, gd["full_supply_interval_share"])
            grows.append({"n_racks":nr,"uptime_%":gd["full_supply_interval_share"]*100,
                          "profit_$M":gf["annual_net_profit_$"]/1e6})
    gdf = pd.DataFrame(grows)
    fig_gr = make_subplots(specs=[[{"secondary_y":True}]])
    fig_gr.add_scatter(x=gdf["n_racks"], y=gdf["profit_$M"], name="Net Profit ($M)",
                       mode="lines+markers", line=dict(color="#1A7A48",width=3), marker_size=7, secondary_y=False)
    fig_gr.add_scatter(x=gdf["n_racks"], y=gdf["uptime_%"], name="Uptime (%)",
                       mode="lines+markers", line=dict(color="#2E86C1",width=2,dash="dot"), marker_size=5, secondary_y=True)
    fig_gr.add_vline(x=n_racks_in, line_dash="dash", line_color="#E67E22",
                     annotation_text="Current", annotation_position="top right")
    fig_gr.update_layout(height=320, margin=dict(l=10,r=10,t=40,b=10),
                         paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                         font=dict(family="Segoe UI"), title="Profit & Uptime vs GPU Racks")
    fig_gr.update_xaxes(title_text="Number of GPU Racks")
    fig_gr.update_yaxes(title_text="Annual Net Profit ($M CAD)", secondary_y=False)
    fig_gr.update_yaxes(title_text="Full-Interval Uptime (%)",   secondary_y=True)
    st.plotly_chart(fig_gr, use_container_width=True)

# ══════════════════════ TAB 4 — FINANCIAL MODEL ══════════════════════════════
with tab4:
    fa, fb = st.columns(2, gap="large")

    with fa:
        st.markdown('<div class="section-header">CAPEX Breakdown</div>', unsafe_allow_html=True)
        cap_l = ["Battery Energy","Battery Power/PCS","GPU Hardware","Rack Infrastructure"]
        cap_v = [C["capex_batt_energy_$"],C["capex_batt_power_$"],C["capex_gpu_$"],C["capex_rack_$"]]
        fig_cap = go.Figure(go.Pie(labels=cap_l, values=cap_v, hole=0.45,
            marker_colors=["#2E86C1","#1A5276","#27AE60","#7D3C98"],
            textinfo="label+percent", textfont_size=11))
        fig_cap.update_layout(height=320, margin=dict(l=5,r=5,t=10,b=5),
                               paper_bgcolor="white", showlegend=False)
        st.plotly_chart(fig_cap, use_container_width=True)
        st.dataframe(pd.DataFrame([
            ["Battery (Energy)",    f"${C['capex_batt_energy_$']:,.0f}"],
            ["Battery (Power/PCS)", f"${C['capex_batt_power_$']:,.0f}"],
            ["GPU Hardware",        f"${C['capex_gpu_$']:,.0f}"],
            ["Rack Infrastructure", f"${C['capex_rack_$']:,.0f}"],
            ["Total CAPEX",         f"${C['capex_total_$']:,.0f}"],
            ["Annualized CAPEX",    f"${C['annualized_capex_$']:,.0f}/yr"],
            ["Fixed O&M (5%)",      f"${C['annual_fixed_om_$']:,.0f}/yr"],
        ], columns=["Component","Amount (CAD)"]), use_container_width=True, hide_index=True)

    with fb:
        st.markdown('<div class="section-header">Cumulative Cash Flow (NPV)</div>', unsafe_allow_html=True)
        years    = list(range(proj_life_in+1))
        ann_cf   = F["annual_revenue_$"] - F["annual_energy_cost_$"] - F["annual_fixed_om_$"]
        cf0      = -C["capex_total_$"]
        cum, dcum = [cf0], [cf0]
        for yr in range(1, proj_life_in+1):
            cum.append(cum[-1] + ann_cf)
            dcum.append(dcum[-1] + ann_cf/(1+disc_rate_in)**yr)
        fig_npv = go.Figure()
        fig_npv.add_scatter(x=years, y=[v/1e6 for v in cum],
                            name="Undiscounted", mode="lines",
                            line=dict(color="#27AE60",width=2),
                            fill="tozeroy", fillcolor="rgba(39,174,96,0.08)")
        fig_npv.add_scatter(x=years, y=[v/1e6 for v in dcum],
                            name="NPV (discounted)", mode="lines",
                            line=dict(color="#1A4A72",width=3))
        fig_npv.add_hline(y=0, line_color="black", line_width=1)
        fig_npv = fmt(fig_npv, 300)
        fig_npv.update_xaxes(title_text="Year")
        fig_npv.update_yaxes(title_text="Cumulative Cash Flow ($M CAD)")
        st.plotly_chart(fig_npv, use_container_width=True)
        st.dataframe(pd.DataFrame([
            ["Annual Revenue",   f"${F['annual_revenue_$']:,.0f}",  f"${C['_rental_hr_cad']:.3f} CAD/hr × {C['n_gpus']} GPUs × {uptime_pct/100*8760:.0f} hrs"],
            ["Energy Cost",      f"${F['annual_energy_cost_$']:,.0f}", "Grid + BTF + curtailment purchase"],
            ["Annualized CAPEX", f"${F['annualized_capex_$']:,.0f}",   f"CRF={crf(disc_rate_in,proj_life_in):.4f}"],
            ["Fixed O&M",        f"${F['annual_fixed_om_$']:,.0f}",    "5% of total CAPEX"],
            ["Net Profit",       f"${F['annual_net_profit_$']:,.0f}",  "Revenue − all costs"],
        ], columns=["Line Item","Annual (CAD)","Notes"]), use_container_width=True, hide_index=True)

    # GPU type comparison
    st.divider()
    override_note = (
        f" · ✏️ {gpu_type} uses custom pricing (${gpu_unit_price_in:,.0f}/unit, ${gpu_rental_hr_in:.3f}/hr)"
        if custom_pricing else ""
    )
    st.markdown(f'<div class="section-header">GPU Type Comparison (same rack count & battery{override_note})</div>',
                unsafe_allow_html=True)
    comp = []
    for gn, gs in GPU_SPECS.items():
        g_mw = n_gpus_in * gs["power_kw"] / 1000
        # Apply overrides only to the currently selected GPU type
        u_ov = gpu_unit_price_in if (custom_pricing and gn == gpu_type) else None
        r_ov = gpu_rental_hr_in  if (custom_pricing and gn == gpu_type) else None
        gd   = run_dispatch(curt_np, price_np, dt_h, gpu_mw=g_mw,
                            batt_mwh=batt_mwh_in, batt_p_mw=batt_p_in,
                            grid_cap_mw=grid_cap_in, btf_cap_mw=btf_cap_in,
                            btf_price=btf_price_in, curt_price=curt_price_in)
        gc   = compute_capex(g_mw, batt_mwh_in, batt_p_in, gn, disc_rate_in, proj_life_in,
                             unit_price_override=u_ov, rental_hr_override=r_ov)
        gf   = compute_financials(gd, gc, gd["full_supply_interval_share"])
        label = gs["label"] + (" ✏️" if (custom_pricing and gn == gpu_type) else "")
        comp.append({"GPU": label, "Load (MW)":f"{g_mw:.3f}",
                     "Uptime (%)":f"{gd['full_supply_interval_share']*100:.1f}",
                     "CAPEX ($M)":f"{gc['capex_total_$']/1e6:.2f}",
                     "Revenue ($K)":f"{gf['annual_revenue_$']/1e3:.0f}",
                     "Net Profit ($K)":f"{gf['annual_net_profit_$']/1e3:+.0f}",
                     "Payback (yrs)":f"{gf['payback_years']:.1f}" if gf['payback_years']<99 else ">25",
                     "ROI (%)":f"{gf['roi_%']:.1f}"})
    st.dataframe(pd.DataFrame(comp), use_container_width=True, hide_index=True)
    fig_cmp = go.Figure(go.Bar(
        x=[r["GPU"] for r in comp],
        y=[float(r["Net Profit ($K)"]) for r in comp],
        marker_color=["#27AE60" if float(r["Net Profit ($K)"])>0 else "#E74C3C" for r in comp],
        text=[f"${r['Net Profit ($K)']}K" for r in comp], textposition="outside"))
    fig_cmp = fmt(fig_cmp, 270)
    fig_cmp.update_layout(showlegend=False)
    fig_cmp.update_yaxes(title_text="Annual Net Profit ($000s CAD)")
    st.plotly_chart(fig_cmp, use_container_width=True)

# ══════════════════════ TAB 5 — ENERGY DISPATCH ══════════════════════════════
with tab5:
    n_last   = 14 * 24 * 6
    idx      = slice(-n_last, None)
    ts_plot  = df["t_stamp"].iloc[idx].reset_index(drop=True)
    soc_plot = D["_soc"][idx]
    srv_plot = D["_served"][idx]
    curt_plt = curt_np[idx]
    price_plt= price_np[idx]

    st.markdown('<div class="section-header">Energy Dispatch — Last 14 Days</div>', unsafe_allow_html=True)
    fig_d = make_subplots(rows=3, cols=1, shared_xaxes=True, vertical_spacing=0.06,
                          subplot_titles=["Curtailed Wind Available (MW)",
                                          "Battery State of Charge (MWh)",
                                          "GPU Uptime (1 = On, 0 = Off)"])
    fig_d.add_scatter(row=1,col=1, x=ts_plot, y=curt_plt, fill="tozeroy",
                      line=dict(color="#E74C3C",width=1), fillcolor="rgba(231,76,60,0.2)", name="Curtailed MW")
    fig_d.add_hline(y=gpu_mw_in, row=1, col=1, line_dash="dash", line_color="#1A4A72",
                    annotation_text=f"GPU load {gpu_mw_in:.3f} MW")
    fig_d.add_scatter(row=2,col=1, x=ts_plot, y=soc_plot, fill="tozeroy",
                      line=dict(color="#27AE60",width=1), fillcolor="rgba(39,174,96,0.2)", name="SOC MWh")
    fig_d.add_hline(y=batt_mwh_in, row=2, col=1, line_dash="dot", line_color="#7D3C98",
                    annotation_text=f"Capacity {batt_mwh_in:.1f} MWh")
    fig_d.add_scatter(row=3,col=1, x=ts_plot, y=srv_plot, fill="tozeroy",
                      line=dict(color="#1A4A72",width=0.8), fillcolor="rgba(26,74,114,0.25)", name="Uptime")
    fig_d.update_layout(height=520, margin=dict(l=10,r=10,t=60,b=10),
                        paper_bgcolor="white", plot_bgcolor="#FAFBFC",
                        font=dict(family="Segoe UI"), showlegend=False)
    st.plotly_chart(fig_d, use_container_width=True)

    st.markdown('<div class="section-header">AESO Pool Price — Last 14 Days</div>', unsafe_allow_html=True)
    fig_pp = go.Figure(go.Scatter(x=ts_plot, y=price_plt, mode="lines",
                                   line=dict(color="#E67E22",width=1.2), fill="tozeroy",
                                   fillcolor="rgba(230,126,34,0.10)"))
    fig_pp = fmt(fig_pp, 200)
    fig_pp.update_yaxes(title_text="Pool Price (CAD/MWh)")
    st.plotly_chart(fig_pp, use_container_width=True)

    # Uptime block distribution
    st.markdown('<div class="section-header">Uptime Block Distribution</div>', unsafe_allow_html=True)
    all_srv = D["_served"]; run_h, runs = 0, []
    for x in all_srv:
        if x: run_h += 1
        elif run_h > 0: runs.append(run_h * dt_h); run_h = 0
    if run_h > 0: runs.append(run_h * dt_h)
    if runs:
        ra = np.array(runs)
        ub1, ub2 = st.columns([2,1])
        fig_rb = go.Figure(go.Histogram(x=ra, nbinsx=40, marker_color="#27AE60", opacity=0.85))
        fig_rb = fmt(fig_rb, 240)
        fig_rb.update_xaxes(title_text="Contiguous Uptime Block (hours)")
        fig_rb.update_yaxes(title_text="Count")
        ub1.plotly_chart(fig_rb, use_container_width=True)
        ub2.markdown(f"""
**Uptime block stats**
- Total blocks: **{len(ra):,}**
- Mean: **{ra.mean():.1f} hrs**
- Median: **{np.median(ra):.1f} hrs**
- P90: **{np.percentile(ra,90):.1f} hrs**
- Longest: **{ra.max():.1f} hrs**
- Blocks ≥ 8 h: **{(ra>=8).sum():,}**
- Blocks ≥ 24 h: **{(ra>=24).sum():,}**
        """)
    else:
        st.info("No uptime blocks detected with current configuration.")
