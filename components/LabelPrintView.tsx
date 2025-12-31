import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
        if (!printRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 4, // Higher scale for print quality
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [4, 2] // Standard 4x2 thermal label size
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 4, 2);
            pdf.save(`Label_${part.id}.pdf`);
        } catch (error) {
            console.error("Label PDF error:", error);
            alert(lang === 'es' ? "Error al generar PDF" : "Error generating PDF");
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

                {/* Print Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center mb-8">
                    <div
                        id="label-to-print"
                        ref={printRef}
                        className="bg-white text-black p-6 rounded-lg shadow-xl print:shadow-none print:m-0 print:p-8 flex"
                        style={{ width: '4in', height: '2in' }}
                    >
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{businessName}</h4>
                                <h2 className="text-sm font-black uppercase leading-tight line-clamp-2">{part.name}</h2>
                            </div>
                            <div className="mt-2">
                                <p className="text-[10px] font-bold uppercase">{part.vehicleInfo.year} {part.vehicleInfo.make}</p>
                                <p className="text-[9px] font-medium text-zinc-600 uppercase tracking-tight">{part.vehicleInfo.model}</p>
                                {part.vehicleInfo.vin && (
                                    <p className="text-[7px] font-mono mt-1 opacity-60">VIN: {part.vehicleInfo.vin}</p>
                                )}
                            </div>
                            <p className="text-lg font-black mt-2">${part.suggestedPrice.toLocaleString()}</p>
                        </div>

                        <div className="ml-4 flex flex-col items-end justify-center">
                            <div className="p-2 border-2 border-zinc-100 rounded-lg bg-white">
                                <QRCodeSVG
                                    value={part.id}
                                    size={100}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-[7px] font-mono mt-2 opacity-50 uppercase tracking-tighter">ID: {part.id}</p>
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
