import { useEffect, useRef } from 'react';
import { X, ExternalLink, TrendingDown, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useMoatDetail } from '../hooks/useMoatDetail';
import { truncateAddress, formatWei, formatFeePercent, formatDate, snowtrace } from '../lib/format';
import type { MoatCardData } from '../types/pillory.types';

interface MoatSlideOverProps {
  moat:     MoatCardData | null;
  onClose:  () => void;
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
}

export function MoatSlideOver({ moat, onClose }: MoatSlideOverProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { detail, isLoading } = useMoatDetail(moat?.contractAddress ?? null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = moat ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [moat]);

  if (!moat) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="
          fixed right-0 top-0 bottom-0 z-50
          w-full max-w-3xl
          bg-navy-900 border-l border-white/5
          overflow-y-auto
          animate-slide-in-right
        "
        role="dialog"
        aria-modal="true"
        aria-label={`${moat.name} detail`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {moat.imageUrl ? (
              <img src={moat.imageUrl} alt={moat.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-slate-500">
                {moat.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-white text-lg">{moat.name}</h2>
              <p className="text-xs text-slate-600 font-mono">{moat.contractAddress}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* ── Metric strip ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Total Exits"     value={String(detail?.totalExits ?? moat.totalExits)}  loading={isLoading} />
            <MetricCard label="Fees Burned"     value={detail ? `${formatWei(detail.totalFeePaid)} ${moat.tokenSymbol}` : '—'} loading={isLoading} accent />
            <MetricCard label="Repeat Exiters"  value={String(detail?.repeatExiters.length ?? '—')}    loading={isLoading} />
          </div>

          {/* ── Exit trend chart ──────────────────────────────────────────── */}
          <ChartSection title="Exit Rate" subtitle="Weekly early exits">
            {isLoading ? (
              <ChartSkeleton />
            ) : (detail?.weeklyTrend.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={detail!.weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="exits"
                    name="Exits"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Not enough data for trend." />
            )}
          </ChartSection>

          {/* ── Penalty burned chart ──────────────────────────────────────── */}
          <ChartSection title="Penalty Burned" subtitle={`Weekly fees in ${moat.tokenSymbol}`}>
            {isLoading ? (
              <ChartSkeleton />
            ) : (detail?.weeklyTrend.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={detail!.weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="feeBurned" name={moat.tokenSymbol} fill="#d97706" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Not enough data for trend." />
            )}
          </ChartSection>

          {/* ── Top 10 traitors table ──────────────────────────────────────── */}
          <section>
            <SectionHeader title="Top Traitors" subtitle="Ranked by total fee burned in this moat" />
            <div className="mt-4 rounded-xl border border-white/5 overflow-hidden">
              {isLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3 border-b border-white/[0.04]">
                      <div className="h-3 w-4 rounded bg-white/5 animate-pulse" />
                      <div className="h-3 flex-1 rounded bg-white/5 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (detail?.topTraitors.length ?? 0) === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600">No traitors on record.</p>
              ) : (
                <table className="pillory-table">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      <th>Wallet</th>
                      <th className="text-right">Fee Burned</th>
                      <th className="text-right">Avg Penalty</th>
                      <th className="text-center">Exits</th>
                      <th>Last Exit</th>
                      <th className="text-center">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail!.topTraitors.map((entry, i) => (
                      <tr key={entry.wallet} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="font-mono text-xs text-slate-600">{i + 1}</td>
                        <td>
                          <a href={snowtrace.address(entry.wallet)} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-sm text-slate-200 hover:text-white transition-colors">
                            {truncateAddress(entry.wallet)}
                          </a>
                          {entry.paidExitCount > 1 && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-betrayal-500/15 text-betrayal-400 border border-betrayal-500/20">
                              Repeat
                            </span>
                          )}
                        </td>
                        <td className="text-right font-mono text-sm text-gold-400 font-semibold">
                          {formatWei(entry.totalFeePaid)} <span className="text-slate-600">{moat.tokenSymbol}</span>
                        </td>
                        <td className="text-right font-mono text-sm text-slate-300">
                          {formatFeePercent(entry.avgFeePercentScaled)}
                        </td>
                        <td className="text-center text-sm text-slate-400">{entry.paidExitCount}</td>
                        <td className="text-sm text-slate-500 whitespace-nowrap">{formatDate(entry.lastExitAt)}</td>
                        <td className="text-center">
                          <a href={snowtrace.tx(entry.lastTxHash)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300 transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ── Repeat exiters ─────────────────────────────────────────────── */}
          {(detail?.repeatExiters.length ?? 0) > 0 && (
            <section>
              <SectionHeader title="Repeat Deserters" subtitle="Wallets that betrayed more than once" />
              <div className="mt-4 space-y-2">
                {detail!.repeatExiters.map((entry) => (
                  <div key={entry.wallet} className="flex items-center justify-between px-4 py-3 rounded-lg bg-betrayal-500/5 border border-betrayal-500/10">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-betrayal-400 shrink-0" />
                      <a href={snowtrace.address(entry.wallet)} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-sm text-slate-200 hover:text-white transition-colors">
                        {truncateAddress(entry.wallet)}
                      </a>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-betrayal-400">{entry.paidExitCount} exits</span>
                      <span className="text-xs text-slate-600 ml-2">
                        {formatWei(entry.totalFeePaid)} {moat.tokenSymbol} burned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </aside>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, loading, accent }: { label: string; value: string; loading: boolean; accent?: boolean }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      {loading
        ? <div className="h-7 w-24 rounded bg-white/5 animate-pulse" />
        : <p className={`font-display font-bold text-2xl ${accent ? 'text-gold-400' : 'text-white'}`}>{value}</p>
      }
    </div>
  );
}

function ChartSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="mt-4 bg-navy-800 rounded-xl border border-white/5 p-4">{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="font-display font-semibold text-white text-base">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[180px] rounded-lg bg-white/[0.02] animate-pulse" />;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-sm text-slate-600">{message}</div>
  );
}
