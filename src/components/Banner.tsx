import { formatWei, formatDate } from '../lib/format';
import type { TraitorEntry } from '../types/pillory.types';

interface BannerProps {
  totalExits:    number;
  totalFeePaid:  bigint;
  totalMoats:    number;
  lastSyncedAt:  string | null;
  globalTop:     TraitorEntry[];
}

export function Banner({
  totalExits,
  totalFeePaid,
  totalMoats,
  lastSyncedAt,
  globalTop,
}: BannerProps) {
  const worstMoat = globalTop[0]?.moatName ?? '—';

  return (
    <header className="relative overflow-hidden bg-navy-900 border-b border-gold-600/20">
      {/* Placeholder background image — replace src with real asset */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/images/banner-placeholder.jpg')" }}
        aria-hidden="true"
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-pillory-vignette" aria-hidden="true" />

      {/* Top edge gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
        {/* Eyebrow */}
        <p className="font-display text-gold-500 text-xs tracking-[0.3em] uppercase mb-4">
          Fortifi Moats · Avalanche
        </p>

        {/* Title */}
        <h1 className="font-display font-black text-white text-5xl lg:text-7xl leading-none tracking-tight mb-3">
          The Pillory
        </h1>

        {/* Tagline */}
        <p className="font-display text-gold-400/70 text-lg lg:text-xl italic mb-10">
          Where deserters are named.
        </p>

        {/* Live stats strip */}
        <div className="flex flex-wrap gap-8">
          <Stat label="Total deserters" value={String(totalExits)} />
          <Stat label="Penalties burned" value={formatWei(totalFeePaid)} />
          <Stat label="Moats watched" value={String(totalMoats)} />
          <Stat label="Most disloyal" value={worstMoat} highlight />
        </div>

        {/* Last sync */}
        {lastSyncedAt && (
          <p className="mt-8 text-xs text-slate-600 font-mono">
            Last indexed: {formatDate(lastSyncedAt)}
          </p>
        )}
      </div>

      {/* Bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent" />
    </header>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label:      string;
  value:      string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">{label}</p>
      <p
        className={`font-display font-bold text-2xl lg:text-3xl ${
          highlight ? 'text-gold-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
