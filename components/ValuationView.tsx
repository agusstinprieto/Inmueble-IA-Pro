
import React, { useState } from 'react';
import {
    Calculator,
    Sparkles,
    MapPin,
    Home,
    Maximize2,
    DollarSign,
    TrendingUp,
    Info,
    ArrowRight,
    Loader2,
    CheckCircle2,
    FileText,
    Globe
} from 'lucide-react';
import { PropertyType } from '../types';
import { translations } from '../translations';
import { getPropertyValuation } from '../services/gemini';

interface ValuationViewProps {
    lang: 'es' | 'en';
    brandColor: string;
    businessName: string;
}

const ValuationView: React.FC<ValuationViewProps> = ({
    lang,
    brandColor,
    businessName
}) => {
    const t = translations[lang];
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [formData, setFormData] = useState({
        propertyType: 'CASA' as PropertyType,
        country: 'MEXICO' as 'MEXICO' | 'USA',
        city: '',
        neighborhood: '',
        m2Built: '',
        m2Total: '',
        bedrooms: '',
        bathrooms: '',
        condition: 'BUENA',
        amenities: ''
    });

    const handleValuate = async () => {
        setLoading(true);
        try {
            const valuation = await getPropertyValuation(formData, formData.city);
            setResult(valuation);
        } catch (error) {
            console.error("Valuation Error:", error);
            alert(lang === 'es' ? 'Error al generar la valuación. Intenta de nuevo.' : 'Error generating valuation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: 'MXN' | 'USD') => {
        return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {lang === 'es' ? 'VALUACIÓN' : 'AI PROPERTY'} <br />
                        <span style={{ color: brandColor }}>{lang === 'es' ? 'ESTUDIO DE MERCADO IA' : 'MARKET STUDY'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">{lang === 'es' ? 'Análisis preciso basado en ubicación, ciudad y colonia' : 'Precise analysis based on location, city, and neighborhood'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={18} />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Gemini Advanced RLHF</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Form Side */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50">
                        <Calculator className="text-zinc-500" size={20} />
                        <h3 className="text-white font-black italic uppercase tracking-tighter">{lang === 'es' ? 'Datos del Estudio' : 'Study Data'}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.country}</label>
                            <div className="flex gap-2">
                                {['MEXICO', 'USA'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setFormData({ ...formData, country: c as any })}
                                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase italic transition-all border ${formData.country === c ? 'bg-amber-500 border-amber-500 text-black' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Globe size={14} />
                                            {c === 'MEXICO' ? t.mexico : t.usa}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.city}</label>
                            <input
                                type="text"
                                placeholder="Ej. Torreón"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.neighborhood}</label>
                            <input
                                type="text"
                                placeholder="Ej. Viñedos"
                                value={formData.neighborhood}
                                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{lang === 'es' ? 'Tipo de Inmueble' : 'Property Type'}</label>
                            <select
                                value={formData.propertyType}
                                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                                className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                            >
                                {Object.entries(PropertyType).map(([key, value]) => (
                                    <option key={key} value={key}>{t.property_types[value]}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">M² Const.</label>
                                <input
                                    type="number"
                                    value={formData.m2Built}
                                    onChange={(e) => setFormData({ ...formData, m2Built: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">M² Total</label>
                                <input
                                    type="number"
                                    value={formData.m2Total}
                                    onChange={(e) => setFormData({ ...formData, m2Total: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.bedrooms}</label>
                                <input
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.bathrooms}</label>
                                <input
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold italic"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleValuate}
                        disabled={loading || !formData.city || !formData.neighborhood}
                        style={{ backgroundColor: brandColor }}
                        className="w-full py-5 text-black rounded-[1.5rem] font-black text-sm uppercase italic active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                {lang === 'es' ? 'Generando Estudio...' : 'Generating Study...'}
                            </>
                        ) : (
                            <>
                                <Calculator size={20} />
                                {lang === 'es' ? 'Obtener Valuación' : 'Get Valuation'}
                            </>
                        )}
                    </button>
                    {!formData.city && <p className="text-[9px] text-zinc-600 font-bold italic text-center uppercase tracking-widest">* {lang === 'es' ? 'Ingresa ciudad y colonia para mayor precisión' : 'Enter city and neighborhood for accuracy'}</p>}
                </div>

                {/* Result Side */}
                <div className="space-y-8">
                    {result ? (
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 animate-in zoom-in-95 duration-700 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8">
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-black text-green-500 italic uppercase">
                                    <CheckCircle2 size={12} />
                                    {lang === 'es' ? 'Alta Precisión' : 'High Accuracy'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest italic">{lang === 'es' ? 'Estimado Comercial en' : 'Market Estimated Value in'} {result.currency}</p>
                                <h2 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                    {formatCurrency(result.estimatedPrice, result.currency)}
                                </h2>
                                <p className="text-zinc-600 text-sm italic font-bold">
                                    {lang === 'es' ? 'Rango Sugerido' : 'Suggested Range'}: {formatCurrency(result.priceRange.min, result.currency)} - {formatCurrency(result.priceRange.max, result.currency)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Precio por M²' : 'Price per M²'}</p>
                                    <p className="text-xl font-black text-white italic tracking-tighter">{formatCurrency(result.pricePerM2, result.currency)}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Confianza' : 'Confidence'}</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="text-green-500" size={20} />
                                        <p className="text-xl font-black text-white italic tracking-tighter">{(result.marketConfidence * 100).toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest italic">{lang === 'es' ? 'Insights de Mercado (IA)' : 'Market Insights (AI)'}</h4>
                                    <FileText size={16} className="text-zinc-700" />
                                </div>
                                <div className="space-y-3">
                                    {result.suggestions.map((s: string, i: number) => (
                                        <div key={i} className="flex gap-3 text-sm text-zinc-400 leading-relaxed italic border-l-2 border-amber-500/30 pl-4 py-1">
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const content = `VALUACIÓN INMOBILIARIA - ${businessName}\n\n` +
                                        `Estimado: ${formatCurrency(result.estimatedPrice, result.currency)}\n` +
                                        `Rango: ${formatCurrency(result.priceRange.min, result.currency)} - ${formatCurrency(result.priceRange.max, result.currency)}\n` +
                                        `Precio/m2: ${formatCurrency(result.pricePerM2, result.currency)}\n` +
                                        `Confianza: ${(result.marketConfidence * 100).toFixed(0)}%\n\n` +
                                        `INSIGHTS:\n${result.suggestions.join('\n')}\n\n` +
                                        `Ubicación: ${formData.city}, ${formData.neighborhood}\n` +
                                        `Características: ${formData.propertyType}, ${formData.bedrooms} rec, ${formData.bathrooms} baños, ${formData.m2Built}m2 const / ${formData.m2Total}m2 total`;

                                    const blob = new Blob([content], { type: 'text/plain' });
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `Valuacion_${formData.city}_${Date.now()}.txt`;
                                    link.click();
                                }}
                                className="w-full group py-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest pt-4"
                            >
                                {lang === 'es' ? 'Exportar Estudio de Mercado' : 'Export Market Study'}
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/10 border-2 border-dashed border-zinc-800 rounded-[2.5rem] h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-6">
                            <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800">
                                <Globe className="text-zinc-800" size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-zinc-700 uppercase italic tracking-tighter">{lang === 'es' ? 'Define la Zona' : 'Define the Area'}</h3>
                                <p className="text-zinc-800 text-sm max-w-xs mx-auto">{lang === 'es' ? 'Ingresa la ubicación exacta para que nuestra IA compare con precios reales de la colonia.' : 'Process the exact location so our AI compares with actual neighborhood prices.'}</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse delay-700"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ValuationView;
