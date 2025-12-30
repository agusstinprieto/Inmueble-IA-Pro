
import React, { useState } from 'react';
import { translations } from '../translations';
import { searchPartsExternally } from '../services/gemini';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    aistudio?: any;
  }
}

interface SmartSearchViewProps {
  lang: 'es' | 'en';
  location: string;
}

const SmartSearchView: React.FC<SmartSearchViewProps> = ({ lang, location }) => {
  const t = translations[lang];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; sources: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setLoading(true);
    setResults(null);
    try {
      const data = await searchPartsExternally(query, location);
      setResults(data);
    } catch (error: any) {
      console.error("Search error:", error);
      if (error?.message?.includes("Requested entity was not found.") && window.aistudio) {
        alert(lang === 'es' ? "Se requiere un proyecto con facturación activa." : "A paid billing project is required.");
        await window.aistudio.openSelectKey();
      } else {
        alert(lang === 'es' ? "Error en la búsqueda." : "Search error.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <header className="mb-8">
        <h2 className="text-3xl font-bold">{t.smart_search}</h2>
        <p className="text-zinc-400 mt-2">Buscando en yonkes y tiendas cercanas a {location}.</p>
      </header>

      <form onSubmit={handleSearch} className="mb-12">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.smart_search_placeholder}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-lg"
          />
          <button
            disabled={loading || !query.trim()}
            type="submit"
            className="bg-amber-500 hover:brightness-110 disabled:bg-zinc-800 disabled:text-zinc-600 text-[var(--brand-text-color)] font-black px-10 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/10 uppercase tracking-widest text-[11px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.search_button}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-400 font-medium">Escaneando mercado en {location}...</p>
        </div>
      )}

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 leading-relaxed text-zinc-300 whitespace-pre-wrap">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Market Status: {location}</span>
            </div>
            {results.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchView;
