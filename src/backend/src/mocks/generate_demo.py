"""
Demo data generation for wind curtailment time series.
Ported from mockup.py (lines 78-114).
"""
import numpy as np
import pandas as pd
from datetime import datetime


def generate_demo_data(seed: int = 42, year: int = 2024) -> pd.DataFrame:
    """
    Generate realistic synthetic 10-minute wind curtailment time series.
    
    Features:
    - Seasonal variation (higher potential in winter)
    - Diurnal variation (wind patterns by hour of day)
    - Realistic congestion probability
    - Log-normal pool price distribution
    
    Args:
        seed: Random seed for reproducibility
        year: Year for time series (2024 is leap year = 366 days)
    
    Returns:
        DataFrame with 52,704 rows (10-min resolution for leap year)
    """
    rng = np.random.default_rng(seed)
    periods = 24 * 6 * 366  # 10-min intervals for 2024 leap year
    ts = pd.date_range(f"{year}-01-01", periods=periods, freq="10min")
    doy = ts.dayofyear.to_numpy()
    hour = ts.hour.to_numpy() + ts.minute.to_numpy() / 60
    
    # Seasonal pattern: peak in winter (day 30), low in summer
    seasonal = 0.55 + 0.25 * np.cos(2 * np.pi * (doy - 30) / 366)
    
    # Diurnal pattern: slight variation by hour
    diurnal = 1.00 - 0.15 * np.sin(2 * np.pi * hour / 24)
    
    # Add noise and smooth
    noise = pd.Series(rng.normal(0, 0.10, periods)).rolling(6, center=True, min_periods=1).mean().to_numpy()
    
    # Potential generation (MW) - clipped to reasonable range
    potential = np.clip(seasonal * diurnal + noise, 0.05, 1.0)
    
    # Congestion probability varies by season and time of day
    cong_prob = 0.18 + 0.12 * np.sin(2 * np.pi * (doy - 90) / 366)
    cong_prob += 0.08 * (1 - np.cos(2 * np.pi * hour / 24)) / 2
    
    # Generate curtailment events
    is_curt = rng.random(periods) < cong_prob
    curt_frac = rng.beta(2.0, 5.0, periods) * 0.6
    curt_raw = np.where(is_curt, potential * curt_frac, 0.0)
    
    # Smooth curtailment slightly
    curtailed = np.clip(
        pd.Series(curt_raw).rolling(3, min_periods=1).mean().to_numpy(),
        0,
        potential
    )
    
    # Pool price: seasonal baseline + lognormal variation
    base_price = 55 + 25 * np.sin(2 * np.pi * (doy - 150) / 366)
    pool_price = np.clip(base_price * rng.lognormal(0, 0.35, periods), 5, 350)
    
    dt_h = 1 / 6  # 10 minutes = 1/6 hour
    
    return pd.DataFrame({
        "t_stamp": ts,
        "p_pot_mw": potential,
        "p_curt_mw": curtailed,
        "p_real_mw": np.clip(potential - curtailed, 0, None),
        "e_pot_mwh": potential * dt_h,
        "e_curt_mwh": curtailed * dt_h,
        "e_real_mwh": np.clip(potential - curtailed, 0, None) * dt_h,
        "pool_price": pool_price,
        "dt_h": dt_h,
        "month": ts.to_period("M").astype(str),
        "hour": ts.hour,
    })
