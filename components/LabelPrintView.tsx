import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Part } from '../types';
import { translations } from '../translations';
import { X, Printer, Package, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LabelPrintViewProps {
    part: Part;
    businessName: string;
    lang: 'es' | 'en';
    onClose: () => void;
}

const LabelPrintView: React.FC<LabelPrintViewProps> = ({ part, businessName, lang, onClose }) => {
    const t = translations[lang] || translations.es;
    const printRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('label-to-print');
        if (!element) return;

        setIsExporting(true);
        console.log("Starting Label PDF Export for ID:", part.id);

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // slightly lower to be safer, yet still high quality
                backgroundColor: '#ffffff',
                logging: true,
                useCORS: true,
                allowTaint: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [4, 2] // Standard 4x2 thermal label size
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 4, 2);
            pdf.save(`Label_${part.id}.pdf`);
            console.log("Label PDF Export SUCCESS");
        } catch (error) {
            console.error("Label PDF error:", error);
            alert(`${lang === 'es' ? "Error al generar PDF" : "Error generating PDF"}: ${String(error)}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white no-print">
            <div className="bg-zinc-900 border border-white/5 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl scale-in-center flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">
                            {t.print_label}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Print Content Area - USING HEX COLORS ONLY TO AVOID OKLCH ERROR */}
                <div className="flex-1 flex flex-col items-center justify-center mb-8 overflow-hidden">
                    <div
                        id="label-to-print"
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
                                <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2, margin: 0 }}>{part.name}</h2>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{part.vehicleInfo.year} {part.vehicleInfo.make}</p>
                                <p style={{ fontSize: '9px', fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>{part.vehicleInfo.model}</p>
                                {part.vehicleInfo.vin && (
                                    <p style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '4px', opacity: 0.6, margin: 0 }}>VIN: {part.vehicleInfo.vin}</p>
                                )}
                            </div>
                            <p style={{ fontSize: '18px', fontWeight: 900, marginTop: '8px', margin: 0 }}>${part.suggestedPrice.toLocaleString()}</p>
                        </div>

                        <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                            <div style={{ padding: '8px', border: '2px solid #f4f4f5', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                                <QRCodeCanvas
                                    value={part.id}
                                    size={90}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>ID: {part.id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            className="flex-1 py-4 bg-zinc-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all hover:bg-zinc-700 flex items-center justify-center gap-2"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-500" />}
                            DESCARGAR PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-4 bg-amber-500 text-black text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all hover:brightness-110 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> {t.print_label}
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        CERRAR
                    </button>
                </div>
            </div>

            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #label-to-print, #label-to-print * {
            visibility: visible;
          }
          #label-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 4in !important;
            height: 2in !important;
            padding: 20px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default LabelPrintView;
