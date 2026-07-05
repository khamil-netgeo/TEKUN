import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Brain, Sparkles, Save, Trash2, ChevronRight, RefreshCw, LayoutDashboard } from 'lucide-react';
import { AiBadge, PageHeader, StatCard, LoadingSpinner, toast } from '@/components/ui';
import api from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface WidgetConfig {
  id: string;
  type: 'stat_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'alert_panel';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data_source: string;
  config: {
    metric?: string;
    value?: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
    chart_data?: Array<Record<string, unknown>>;
    columns?: string[];
    rows?: Array<Record<string, unknown>>;
  };
  ai_insight?: string;
}

interface DashboardConfig {
  dashboard_title: string;
  summary: string;
  widgets: WidgetConfig[];
  ai_narrative: string;
  generated_at: string;
  confidence: number;
}

interface SavedConfig {
  id: number;
  name: string;
  prompt: string;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

// ── Colour map for widget colours ──────────────────────────────────────────
const COLOUR_MAP: Record<string, string> = {
  green:  '#2E7D32',
  orange: '#E65100',
  red:    '#C62828',
  navy:   '#1B2B5E',
  purple: '#673AB7',
};

// ── Widget Renderer ────────────────────────────────────────────────────────
function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const colour = COLOUR_MAP[widget.config.color ?? 'navy'] ?? '#1B2B5E';

  const sizeClass = {
    small:  'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large:  'col-span-1 md:col-span-2 lg:col-span-3',
    full:   'col-span-full',
  }[widget.size] ?? 'col-span-1';

  return (
    <div className={`${sizeClass} bg-white rounded-xl shadow-sm border border-gray-100 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>{widget.title}</h4>
        <AiBadge label="AI" size="xs" />
      </div>

      {/* stat_card */}
      {widget.type === 'stat_card' && (
        <div>
          <p className="text-3xl font-bold" style={{ color: colour }}>
            {widget.config.value ?? '—'}
            {widget.config.unit && widget.config.unit !== 'RM' && (
              <span className="text-base ml-1">{widget.config.unit}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{widget.config.metric}</p>
          {widget.config.trend && (
            <span className={`text-xs font-semibold ${widget.config.trend === 'up' ? 'text-green-600' : widget.config.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {widget.config.trend === 'up' ? '↑' : widget.config.trend === 'down' ? '↓' : '→'} Trend {widget.config.trend}
            </span>
          )}
        </div>
      )}

      {/* line_chart */}
      {widget.type === 'line_chart' && Array.isArray(widget.config.chart_data) && widget.config.chart_data.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={widget.config.chart_data as Array<Record<string, number | string>>}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={colour} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* bar_chart */}
      {widget.type === 'bar_chart' && Array.isArray(widget.config.chart_data) && widget.config.chart_data.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={widget.config.chart_data as Array<Record<string, number | string>>}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill={colour} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* pie_chart */}
      {widget.type === 'pie_chart' && Array.isArray(widget.config.chart_data) && widget.config.chart_data.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={widget.config.chart_data as Array<Record<string, number | string>>} cx="50%" cy="50%" outerRadius={60} dataKey="value">
              {(widget.config.chart_data as Array<Record<string, string>>).map((_, i) => (
                <Cell key={i} fill={Object.values(COLOUR_MAP)[i % Object.values(COLOUR_MAP).length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* table */}
      {widget.type === 'table' && Array.isArray(widget.config.rows) && (
        <div className="overflow-auto max-h-40">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                {(widget.config.columns ?? []).map((col) => (
                  <th key={col} className="px-2 py-1 text-left font-semibold text-gray-600">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(widget.config.rows ?? []).slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-gray-50">
                  {(widget.config.columns ?? []).map((col) => (
                    <td key={col} className="px-2 py-1 text-gray-700">{String(row[col] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* alert_panel */}
      {widget.type === 'alert_panel' && (
        <div className="rounded-lg p-3" style={{ background: colour + '15', borderLeft: `3px solid ${colour}` }}>
          <p className="text-sm font-semibold" style={{ color: colour }}>{widget.config.metric ?? 'Amaran'}</p>
          <p className="text-xs text-gray-600 mt-1">{String(widget.config.value ?? '')}</p>
        </div>
      )}

      {/* AI Insight */}
      {widget.ai_insight && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">{widget.ai_insight}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AiDashboardBuilder() {
  const [prompt,       setPrompt]       = useState('');
  const [generating,   setGenerating]   = useState(false);
  const [config,       setConfig]       = useState<DashboardConfig | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [saveName,     setSaveName]     = useState('');
  const [showSave,     setShowSave]     = useState(false);
  const [loadingList,  setLoadingList]  = useState(true);

  const SAMPLE_PROMPTS = [
    'Tunjukkan prestasi cawangan Kelantan bulan ini',
    'Analisis NPL mengikut negeri dan cadangan tindakan',
    'Ringkasan KPI eksekutif dengan trend 6 bulan',
    'Perbandingan kadar kelulusan antara produk pembiayaan',
  ];

  useEffect(() => {
    api.get('/ai/dashboard/configs')
      .then(r => setSavedConfigs(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Sila masukkan arahan untuk papan pemuka'); return; }
    setGenerating(true);
    setConfig(null);
    try {
      const res = await api.post('/ai/dashboard/generate', { prompt });
      setConfig(res.data.data);
      setSaveName(res.data.data?.dashboard_title ?? 'Papan Pemuka AI');
      toast.success('Papan pemuka AI berjaya dijana');
    } catch {
      toast.error('Gagal menjana papan pemuka. Sila cuba lagi.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      const res = await api.post('/ai/dashboard/generate', { prompt, save: true, name: saveName });
      const saved = res.data.saved_config;
      if (saved) {
        setSavedConfigs(prev => [{ id: saved.id, name: saved.name, prompt, use_count: 0, last_used_at: null, created_at: new Date().toISOString() }, ...prev]);
        toast.success('Konfigurasi papan pemuka disimpan');
        setShowSave(false);
      }
    } catch {
      toast.error('Gagal menyimpan konfigurasi');
    }
  };

  const handleLoadConfig = async (id: number) => {
    try {
      const res = await api.get(`/ai/dashboard/configs/${id}`);
      const cfg = res.data.data;
      setConfig(cfg.widget_config);
      setPrompt(cfg.prompt);
      toast.success('Konfigurasi dimuatkan');
    } catch {
      toast.error('Gagal memuatkan konfigurasi');
    }
  };

  const handleDeleteConfig = async (id: number) => {
    try {
      await api.delete(`/ai/dashboard/configs/${id}`);
      setSavedConfigs(prev => prev.filter(c => c.id !== id));
      toast.success('Konfigurasi dipadam');
    } catch {
      toast.error('Gagal memadam konfigurasi');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Pembina Papan Pemuka AI"
        subtitle="Jana papan pemuka dinamik menggunakan arahan bahasa semula jadi"
        icon={<LayoutDashboard size={20} />}
        action={<AiBadge label="SPPT AI" variant="gradient" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Left: Prompt Input + Saved Configs ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Prompt Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} style={{ color: '#673AB7' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>Arahan Papan Pemuka</h3>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Contoh: Tunjukkan prestasi cawangan Kelantan dengan trend NPL..."
              className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2"
              style={{ minHeight: 100, focusRingColor: '#673AB7' } as React.CSSProperties}
              rows={4}
            />

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: generating ? '#9C27B0' : '#673AB7' }}
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Menjana Papan Pemuka...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Jana Papan Pemuka
                </>
              )}
            </button>

            {/* Sample Prompts */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Contoh arahan:</p>
              <div className="space-y-1">
                {SAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-purple-50 transition flex items-center gap-1"
                    style={{ color: '#673AB7' }}
                  >
                    <ChevronRight size={10} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Configs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1B2B5E' }}>Konfigurasi Tersimpan</h3>
            {loadingList ? (
              <p className="text-xs text-gray-400 text-center py-2">Memuatkan...</p>
            ) : savedConfigs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">Tiada konfigurasi tersimpan</p>
            ) : (
              <div className="space-y-2">
                {savedConfigs.map(cfg => (
                  <div key={cfg.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{cfg.name}</p>
                      <p className="text-xs text-gray-400">Digunakan {cfg.use_count}x</p>
                    </div>
                    <button onClick={() => handleLoadConfig(cfg.id)} className="text-xs px-2 py-1 rounded text-white" style={{ background: '#1B2B5E' }}>Muat</button>
                    <button onClick={() => handleDeleteConfig(cfg.id)} className="opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Generated Dashboard ── */}
        <div className="lg:col-span-3">
          {generating && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse" style={{ background: '#EDE9FE' }}>
                <Brain size={32} style={{ color: '#673AB7' }} />
              </div>
              <p className="text-sm font-bold mb-2" style={{ color: '#673AB7' }}>SPPT AI sedang menjana papan pemuka...</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">Menganalisis data sistem dan membina widget yang relevan berdasarkan arahan anda</p>
              <div className="mt-4 flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#673AB7', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {!generating && !config && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <LayoutDashboard size={48} className="mb-4 opacity-20" style={{ color: '#673AB7' }} />
              <p className="text-sm font-bold text-gray-500 mb-2">Papan Pemuka Belum Dijana</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">Masukkan arahan di sebelah kiri dan klik "Jana Papan Pemuka" untuk menjana papan pemuka dinamik menggunakan SPPT AI</p>
            </div>
          )}

          {!generating && config && (
            <div className="space-y-4">
              {/* Dashboard Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold" style={{ color: '#1B2B5E' }}>{config.dashboard_title}</h2>
                      <AiBadge label="SPPT AI" variant="gradient" />
                    </div>
                    <p className="text-xs text-gray-500">{config.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">Keyakinan: {Math.round((config.confidence ?? 0) * 100)}%</span>
                    <button
                      onClick={() => setShowSave(!showSave)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white"
                      style={{ background: '#673AB7' }}
                    >
                      <Save size={12} /> Simpan
                    </button>
                  </div>
                </div>

                {/* Save Form */}
                {showSave && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="Nama konfigurasi..."
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
                    />
                    <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: '#2E7D32' }}>
                      Simpan
                    </button>
                    <button onClick={() => setShowSave(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600">
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(config.widgets ?? []).map(widget => (
                  <WidgetRenderer key={widget.id} widget={widget} />
                ))}
              </div>

              {/* AI Narrative */}
              {config.ai_narrative && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4" style={{ borderLeft: '4px solid #673AB7' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} style={{ color: '#673AB7' }} />
                    <span className="text-xs font-bold" style={{ color: '#673AB7' }}>Naratif Eksekutif SPPT AI</span>
                  </div>
                  <p className="text-sm text-gray-700">{config.ai_narrative}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Dijana pada {new Date(config.generated_at).toLocaleString('ms-MY')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
