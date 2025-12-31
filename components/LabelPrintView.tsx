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
                setExportProgress(Math.round(((i) / parts.length) * 100));
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
            pdf.save(parts.length === 1 ? `Label_${parts[0].id}.pdf` : `Labels_Batch_${new Date().getTime()}.pdf`);
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
            <div className="bg-zinc-900 border border-white/5 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl scale-in-center flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-amber-500" />
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">
                                {t.print_label}
                            </h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {parts.length} {lang === 'es' ? 'Etiquetas en cola' : 'Labels in queue'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 py-4 px-2 mb-10">
                    {parts.map((p, idx) => (
                        <div key={p.id} className="flex flex-col items-center">
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
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <div>
                                        <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', marginBottom: '4px', margin: 0 }}>{businessName}</h4>
                                        <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2, margin: 0 }}>{p.name}</h2>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{p.vehicleInfo.year} {p.vehicleInfo.make}</p>
                                        <p style={{ fontSize: '9px', fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>{p.vehicleInfo.model}</p>
                                        {p.vehicleInfo.vin && (
                                            <p style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '4px', opacity: 0.6, margin: 0 }}>VIN: {p.vehicleInfo.vin}</p>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '18px', fontWeight: 900, marginTop: '8px', margin: 0 }}>${p.suggestedPrice.toLocaleString()}</p>
                                </div>

                                <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ padding: '8px', border: '2px solid #f4f4f5', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                                        <QRCodeCanvas
                                            value={p.id}
                                            size={90}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <p style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>ID: {p.id}</p>
                                </div>
                            </div>
                            <div className="w-full mt-4 flex items-center gap-3 px-4">
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{p.id}</span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4 shrink-0">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="w-full py-5 bg-amber-500 text-black text-[12px] font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:brightness-110 flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-amber-500/20"
                    >
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                        {isExporting ? (lang === 'es' ? `PROCESANDO... ${exportProgress}%` : `PROCESSING... ${exportProgress}%`) : (lang === 'es' ? `DESCARGAR ${parts.length} ETIQUETAS` : `DOWNLOAD ${parts.length} LABELS`)}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        {lang === 'es' ? 'VOLVER AL INVENTARIO' : 'BACK TO INVENTORY'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelPrintView;
