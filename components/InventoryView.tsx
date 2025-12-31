import React, { useState, useEffect } from 'react';
import { Part, PartCategory, PartStatus } from '../types';
import { translations } from '../translations';
import { generateFacebookAd, getMarketPriceInsight, getStagnantStrategy } from '../services/gemini';
import LabelPrintView from './LabelPrintView';
import {
  Trash2, DollarSign, Search, Car, AlertTriangle, X,
  AlertCircle, CheckCircle2, ArrowRight, Loader2,
  LayoutGrid, List, Megaphone, Copy, Check, ChevronRight, Hash, Package, TrendingUp, Zap, Sparkles, Printer
} from 'lucide-react';

interface InventoryViewProps {
  inventory: Part[];
  onSellPart: (partId: string, price: number) => void;
  onDeletePart: (partId: string) => void;
  onBatchDeleteVehicle: (parts: Part[]) => void;
  onBatchSellVehicle: (parts: Part[], totalAmount: number) => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  inventory, onSellPart, onDeletePart, onBatchDeleteVehicle, onBatchSellVehicle, lang, businessName, location
}) => {
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

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string | null>(null);
  const [batchActionType, setBatchActionType] = useState<'DELETE' | 'SELL' | null>(null);
  const [batchSalePrice, setBatchSalePrice] = useState<string>('');

  const [insights, setInsights] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});
  const [insightPart, setInsightPart] = useState<Part | null>(null);
  const [strategyPart, setStrategyPart] = useState<Part | null>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [partToPrint, setPartToPrint] = useState<Part | null>(null);

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

  const fetchMarketInsight = async (part: Part) => {
    console.log("FETCH MARKET INSIGHT CALLED for part:", part.id, part.name);
    setInsightPart(part);
    if (loadingInsights[part.id]) return;
    setLoadingInsights(prev => ({ ...prev, [part.id]: true }));
    try {
      const apiKey = process.env.API_KEY || '';
      console.log("API KEY check:", apiKey ? "Found" : "NOT FOUND");
      if (!apiKey) {
        alert("Configuración de IA incompleta (Falta API_KEY)");
        return;
      }
      const result = await getMarketPriceInsight(part, location);
      console.log("API Result received:", result ? "YES" : "EMPTY");
      if (!result) {
        setInsights(prev => ({ ...prev, [part.id]: (lang === 'es' ? "Mercado no respondió..." : "Market did not respond...") }));
      } else {
        setInsights(prev => ({ ...prev, [part.id]: result }));
      }
    } catch (error) {
      console.error("Insight error in UI:", error);
      setInsights(prev => ({ ...prev, [part.id]: (lang === 'es' ? "Error técnico..." : "Technical error...") }));
    } finally {
      setLoadingInsights(prev => ({ ...prev, [part.id]: false }));
    }
  };

  const handleGetStrategy = async (part: Part) => {
    setStrategyPart(part);
    setIsGeneratingStrategy(true);
    setGeneratedStrategy('');
    try {
      const result = await getStagnantStrategy(part, location);
      setGeneratedStrategy(result || (lang === 'es' ? 'No se pudo generar estrategia.' : 'Could not generate strategy.'));
    } catch (error) {
      console.error("Strategy error:", error);
      setGeneratedStrategy(lang === 'es' ? "Error técnico al consultar IA." : "Technical error querying IA.");
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const availableInventory = inventory.filter(p => p.status === PartStatus.AVAILABLE);

  const filteredInventory = availableInventory.filter(part => {
    const matchesFilter = filter === 'ALL' || String(part.category).toUpperCase() === String(filter).toUpperCase();
    const searchString = `${part.name} ${part.vehicleInfo.year} ${part.vehicleInfo.make} ${part.vehicleInfo.model} ${part.id}`.toLowerCase();
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

  const vehicles = Array.from(new Set(availableInventory.map(p => {
    return `${p.vehicleInfo.year}-${p.vehicleInfo.make}-${p.vehicleInfo.model}-${p.vehicleInfo.vin || 'no-vin'}`;
  }))).map(key => {
    const parts = availableInventory.filter(p => `${p.vehicleInfo.year}-${p.vehicleInfo.make}-${p.vehicleInfo.model}-${p.vehicleInfo.vin || 'no-vin'}` === key);
    const v = parts[0].vehicleInfo;
    return {
      key,
      year: v.year,
      make: v.make,
      model: v.model,
      vin: v.vin,
      partsCount: parts.length,
      parts
    };
  }).sort((a, b) => b.partsCount - a.partsCount);

  const confirmBatchAction = async () => {
    if (!selectedVehicleKey || !batchActionType) return;
    const vehicle = vehicles.find(v => v.key === selectedVehicleKey);
    if (!vehicle) return;

    setIsProcessing(true);
    if (batchActionType === 'DELETE') {
      await onBatchDeleteVehicle(vehicle.parts);
    } else if (batchActionType === 'SELL') {
      const price = parseFloat(batchSalePrice);
      if (!isNaN(price) && price >= 0) {
        await onBatchSellVehicle(vehicle.parts, price);
      }
    }
    setIsProcessing(false);
    setIsBatchModalOpen(false);
    setSelectedVehicleKey(null);
    setBatchActionType(null);
    setBatchSalePrice('');
  };

  const handleCopyAd = () => {
    navigator.clipboard.writeText(generatedAd);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  try {
    return (
      <div className="p-4 md:p-8 pt-16 md:pt-24 relative min-h-full pb-20 animate-in fade-in duration-500 overflow-x-hidden text-white">
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
                    className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:brightness-110'}`}
                  >
                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {isCopied ? (lang === 'es' ? 'COPIADO' : 'COPIED') : t.copy_ad}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <header className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-full text-white">
              <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic leading-tight">{t.inventory}: {businessName}</h2>
              <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{t.synced_cloud} {location}</p>
            </div>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-3 px-8 py-5 bg-zinc-900 border border-white/5 rounded-2xl text-[11px] font-black text-amber-500 uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              <CheckCircle2 className="w-5 h-5" /> {t.batch_management}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-center bg-black/20 p-4 rounded-[2rem] border border-white/5">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder={t.search_placeholder}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-xl shrink-0">
              <button onClick={() => toggleViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => toggleViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {sortedInventory.map(part => (
              <div key={part.id} className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] relative flex flex-col shadow-xl hover:border-amber-500/20 transition-all group overflow-hidden h-full">
                <div className="h-48 w-full bg-black/40 relative overflow-hidden shrink-0">
                  {part.imageUrl ? (
                    <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
                      <Car className="w-12 h-12 opacity-20" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent opacity-60" />

                  {/* AI Insights & Info overlap */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    <div className="flex flex-col gap-2">
                      {insights[part.id] && (
                        <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 border border-amber-500/30 text-[9px] text-amber-200 leading-tight max-w-[150px] shadow-2xl animate-in fade-in slide-in-from-left-2">
                          <Zap className="w-3 h-3 mb-1 text-amber-500" />
                          {insights[part.id]}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); fetchMarketInsight(part); }} className="text-white hover:text-amber-500 p-2.5 bg-black/60 backdrop-blur-md rounded-xl transition-all active:scale-90 shadow-lg">
                        {loadingInsights[part.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleGetStrategy(part); }} className="text-white hover:text-green-500 p-2.5 bg-black/60 backdrop-blur-md rounded-xl transition-all active:scale-90 shadow-lg" title="AI Strategy">
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className="inline-block text-[8px] font-black bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest truncate">
                      {(t.categories as any)[part.category] || part.category}
                    </span>
                    <button onClick={() => setPartToPrint(part)} className="text-zinc-600 hover:text-white transition-colors" title={t.print_label}>
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="min-h-[3rem]">
                    <h3 className="text-sm md:text-base font-black text-white leading-tight uppercase tracking-tight group-hover:text-amber-500 transition-colors line-clamp-2">{part.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 mt-3 overflow-hidden">
                      <Car className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-wide truncate">
                        {part.vehicleInfo.year} {part.vehicleInfo.make} {part.vehicleInfo.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-4 border-t border-white/5 overflow-hidden">
                    <p className="text-amber-500 font-mono text-3xl font-black truncate">${part.suggestedPrice.toLocaleString()}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 mt-auto flex gap-2">
                  <button onClick={() => setPartToSell(part)} className="flex-1 py-5 bg-amber-500 hover:brightness-110 text-black text-[11px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/10">
                    <DollarSign className="w-4 h-4" /> {t.register_sale}
                  </button>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleCreateAd(part)} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition-all" title={t.create_ad}>
                      <Megaphone className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPartToDelete(part)} className="p-4 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-2xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap text-right">Precio</th>
                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedInventory.map(part => (
                    <tr key={part.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-500 shrink-0 relative overflow-hidden">
                            {part.imageUrl ? <img src={part.imageUrl} className="w-full h-full object-cover opacity-50" /> : <Hash className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase truncate max-w-[200px]">{part.name}</span>
                            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{(t.categories as any)[part.category] || part.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tight">{part.vehicleInfo.year} {part.vehicleInfo.make}</span>
                          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{part.vehicleInfo.model}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right flex flex-col items-end gap-1">
                        <span className="font-mono text-amber-500 font-black text-lg">${part.suggestedPrice.toLocaleString()}</span>
                        {insights[part.id] && <span className="text-[10px] text-amber-500/60 uppercase font-black tracking-tight">{insights[part.id].substring(0, 50)}...</span>}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => fetchMarketInsight(part)} className="p-2 text-zinc-500 hover:text-amber-500 transition-all" title="Market Insight">
                            <Zap className={`w-4 h-4 ${loadingInsights[part.id] ? 'animate-pulse' : ''}`} />
                          </button>
                          <button onClick={() => handleGetStrategy(part)} className="p-2 text-zinc-500 hover:text-green-500 transition-all" title="AI Strategy">
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => setPartToPrint(part)} className="p-2 text-zinc-500 hover:text-white transition-all">
                            <Printer className="w-4 h-4" />
                          </button>
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
            </div>
          </div>
        )}

        {/* Modals */}
        {strategyPart && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
            <div className="bg-zinc-900 border border-white/5 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-green-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">ESTRATEGIA IA: {strategyPart.name}</h3>
                </div>
                <button onClick={() => setStrategyPart(null)} className="p-2 text-zinc-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-black/60 border border-white/5 rounded-3xl p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {isGeneratingStrategy ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Diseñando estrategia de venta...</span>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-300 leading-relaxed font-black uppercase tracking-tight whitespace-pre-wrap">{generatedStrategy}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {partToPrint && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-zinc-900 border border-white/5 w-fit rounded-[2.5rem] p-1 shadow-2xl scale-in-center">
              <LabelPrintView part={partToPrint} onClose={() => setPartToPrint(null)} businessName={businessName} lang={lang} />
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

        {isBatchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white overflow-hidden">
            <div className="bg-zinc-900 border border-white/5 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl scale-in-center max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                    ADMINISTRACIÓN POR LOTE
                  </h3>
                </div>
                <button onClick={() => setIsBatchModalOpen(false)} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {vehicles.length === 0 ? (
                  <div className="py-20 text-center text-zinc-700 italic text-sm">No hay vehículos con piezas disponibles.</div>
                ) : vehicles.map(v => (
                  <div key={v.key} className="bg-black/40 border border-white/5 rounded-3xl p-6 hover:border-amber-500/10 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                          {v.year} {v.make} {v.model}
                        </h4>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <Package className="w-3 h-3" /> {v.partsCount} piezas disponibles • VIN: {v.vin || 'N/A'}
                        </p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button
                          onClick={() => { setSelectedVehicleKey(v.key); setBatchActionType('DELETE'); }}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-950/30 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          Baja Total
                        </button>
                        <button
                          onClick={() => { setSelectedVehicleKey(v.key); setBatchActionType('SELL'); setBatchSalePrice('0'); }}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-950/30 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500 hover:text-white transition-all text-center"
                        >
                          Venta Lote
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedVehicleKey && batchActionType === 'DELETE' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
            <div className="bg-zinc-900 border border-red-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
              <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"><AlertCircle className="w-8 h-8 text-red-500" /></div></div>
              <h3 className="text-xl font-black text-white text-center uppercase italic tracking-tighter mb-2">¿ELIMINAR EL LOTE COMPLETO?</h3>
              <p className="text-zinc-400 text-center text-sm mb-8">Se eliminarán permanentemente las {vehicles.find(v => v.key === selectedVehicleKey)?.partsCount} piezas de este vehículo.</p>
              <div className="flex gap-4">
                <button onClick={() => { setSelectedVehicleKey(null); setBatchActionType(null); }} className="flex-1 py-4 bg-zinc-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest">CANCELAR</button>
                <button onClick={confirmBatchAction} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                  {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />} SI, ELIMINAR TODO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Insight Modal */}
        {insightPart && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
            <div className="bg-zinc-900 border border-white/5 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">ANÁLISIS DE MERCADO: {insightPart.name}</h3>
                </div>
                <button onClick={() => setInsightPart(null)} className="p-2 text-zinc-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-black/60 border border-white/5 rounded-3xl p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {loadingInsights[insightPart.id] ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Consultando mercado real...</span>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-300 leading-relaxed font-black uppercase tracking-tight whitespace-pre-wrap">
                    {insights[insightPart.id] || "No se pudo obtener información de mercado."}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedVehicleKey && batchActionType === 'SELL' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
            <div className="bg-zinc-900 border border-green-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
              <h3 className="text-xl font-black text-white text-center uppercase italic tracking-tighter mb-6">VENTA POR LOTE</h3>
              <div className="bg-black/40 border border-white/5 rounded-3xl p-6 mb-8 text-center">
                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-1 truncate">
                  {vehicles.find(v => v.key === selectedVehicleKey)?.year} {vehicles.find(v => v.key === selectedVehicleKey)?.make} {vehicles.find(v => v.key === selectedVehicleKey)?.model}
                </p>
                <p className="text-zinc-500 text-[8px] uppercase tracking-widest">{vehicles.find(v => v.key === selectedVehicleKey)?.partsCount} piezas en total</p>
                <div className="relative mt-6">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500 font-mono text-2xl font-black">$</span>
                  <input autoFocus type="number" value={batchSalePrice} onChange={(e) => setBatchSalePrice(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-3xl font-mono font-black focus:outline-none focus:border-green-500 transition-all text-center" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setSelectedVehicleKey(null); setBatchActionType(null); }} className="flex-1 py-4 bg-zinc-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest">CANCELAR</button>
                <button onClick={confirmBatchAction} className="flex-1 py-4 bg-green-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                  {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />} REGISTRAR VENTA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("InventoryView Error:", err);
    return <div className="p-8 text-red-500 font-bold bg-red-500/10 rounded-3xl border border-red-500/20">Error en Vista de Inventario: {String(err)}</div>;
  }
};

export default InventoryView;
