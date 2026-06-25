import { useState, useCallback } from 'react';
import { Search, Shield, AlertTriangle, Flame, Skull, ExternalLink } from 'lucide-react';
import { useWalletStanding } from '../hooks/useWalletStanding';
import { formatWei, formatFeePercent, snowtrace } from '../lib/format';
import type { PilloryColumn, LoyaltyTier } from '../types/pillory.types';

interface WalletCheckerProps {
  pillories: PilloryColumn[];
}

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<LoyaltyTier, {
  icon:    React.ReactNode;
  label:   string;
  desc:    string;
  color:   string;
  border:  string;
  bg:      string;
}> = {
  loyal: {
    icon:   <Shield size={20} />,
    label:  'Loyal',
    desc:   'No early exits on record. A true keeper of the moat.',
    color:  'text-emerald-400',
    border: 'border-emerald-500/20',
    bg:     'bg-emerald-500/5',
  },
  watched: {
    icon:   <AlertTriangle size={20} />,
    label:  'Watched',
    desc:   'One early exit. One strike. The Pillory remembers.',
    color:  'text-gold-400',
    border: 'border-gold-500/20',
    bg:     'bg-gold-500/5',
  },
  endangered: {
    icon:   <Flame size={20} />,
    label:  'Endangered',
    desc:   'Multiple betrayals. You are dangerously close to being named.',
    color:  'text-orange-400',
    border: 'border-orange-500/20',
    bg:     'bg-orange-500/5',
  },
  named: {
    icon:   <Skull size={20} />,
    label:  'Named',
    desc:   'You stand in the Pillory. The moats do not forget.',
    color:  'text-betrayal-400',
    border: 'border-betrayal-500/20',
    bg:     'bg-betrayal-500/5',
  },
};

export function WalletChecker({ pillories }: WalletCheckerProps) {
  const [input,  setInput]  = useState('');
  const [wallet, setWallet] = useState<string | null>(null);

  const top5ByKind = {
    greedy:    pillories.find((p) => p.kind === 'greedy')?.top5    ?? [],
    reckless:  pillories.find((p) => p.kind === 'reckless')?.top5  ?? [],
    faithless: pillories.find((p) => p.kind === 'faithless')?.top5 ?? [],
  };

  const { standing, isLoading, notFound } = useWalletStanding(wallet, top5ByKind);

  const handleSearch = useCallback(() => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.startsWith('0x') && trimmed.length === 42) {
      setWallet(trimmed);
    }
  }, [input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const tierCfg = standing ? TIER_CONFIG[standing.loyaltyTier] : null;

  return (
    <section className="rounded-xl border border-white/5 bg-navy-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5">
        <h2 className="font-display font-semibold text-white text-lg">Check Your Standing</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter a wallet address to see how close it is to the Pillory
        </p>
      </div>

      <div className="p-6">
        {/* Input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="0x..."
              spellCheck={false}
              className="
                w-full pl-9 pr-4 py-2.5
                bg-navy-800 border border-white/8 rounded-lg
                font-mono text-sm text-slate-200 placeholder-slate-600
                focus:outline-none focus:border-gold-600/50 focus:ring-1 focus:ring-gold-600/30
                transition-colors
              "
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="
              px-5 py-2.5 rounded-lg font-body text-sm font-medium
              bg-gold-600 hover:bg-gold-500 text-navy-950
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isLoading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {/* Not found */}
        {notFound && !isLoading && (
          <div className="mt-6 flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <Shield size={18} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">
              This wallet has no early exits on record. A loyal keeper of the moat.
            </p>
          </div>
        )}

        {/* Standing result */}
        {standing && tierCfg && (
          <div className="mt-6 space-y-4 animate-fade-in">

            {/* Tier badge */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${tierCfg.border} ${tierCfg.bg}`}>
              <span className={tierCfg.color}>{tierCfg.icon}</span>
              <div>
                <p className={`font-display font-bold text-lg ${tierCfg.color}`}>{tierCfg.label}</p>
                <p className="text-sm text-slate-400 mt-0.5">{tierCfg.desc}</p>
              </div>
              <a
                href={snowtrace.address(standing.wallet)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-slate-600 hover:text-slate-300 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Named pillories */}
            {standing.inPillory.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {standing.inPillory.map((kind) => (
                  <span
                    key={kind}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-betrayal-500/15 text-betrayal-400 border border-betrayal-500/20"
                  >
                    <Skull size={10} />
                    {kind === 'greedy'    && 'Pillory of the Greedy'}
                    {kind === 'reckless'  && 'Pillory of the Reckless'}
                    {kind === 'faithless' && 'Pillory of the Faithless'}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Total Exits"   value={String(standing.totalPaidExits)} />
              <MiniStat label="Fees Burned"   value={formatWei(standing.totalFeePaid)}          accent />
              <MiniStat label="Avg Penalty"   value={formatFeePercent(standing.avgFeePercentScaled)} />
            </div>

            {/* Gaps to pillory */}
            {standing.loyaltyTier !== 'named' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Distance to Pillory</p>
                {standing.greedyGap !== null && (
                  <GapBar label="Greedy"    value={`${formatWei(standing.greedyGap)} more in fees`} />
                )}
                {standing.recklessGap !== null && (
                  <GapBar label="Reckless"  value={`${formatFeePercent(standing.recklessGap)} higher avg penalty`} />
                )}
                {standing.faithlessGap !== null && (
                  <GapBar label="Faithless" value={`${standing.faithlessGap} more exit${standing.faithlessGap !== 1 ? 's' : ''}`} />
                )}
              </div>
            )}

            {/* Per-moat breakdown */}
            {standing.exits.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Exit History by Moat</p>
                <div className="space-y-2">
                  {standing.exits.map((e) => (
                    <div key={e.contractAddress} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-navy-800 border border-white/5">
                      <div className="flex items-center gap-2">
                        {e.moatImageUrl
                          ? <img src={e.moatImageUrl} alt={e.moatName} className="w-5 h-5 rounded-full object-cover" />
                          : <div className="w-5 h-5 rounded-full bg-navy-700 flex items-center justify-center text-[9px] text-slate-500">{e.moatName.charAt(0)}</div>
                        }
                        <span className="text-sm text-slate-300">{e.moatName}</span>
                      </div>
                      <div className="text-right text-xs font-mono">
                        <span className="text-gold-400">{formatWei(e.totalFeePaid)} {e.tokenSymbol}</span>
                        <span className="text-slate-600 ml-2">{e.paidExitCount} exit{e.paidExitCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="stat-card">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-display font-semibold text-lg ${accent ? 'text-gold-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function GapBar({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy-800 border border-white/5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-300">{value} away</span>
    </div>
  );
}
