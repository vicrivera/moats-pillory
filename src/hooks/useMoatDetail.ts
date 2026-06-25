import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchEarlyExitsByContract, fetchTraitorSummaryByWallet } from '../api/supabase.queries';
import { fetchTraitorSummaries } from '../api/supabase.queries';
import { parseBigInt } from '../lib/format';
import type { TraitorEntry, EarlyExitRow } from '../types/pillory.types';

export interface WeeklyExitPoint {
  week:      string;   // "MMM DD"
  exits:     number;
  feeBurned: number;   // float for chart
}

export interface DurationBucket {
  label:  string;
  count:  number;
}

export interface MoatDetailData {
  topTraitors:      TraitorEntry[];
  weeklyTrend:      WeeklyExitPoint[];
  durationBuckets:  DurationBucket[];
  retentionRate:    number;   // 0-100 percent of locks that completed normally
  repeatExiters:    TraitorEntry[];
  totalFeePaid:     bigint;
  totalExits:       number;
}

const DURATION_BUCKETS: { label: string; maxDays: number }[] = [
  { label: '<7d',    maxDays: 7   },
  { label: '7–30d',  maxDays: 30  },
  { label: '30–90d', maxDays: 90  },
  { label: '90d+',   maxDays: Infinity },
];

function weekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useMoatDetail(contractAddress: string | null) {
  const enabled = Boolean(contractAddress);

  const exitsQuery   = useQuery({
    queryKey: ['moat-exits', contractAddress?.toLowerCase()],
    queryFn:  () => fetchEarlyExitsByContract(contractAddress!),
    enabled,
    staleTime: 60_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['traitor-summary'],
    queryFn:  fetchTraitorSummaries,
    staleTime: 60_000,
  });

  const detail = useMemo((): MoatDetailData | null => {
    if (!contractAddress || !exitsQuery.data || !summaryQuery.data) return null;

    const key      = contractAddress.toLowerCase();
    const exits    = exitsQuery.data;
    const summaries = summaryQuery.data
      .filter((s) => s.contract_address.toLowerCase() === key)
      .map((s): TraitorEntry => ({
        wallet:              s.wallet,
        contractAddress:     s.contract_address,
        moatName:            '',       // enriched at display level
        moatImageUrl:        null,
        tokenSymbol:         '',
        totalFeePaid:        parseBigInt(s.total_fee_paid),
        totalAmountExited:   parseBigInt(s.total_amount_exited),
        avgFeePercentScaled: s.avg_fee_percent_scaled,
        paidExitCount:       s.paid_exit_count,
        lastExitAt:          s.last_exit_at,
        lastTxHash:          s.last_tx_hash,
      }));

    // Top 10 traitors for this moat
    const topTraitors = [...summaries]
      .sort((a, b) => (b.totalFeePaid > a.totalFeePaid ? 1 : -1))
      .slice(0, 10);

    // Repeat exiters (>1 paid exit)
    const repeatExiters = summaries
      .filter((s) => s.paidExitCount > 1)
      .sort((a, b) => b.paidExitCount - a.paidExitCount);

    // Weekly trend
    const weekMap = new Map<string, { exits: number; fee: bigint }>();
    for (const ev of exits) {
      const week = weekStart(new Date(ev.exited_at));
      const curr = weekMap.get(week) ?? { exits: 0, fee: 0n };
      weekMap.set(week, {
        exits: curr.exits + 1,
        fee:   curr.fee + parseBigInt(ev.fee),
      });
    }

    const weeklyTrend: WeeklyExitPoint[] = [...weekMap.entries()]
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([week, { exits, fee }]) => ({
        week,
        exits,
        feeBurned: Number(fee) / 1e18,
      }));

    // Duration histogram
    const durationBuckets: DurationBucket[] = DURATION_BUCKETS.map(({ label }) => ({
      label,
      count: 0,
    }));

    // We don't have the original lock timestamp here — we use exited_at as proxy
    // and will match against Locked events in a future phase.
    // For now, bucket by block_number spread approximation is not possible,
    // so we surface this as "data pending lock pairing" with 0s.
    // TODO: pair with Locked events when lock pairing is added.

    const totalFeePaid = exits.reduce((s, e) => s + parseBigInt(e.fee), 0n);
    const totalExits   = exits.length;

    return {
      topTraitors,
      weeklyTrend,
      durationBuckets,
      retentionRate: 0,   // requires Locked event pairing — future phase
      repeatExiters,
      totalFeePaid,
      totalExits,
    };
  }, [contractAddress, exitsQuery.data, summaryQuery.data]);

  return {
    detail,
    isLoading: exitsQuery.isLoading || summaryQuery.isLoading,
    isError:   exitsQuery.isError,
  };
}
