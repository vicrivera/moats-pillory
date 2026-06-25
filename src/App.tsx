import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Banner } from './components/Banner';
import { PilloryColumnCard } from './components/PilloryColumnCard';
import { GlobalTraitorsTable } from './components/GlobalTraitorsTable';
import { WalletChecker } from './components/WalletChecker';
import { MoatGridCard } from './components/MoatGridCard';
import { MoatSlideOver } from './components/MoatSlideOver';
import { usePilloryData } from './hooks/usePilloryData';
import type { MoatCardData } from './types/pillory.types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 8_000),
    },
  },
});

// ─── Inner app (needs QueryClient in context) ─────────────────────────────────

function PilloryApp() {
  const { pillories, globalTop10, moatCards, lastSyncedAt, isLoading, isError, error } =
    usePilloryData();

  const [selectedMoat, setSelectedMoat] = useState<MoatCardData | null>(null);

  // Global stats for banner
  const totalExits   = useMemo(() => moatCards.reduce((s, m) => s + m.totalExits, 0), [moatCards]);
  const totalFeePaid = useMemo(() => moatCards.reduce((s, m) => s + m.totalFeePaid, 0n), [moatCards]);

  const handleMoatClick = (contractAddress: string) => {
    const moat = moatCards.find(
      (m) => m.contractAddress.toLowerCase() === contractAddress.toLowerCase(),
    );
    if (moat) setSelectedMoat(moat);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-betrayal-400 text-lg mb-2">The Pillory is dark.</p>
          <p className="text-sm text-slate-600">{error?.message ?? 'Failed to load data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <Banner
        totalExits={totalExits}
        totalFeePaid={totalFeePaid}
        totalMoats={moatCards.length}
        lastSyncedAt={lastSyncedAt}
        globalTop={globalTop10}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Three Pillories ────────────────────────────────────────────────── */}
        <section aria-labelledby="pillories-heading">
          <SectionLabel id="pillories-heading" eyebrow="Hall of Shame" title="The Pillories" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <PilloryColumnCard
                    key={i}
                    column={{ kind: 'greedy', title: '', subtitle: '', rankLabel: '', top5: [] }}
                    isLoading={true}
                  />
                ))
              : pillories.map((col) => (
                  <PilloryColumnCard key={col.kind} column={col} isLoading={false} />
                ))}
          </div>
        </section>

        {/* ── Global Top 10 ─────────────────────────────────────────────────── */}
        <section aria-labelledby="global-heading">
          <SectionLabel id="global-heading" eyebrow="Across All Moats" title="Most Wanted" />
          <div className="mt-8">
            <GlobalTraitorsTable traitors={globalTop10} isLoading={isLoading} />
          </div>
        </section>

        {/* ── Wallet checker ─────────────────────────────────────────────────── */}
        <section aria-labelledby="standing-heading">
          <SectionLabel id="standing-heading" eyebrow="Self-check" title="Your Standing" />
          <div className="mt-8">
            <WalletChecker pillories={pillories} />
          </div>
        </section>

        {/* ── Moats grid ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="moats-heading">
          <SectionLabel id="moats-heading" eyebrow="All Moats" title="Browse by Moat" />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <MoatGridCard
                    key={i}
                    data={{ contractAddress: '', name: '', imageUrl: null, tokenSymbol: '', totalExits: 0, totalFeePaid: 0n, topTraitor: null }}
                    onClick={() => {}}
                    isLoading={true}
                  />
                ))
              : moatCards.map((moat) => (
                  <MoatGridCard
                    key={moat.contractAddress}
                    data={moat}
                    onClick={handleMoatClick}
                    isLoading={false}
                  />
                ))}
          </div>
        </section>

      </main>

      {/* ── Slide-over ─────────────────────────────────────────────────────── */}
      <MoatSlideOver
        moat={selectedMoat}
        onClose={() => setSelectedMoat(null)}
      />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center text-xs text-slate-700 font-body">
        The Pillory · Fortifi Moats · Avalanche
      </footer>
    </div>
  );
}

// ─── Section label helper ─────────────────────────────────────────────────────

function SectionLabel({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-gold-600 text-xs uppercase tracking-[0.25em] font-body mb-1">{eyebrow}</p>
      <h2 id={id} className="font-display font-bold text-white text-2xl">{title}</h2>
    </div>
  );
}

// ─── Root with providers ──────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PilloryApp />
    </QueryClientProvider>
  );
}
