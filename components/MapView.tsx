
import React, { useState } from 'react';
import {
    Map as MapIcon,
    MapPin,
    Search,
    Layers,
    Navigation,
    Maximize2,
    Minimize2,
    Filter,
    Info,
    Home,
    DollarSign,
    ArrowRight
} from 'lucide-react';
import { Property, OperationType } from '../types';
import { translations } from '../translations';

interface MapViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
}

const MapView: React.FC<MapViewProps> = ({
    properties,
    lang,
    brandColor
}) => {
    const t = translations[lang];
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [zoom, setZoom] = useState(14);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: lang === 'es' ? 'MXN' : 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="h-[calc(100vh-100px)] relative overflow-hidden bg-[#0a0a0a]">
            {/* Search Overlay */}
            <div className="absolute top-6 left-6 z-20 w-80 space-y-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2 pr-4">
                    <div className="p-2 bg-amber-500 rounded-xl text-black">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder={lang === 'es' ? 'Buscar zona o colonia...' : 'Search area...'}
                        className="bg-transparent border-none text-sm text-white focus:outline-none w-full font-bold placeholder:text-zinc-600"
                    />
                </div>

                <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{lang === 'es' ? 'Propiedades Cerca' : 'Properties Nearby'}</h3>
                        <span className="text-[10px] font-black text-amber-500 italic bg-amber-500/10 px-2 py-0.5 rounded-full">{properties.length}</span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {properties.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProp(p)}
                                className={`w-full p-3 rounded-2xl border transition-all text-left flex gap-3 ${selectedProp?.id === p.id ? 'bg-amber-500/20 border-amber-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                            >
                                <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-white uppercase italic truncate tracking-tighter">{p.title}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold mt-1 italic">{formatCurrency(p.operation === OperationType.VENTA ? p.salePrice || 0 : p.rentPrice || 0)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
                <button className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-zinc-800 transition-all shadow-xl">
                    <Layers size={20} />
                </button>
                <button className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-zinc-800 transition-all shadow-xl">
                    <Navigation size={20} />
                </button>
                <div className="flex flex-col bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden mt-2">
                    <button onClick={() => setZoom(z => Math.min(20, z + 1))} className="p-3 text-white hover:bg-zinc-800 transition-all border-b border-white/5"><Maximize2 size={18} /></button>
                    <button onClick={() => setZoom(z => Math.max(1, z - 1))} className="p-3 text-white hover:bg-zinc-800 transition-all"><Minimize2 size={18} /></button>
                </div>
            </div>

            {/* Property Details Popup */}
            {selectedProp && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-[400px] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedProp(null)}
                            className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                        >
                            <Minimize2 size={16} />
                        </button>

                        <div className="flex gap-6">
                            <img src={selectedProp.images[0]} className="w-32 h-32 rounded-3xl object-cover shadow-2xl" alt="" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">{selectedProp.type} • {selectedProp.operation}</span>
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter truncate">{selectedProp.title}</h4>
                                    <p className="text-xs text-zinc-500 font-bold italic flex items-center gap-1">
                                        <MapPin size={12} className="text-amber-500" />
                                        {selectedProp.address.city}, {selectedProp.address.colony}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xl font-black text-white italic tracking-tighter">{formatCurrency(selectedProp.operation === OperationType.VENTA ? selectedProp.salePrice || 0 : selectedProp.rentPrice || 0)}</p>
                                    <button
                                        style={{ backgroundColor: brandColor }}
                                        className="p-2.5 text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulated Map Canvas */}
            <div className="absolute inset-0 bg-[#0f1115] overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}></div>

                {/* Major Roads Decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute w-full h-[2px] bg-zinc-800/40 top-1/3 rotate-[-5deg]"></div>
                    <div className="absolute w-full h-[2px] bg-zinc-800/40 top-2/3 rotate-[10deg]"></div>
                    <div className="absolute h-full w-[2px] bg-zinc-800/40 left-1/4 rotate-[-15deg]"></div>
                    <div className="absolute h-full w-[2px] bg-zinc-800/40 right-1/4 rotate-[5deg]"></div>
                </div>

                {/* Markers Simulation */}
                {properties.map((p, idx) => {
                    // Generate deterministic unique positions for the pins based on index
                    const left = (25 + (idx * 17) % 60) + '%';
                    const top = (30 + (idx * 23) % 40) + '%';
                    const isSelected = selectedProp?.id === p.id;

                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelectedProp(p)}
                            className={`absolute cursor-pointer transition-all hover:scale-125 hover:z-50 ${isSelected ? 'z-40 scale-125' : 'z-10'}`}
                            style={{ left, top }}
                        >
                            <div className="relative group">
                                <div className={`p-2 rounded-2xl shadow-2xl border-2 backdrop-blur-md transition-all ${isSelected ? 'bg-amber-500 border-white text-black' : 'bg-black/60 border-amber-500/50 text-amber-500 hover:border-amber-500'}`}>
                                    <MapPin size={18} strokeWidth={3} />
                                </div>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/90 text-white px-3 py-1.5 rounded-xl border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">
                                    <p className="text-[10px] font-black uppercase italic tracking-tighter">{formatCurrency(p.operation === OperationType.VENTA ? p.salePrice || 0 : p.rentPrice || 0)}</p>
                                </div>
                                <div className={`absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-500/20 rounded-full blur-md transition-all ${isSelected ? 'scale-150 opacity-100' : 'opacity-0'}`}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-6 right-6 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-4 shadow-xl">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Disponibles' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Vendidas' : 'Sold'}</span>
                </div>
            </div>
        </div>
    );
};

export default MapView;
