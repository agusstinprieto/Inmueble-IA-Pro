
import React from 'react';
import { Part, PartCategory, PartStatus } from '../types';
import { translations } from '../translations';
import { DollarSign, TrendingUp, Package, BarChart3 } from 'lucide-react';

interface SummaryViewProps {
  inventory: Part[];
  lang: 'es' | 'en';
  location: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({ inventory, lang, location }) => {
  const t = translations[lang] || translations.es;

  const availableParts = inventory.filter(p => p.status === PartStatus.AVAILABLE);
  const totalValue = availableParts.reduce((acc, p) => acc + (p.suggestedPrice || 0), 0);

  // Agrupar por categoría
  const categorySummary = Object.values(PartCategory).map(cat => {
    const parts = availableParts.filter(p => p.category === cat);
    const sum = parts.reduce((acc, p) => acc + (p.suggestedPrice || 0), 0);
    return {
      category: cat,
      label: (t.categories as any)[cat] || cat,
      value: sum,
      count: parts.length,
      percentage: totalValue > 0 ? (sum / totalValue) * 100 : 0
    };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Colores para el gráfico
  const colors = [
    '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
    '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#64748b'
  ];

  // Generar coordenadas para el gráfico de pastel SVG
  const renderPieChart = () => {
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <svg viewBox="-1 -1 2 2" className="w-full max-w-[300px] aspect-square transform -rotate-90">
        {categorySummary.map((item, index) => {
          const startPercent = cumulativePercent;
          const endPercent = cumulativePercent + (item.percentage / 100);
          cumulativePercent = endPercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = item.percentage > 50 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return (
            <path
              key={item.category}
              d={pathData}
              fill={colors[index % colors.length]}
              className="hover:opacity-80 transition-opacity cursor-pointer border border-black/20"
            >
              <title>{item.label}: ${item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)</title>
            </path>
          );
        })}
        {/* Hueco central para efecto donut */}
        <circle cx="0" cy="0" r="0.6" fill="#0a0a0a" />
      </svg>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-amber-500" />
          {t.summary}
        </h2>
        <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1 tracking-widest">{location} Terminal Finance</p>
      </header>

      {/* Hero Total Card */}
      <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(245,158,11,0.05),_transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.4em] mb-3">{t.inventory_value} (TOTAL)</p>
            <p className="text-5xl md:text-7xl font-black text-white italic tracking-tighter">
              ${totalValue.toLocaleString()}
              <span className="text-zinc-700 text-2xl md:text-3xl ml-4 not-italic">USD</span>
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.available_stock}</p>
              <p className="text-2xl font-black text-white">{availableParts.length}</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">PROM. PIEZA</p>
              <p className="text-2xl font-black text-green-500">
                ${availableParts.length > 0 ? Math.round(totalValue / availableParts.length).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Table View */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              {t.category_summary}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20">
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">CATEGORÍA</th>
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">PIEZAS</th>
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">VALOR ($)</th>
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categorySummary.map((item, index) => (
                  <tr key={item.category} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                        <span className="text-[11px] font-black text-white uppercase truncate">{item.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-mono text-zinc-500 text-[11px]">{item.count}</td>
                    <td className="px-8 py-5 text-right font-mono text-amber-500 font-bold text-[11px]">${item.value.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-2 py-1 rounded-md">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center space-y-8 min-h-[500px]">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">{t.distribution}</h3>
          {totalValue > 0 ? (
            <>
              <div className="relative w-full flex justify-center">
                {renderPieChart()}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">CAPITAL</p>
                  <p className="text-xl font-black text-white italic">100%</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                {categorySummary.slice(0, 5).map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
                {categorySummary.length > 5 && (
                  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">+ {categorySummary.length - 5} MÁS</span>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-zinc-700">
              <Package className="w-12 h-12 opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Inventario vacío</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
