import { ExternalLink } from 'lucide-react';
import { truncateAddress, formatWei, formatFeePercent, snowtrace } from '../lib/format';
import type { PilloryColumn, PilloryKind, TraitorEntry } from '../types/pillory.types';

// ─── Rank value display per pillory kind ─────────────────────────────────────

function rankValue(entry: TraitorEntry, kind: PilloryKind): string {
  switch (kind) {
    case 'greedy':    return `${formatWei(entry.totalFeePaid)} ${entry.tokenSymbol}`;
    case 'reckless':  return formatFeePercent(entry.avgFeePercentScaled);
    case 'faithless': return `${entry.paidExitCount} exit${entry.paidExitCount !== 1 ? 's' : ''}`;
  }
}

// ─── Pilory accent color per kind ────────────────────────────────────────────

const KIND_STYLES: Record<PilloryKind, { accent: string; glow: string; border: string }> = {
  greedy:    { accent: 'text-gold-400',      glow: 'shadow-gold-500/10',   border: 'border-gold-600/30'    },
  reckless:  { accent: 'text-betrayal-400',  glow: 'shadow-betrayal-500/10', border: 'border-betrayal-600/30' },
  faithless: { accent: 'text-slate-300',     glow: 'shadow-slate-500/10',  border: 'border-slate-600/30'   },
};

// ─── Single entry in the pillory ─────────────────────────────────────────────

function PilloryEntry({
  entry,
  rank,
  kind,
}: {
  entry: TraitorEntry;
  rank:  number;
  kind:  PilloryKind;
}) {
  const isFirst = rank === 1;
  const styles  = KIND_STYLES[kind];

  return (
    <div
      className={`
        flex items-center gap-3 py-3 px-4
        border-b border-white/[0.04] last:border-0
        ${isFirst ? 'bg-white/[0.03]' : ''}
      `}
    >
      {/* Rank number */}
      <span
        className={`
          font-display font-black shrink-0 w-8 text-center
          ${isFirst ? `text-3xl ${styles.accent}` : 'text-base text-slate-600'}
        `}
      >
        {rank}
      </span>

      {/* Moat logo */}
      <div className="shrink-0">
        {entry.moatImageUrl ? (
          <img
            src={entry.moatImageUrl}
            alt={entry.moatName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
            {entry.moatName.charAt(0)}
          </div>
        )}
      </div>

      {/* Wallet + moat */}
      <div className="flex-1 min-w-0">
        <a
          href={snowtrace.address(entry.wallet)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-slate-200 hover:text-white transition-colors block truncate"
        >
          {truncateAddress(entry.wallet)}
        </a>
        <p className="text-xs text-slate-600 truncate">{entry.moatName}</p>
      </div>

      {/* Rank value */}
      <div className="text-right shrink-0">
        <span className={`text-sm font-semibold font-mono ${styles.accent}`}>
          {rankValue(entry, kind)}
        </span>
        <a
          href={snowtrace.tx(entry.lastTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[10px] text-slate-600 hover:text-slate-400 justify-end mt-0.5 transition-colors"
        >
          <ExternalLink size={10} />
          tx
        </a>
      </div>
    </div>
  );
}

// ─── Full column ──────────────────────────────────────────────────────────────

interface PilloryColumnProps {
  column:    PilloryColumn;
  isLoading: boolean;
}

function SkeletonEntry() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-white/[0.04]">
      <div className="w-8 h-5 rounded bg-white/5 animate-pulse" />
      <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
        <div className="h-2 w-20 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
    </div>
  );
}

export function PilloryColumnCard({ column, isLoading }: PilloryColumnProps) {
  const styles = KIND_STYLES[column.kind];

  return (
    <article
      className={`
        flex flex-col rounded-xl border bg-navy-900 overflow-hidden
        shadow-xl ${styles.glow} ${styles.border}
      `}
    >
      {/* Column header — placeholder image area */}
      <div className="relative h-40 bg-navy-800 overflow-hidden">
        {/* Placeholder — replace with real image per pillory */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('/images/pillory-${column.kind}-placeholder.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className={`font-display font-bold text-lg leading-tight ${styles.accent}`}>
            {column.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{column.subtitle}</p>
        </div>

        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent ${styles.accent} opacity-40`} />
      </div>

      {/* Entries */}
      <div className="flex-1">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonEntry key={i} />)
          : column.top5.length === 0
          ? (
            <p className="py-12 text-center text-sm text-slate-600">
              No deserters recorded yet.
            </p>
          )
          : column.top5.map((entry, i) => (
              <PilloryEntry
                key={entry.wallet + entry.contractAddress}
                entry={entry}
                rank={i + 1}
                kind={column.kind}
              />
            ))}
      </div>
    </article>
  );
}
