// ─── Supabase table shapes (raw reads) ───────────────────────────────────────

export interface MoatRecord {
  id: string;
  contract_address: string;
  name: string;
  image_url: string | null;
}

export interface TokenRecord {
  id: string;
  contract_address: string;
  symbol: string;
  decimals: number;
}

export interface EarlyExitRow {
  id: string;
  contract_address: string;
  wallet: string;
  amount: string;          // 18-decimal wei string
  fee: string;             // 18-decimal wei string
  token_contract: string;
  lock_index: number | null;
  tx_hash: string;
  block_number: number;
  exited_at: string;       // ISO timestamp
}

export interface TraitorSummaryRow {
  wallet: string;
  contract_address: string;
  total_fee_paid: string;          // 18-decimal wei string
  avg_fee_percent_scaled: number;  // (fee/amount)*10000, e.g. 6750 = 67.50%
  paid_exit_count: number;
  total_amount_exited: string;     // 18-decimal wei string
  last_exit_at: string;            // ISO timestamp
  last_tx_hash: string;
  updated_at: string;
}

export interface SyncStateRow {
  id: number;
  last_block_number: number;
  last_synced_at: string;
}

// ─── Derived / enriched shapes ────────────────────────────────────────────────

export interface TraitorEntry {
  wallet: string;
  contractAddress: string;
  moatName: string;
  moatImageUrl: string | null;
  tokenSymbol: string;

  // Raw BigInt values (for sorting and math)
  totalFeePaid: bigint;
  totalAmountExited: bigint;
  avgFeePercentScaled: number;   // stored as integer ×100, e.g. 6750 = 67.50%

  paidExitCount: number;
  lastExitAt: string;
  lastTxHash: string;
}

// ─── Pillory types ────────────────────────────────────────────────────────────

export type PilloryKind = 'greedy' | 'reckless' | 'faithless';

export interface PilloryColumn {
  kind: PilloryKind;
  title: string;
  subtitle: string;
  /** What metric is ranked */
  rankLabel: string;
  top5: TraitorEntry[];
}

// ─── Moat card shape (for the grid) ──────────────────────────────────────────

export interface MoatCardData {
  contractAddress: string;
  name: string;
  imageUrl: string | null;
  tokenSymbol: string;
  totalExits: number;
  totalFeePaid: bigint;
  topTraitor: TraitorEntry | null;
}

// ─── Wallet standing ─────────────────────────────────────────────────────────

export type LoyaltyTier = 'loyal' | 'watched' | 'endangered' | 'named';

export interface WalletStanding {
  wallet: string;
  exits: TraitorEntry[];                // one entry per moat they've exited in
  totalFeePaid: bigint;
  avgFeePercentScaled: number;
  totalPaidExits: number;
  loyaltyTier: LoyaltyTier;
  /** Distance from #5 spot in each pillory, null if not relevant */
  greedyGap: bigint | null;
  recklessGap: number | null;           // in avg_fee_percent_scaled units
  faithlessGap: number | null;
  inPillory: PilloryKind[];
}
