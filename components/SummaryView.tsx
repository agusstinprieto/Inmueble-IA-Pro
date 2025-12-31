import React from 'react';
import { Part, PartCategory, PartStatus } from '../types';
import { translations } from '../translations';
import { DollarSign, TrendingUp, Package, BarChart3, Download } from 'lucide-react';

interface SummaryViewProps {
  inventory: Part[];
  location: string;
  lang: 'es' | 'en';
}

const SummaryView: React.FC<SummaryViewProps> = ({ inventory, location, lang }) => {
  const t = translations[lang] || translations.es;

  const totalValue = inventory.reduce((sum, p) => sum + (p.suggestedPrice || 0), 0);
  const totalItems = inventory.length;
  const avgValue = totalItems > 0 ? totalValue / totalItems : 0;

  const categorySummary = Object.values(PartCategory).map(cat => {
    const items = inventory.filter(p => p.category === cat);
    const value = items.reduce((sum, p) => sum + (p.suggestedPrice || 0), 0);
    return {
      category: cat,
      label: (t.categories as any)[cat] || cat,
      count: items.length,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    };
  }).filter(c => c.count > 0).sort((a, b) => b.value - a.value);

  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

  const handleExportCSV = () => {
    const headers = ['Category', 'Part Name', 'Model', 'Status', 'Price $'];
    const rows = inventory.map(p => [
      p.category,
      p.name,
      `${p.vehicleInfo.year || ''} ${p.vehicleInfo.make || ''} ${p.vehicleInfo.model || ''}`,
      p.status,
      p.suggestedPrice || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Report_${location}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPieChart = () => {
    if (categorySummary.length === 0) return null;

    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90 drop-shadow-2xl">
        {categorySummary.map((item, index) => {
          const startPercent = cumulativePercent;
          cumulativePercent += item.percentage / 100;
          const endPercent = cumulativePercent;

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
        <circle cx="0" cy="0" r="0.6" fill="#0a0a0a" />
      </svg>
    );
  };

  const isMexico = location.toLowerCase().includes("mexico") || location.toLowerCase().includes("mx") || location.toLowerCase().includes("torreon") || location.toLowerCase().includes("mty");
  const currency = isMexico ? "MXN" : "USD";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            {t.summary}
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1 tracking-widest">{location} Terminal Finance</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black text-white hover:bg-zinc-800 transition-all uppercase tracking-widest shadow-lg"
        >
          <Download className="w-4 h-4 text-amber-500" /> {t.export_csv}
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(245,158,11,0.05),_transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[11px] font-black text-amber-500/60 uppercase tracking-[0.4em] mb-3">{t.inventory_value} (TOTAL)</p>
            <p className="text-5xl md:text-7xl font-black text-white italic tracking-tighter">
              ${totalValue.toLocaleString()}
              <span className="text-zinc-700 text-2xl md:text-3xl ml-4 not-italic">{currency}</span>
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl text-center min-w-[140px]">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.pieces}</p>
              <p className="text-2xl font-black text-white italic">{totalItems}</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl text-center min-w-[140px]">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.avg_per_part}</p>
              <p className="text-2xl font-black text-green-500 italic">${Math.round(avgValue).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span> {t.category_summary}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySummary.map((item, index) => (
              <div key={item.category} className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-zinc-800/60 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-xs font-black text-amber-500 group-hover:scale-110 transition-transform">
                    {item.count}
                  </div>
                  <div>
                    <p className="text-white font-black text-[11px] uppercase tracking-wider">{item.label}</p>
                    <div className="w-24 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono font-black text-sm">${item.value.toLocaleString()}</p>
                  <p className="text-zinc-600 font-mono text-[9px] font-bold">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-4 bg-zinc-700 rounded-full"></span> {t.distribution}
          </h3>
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] aspect-square flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
            {inventory.length > 0 ? (
              <>
                <div className="w-full h-full p-4 relative">
                  {renderPieChart()}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.capital}</p>
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
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">+ {categorySummary.length - 5} {t.more}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-zinc-700">
                <Package className="w-12 h-12 opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">{t.empty_inventory}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
