
import React, { useState, useEffect } from 'react';
import {
    Search,
    MapPin,
    Home,
    Layers,
    ArrowRight,
    Sparkles,
    Phone,
    ChevronRight,
    Filter,
    X,
    MessageCircle,
    Globe,
    Heart,
    Share2,
    Check
} from 'lucide-react';
import { Property, PropertyType, OperationType } from '../types';
import { translations } from '../translations';

interface PublicPortalViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
    onViewDetail: (property: Property) => void;
    onExitPublic: () => void;
    agencyName: string;
    isAuthenticated?: boolean;
}

const PublicPortalView: React.FC<PublicPortalViewProps> = ({
    properties,
    lang,
    brandColor,
    onViewDetail,
    onExitPublic,
    agencyName,
    isAuthenticated
}) => {
    const t = translations[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<PropertyType | 'ALL'>('ALL');
    const [opFilter, setOpFilter] = useState<OperationType | 'ALL'>('ALL');
    const [bedroomsFilter, setBedroomsFilter] = useState<number | 'ALL'>('ALL');
    const [bathroomsFilter, setBathroomsFilter] = useState<number | 'ALL'>('ALL');

    // Favorites state (persisted in localStorage)
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('inmueble_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync favorites to localStorage
    useEffect(() => {
        localStorage.setItem('inmueble_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (propertyId: string) => {
        setFavorites(prev =>
            prev.includes(propertyId)
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        );
    };

    const [isCopiedMap, setIsCopiedMap] = useState<Record<string, boolean>>({});

    const handleShare = async (property: Property) => {
        const shareData = {
            title: property.title,
            text: `¡Mira esta propiedad! ${property.title} en ${property.address.city}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);

            // Set copied state for this specific property
            setIsCopiedMap(prev => ({ ...prev, [property.id]: true }));

            // Reset after 2 seconds
            setTimeout(() => {
                setIsCopiedMap(prev => ({ ...prev, [property.id]: false }));
            }, 2000);
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address.colony.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
        const matchesOp = opFilter === 'ALL' || p.operation === opFilter;
        const matchesBedrooms = bedroomsFilter === 'ALL' || p.specs.bedrooms >= bedroomsFilter;
        const matchesBathrooms = bathroomsFilter === 'ALL' || p.specs.bathrooms >= bathroomsFilter;
        return matchesSearch && matchesType && matchesOp && matchesBedrooms && matchesBathrooms;
    });

    const formatCurrency = (amount: number, currency: 'MXN' | 'USD') => {
        return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500/30 selection:text-amber-500">
            {/* Navigation / Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                            <Home className="text-black" size={24} />
                        </div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase">{agencyName}</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={onExitPublic} className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500 hover:text-white transition-colors">
                            {isAuthenticated ? 'Volver al Panel' : 'Iniciar Sesión'}
                        </button>
                        <a href="#inventario" className="text-xs font-black uppercase italic tracking-widest text-zinc-500 hover:text-white transition-colors">Propiedades</a>
                        <a href="#" className="text-xs font-black uppercase italic tracking-widest text-zinc-500 hover:text-white transition-colors">Nosotros</a>
                        <button
                            onClick={() => document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' })}
                            style={{ backgroundColor: brandColor }}
                            className="px-6 py-2.5 rounded-full text-black text-[10px] font-black uppercase italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                        >
                            Contáctanos
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full"></div>
                    <div className="absolute top-40 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full"></div>
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 border border-white/10 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest italic backdrop-blur-md">
                        <Sparkles size={14} className="text-amber-500" />
                        Tus sueños, nuestra prioridad
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-white">
                        ENCUENTRA TU <br />
                        <span style={{ color: brandColor }}>PRÓXIMO HOGAR</span>
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto font-medium italic">
                        Explora la selección más exclusiva de inmuebles gestionada con tecnología inteligente.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-12 bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder="Ciudad, colonia o palabras clave..."
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none placeholder:text-zinc-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 p-1 justify-center md:justify-end">
                            <select
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-black uppercase text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                                value={bedroomsFilter}
                                onChange={(e) => setBedroomsFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            >
                                <option value="ALL">Recámaras</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                            </select>
                            <select
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-black uppercase text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                                value={bathroomsFilter}
                                onChange={(e) => setBathroomsFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            >
                                <option value="ALL">Baños</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                            </select>
                            <select
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-black uppercase text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                            >
                                <option value="ALL">Todo Tipo</option>
                                <option value="CASA">Casas</option>
                                <option value="DEPARTAMENTO">Deptos</option>
                                <option value="TERRENO">Terrenos</option>
                            </select>
                            <button
                                style={{ backgroundColor: brandColor }}
                                className="px-8 py-3 rounded-2xl text-black font-black uppercase text-xs italic flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/10"
                            >
                                Buscar
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Inventory Grid */}
            <main id="inventario" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
                <div className="flex items-end justify-between border-b border-white/5 pb-8">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Propiedades Disponibles</h3>
                        <p className="text-zinc-500 text-sm mt-1 italics font-bold">Mostrando {filteredProperties.length} resultados</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setOpFilter('VENTA')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${opFilter === 'VENTA' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                            Comprar
                        </button>
                        <button
                            onClick={() => setOpFilter('RENTA')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${opFilter === 'RENTA' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                            Rentar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.map((prop) => (
                        <div
                            key={prop.id}
                            className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-amber-500/30 transition-all hover:-translate-y-2 relative"
                        >
                            <div className="aspect-[4/3] relative overflow-hidden bg-black">
                                {prop.images[0].toLowerCase().includes('.mp4') || prop.images[0].toLowerCase().includes('.webm') || prop.images[0].toLowerCase().includes('.mov') ? (
                                    <video
                                        src={prop.images[0]}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={prop.images[0]}
                                        alt={prop.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                )}
                                <div className="absolute top-5 left-5">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic backdrop-blur-md shadow-lg ${prop.operation === OperationType.VENTA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
                                        {prop.operation}
                                    </span>
                                </div>
                                {/* Heart and Share buttons */}
                                <div className="absolute top-5 right-5 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(prop.id); }}
                                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${favorites.includes(prop.id) ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
                                    >
                                        <Heart size={18} fill={favorites.includes(prop.id) ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleShare(prop); }}
                                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${isCopiedMap[prop.id] ? 'bg-green-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                                            }`}
                                    >
                                        {isCopiedMap[prop.id] ? <Check size={18} /> : <Share2 size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={14} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{prop.address.city}, {prop.address.colony}</span>
                                    </div>
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter truncate leading-tight">{prop.title}</h4>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Camas</p>
                                        <p className="text-sm font-black text-white italic">{prop.specs.bedrooms}</p>
                                    </div>
                                    <div className="text-center border-x border-white/5">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Baños</p>
                                        <p className="text-sm font-black text-white italic">{prop.specs.bathrooms}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Área</p>
                                        <p className="text-sm font-black text-white italic">{prop.specs.m2Built}m²</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase italic">Precio</p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter">
                                            {formatCurrency(prop.operation === OperationType.VENTA ? prop.salePrice || 0 : prop.rentPrice || 0, prop.currency)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onViewDetail(prop)}
                                        className="p-3 bg-zinc-800 rounded-2xl text-white hover:bg-white hover:text-black transition-all"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredProperties.length === 0 && (
                        <div className="col-span-full py-40 text-center">
                            <Search size={64} className="mx-auto text-zinc-800 mb-6 opacity-20" />
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-800">Sin coincidencias</h4>
                            <p className="text-zinc-600 font-bold italic mt-2">Prueba ajustando los filtros de búsqueda</p>
                        </div>
                    )}
                </div>
            </main >

            {/* CTA Footer */}
            < footer className="bg-zinc-900 py-20 px-6 border-t border-white/5" >
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white">¿Buscas algo específico?</h3>
                    <p className="text-zinc-500 font-medium italic">Nuestro equipo de expertos te ayudará a encontrar la propiedad ideal de forma personalizada.</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
                        <button
                            onClick={() => window.open('https://wa.me/?text=Hola,%20me%20interesa%20iniciar%20una%20nueva%20búsqueda%20de%20propiedad', '_blank')}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-3xl font-black uppercase italic hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            <MessageCircle size={20} />
                            Hablar por WhatsApp
                        </button>
                        <button
                            onClick={() => window.open('mailto:contacto@inmuebleiapro.com?subject=Agendar Llamada&body=Hola, deseo agendar una llamada para buscar una propiedad.', '_blank')}
                            className="flex items-center gap-3 px-8 py-4 bg-zinc-800 text-white rounded-3xl font-black uppercase italic hover:scale-105 active:scale-95 transition-all"
                        >
                            <Phone size={20} />
                            Agendar Llamada
                        </button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 opacity-50">
                        <Home size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic tracking-tighter">{agencyName} © 2024</span>
                    </div>
                    <div className="flex gap-8 opacity-50">
                        <a href="#" className="text-[10px] font-black uppercase italic text-zinc-400 hover:text-white">Privacidad</a>
                        <a href="#" className="text-[10px] font-black uppercase italic text-zinc-400 hover:text-white">Términos</a>
                    </div>
                </div>
            </footer >
        </div >
    );
};

export default PublicPortalView;
