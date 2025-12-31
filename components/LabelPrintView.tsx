import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Part } from '../types';
import { translations } from '../translations';
import { X, Printer, Package, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LabelPrintViewProps {
    parts: Part[];
    businessName: string;
    lang: 'es' | 'en';
    onClose: () => void;
}

const LabelPrintView: React.FC<LabelPrintViewProps> = ({ parts, businessName, lang, onClose }) => {
    const t = translations[lang] || translations.es;
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const handleDownloadPDF = async () => {
        if (parts.length === 0) return;

        setIsExporting(true);
        setExportProgress(0);
        console.log("Starting Batch Label PDF Export for", parts.length, "parts");

        try {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [4, 2]
            });

            for (let i = 0; i < parts.length; i++) {
                setExportProgress(Math.round(((i + 1) / parts.length) * 100));
                const element = document.getElementById(`label-to-print-${i}`);
                if (!element) continue;

                const canvas = await html2canvas(element, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true,
                    allowTaint: true
                });

                const imgData = canvas.toDataURL('image/png');
                if (i > 0) pdf.addPage([4, 2], 'landscape');
                pdf.addImage(imgData, 'PNG', 0, 0, 4, 2);
            }

            setExportProgress(100);
            pdf.save(parts.length === 1 ? `Etiqueta_${parts[0].id}.pdf` : `Lote_Etiquetas_${new Date().getTime()}.pdf`);
            console.log("Batch Label PDF Export SUCCESS");
        } catch (error) {
            console.error("Batch Label PDF error:", error);
            alert(`${lang === 'es' ? "Error al generar lote" : "Error generating batch"}: ${String(error)}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white no-print">
            <div className="bg-zinc-900 border border-white/5 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl scale-in-center flex flex-col max-h-[92vh]">
                <div className="flex justify-between items-center mb-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                            <Package className="w-7 h-7 text-amber-500" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                                {t.print_label}
                            </h3>
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">
                                {parts.length} {lang === 'es' ? 'Etiquetas Listas' : 'Labels Ready'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-zinc-500 hover:text-white bg-white/5 rounded-2xl transition-all hover:scale-110 active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-12 py-4 px-4 mb-10">
                    {parts.map((p, idx) => (
                        <div key={p.id} className="flex flex-col items-center">
                            <div className="w-full flex justify-between items-end mb-3 px-2">
                                <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">{lang === 'es' ? 'Vista Previa' : 'Preview'} {idx + 1}/{parts.length}</span>
                                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">REF: {p.id}</span>
                            </div>
                            <div
                                id={`label-to-print-${idx}`}
                                style={{
                                    width: '4in',
                                    height: '2in',
                                    minWidth: '4in',
                                    minHeight: '2in',
                                    backgroundColor: '#ffffff',
                                    color: '#000000',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <div>
                                        <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#71717a', marginBottom: '6px', margin: 0 }}>{businessName}</h4>
                                        <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, margin: 0, color: '#000000' }}>{p.name}</h2>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <p style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', margin: 0, color: '#18181b' }}>{p.vehicleInfo.year} {p.vehicleInfo.make}</p>
                                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0, marginTop: '2px' }}>{p.vehicleInfo.model}</p>
                                        {p.vehicleInfo.vin && (
                                            <p style={{ fontSize: '8px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', marginTop: '6px', color: '#9ca3af', margin: 0 }}>VIN: {p.vehicleInfo.vin}</p>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '24px', fontWeight: 950, marginTop: '10px', margin: 0, color: '#000000', letterSpacing: '-0.05em' }}>${p.suggestedPrice.toLocaleString()}</p>
                                </div>

                                <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ padding: '10px', border: '2px solid #f3f4f6', borderRadius: '14px', backgroundColor: '#ffffff' }}>
                                        <QRCodeCanvas
                                            value={p.id}
                                            size={95}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <p style={{ fontSize: '8px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', marginTop: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 700 }}>ID: {p.id}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-5 shrink-0">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="w-full py-6 bg-amber-500 text-black text-[13px] font-black rounded-[1.5rem] uppercase tracking-[0.25em] transition-all hover:brightness-110 flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6" />}
                        {isExporting ? (lang === 'es' ? `GENERANDO... ${exportProgress}%` : `GENERATING... ${exportProgress}%`) : (lang === 'es' ? `DESCARGAR ${parts.length} ETIQUETAS` : `DOWNLOAD ${parts.length} LABELS`)}
                    </button>
                    {isExporting && (
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden animate-in fade-in">
                            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                    >
                        {lang === 'es' ? 'VOLVER AL INVENTARIO' : 'BACK TO INVENTORY'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelPrintView;
