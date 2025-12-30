
import React, { useState } from 'react';
import { Part } from '../types';
import { translations } from '../translations';
import { FileText, Copy, User, MapPin, RefreshCw, ChevronRight, Share2, ReceiptText } from 'lucide-react';

interface SalesViewProps {
  salesHistory: Part[];
  onRefresh: () => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
}

const SalesView: React.FC<SalesViewProps> = ({ salesHistory, onRefresh, lang, businessName, location }) => {
  const t = translations[lang];
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const getDisplayPrice = (part: Part) => part.finalPrice || part.suggestedPrice || 0;

  const invoiceContent = selectedPart ? `
${businessName.toUpperCase()} - INVOICE #${Math.floor(Math.random()*10000)}
${t.date} ${new Date().toLocaleDateString()}
${t.location} ${location}

${t.bill_to}
${clientName || 'CUSTOMER NAME'}
${clientAddress || 'CUSTOMER ADDRESS'}

----------------------------------------------------------------------------------
${t.qty}   ${t.description.toUpperCase().padEnd(48)} ${t.price.toUpperCase().padEnd(15)} ${t.total.toUpperCase()}
----------------------------------------------------------------------------------
1     ${selectedPart.name.padEnd(48)} $${getDisplayPrice(selectedPart).toString().padEnd(14)} $${getDisplayPrice(selectedPart)}
      Auto: ${selectedPart.vehicleInfo.year} ${selectedPart.vehicleInfo.make} ${selectedPart.vehicleInfo.model}
      VIN: ${selectedPart.vehicleInfo.vin || 'N/A'}
----------------------------------------------------------------------------------
                                                      SUBTOTAL:       $${getDisplayPrice(selectedPart)}
                                                      TOTAL DUE:      $${getDisplayPrice(selectedPart)}

${t.thanks_purchase} 
${t.no_returns}
  ` : '';

  const handleCopy = () => {
    setIsCopying(true);
    navigator.clipboard.writeText(invoiceContent);
    setTimeout(() => setIsCopying(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-white">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <ReceiptText className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
            Ventas & Facturas
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Terminal: {businessName}</p>
        </div>
        <button onClick={onRefresh} className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-white hover:bg-zinc-800 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <RefreshCw className="w-3.5 h-3.5" /> {lang === 'es' ? 'Sincronizar' : 'Sync'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-3 uppercase tracking-widest">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span> {t.recently_sold}
          </h3>
          <div className="space-y-3 max-h-[60vh] lg:max-h-none overflow-y-auto pr-2 custom-scrollbar">
            {salesHistory.map(part => (
              <div key={part.id} className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden ${selectedPart?.id === part.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`} onClick={() => setSelectedPart(part)}>
                <div className="space-y-1 pr-4">
                  <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">{part.name}</h4>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{part.vehicleInfo.year} {part.vehicleInfo.make} {part.vehicleInfo.model}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xl text-green-500 font-mono font-black">${getDisplayPrice(part).toLocaleString()}</p>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedPart?.id === part.id ? 'translate-x-1 text-amber-500' : 'text-zinc-700'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-8 self-start">
          {selectedPart ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">Configurador</div>
                <button onClick={handleCopy} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isCopying ? 'bg-green-600' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                  {isCopying ? <FileText className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopying ? '¡COPIADO!' : t.copy_docs}
                </button>
              </div>
              <div className="space-y-4">
                <input placeholder="Nombre del Cliente" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                <textarea placeholder="Dirección / Teléfono" className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </div>
              <div className="bg-black p-5 rounded-2xl border border-white/5 font-mono text-[9px] text-green-500/90 whitespace-pre overflow-x-auto shadow-inner leading-relaxed custom-scrollbar max-h-48 md:max-h-none">
                {invoiceContent}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/10 border border-dashed border-zinc-800 h-64 md:h-[500px] rounded-[3rem] flex flex-col items-center justify-center p-8 text-center text-zinc-600">
              <Share2 className="w-6 h-6 opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Selecciona una venta de {businessName} para facturar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesView;
