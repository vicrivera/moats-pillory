import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchMoats,
  fetchTokens,
  fetchTraitorSummaries,
  fetchSyncState,
} from '../api/supabase.queries';
import { parseBigInt } from '../lib/format';
import type {
  TraitorEntry,
  PilloryColumn,
  MoatCardData,
  MoatRecord,
  TokenRecord,
  TraitorSummaryRow,
} from '../types/pillory.types';

const TOP_N = 5;
const GLOBAL_TOP = 10;

// ─── Enrichment helper ────────────────────────────────────────────────────────

function enrichSummary(
  row: TraitorSummaryRow,
  moatMap: Map<string, MoatRecord>,
  tokenMap: Map<string, TokenRecord>,
): TraitorEntry {
  const moat  = moatMap.get(row.contract_address.toLowerCase());
  const token = tokenMap.get(row.contract_address.toLowerCase());

  return {
    wallet:               row.wallet,
    contractAddress:      row.contract_address,
    moatName:             moat?.name        ?? row.contract_address.slice(0, 8),
    moatImageUrl:         moat?.image_url   ?? null,
    tokenSymbol:          token?.symbol     ?? '???',
    totalFeePaid:         parseBigInt(row.total_fee_paid),
    totalAmountExited:    parseBigInt(row.total_amount_exited),
    avgFeePercentScaled:  row.avg_fee_percent_scaled,
    paidExitCount:        row.paid_exit_count,
    lastExitAt:           row.last_exit_at,
    lastTxHash:           row.last_tx_hash,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePilloryDataResult {
  pillories:     PilloryColumn[];
  globalTop10:   TraitorEntry[];
  moatCards:     MoatCardData[];
  lastSyncedAt:  string | null;
  isLoading:     boolean;
  isError:       boolean;
  error:         Error | null;
}

export function usePilloryData(): UsePilloryDataResult {
  const moatsQuery     = useQuery({ queryKey: ['moats'],     queryFn: fetchMoats,            staleTime: 5 * 60_000 });
  const tokensQuery    = useQuery({ queryKey: ['tokens'],    queryFn: fetchTokens,            staleTime: 5 * 60_000 });
  const summaryQuery   = useQuery({ queryKey: ['traitor-summary'], queryFn: fetchTraitorSummaries, staleTime: 60_000, refetchInterval: 60_000 });
  const syncQuery      = useQuery({ queryKey: ['sync-state'], queryFn: fetchSyncState,        staleTime: 60_000, refetchInterval: 60_000 });

  const isLoading = moatsQuery.isLoading || tokensQuery.isLoading || summaryQuery.isLoading;
  const isError   = moatsQuery.isError   || tokensQuery.isError   || summaryQuery.isError;
  const error     = (moatsQuery.error ?? tokensQuery.error ?? summaryQuery.error) as Error | null;

  const derived = useMemo(() => {
    if (!moatsQuery.data || !tokensQuery.data || !summaryQuery.data) {
      return { pillories: [], globalTop10: [], moatCards: [] };
    }

    // Build lookup maps — always lowercase keys
    const moatMap = new Map<string, MoatRecord>(
      moatsQuery.data.map((m) => [m.contract_address.toLowerCase(), m]),
    );

    // Token map keyed by moat contract_address (tokens table uses contract_address)
    const tokenMap = new Map<string, TokenRecord>(
      tokensQuery.data.map((t) => [t.contract_address.toLowerCase(), t]),
    );

    // Enrich all summaries
    const entries: TraitorEntry[] = summaryQuery.data.map((row) =>
      enrichSummary(row, moatMap, tokenMap),
    );

    // ── Three Pillories ────────────────────────────────────────────────────

    const pillories: PilloryColumn[] = [
      {
        kind:      'greedy',
        title:     'Pillory of the Greedy',
        subtitle:  'Highest penalty fee burned',
        rankLabel: 'Fee Burned',
        top5: [...entries]
          .sort((a, b) => (b.totalFeePaid > a.totalFeePaid ? 1 : -1))
          .slice(0, TOP_N),
      },
      {
        kind:      'reckless',
        title:     'Pillory of the Reckless',
        subtitle:  'Highest average penalty %',
        rankLabel: 'Avg Penalty',
        top5: [...entries]
          .sort((a, b) => b.avgFeePercentScaled - a.avgFeePercentScaled)
          .slice(0, TOP_N),
      },
      {
        kind:      'faithless',
        title:     'Pillory of the Faithless',
        subtitle:  'Most fee-paying exits',
        rankLabel: 'Exits',
        top5: [...entries]
          .sort((a, b) => b.paidExitCount - a.paidExitCount)
          .slice(0, TOP_N),
      },
    ];

    // ── Global Top 10 (by total fee paid) ─────────────────────────────────

    // Aggregate across moats per wallet
    const globalByWallet = new Map<string, TraitorEntry>();
    for (const entry of entries) {
      const key      = entry.wallet.toLowerCase();
      const existing = globalByWallet.get(key);
      if (!existing) {
        globalByWallet.set(key, { ...entry });
      } else {
        const combined: TraitorEntry = {
          ...existing,
          totalFeePaid:      existing.totalFeePaid + entry.totalFeePaid,
          totalAmountExited: existing.totalAmountExited + entry.totalAmountExited,
          paidExitCount:     existing.paidExitCount + entry.paidExitCount,
          // avg fee percent: weighted mean
          avgFeePercentScaled: Math.round(
            (existing.avgFeePercentScaled * existing.paidExitCount +
              entry.avgFeePercentScaled * entry.paidExitCount) /
              (existing.paidExitCount + entry.paidExitCount),
          ),
          lastExitAt: existing.lastExitAt > entry.lastExitAt
            ? existing.lastExitAt
            : entry.lastExitAt,
          // For global view, moatName is "Multiple" if they appear in >1 moat
          moatName:    'Multiple moats',
          moatImageUrl: null,
        };
        globalByWallet.set(key, combined);
      }
    }

    const globalTop10 = [...globalByWallet.values()]
      .sort((a, b) => (b.totalFeePaid > a.totalFeePaid ? 1 : -1))
      .slice(0, GLOBAL_TOP);

    // ── Moat cards ─────────────────────────────────────────────────────────

    const moatCards: MoatCardData[] = moatsQuery.data.map((moat) => {
      const key      = moat.contract_address.toLowerCase();
      const token    = tokenMap.get(key);
      const moatEnts = entries.filter((e) => e.contractAddress.toLowerCase() === key);

      const totalExits   = moatEnts.reduce((s, e) => s + e.paidExitCount, 0);
      const totalFeePaid = moatEnts.reduce((s, e) => s + e.totalFeePaid, 0n);
      const topTraitor   = moatEnts.length > 0
        ? [...moatEnts].sort((a, b) => (b.totalFeePaid > a.totalFeePaid ? 1 : -1))[0]
        : null;

      return {
        contractAddress: moat.contract_address,
        name:            moat.name,
        imageUrl:        moat.image_url,
        tokenSymbol:     token?.symbol ?? '???',
        totalExits,
        totalFeePaid,
        topTraitor,
      };
    });

    return { pillories, globalTop10, moatCards };
  }, [moatsQuery.data, tokensQuery.data, summaryQuery.data]);

  return {
    ...derived,
    lastSyncedAt: syncQuery.data?.last_synced_at ?? null,
    isLoading,
    isError,
    error,
  };
}
