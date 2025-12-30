
import React, { useState, useEffect } from 'react';
import { Part, PartCategory, PartStatus } from '../types';
import { translations } from '../translations';
import { generateFacebookAd } from '../services/gemini';
import {
  Trash2, DollarSign, Search, Car, AlertTriangle, X,
  AlertCircle, CheckCircle2, ArrowRight, Loader2,
  LayoutGrid, List, Megaphone, Copy, Check, ChevronRight, Hash
} from 'lucide-react';

interface InventoryViewProps {
  inventory: Part[];
  onSellPart: (partId: string, price: number) => void;
  onDeletePart: (partId: string) => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
}

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onSellPart, onDeletePart, lang, businessName, location }) => {
  const t = translations[lang] || translations.es;
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('inventory_view_mode') as 'grid' | 'list') || 'grid';
  });

  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [partToSell, setPartToSell] = useState<Part | null>(null);
  const [salePrice, setSalePrice] = useState<string>('');

  const [adPart, setAdPart] = useState<Part | null>(null);
  const [generatedAd, setGeneratedAd] = useState('');
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  if (!t) return null;

  const availableInventory = inventory.filter(p => p.status === PartStatus.AVAILABLE);

  const filteredInventory = availableInventory.filter(part => {
    const matchesFilter = filter === 'ALL' || String(part.category).toUpperCase() === String(filter).toUpperCase();
    const searchString = `${part.name} ${part.vehicleInfo.make} ${part.vehicleInfo.model} ${part.id}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const catA = (t.categories as any)[a.category] || a.category;
    const catB = (t.categories as any)[b.category] || b.category;
    const catComparison = catA.localeCompare(catB, lang);
    if (catComparison !== 0) return catComparison;
    return a.name.localeCompare(b.name, lang);
  });

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('inventory_view_mode', mode);
  };

  useEffect(() => {
    if (partToSell) {
      setSalePrice(partToSell.suggestedPrice.toString());
    }
  }, [partToSell]);

  const confirmDelete = async () => {
    if (partToDelete) {
      setIsProcessing(true);
      await onDeletePart(partToDelete.id);
      setIsProcessing(false);
      setPartToDelete(null);
    }
  };

  const confirmSell = async () => {
    if (partToSell) {
      const price = parseFloat(salePrice);
      if (!isNaN(price) && price >= 0) {
        setIsProcessing(true);
        await onSellPart(partToSell.id, price);
        setIsProcessing(false);
        setPartToSell(null);
        setSalePrice('');
      }
    }
  };

  const handleCreateAd = async (part: Part) => {
    setAdPart(part);
    setIsGeneratingAd(true);
    setGeneratedAd('');
    try {
      const ad = await generateFacebookAd(part, lang, businessName, location);
      setGeneratedAd(ad);
    } catch (error) {
      console.error("Error generating ad:", error);
      setGeneratedAd(lang === 'es' ? "Error al generar el anuncio." : "Error generating ad.");
    } finally {
      setIsGeneratingAd(false);
    }
  };

  const handleCopyAd = () => {
    navigator.clipboard.writeText(generatedAd);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-8 relative min-h-full pb-20 animate-in fade-in duration-500 overflow-x-hidden">
      {adPart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
          <div className="bg-zinc-900 border border-white/5 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl scale-in-center max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-3">
                <Megaphone className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">
                  ANUNCIO PARA {businessName}
                </h3>
              </div>
              <button onClick={() => setAdPart(null)} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 border border-white/5 rounded-3xl p-6 mb-8">
              {isGeneratingAd ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">{t.generating_ad}</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-mono text-xs text-zinc-300 leading-relaxed">
                  {generatedAd}
                </div>
              )}
            </div>

            {!isGeneratingAd && (
              <div className="flex gap-4 shrink-0">
                <button
                  onClick={handleCopyAd}
                  className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'
                    }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? (lang === 'es' ? 'COPIADO' : 'COPIED') : t.copy_ad}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="max-w-full text-white">
          <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic leading-tight">INVENTARIO: {businessName}</h2>
          <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Sincronizado con la nube de {location}</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-xl shrink-0">
            <button onClick={() => toggleViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => toggleViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder={t.search_placeholder}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {sortedInventory.map(part => (
            <div key={part.id} className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-6 relative flex flex-col justify-between shadow-xl hover:border-amber-500/20 transition-all group overflow-hidden h-full">
              <div className="absolute top-5 right-5 flex gap-2 z-20">
                <button onClick={() => handleCreateAd(part)} className="text-zinc-600 hover:text-amber-500 p-2.5 bg-black/40 rounded-xl transition-all active:scale-90" title={t.create_ad}><Megaphone className="w-4 h-4" /></button>
                <button onClick={() => setPartToDelete(part)} className="text-zinc-600 hover:text-red-500 p-2.5 bg-black/40 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <span className="inline-block text-[8px] font-black bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest truncate max-w-full">
                  {(t.categories as any)[part.category] || part.category}
                </span>
                <div className="min-h-[3rem]">
                  <h3 className="text-sm md:text-base font-black text-white leading-tight uppercase tracking-tight group-hover:text-amber-500 transition-colors line-clamp-2" title={part.name}>{part.name}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 mt-3 overflow-hidden">
                    <Car className="w-3.5 h-3.5 opacity-40 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wide truncate">
                      {part.vehicleInfo.year} {part.vehicleInfo.make} {part.vehicleInfo.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 pt-4 border-t border-white/5 overflow-hidden">
                  <p className="text-amber-500 font-mono text-2xl md:text-3xl font-black truncate">${part.suggestedPrice.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setPartToSell(part)} className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/10 shrink-0">
                <DollarSign className="w-4 h-4 shrink-0" /> {t.register_sale}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20">
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">Parte / Descripción</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">Vehículo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">Categoría</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap text-right">Precio</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedInventory.map(part => (
                  <tr key={part.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                          <Hash className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white uppercase truncate max-w-[200px]">{part.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tight">{part.vehicleInfo.year} {part.vehicleInfo.make}</span>
                        <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{part.vehicleInfo.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">
                        {(t.categories as any)[part.category] || part.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-amber-500 font-black text-lg">
                      ${part.suggestedPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setPartToSell(part)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all" title={t.register_sale}>
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleCreateAd(part)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all" title={t.create_ad}>
                          <Megaphone className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPartToDelete(part)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedInventory.length === 0 && (
              <div className="py-20 text-center text-zinc-700 italic text-sm">
                No se encontraron piezas en este yonke.
              </div>
            )}
          </div>
        </div>
      )}

      {partToSell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
          <div className="bg-zinc-900 border border-amber-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
            <h3 className="text-xl font-black text-white text-center uppercase italic tracking-tighter mb-6">REGISTRAR VENTA</h3>
            <div className="bg-black/40 border border-white/5 rounded-3xl p-6 mb-8 text-center">
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1 truncate">{partToSell.name}</p>
              <div className="relative mt-4">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 font-mono text-2xl font-black">$</span>
                <input autoFocus type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-3xl font-mono font-black focus:outline-none focus:border-amber-500 transition-all text-center" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPartToSell(null)} className="flex-1 py-4 bg-zinc-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest">CANCELAR</button>
              <button onClick={confirmSell} className="flex-1 py-4 bg-amber-500 text-black text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />} CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {partToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
          <div className="bg-zinc-900 border border-red-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center overflow-hidden">
            <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"><AlertCircle className="w-8 h-8 text-red-500" /></div></div>
            <h3 className="text-xl font-black text-white text-center uppercase italic tracking-tighter mb-2">¿ELIMINAR PIEZA?</h3>
            <p className="text-zinc-400 text-center text-sm mb-8">Mover "{partToDelete.name}" a ELIMINADOS de {businessName}.</p>
            <div className="flex gap-4">
              <button onClick={() => setPartToDelete(null)} className="flex-1 py-4 bg-zinc-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest">CANCELAR</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />} ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
