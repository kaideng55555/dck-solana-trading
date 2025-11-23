# backend/fees.py
# Fractions (0.00300 = 0.300%). Decimal, not percent.

from dataclasses import dataclass
from math import inf
from typing import List, Dict, Any
import os

@dataclass(frozen=True)
class FeeTier:
    max: float
    creator: float
    protocol: float
    lp: float
    total: float
    range: str

BONDING_CURVE_FEES = dict(creator=0.00300, protocol=0.00950, lp=0.00000, total=0.01250)

CANONICAL_FEE_TIERS: List[FeeTier] = [
    FeeTier(420,    0.00300, 0.00930, 0.00020, 0.01250, "0–420 SOL"),

    FeeTier(1470,   0.00950, 0.00050, 0.00200, 0.01200, "420–1470 SOL"),
    FeeTier(2460,   0.00900, 0.00050, 0.00200, 0.01150, "1470–2460 SOL"),
    FeeTier(3440,   0.00850, 0.00050, 0.00200, 0.01100, "2460–3440 SOL"),
    FeeTier(4420,   0.00800, 0.00050, 0.00200, 0.01050, "3440–4420 SOL"),
    FeeTier(9820,   0.00750, 0.00050, 0.00200, 0.01000, "4420–9820 SOL"),
    FeeTier(14740,  0.00700, 0.00050, 0.00200, 0.00950, "9820–14740 SOL"),
    FeeTier(19650,  0.00650, 0.00050, 0.00200, 0.00900, "14740–19650 SOL"),
    FeeTier(24560,  0.00600, 0.00050, 0.00200, 0.00850, "19650–24560 SOL"),
    FeeTier(29470,  0.00550, 0.00050, 0.00200, 0.00800, "24560–29470 SOL"),
    FeeTier(34380,  0.00500, 0.00050, 0.00200, 0.00750, "29470–34380 SOL"),
    FeeTier(39300,  0.00450, 0.00050, 0.00200, 0.00700, "34380–39300 SOL"),
    FeeTier(44210,  0.00400, 0.00050, 0.00200, 0.00650, "39300–44210 SOL"),
    FeeTier(49120,  0.00350, 0.00050, 0.00200, 0.00600, "44210–49120 SOL"),
    FeeTier(54030,  0.00300, 0.00050, 0.00200, 0.00550, "49120–54030 SOL"),
    FeeTier(58940,  0.00275, 0.00050, 0.00200, 0.00525, "54030–58940 SOL"),
    FeeTier(63860,  0.00250, 0.00050, 0.00200, 0.00500, "58940–63860 SOL"),
    FeeTier(68770,  0.00225, 0.00050, 0.00200, 0.00475, "63860–68770 SOL"),
    FeeTier(73681,  0.00200, 0.00050, 0.00200, 0.00450, "68770–73681 SOL"),
    FeeTier(78590,  0.00175, 0.00050, 0.00200, 0.00425, "73681–78590 SOL"),
    FeeTier(83500,  0.00150, 0.00050, 0.00200, 0.00400, "78590–83500 SOL"),
    FeeTier(88400,  0.00125, 0.00050, 0.00200, 0.00375, "83500–88400 SOL"),
    FeeTier(93330,  0.00100, 0.00050, 0.00200, 0.00350, "88400–93330 SOL"),
    FeeTier(98240,  0.00075, 0.00050, 0.00200, 0.00325, "93330–98240 SOL"),

    # Final, ≥ 98,240 SOL
    FeeTier(inf,    0.00050, 0.00050, 0.00200, 0.00300, "≥ 98240 SOL"),
]

def market_cap_sol_from_price_sol(price_sol: float) -> float:
    """Compute SOL market cap from price in SOL (supply fixed at 1B)"""
    return price_sol * 1_000_000_000.0

def get_fee_tier(mcap_sol: float) -> FeeTier:
    """Get the appropriate fee tier based on market cap in SOL"""
    for t in CANONICAL_FEE_TIERS:
        if mcap_sol <= t.max:
            return t
    return CANONICAL_FEE_TIERS[-1]

def calculate_fee_breakdown(amount_tokens: float, price_sol: float, phase: str) -> Dict[str, Any]:
    """
    Calculate fee breakdown for a trade
    
    Args:
        amount_tokens: Number of tokens being traded
        price_sol: Price per token in SOL
        phase: Either 'bonding' or 'canonical'
    
    Returns:
        Dictionary with creator, protocol, lp fees and metadata
    """
    trade_value_sol = amount_tokens * price_sol
    
    if phase == "bonding":
        fees = BONDING_CURVE_FEES
        return {
            "creator": trade_value_sol * fees["creator"],
            "protocol": trade_value_sol * fees["protocol"], 
            "lp": trade_value_sol * fees["lp"],
            "total": trade_value_sol * fees["total"],
            "total_pct": fees["total"],
            "tier": "Bonding Curve",
            "phase": phase
        }
    else:
        mcap_sol = market_cap_sol_from_price_sol(price_sol)
        tier = get_fee_tier(mcap_sol)
        
        return {
            "creator": trade_value_sol * tier.creator,
            "protocol": trade_value_sol * tier.protocol,
            "lp": trade_value_sol * tier.lp, 
            "total": trade_value_sol * tier.total,
            "total_pct": tier.total,
            "tier": tier.range,
            "phase": phase,
            "market_cap_sol": mcap_sol
        }

# Treasury wallet addresses from environment
TREASURY_WALLETS = {
    "protocol": os.getenv("PROTOCOL_TREASURY", "PROTOCOL_TREASURY_ADDRESS_HERE"),
    "creator": os.getenv("CREATOR_TREASURY", "CREATOR_TREASURY_ADDRESS_HERE"), 
    "lp": os.getenv("LP_TREASURY", "LP_TREASURY_ADDRESS_HERE"),
}

def percent(n: float, digits: int = 3) -> str:
    """Format decimal as percentage string"""
    return f"{(n * 100):.{digits}f}%"