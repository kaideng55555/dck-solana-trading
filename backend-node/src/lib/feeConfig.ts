/**
 * Fee configuration and utilities
 * Handles platform fee calculation and wallet validation
 */

import { PublicKey } from '@solana/web3.js';

interface FeeConfig {
  feeWallet: string;
  feePercentage: number;
  enabled: boolean;
}

let feeConfig: FeeConfig | null = null;

/**
 * Load fee configuration from environment
 */
export function loadFeeConfig(): FeeConfig {
  console.log('🔧 loadFeeConfig() function entered');
  const feeWallet = process.env.FEE_WALLET || '';
  const feePercentage = parseFloat(process.env.FEE_PERCENTAGE || '1.0');
  // Debug visibility for env loading sequence (safe to log wallet address)
  console.log(`🔍 Raw env FEE_WALLET='${feeWallet}' FEE_PERCENTAGE='${process.env.FEE_PERCENTAGE || '1.0'}'`);
  console.log(`🔍 Full process.env.FEE_WALLET: '${process.env.FEE_WALLET}'`);

  // Validate fee wallet if provided
  let enabled = false;
  if (feeWallet && feeWallet !== 'YourSolanaWalletAddressHere') {
    try {
      new PublicKey(feeWallet);
      enabled = true;
      console.log(`💰 Fee collection enabled: ${feeWallet.slice(0, 4)}...${feeWallet.slice(-4)} (${feePercentage}%)`);
    } catch (e) {
      console.warn('⚠️ Invalid FEE_WALLET address, fee collection disabled');
    }
  } else {
    console.log('ℹ️ Fee collection disabled (no FEE_WALLET configured)');
  }

  feeConfig = {
    feeWallet,
    feePercentage: Math.max(0, Math.min(100, feePercentage)), // Clamp 0-100
    enabled,
  };

  return feeConfig;
}

/**
 * Get current fee configuration
 */
export function getFeeConfig(): FeeConfig {
  if (!feeConfig) {
    return loadFeeConfig();
  }
  return feeConfig;
}

/**
 * Calculate fee amount from input
 */
export function calculateFee(amount: number): { feeAmount: number; netAmount: number } {
  const config = getFeeConfig();
  
  if (!config.enabled || config.feePercentage === 0) {
    return {
      feeAmount: 0,
      netAmount: amount,
    };
  }

  const feeAmount = Math.floor(amount * (config.feePercentage / 100));
  const netAmount = amount - feeAmount;

  return {
    feeAmount,
    netAmount,
  };
}

/**
 * Calculate fee from output (used when user specifies desired output amount)
 */
export function calculateFeeFromOutput(desiredOutput: number): { 
  totalInput: number;
  feeAmount: number;
  netOutput: number;
} {
  const config = getFeeConfig();
  
  if (!config.enabled || config.feePercentage === 0) {
    return {
      totalInput: desiredOutput,
      feeAmount: 0,
      netOutput: desiredOutput,
    };
  }

  // If user wants X out, and fee is Y%, then totalInput = X / (1 - Y/100)
  const totalInput = Math.ceil(desiredOutput / (1 - config.feePercentage / 100));
  const feeAmount = totalInput - desiredOutput;

  return {
    totalInput,
    feeAmount,
    netOutput: desiredOutput,
  };
}

/**
 * Validate that fee wallet is configured and valid
 */
export function validateFeeWallet(): { valid: boolean; error?: string } {
  const config = getFeeConfig();

  if (!config.enabled) {
    return { valid: false, error: 'Fee collection not enabled' };
  }

  try {
    new PublicKey(config.feeWallet);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid fee wallet address' };
  }
}

/**
 * Get fee wallet public key
 */
export function getFeeWalletPubkey(): PublicKey | null {
  const config = getFeeConfig();
  
  if (!config.enabled) {
    return null;
  }

  try {
    return new PublicKey(config.feeWallet);
  } catch (e) {
    return null;
  }
}
