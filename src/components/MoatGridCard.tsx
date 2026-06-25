import { TrendingDown } from 'lucide-react';
import { formatWei, truncateAddress } from '../lib/format';
import type { MoatCardData } from '../types/pillory.types';

interface MoatGridCardProps {
  data:      MoatCardData;
  onClick:   (contractAddress: string) => void;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-900 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function MoatGridCard({ data, onClick, isLoading }: MoatGridCardProps) {
  if (isLoading) return <SkeletonCard />;

  const hasExits = data.totalExits > 0;

  return (
    <button
      onClick={() => onClick(data.contractAddress)}
      className="
        w-full text-left rounded-xl border border-white/5 bg-navy-900
        hover:border-gold-600/30 hover:bg-navy-800
        transition-all duration-200 p-4 group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.name}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
            {data.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate group-hover:text-gold-300 transition-colors">
            {data.name}
          </p>
          <p className="text-xs text-slate-600 font-mono mt-0.5">{data.tokenSymbol}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-navy-800 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Exits</p>
          <p className={`font-display font-bold text-xl ${hasExits ? 'text-betrayal-400' : 'text-slate-600'}`}>
            {data.totalExits}
          </p>
        </div>
        <div className="bg-navy-800 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fees Burned</p>
          <p className={`font-display font-bold text-xl ${hasExits ? 'text-gold-400' : 'text-slate-600'}`}>
            {hasExits ? formatWei(data.totalFeePaid) : '—'}
          </p>
        </div>
      </div>

      {/* Worst traitor preview */}
      {data.topTraitor && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <TrendingDown size={12} className="text-betrayal-500 shrink-0" />
          <span className="font-mono truncate">
            {truncateAddress(data.topTraitor.wallet, 5)}
          </span>
          <span className="text-slate-700 shrink-0">
            burned {formatWei(data.topTraitor.totalFeePaid)} {data.tokenSymbol}
          </span>
        </div>
      )}
    </button>
  );
}
