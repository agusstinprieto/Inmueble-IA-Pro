import React, { useState } from 'react';
import { Part } from '../types';
import { translations } from '../translations';
import { ReceiptText, FileText, Copy, Printer, Check, Eye, Download, MessageSquare, ChevronRight, Share2, Package, LogOut } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SalesViewProps {
  salesHistory: Part[];
  onRefresh: () => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
  onReturnPart: (part: Part) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ salesHistory = [], onRefresh, lang, businessName, location, onReturnPart }) => {
  const t = translations[lang] || translations.es;
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const getDisplayPrice = (part: Part) => {
    if (!part) return 0;
    return part.finalPrice || part.suggestedPrice || 0;
  };

  try {
    const invoiceContent = selectedPart ? `
${businessName.toUpperCase()} - INVOICE #${Math.floor(Math.random() * 10000)}
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

    const handleDownloadPDF = async () => {
      if (!selectedPart) return;
      const invoiceElement = document.getElementById('invoice-preview-hidden');
      if (!invoiceElement) return;

      try {
        const canvas = await html2canvas(invoiceElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
        pdf.save(`Invoice_${selectedPart.id}.pdf`);
      } catch (error) {
        console.error("PDF Generation error:", error);
      }
    };

    const handleWhatsApp = () => {
      if (!selectedPart) return;
      const message = `Hola! Gracias por tu consulta en ${businessName}.\nTe adjunto la información de la pieza: ${selectedPart.name}.\nPrecio: $${getDisplayPrice(selectedPart)}\nAuto: ${selectedPart.vehicleInfo.year} ${selectedPart.vehicleInfo.make} ${selectedPart.vehicleInfo.model}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-white pb-20">
        <header>
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <ReceiptText className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
              {t.sales}
            </h2>
            <p className="text-white text-[11px] font-black uppercase tracking-[0.2em] mt-1 italic opacity-60">Terminal: {businessName}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-3 uppercase tracking-widest">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span> {t.recently_sold}
            </h3>
            <div className="space-y-3 max-h-[60vh] lg:max-h-none overflow-y-auto pr-2 custom-scrollbar">
              {salesHistory.length === 0 ? (
                <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
                  <Package className="w-12 h-12 text-white mx-auto mb-4 opacity-20" />
                  <p className="text-white text-[10px] font-black uppercase tracking-widest leading-loose">No hay registros de ventas recientes.</p>
                </div>
              ) : (
                salesHistory.map(part => (
                  <div key={part.id} className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden ${selectedPart?.id === part.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`} onClick={() => setSelectedPart(part)}>
                    <div className="space-y-1 pr-4">
                      <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">{part.name}</h4>
                      <p className="text-white text-[11px] font-black uppercase tracking-wider opacity-60">{part.vehicleInfo.year} {part.vehicleInfo.make} {part.vehicleInfo.model}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xl text-green-500 font-mono font-black">${getDisplayPrice(part).toLocaleString()}</p>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedPart?.id === part.id ? 'translate-x-1 text-amber-500' : 'text-white'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 self-start">
            {selectedPart ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                  <div className="bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-lg border border-amber-500/20 text-[11px] font-black uppercase tracking-widest">{t.bill_to}</div>
                  <button
                    onClick={handleCopy}
                    className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg ${isCopying ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:brightness-110'}`}
                  >
                    {isCopying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {isCopying ? t.copied : t.copy_docs}
                  </button>
                </div>
                <div className="space-y-4">
                  <input placeholder="Nombre del Cliente" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  <textarea placeholder="Dirección / Teléfono" className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                </div>
                <div className="bg-black p-5 rounded-2xl border border-white/5 font-mono text-[9px] text-green-500/90 whitespace-pre overflow-x-auto shadow-inner leading-relaxed custom-scrollbar max-h-48 md:max-h-none">
                  {invoiceContent}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleDownloadPDF} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5 shadow-xl">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={handleWhatsApp} className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-green-500/20">
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(lang === 'es' ? '¿Estás seguro de cancelar esta venta? La pieza volverá al inventario.' : 'Are you sure you want to cancel this sale? Item will return to inventory.')) {
                        onReturnPart(selectedPart);
                        setSelectedPart(null);
                      }
                    }}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4 rotate-180" /> {lang === 'es' ? 'DEVOLUCIÓN' : 'RETURN'}
                  </button>
                </div>

                <div id="invoice-preview-hidden" style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', padding: '40px', background: 'white', color: 'black', fontFamily: 'monospace' }}>
                  <div style={{ border: '2px solid black', padding: '30px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>{businessName}</h1>
                    <p style={{ textAlign: 'center', margin: '5px 0' }}>{location}</p>
                    <div style={{ margin: '30px 0', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '15px 0' }}>
                      <p><strong>{t.bill_to}:</strong> {clientName || '...'}</p>
                      <p><strong>{t.date}:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid black' }}>
                          <th style={{ textAlign: 'left', padding: '10px' }}>{t.description}</th>
                          <th style={{ textAlign: 'right', padding: '10px' }}>{t.total}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '10px' }}>{selectedPart.name}<br /><span style={{ fontSize: '12px' }}>{selectedPart.vehicleInfo.year} {selectedPart.vehicleInfo.make} {selectedPart.vehicleInfo.model}</span></td>
                          <td style={{ textAlign: 'right', padding: '10px' }}>${getDisplayPrice(selectedPart)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '18px' }}>
                      <p><strong>TOTAL: ${getDisplayPrice(selectedPart)}</strong></p>
                    </div>
                    <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{t.thanks_purchase}</p>
                      <p style={{ fontSize: '10px', fontWeight: 500, margin: '5px 0 0 0', opacity: 0.6 }}>{t.no_returns}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/10 border border-dashed border-zinc-800 h-64 md:h-[600px] rounded-[3rem] flex flex-col items-center justify-center p-8 text-center text-white transition-all">
                <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                  <Share2 className="w-6 h-6 opacity-30" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] max-w-[200px]">{t.select_sale_prompt || 'Seleccionar una venta para facturar'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("SalesView Error:", err);
    return <div className="p-8 text-red-500 font-bold bg-red-500/10 rounded-3xl border border-red-500/20 flex flex-col items-center gap-4">
      <AlertTriangle className="w-10 h-10" />
      <span className="text-sm font-black uppercase tracking-widest">Error en Vista de Ventas</span>
      <code className="text-[10px] opacity-60 bg-black/40 p-4 rounded-xl">{String(err)}</code>
    </div>;
  }
};

export default SalesView;
