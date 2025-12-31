
import React, { useState } from 'react';
import {
    RotateCw,
    Eye,
    Smartphone,
    Box,
    ExternalLink,
    Plus,
    Play,
    Layers,
    Search,
    Maximize2,
    Trash2,
    Share2
} from 'lucide-react';
import { Property } from '../types';
import { translations } from '../translations';

interface TourViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
}

const TourView: React.FC<TourViewProps> = ({
    properties,
    lang,
    brandColor
}) => {
    const t = translations[lang];
    const [activeTour, setActiveTour] = useState<Property | null>(null);

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {lang === 'es' ? 'TOURS' : 'VIRTUAL'} <br />
                        <span style={{ color: brandColor }}>{lang === 'es' ? 'VIRTUALES 360°' : '360° TOURS'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">{lang === 'es' ? 'Experiencias inmersivas para tus clientes' : 'Immersive experiences for your clients'}</p>
                </div>
                <button
                    style={{ backgroundColor: brandColor }}
                    className="flex items-center gap-2 px-6 py-3 text-black rounded-xl transition-all font-black text-xs uppercase italic active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    <Plus size={18} />
                    {lang === 'es' ? 'Crear Nuevo Tour' : 'Create New Tour'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Active Tour Viewer */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="aspect-video bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden relative group shadow-2xl">
                        {activeTour ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity p-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{lang === 'es' ? 'VIVO' : 'LIVE'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white/10 transition-all"><Share2 size={18} /></button>
                                            <button className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white/10 transition-all"><Maximize2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                                {/* Simulated 360 Frame */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img src={activeTour.images[0]} className="w-full h-full object-cover blur-[2px] opacity-40 scale-110" alt="" />
                                    <div className="absolute inset-0 bg-[#000]/20 backdrop-blur-[1px]"></div>
                                    <div className="relative text-center space-y-6">
                                        <div className="w-24 h-24 bg-white/5 border border-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-xl animate-pulse">
                                            <RotateCw className="text-white" size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{activeTour.title}</h3>
                                            <p className="text-zinc-400 text-xs font-bold italic">{lang === 'es' ? 'Vista: Estancia Principal' : 'View: Main Living Room'}</p>
                                        </div>
                                        <button className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase italic hover:bg-zinc-200 transition-all">
                                            {lang === 'es' ? 'Iniciar Recorrido' : 'Start Tour'}
                                        </button>
                                    </div>
                                </div>
                                {/* Hotspots Simulation */}
                                <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping"></div>
                                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping delay-500"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
                                <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700">
                                    <Box className="text-zinc-600" size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-zinc-400 uppercase italic tracking-tighter">{lang === 'es' ? 'Selecciona un Tour' : 'Select a Tour'}</h3>
                                    <p className="text-zinc-600 text-sm max-w-sm">{lang === 'es' ? 'Elige una propiedad para cargar su experiencia inmersiva de 360 grados.' : 'Choose a property to load its 360-degree immersive experience.'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Eye className="text-amber-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Vistas' : 'Views'}</p>
                                <p className="text-sm font-black text-white italic">1.2k</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Smartphone className="text-blue-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'VR Ready' : 'VR Ready'}</p>
                                <p className="text-sm font-black text-white italic">Compatible</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Layers className="text-green-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Escenas' : 'Scenes'}</p>
                                <p className="text-sm font-black text-white italic">8 {lang === 'es' ? 'Fijos' : 'Points'}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <RotateCw className="text-purple-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Giro' : 'Rotation'}</p>
                                <p className="text-sm font-black text-white italic">Full 360</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Selector */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder={lang === 'es' ? 'Filtrar tours...' : 'Filter tours...'}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all italic font-bold"
                        />
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                        {properties.map(p => (
                            <div
                                key={p.id}
                                className={`group relative rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeTour?.id === p.id ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-zinc-800 hover:border-zinc-700'}`}
                                onClick={() => setActiveTour(p)}
                            >
                                <div className="aspect-video relative">
                                    <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="text-white fill-white" size={32} />
                                    </div>
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[8px] font-black text-white uppercase italic">
                                        360 VR
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900">
                                    <h4 className="text-xs font-black text-white uppercase italic tracking-tighter truncate">{p.title}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold italic mt-1">{p.address.city}, {p.address.colony}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourView;
