import { ExternalLink } from 'lucide-react';
import { truncateAddress, formatWei, formatFeePercent, formatDate, snowtrace } from '../lib/format';
import type { TraitorEntry } from '../types/pillory.types';

interface GlobalTraitorsTableProps {
  traitors:  TraitorEntry[];
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3.5 rounded bg-white/5 animate-pulse" style={{ width: `${50 + (i % 4) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function GlobalTraitorsTable({ traitors, isLoading }: GlobalTraitorsTableProps) {
  return (
    <section className="rounded-xl border border-white/5 bg-navy-900 overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <h2 className="font-display font-semibold text-white text-lg">
          Global Top 10
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Highest penalty fees burned across all moats
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="pillory-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Wallet</th>
              <th>Moats</th>
              <th className="text-right">Fee Burned</th>
              <th className="text-right">Avg Penalty</th>
              <th className="text-center">Exits</th>
              <th>Last Exit</th>
              <th className="text-center">Tx</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              : traitors.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm text-slate-600">
                    No early exits on record.
                  </td>
                </tr>
              )
              : traitors.map((entry, i) => (
                  <tr key={entry.wallet} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    {/* Rank */}
                    <td className="font-mono text-slate-600 text-sm">{i + 1}</td>

                    {/* Wallet */}
                    <td>
                      <a
                        href={snowtrace.address(entry.wallet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-slate-200 hover:text-white transition-colors"
                      >
                        {truncateAddress(entry.wallet)}
                      </a>
                    </td>

                    {/* Moat (multiple for global) */}
                    <td className="text-sm text-slate-500">{entry.moatName}</td>

                    {/* Fee burned */}
                    <td className="text-right font-mono text-sm text-gold-400 font-semibold">
                      {formatWei(entry.totalFeePaid)} <span className="text-slate-600">{entry.tokenSymbol}</span>
                    </td>

                    {/* Avg penalty % */}
                    <td className="text-right">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          entry.avgFeePercentScaled >= 5000
                            ? 'text-betrayal-400'
                            : entry.avgFeePercentScaled >= 2500
                            ? 'text-gold-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatFeePercent(entry.avgFeePercentScaled)}
                      </span>
                    </td>

                    {/* Exit count */}
                    <td className="text-center text-sm text-slate-400">{entry.paidExitCount}</td>

                    {/* Last exit date */}
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(entry.lastExitAt)}
                    </td>

                    {/* Tx link */}
                    <td className="text-center">
                      <a
                        href={snowtrace.tx(entry.lastTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
