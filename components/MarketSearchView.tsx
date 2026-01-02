
import React, { useState } from 'react';
import {
    Search,
    Filter,
    MapPin,
    ArrowRightLeft,
    Home,
    AlertCircle,
    DollarSign,
    Maximize2,
    TrendingUp,
    Layers,
    ChevronDown,
    X,
    Plus,
    ArrowRight,
    Sparkles,
    Info,
    CheckCircle2
} from 'lucide-react';
import { Property, PropertyType, OperationType, PropertyStatus } from '../types';
import { translations } from '../translations';

interface MarketSearchViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
}

const MarketSearchView: React.FC<MarketSearchViewProps> = ({
    properties,
    lang,
    brandColor
}) => {
    const t = translations[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<PropertyType | 'ALL'>('ALL');
    const [opFilter, setOpFilter] = useState<OperationType | 'ALL'>('ALL');
    const [countryFilter, setCountryFilter] = useState<'ALL' | 'MEXICO' | 'USA'>('ALL');
    const [cityFilter, setCityFilter] = useState('');
    const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
    const [compareList, setCompareList] = useState<Property[]>([]);
    const [isComparing, setIsComparing] = useState(false);

    // Calculate Market Insights
    const totalMarketValue = properties.reduce((acc, p) => acc + Number(p.operation === OperationType.VENTA ? p.salePrice || 0 : p.rentPrice || 0), 0);
    const avgPrice = properties.length > 0 ? totalMarketValue / properties.length : 0;

    const propertiesWithM2 = properties.filter(p => (p.specs.m2Built || 0) > 0);
    const avgPriceM2 = propertiesWithM2.length > 0
        ? propertiesWithM2.reduce((acc, p) => acc + (Number(p.operation === OperationType.VENTA ? p.salePrice || 0 : p.rentPrice || 0) / (p.specs.m2Built || 1)), 0) / propertiesWithM2.length
        : 0;

    const typeDistribution = properties.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address.colony.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
        const matchesOp = opFilter === 'ALL' || p.operation === opFilter;
        const matchesCountry = countryFilter === 'ALL' || p.address.country === countryFilter;
        const matchesCity = !cityFilter || p.address.city.toLowerCase().includes(cityFilter.toLowerCase());
        const matchesNeighborhood = !neighborhoodFilter || p.address.colony.toLowerCase().includes(neighborhoodFilter.toLowerCase());

        return matchesSearch && matchesType && matchesOp && matchesCountry && matchesCity && matchesNeighborhood;
    });

    const toggleCompare = (property: Property) => {
        if (compareList.find(p => p.id === property.id)) {
            setCompareList(prev => prev.filter(p => p.id !== property.id));
        } else if (compareList.length < 3) {
            setCompareList(prev => [...prev, property]);
        }
    };

    const formatCurrency = (amount: number, currency: 'MXN' | 'USD') => {
        return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (isComparing) {
        return (
            <div className="p-4 lg:p-8 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsComparing(false)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-black text-xs uppercase italic"
                    >
                        <ArrowRight className="rotate-180" size={18} />
                        {lang === 'es' ? 'Volver al Buscador' : 'Back to Search'}
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                            {lang === 'es' ? 'COMPARADOR' : 'MARKET'} <span style={{ color: brandColor }}>{lang === 'es' ? 'DE MERCADO' : 'COMPARISON'}</span>
                        </h1>
                    </div>
                    <div className="w-24"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 border border-zinc-800 rounded-3xl p-6 bg-zinc-900/20 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest italic">{lang === 'es' ? 'Características' : 'Features'}</h3>
                            <p className="text-xs text-zinc-600 italic leading-relaxed">{lang === 'es' ? 'Comparativa técnica detallada de las propiedades seleccionadas.' : 'Detailed technical comparison of selected properties.'}</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            {['Precio', 'M² Construcción', 'Habitaciones', 'Baños', 'Cajones', 'Tipo', 'Estado'].map(feature => (
                                <div key={feature} className="h-12 flex items-center border-b border-zinc-800 text-zinc-300 text-xs font-bold font-black uppercase tracking-tighter">
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    {compareList.map(prop => (
                        <div key={prop.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-amber-500/30 transition-all">
                            <div className="aspect-[4/3] relative">
                                <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => toggleCompare(prop)}
                                    className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-xl text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                                <div className="absolute bottom-4 left-4 right-4 group-hover:bottom-6 transition-all duration-500">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl">
                                        <h4 className="text-sm font-black text-white uppercase italic truncate mb-1">{prop.title}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[8px] font-black text-white/60 uppercase tracking-widest italic">{prop.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Technical Specs Section */}
                                <div className="space-y-4">
                                    <div className="h-14 flex flex-col items-center justify-center border-b border-zinc-800/50 group/item hover:bg-white/5 transition-colors rounded-xl">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Inversión</p>
                                        <span className="text-xl font-black text-white italic tracking-tighter">
                                            {formatCurrency(prop.operation === OperationType.VENTA ? prop.salePrice || 0 : prop.rentPrice || 0, prop.currency)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="h-12 flex flex-col items-center justify-center border-b border-zinc-800/50 hover:bg-white/5 transition-colors rounded-xl">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Superficie</p>
                                            <span className="text-xs font-bold text-zinc-300">{prop.specs.m2Built} m²</span>
                                        </div>
                                        <div className="h-12 flex flex-col items-center justify-center border-b border-zinc-800/50 hover:bg-white/5 transition-colors rounded-xl">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Habitaciones</p>
                                            <span className="text-xs font-bold text-zinc-300">{prop.specs.bedrooms} Rec.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Section (PROS & CONS) */}
                                <div className="pt-4 border-t border-zinc-800 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest italic flex items-center gap-2">
                                            <TrendingUp size={10} /> {t.pros}
                                        </p>
                                        <div className="space-y-1.5">
                                            {(prop.pros || ['Ubicación estratégica', 'Alta plusvalía']).map((pro, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <div className="mt-1 w-1 h-1 rounded-full bg-teal-500"></div>
                                                    <p className="text-[10px] text-zinc-400 font-medium leading-tight">{pro}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2">
                                            <AlertCircle size={10} /> {t.cons}
                                        </p>
                                        <div className="space-y-1.5">
                                            {(prop.cons || ['Requiere remodelación parcial']).map((con, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <div className="mt-1 w-1 h-1 rounded-full bg-rose-500"></div>
                                                    <p className="text-[10px] text-zinc-400 font-medium leading-tight">{con}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <div className="h-12 flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">{prop.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {compareList.length < 3 && (
                        <button
                            onClick={() => setIsComparing(false)}
                            className="border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-zinc-700 transition-all hover:bg-white/5"
                        >
                            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="text-zinc-500" size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{lang === 'es' ? 'Añadir Propiedad' : 'Add Property'}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Market Insights Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-amber-500" size={20} />
                        <h3 className="text-white font-black italic uppercase tracking-tighter text-sm">{t.market_insights}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.avg_price_m2}</p>
                            <p className="text-xl font-black text-white italic tracking-tighter">{formatCurrency(avgPriceM2, 'MXN')}</p>
                        </div>
                        <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{lang === 'es' ? 'Valor Promedio' : 'Average Value'}</p>
                            <p className="text-xl font-black text-white italic tracking-tighter">{formatCurrency(avgPrice, 'MXN')}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-6 space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <Layers className="text-amber-500" size={20} />
                            <h3 className="text-white font-black italic uppercase tracking-tighter text-sm">{t.inventory_mix}</h3>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500">{properties.length} {lang === 'es' ? 'Activos' : 'Actives'}</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 relative z-10">
                        {Object.entries(typeDistribution).slice(0, 4).map(([type, count]) => (
                            <div key={type} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase italic truncate">{t.property_types[type as PropertyType]}</span>
                                    <span className="text-[9px] font-black text-white">{((Number(count) / properties.length) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(Number(count) / properties.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">{t.market_liquidity}</p>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">{lang === 'es' ? 'ALTA DEMANDA' : 'HIGH DEMAND'}</h4>
                    </div>
                    <div className="pt-4 mt-4 border-t border-zinc-800/50">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.total_value}</p>
                        <p className="text-2xl font-black text-amber-500 italic tracking-tighter">
                            ${(Number(totalMarketValue) / 1000000).toFixed(1)}M
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Header */}
            <div className="bg-gradient-to-br from-zinc-900 via-black to-black border border-zinc-800 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10 max-w-4xl space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2">
                            <Sparkles size={14} />
                            AI Intelligent Search
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {lang === 'es' ? 'BUSCADOR DE' : 'DISCOVER THE'} <br />
                        <span style={{ color: brandColor }}>{lang === 'es' ? 'OPORTUNIDADES' : 'OPPORTUNITIES'}</span>
                    </h1>

                    <div className="space-y-4 pt-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <select
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer md:w-48"
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value as any)}
                            >
                                <option value="ALL">{t.select_country}</option>
                                <option value="MEXICO">{t.mexico}</option>
                                <option value="USA">{t.usa}</option>
                            </select>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    placeholder={t.search_properties}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-600 italic transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder={t.city}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder={t.neighborhood}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                value={neighborhoodFilter}
                                onChange={(e) => setNeighborhoodFilter(e.target.value)}
                            />
                            <select
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                            >
                                <option value="ALL">{t.filter_by_type}</option>
                                {Object.entries(PropertyType).map(([key, value]) => (
                                    <option key={key} value={key}>{t.property_types[value]}</option>
                                ))}
                            </select>
                            <select
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                value={opFilter}
                                onChange={(e) => setOpFilter(e.target.value as any)}
                            >
                                <option value="ALL">{t.filter_by_operation}</option>
                                {Object.entries(OperationType).map(([key, value]) => (
                                    <option key={key} value={key}>{t.operations[value]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <p className="text-[10px] text-zinc-600 font-bold italic uppercase">
                            {filteredProperties.length} {lang === 'es' ? 'Resultados encontrados' : 'Results found'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Compare Bar (Sticky) */}
            {compareList.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-[2rem] shadow-2xl flex items-center gap-6 pr-4">
                        <div className="flex -space-x-4 pl-2">
                            {compareList.map(prop => (
                                <div key={prop.id} className="relative group">
                                    <img src={prop.images[0]} className="w-12 h-12 rounded-full border-2 border-black object-cover shadow-lg" alt="" />
                                    <button
                                        onClick={() => toggleCompare(prop)}
                                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-700">
                                    <Plus size={16} />
                                </div>
                            ))}
                        </div>

                        <div className="h-8 w-px bg-zinc-800"></div>

                        <div className="flex items-center gap-4">
                            <div className="text-left">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{lang === 'es' ? 'Lista de Comparativa' : 'Comparison List'}</p>
                                <p className="text-white text-xs font-bold italic">{compareList.length}/3 {lang === 'es' ? 'Seleccionadas' : 'Selected'}</p>
                            </div>
                            <button
                                onClick={() => setIsComparing(true)}
                                disabled={compareList.length < 2}
                                className="px-6 py-2.5 bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-2xl font-black uppercase text-[10px] italic transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                            >
                                {lang === 'es' ? 'Comparar Ahora' : 'Compare Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {filteredProperties.length > 0 ? filteredProperties.map((prop) => {
                    const isSelected = compareList.find(c => c.id === prop.id);
                    return (
                        <div key={prop.id} className="bg-zinc-900/30 border border-zinc-800/80 rounded-[2.5rem] overflow-hidden group hover:border-amber-500/30 transition-all hover:translate-y-[-4px]">
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-5 left-5 flex flex-col gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic backdrop-blur-md shadow-lg ${prop.operation === OperationType.VENTA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                                        }`}>
                                        {prop.operation}
                                    </span>
                                    <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase italic shadow-lg">
                                        {prop.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => toggleCompare(prop)}
                                    className={`absolute top-5 right-5 p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all shadow-xl group/btn ${isSelected ? 'bg-amber-500 text-black' : 'bg-black/40 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isSelected ? <CheckCircle2 size={20} /> : <ArrowRightLeft size={20} className="group-hover/btn:scale-110" />}
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter truncate">{prop.title}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-zinc-500">
                                        <MapPin size={16} className="text-amber-500" />
                                        <span className="text-xs font-bold italic">{prop.address.city}, {prop.address.colony}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-800/50">
                                    <div className="space-y-1">
                                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">{lang === 'es' ? 'Recámaras' : 'Beds'}</p>
                                        <p className="text-white text-sm font-black flex items-center gap-1.5 italic">
                                            {prop.specs.bedrooms} <Home size={12} className="text-zinc-700" />
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">{lang === 'es' ? 'Baños' : 'Baths'}</p>
                                        <p className="text-white text-sm font-black flex items-center gap-1.5 italic">
                                            {prop.specs.bathrooms} <Layers size={12} className="text-zinc-700" />
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">{lang === 'es' ? 'Construcción' : 'Size'}</p>
                                        <p className="text-white text-sm font-black italic">{prop.specs.m2Built} m²</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between group/price">
                                    <div>
                                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em]">{lang === 'es' ? 'Precio de Lista' : 'List Price'}</p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter mt-1 group-hover/price:text-amber-500 transition-colors">
                                            {formatCurrency(prop.operation === OperationType.VENTA ? prop.salePrice || 0 : prop.rentPrice || 0, prop.currency)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleCompare(prop)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 text-black' : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-white hover:text-black hover:border-white'}`}
                                    >
                                        {isSelected ? <CheckCircle2 size={20} /> : <ArrowRightLeft size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-32 text-center text-zinc-800">
                        <Search size={64} className="mx-auto mb-6 opacity-20" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter opacity-40">{lang === 'es' ? 'Sin coincidencias' : 'No matches'}</h3>
                        <p className="text-zinc-800 text-sm mt-2">{lang === 'es' ? 'Intenta ajustar tus filtros de búsqueda.' : 'Try adjusting your search filters.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketSearchView;
