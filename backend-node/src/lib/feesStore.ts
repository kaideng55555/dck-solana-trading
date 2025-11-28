/**
 * Shared fee recording utility
 * Allows recording fees from anywhere in the backend
 */

export interface FeeEvent {
  ts: number;
  source: string;
  amountLamports: number;
  tx?: string;
  note?: string;
}

type RecordFeeFunc = (event: FeeEvent) => void;

let recordFeeFunc: RecordFeeFunc | null = null;

/**
 * Set the fee recording function (called by feesAdmin during initialization)
 */
export function setRecordFeeFunc(fn: RecordFeeFunc): void {
  recordFeeFunc = fn;
}

/**
 * Record a fee event (can be called from anywhere in the backend)
 */
export async function recordFee(event: FeeEvent): Promise<void> {
  if (recordFeeFunc) {
    recordFeeFunc(event);
  } else {
    console.warn('[feesStore] recordFee called but no recording function set');
  }
}
