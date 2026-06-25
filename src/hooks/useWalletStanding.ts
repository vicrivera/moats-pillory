import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchTraitorSummaryByWallet, fetchMoats, fetchTokens } from '../api/supabase.queries';
import { parseBigInt } from '../lib/format';
import type { WalletStanding, LoyaltyTier, PilloryKind, TraitorEntry, MoatRecord, TokenRecord } from '../types/pillory.types';

const REPEAT_THRESHOLD = 1; // more than 1 paid exit = repeat exiter

function determineTier(
  inPillory: PilloryKind[],
  totalPaidExits: number,
  avgFeePercentScaled: number,
): LoyaltyTier {
  if (inPillory.length > 0)       return 'named';
  if (totalPaidExits > REPEAT_THRESHOLD) return 'endangered';
  if (totalPaidExits > 0)         return 'watched';
  return 'loyal';
}

export function useWalletStanding(
  wallet: string | null,
  pilloryTop5ByKind: {
    greedy:    TraitorEntry[];
    reckless:  TraitorEntry[];
    faithless: TraitorEntry[];
  },
) {
  const enabled = Boolean(wallet && wallet.length === 42 && wallet.startsWith('0x'));

  const summaryQuery = useQuery({
    queryKey: ['wallet-standing', wallet?.toLowerCase()],
    queryFn:  () => fetchTraitorSummaryByWallet(wallet!),
    enabled,
    staleTime: 60_000,
  });

  const moatsQuery  = useQuery({ queryKey: ['moats'],  queryFn: fetchMoats,  staleTime: 5 * 60_000 });
  const tokensQuery = useQuery({ queryKey: ['tokens'], queryFn: fetchTokens, staleTime: 5 * 60_000 });

  const standing = useMemo((): WalletStanding | null => {
    if (!wallet || !summaryQuery.data || !moatsQuery.data || !tokensQuery.data) return null;

    const moatMap = new Map<string, MoatRecord>(
      moatsQuery.data.map((m) => [m.contract_address.toLowerCase(), m]),
    );
    const tokenMap = new Map<string, TokenRecord>(
      tokensQuery.data.map((t) => [t.contract_address.toLowerCase(), t]),
    );

    const exits: TraitorEntry[] = summaryQuery.data.map((row) => {
      const moat  = moatMap.get(row.contract_address.toLowerCase());
      const token = tokenMap.get(row.contract_address.toLowerCase());
      return {
        wallet:              row.wallet,
        contractAddress:     row.contract_address,
        moatName:            moat?.name      ?? row.contract_address.slice(0, 8),
        moatImageUrl:        moat?.image_url ?? null,
        tokenSymbol:         token?.symbol   ?? '???',
        totalFeePaid:        parseBigInt(row.total_fee_paid),
        totalAmountExited:   parseBigInt(row.total_amount_exited),
        avgFeePercentScaled: row.avg_fee_percent_scaled,
        paidExitCount:       row.paid_exit_count,
        lastExitAt:          row.last_exit_at,
        lastTxHash:          row.last_tx_hash,
      };
    });

    const totalFeePaid      = exits.reduce((s, e) => s + e.totalFeePaid, 0n);
    const totalPaidExits    = exits.reduce((s, e) => s + e.paidExitCount, 0);
    const avgFeePercentScaled = totalPaidExits > 0
      ? Math.round(exits.reduce((s, e) => s + e.avgFeePercentScaled * e.paidExitCount, 0) / totalPaidExits)
      : 0;

    // Check if wallet appears in any pillory top 5
    const walletLower = wallet.toLowerCase();
    const inPillory: PilloryKind[] = [];
    if (pilloryTop5ByKind.greedy.some((e)    => e.wallet === walletLower)) inPillory.push('greedy');
    if (pilloryTop5ByKind.reckless.some((e)  => e.wallet === walletLower)) inPillory.push('reckless');
    if (pilloryTop5ByKind.faithless.some((e) => e.wallet === walletLower)) inPillory.push('faithless');

    // Gap to #5 in each pillory
    const greedyFifth    = pilloryTop5ByKind.greedy[4]?.totalFeePaid      ?? 0n;
    const recklessFifth  = pilloryTop5ByKind.reckless[4]?.avgFeePercentScaled ?? 0;
    const faithlessFifth = pilloryTop5ByKind.faithless[4]?.paidExitCount   ?? 0;

    return {
      wallet:              walletLower,
      exits,
      totalFeePaid,
      avgFeePercentScaled,
      totalPaidExits,
      loyaltyTier:         determineTier(inPillory, totalPaidExits, avgFeePercentScaled),
      greedyGap:           totalFeePaid < greedyFifth    ? greedyFifth - totalFeePaid : null,
      recklessGap:         avgFeePercentScaled < recklessFifth ? recklessFifth - avgFeePercentScaled : null,
      faithlessGap:        totalPaidExits < faithlessFifth ? faithlessFifth - totalPaidExits : null,
      inPillory,
    };
  }, [summaryQuery.data, moatsQuery.data, tokensQuery.data, wallet, pilloryTop5ByKind]);

  return {
    standing,
    isLoading: summaryQuery.isLoading || moatsQuery.isLoading || tokensQuery.isLoading,
    isError:   summaryQuery.isError,
    notFound:  summaryQuery.isFetched && summaryQuery.data?.length === 0,
  };
}
