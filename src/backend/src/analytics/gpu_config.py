"""
GPU configuration, specifications, and CAPEX calculations.
Extracted from application/mockup.py (lines 59-73, 239-270).
"""
import math
from typing import Any
from pydantic import BaseModel, Field


# Constants - All values in CAD (from mockup.py lines 61-66)
GPUS_PER_RACK = 8
RACK_PRICE_CAD = 8_000  # CAD per rack
BATT_COST_PER_KWH = 220  # CAD/kWh (energy component)
BATT_COST_PER_KW = 130   # CAD/kW (power/PCS component)
FIXED_OM_FRAC = 0.05     # 5% of CAPEX/yr


# GPU specifications - All prices in CAD (from mockup.py lines 68-73)
GPU_SPECS = {
    "RTX 3090": {
        "power_kw": 0.350,
        "unit_price_cad": 900,  # CAD
        "rental_hr_cad": 0.13,  # CAD/hr
        "label": "RTX 3090 (Entry / Inference)"
    },
    "RTX 5090": {
        "power_kw": 0.58,
        "unit_price_cad": 2_000,  # CAD
        "rental_hr_cad": 0.37,  # CAD/hr
        "label": "RTX 5090 (Mid-tier / AI)"
    },
    "A6000": {
        "power_kw": 0.300,
        "unit_price_cad": 6_000,  # CAD
        "rental_hr_cad": 0.37,  # CAD/hr
        "label": "A6000 (Pro / Data Science)"
    },
    "PRO 6000": {
        "power_kw": 0.600,
        "unit_price_cad": 8_000,  # CAD
        "rental_hr_cad": 0.80,  # CAD/hr
        "label": "PRO 6000 (High-perf / LLM)"
    },
}


class GpuSpecs(BaseModel):
    """GPU specifications with type safety."""
    power_kw: float = Field(..., gt=0, description="GPU power consumption in kW")
    unit_price_cad: float = Field(..., gt=0, description="GPU unit price in CAD")
    rental_hr_cad: float = Field(..., gt=0, description="GPU rental rate in CAD/hr")
    label: str = Field(..., description="GPU display label")


class CapexBreakdown(BaseModel):
    """CAPEX calculation results with detailed breakdown."""
    n_gpus: int = Field(..., ge=1, description="Number of GPUs")
    n_racks: int = Field(..., ge=1, description="Number of racks")
    capex_batt_energy_$: float = Field(..., ge=0, description="Battery energy CAPEX ($)")
    capex_batt_power_$: float = Field(..., ge=0, description="Battery power/PCS CAPEX ($)")
    capex_gpu_$: float = Field(..., ge=0, description="GPU hardware CAPEX ($)")
    capex_rack_$: float = Field(..., ge=0, description="Rack infrastructure CAPEX ($)")
    capex_total_$: float = Field(..., ge=0, description="Total CAPEX ($)")
    annualized_capex_$: float = Field(..., ge=0, description="Annualized CAPEX ($)")
    annual_fixed_om_$: float = Field(..., ge=0, description="Annual fixed O&M ($)")
    annual_rental_price_$: float = Field(..., ge=0, description="Annual rental revenue ($)")
    _unit_price_cad: float = Field(..., description="Effective GPU unit price (CAD)")
    _rental_hr_cad: float = Field(..., description="Effective GPU rental rate (CAD/hr)")


def get_gpu_specs(gpu_type: str) -> dict[str, Any]:
    """
    Return specifications for a GPU type.
    
    Args:
        gpu_type: GPU model key (e.g., "RTX 3090", "RTX 5090", "A6000", "PRO 6000")
    
    Returns:
        Dictionary with power_kw, unit_price_cad, rental_hr_cad, label
    
    Raises:
        KeyError: If gpu_type is not found in GPU_SPECS
    """
    return GPU_SPECS[gpu_type]


def crf(r: float, n: int) -> float:
    """
    Calculate Capital Recovery Factor.
    
    Args:
        r: Discount rate (e.g., 0.08 for 8%)
        n: Project lifetime (years)
    
    Returns:
        Capital Recovery Factor
    """
    if r > 1e-9:
        return r * (1 + r)**n / ((1 + r)**n - 1)
    return 1.0 / n


def compute_capex(
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float,
    gpu_type: str,
    discount_rate: float = 0.08,
    project_life: int = 12,
    unit_price_override: float | None = None,
    rental_hr_override: float | None = None,
) -> dict[str, Any]:
    """
    Calculate CAPEX breakdown for GPU + battery system.
    
    Args:
        gpu_mw: GPU load capacity (MW)
        batt_mwh: Battery energy capacity (MWh)
        batt_p_mw: Battery power capacity (MW)
        gpu_type: GPU model key (from GPU_SPECS)
        discount_rate: Discount rate for CRF calculation (default: 0.08)
        project_life: Project lifetime in years (default: 12)
        unit_price_override: Custom GPU unit price (CAD) - overrides spec default
        rental_hr_override: Custom rental rate (CAD/hr) - overrides spec default
    
    Returns:
        Dictionary with CAPEX breakdown and annualized values:
        - n_gpus: Number of GPUs
        - n_racks: Number of racks
        - capex_batt_energy_$: Battery energy CAPEX
        - capex_batt_power_$: Battery power/PCS CAPEX
        - capex_gpu_$: GPU hardware CAPEX
        - capex_rack_$: Rack infrastructure CAPEX
        - capex_total_$: Total CAPEX
        - annualized_capex_$: Annualized CAPEX
        - annual_fixed_om_$: Annual fixed O&M (5% of CAPEX)
        - annual_rental_price_$: Annual rental revenue
        - _unit_price_cad: Effective GPU unit price
        - _rental_hr_cad: Effective GPU rental rate
    """
    spec = GPU_SPECS[gpu_type]
    
    # Calculate number of GPUs and racks from power requirement
    n_gpus = max(1, int(gpu_mw * 1000 / spec["power_kw"]))
    n_racks = math.ceil(n_gpus / GPUS_PER_RACK)
    
    # Battery CAPEX components
    cap_batt_e = batt_mwh * 1000 * BATT_COST_PER_KWH
    cap_batt_p = batt_p_mw * 1000 * BATT_COST_PER_KW
    
    # GPU and rack CAPEX with optional overrides
    unit_price = unit_price_override if unit_price_override is not None else spec["unit_price_cad"]
    rental_hr = rental_hr_override if rental_hr_override is not None else spec["rental_hr_cad"]
    cap_gpu = n_gpus * unit_price
    cap_rack = n_racks * RACK_PRICE_CAD
    
    # Total CAPEX and annualization
    cap_total = cap_batt_e + cap_batt_p + cap_gpu + cap_rack
    ann_capex = cap_total * crf(discount_rate, project_life)
    fixed_om = cap_total * FIXED_OM_FRAC
    
    return {
        "n_gpus": n_gpus,
        "n_racks": n_racks,
        "capex_batt_energy_$": cap_batt_e,
        "capex_batt_power_$": cap_batt_p,
        "capex_gpu_$": cap_gpu,
        "capex_rack_$": cap_rack,
        "capex_total_$": cap_total,
        "annualized_capex_$": ann_capex,
        "annual_fixed_om_$": fixed_om,
        "annual_rental_price_$": n_gpus * rental_hr * 8760,
        "_unit_price_cad": unit_price,
        "_rental_hr_cad": rental_hr,
    }
