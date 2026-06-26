import { formatWei, formatDate } from '../lib/format';
import type { TraitorEntry } from '../types/pillory.types';
import bannerBg from '../assets/img/banner.png';
import bannerMobileBg from '../assets/img/banner-mobile.png';

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
    <header className="relative overflow-hidden bg-navy-100 border-b border-gold-600/20">
      {/* Placeholder background image — replace src with real asset */}
      <>
        <img
            src={bannerBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-left-top  opacity-90 hidden sm:block"
            aria-hidden="true"
        />
        <img
            src={bannerMobileBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top opacity-90 sm:hidden"
            aria-hidden="true"
        />
        </>

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-pillory-vignette" aria-hidden="true" />

      {/* Top edge gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-3 flex flex-col justify-end" style={{ minHeight: '420px' }}>
        

        {/* Live stats strip */}
        <div className="flex flex-wrap gap-8">
          <Stat label="Total deserters" value={String(totalExits)} />
          <Stat label="Penalties burned" value={formatWei(totalFeePaid)} />
          <Stat label="Moats watched" value={String(totalMoats)} />
          <Stat label="Most disloyal" value={worstMoat} highlight />
        </div>

        {/* Last sync */}
        {lastSyncedAt && (
          <p className="mt-1 text-xs text-slate-600 font-mono">
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
