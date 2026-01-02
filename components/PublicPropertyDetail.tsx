
import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    MapPin,
    Home,
    Layers,
    Check,
    MessageCircle,
    Share2,
    Camera,
    Maximize2,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight,
    Info,
    RotateCw,
    Calculator,
    Download
} from 'lucide-react';
import { Property, PropertyType, OperationType } from '../types';
import MortgageCalculator from './MortgageCalculator';
import { translations } from '../translations';

interface PublicPropertyDetailProps {
    property: Property;
    lang: 'es' | 'en';
    brandColor: string;
    onBack: () => void;
    agencyName: string;
}

const PublicPropertyDetail: React.FC<PublicPropertyDetailProps> = ({
    property,
    lang,
    brandColor,
    onBack,
    agencyName
}) => {
    const t = translations[lang];
    const [activeImage, setActiveImage] = useState(0);

    const handleShare = async () => {
        const shareData = {
            title: property.title,
            text: `${property.title} - ${formatCurrency(property.operation === OperationType.VENTA ? property.salePrice || 0 : property.rentPrice || 0, property.currency)}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('¡Enlace copiado al portapapeles!');
            }
        } catch (err) {
            console.log('Error sharing:', err);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };


    // Helper to detect if media is a video

    // Helper to detect if media is a video
    const isVideo = (url: string) => {
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    };

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const formatCurrency = (amount: number, currency: 'MXN' | 'USD') => {
        return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hola, vi la propiedad "${property.title}" en su sitio web y me interesa recibir más información. \nLink: ${window.location.href}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500/30 selection:text-amber-500 pb-20">
            {/* Print Header */}
            <div className="print-only mb-8 border-b-2 border-amber-500 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase italic">{agencyName}</h1>
                        <p className="text-sm text-gray-400">Plataforma Inmobiliaria Profesional</p>
                    </div>
                </div>
            </div>

            {/* Header / Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 no-print">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                    >
                        <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-all">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase italic tracking-widest">{t.back}</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <Home className="text-amber-500" size={20} />
                        <h1 className="text-sm font-black italic tracking-tighter uppercase">{agencyName}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"
                            title="Compartir"
                        >
                            <Share2 size={18} />
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"
                            title="Descargar PDF"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <main id="property-detail-content" className="max-w-7xl mx-auto px-6 pt-24 lg:pt-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Gallery & Details */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-zinc-900 relative shadow-2xl border border-white/5 group">
                            {isVideo(property.images[activeImage]) ? (
                                <video
                                    src={property.images[activeImage]}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    muted
                                    loop
                                />
                            ) : (
                                <img
                                    src={property.images[activeImage]}
                                    className="w-full h-full object-cover animate-in fade-in duration-500"
                                    alt={property.title}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                            {/* Gallery Navigation Arrows */}
                            <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setActiveImage(prev => (prev > 0 ? prev - 1 : property.images.length - 1))}
                                    className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-black transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => (prev < property.images.length - 1 ? prev + 1 : 0))}
                                    className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-black transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black uppercase italic tracking-widest">
                                    {activeImage + 1} / {property.images.length} {t.photos}
                                </div>
                                {property.virtualTourUrl && (
                                    <button className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase italic shadow-xl">
                                        <RotateCw size={14} className="animate-spin-slow" />
                                        Ver Tour 360°
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {property.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`relative min-w-[120px] aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-amber-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Detail */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase italic ${property.operation === OperationType.VENTA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
                                    {property.operation}
                                </span>
                                <span className="px-4 py-1 bg-zinc-900 border border-white/10 rounded-full text-[10px] font-black uppercase italic tracking-widest text-zinc-400">
                                    {property.type}
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white italic">
                                {property.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-4 text-zinc-500">
                                <MapPin size={18} className="text-amber-500" />
                                <span className="text-sm font-bold italic uppercase tracking-tight">
                                    {property.address.street} {property.address.exteriorNumber}, {property.address.colony}, {property.address.city}
                                </span>
                            </div>
                        </div>

                        {/* Key Specs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Recámaras', value: property.specs.bedrooms, icon: Home },
                                { label: 'Baños', value: property.specs.bathrooms, icon: Layers },
                                { label: 'Estacionamiento', value: property.specs.parking, icon: Camera },
                                { label: 'Área Total', value: `${property.specs.m2Total} m²`, icon: Maximize2 },
                            ].map((spec, i) => (
                                <div key={i} className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center text-center space-y-1">
                                    <spec.icon className="text-amber-500 mb-1" size={18} />
                                    <p className="text-[9px] font-black text-zinc-600 uppercase italic">{spec.label}</p>
                                    <p className="text-sm font-black text-white italic">{spec.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase italic tracking-widest text-zinc-500 border-l-4 border-amber-500 pl-4">Descripción</h3>
                            <p className="text-zinc-400 text-md leading-relaxed font-medium italic">
                                {property.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase italic tracking-widest text-zinc-500 border-l-4 border-amber-500 pl-4">Amenidades</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {property.amenities.map((amenity, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/30 rounded-2xl border border-white/5">
                                        <div className="p-1 bg-amber-500/10 rounded-full">
                                            <Check size={12} className="text-amber-500" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-300 italic uppercase">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pricing & Lead Card */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-32 space-y-6">
                        {/* Price Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                            <div>
                                <p className="text-zinc-500 text-[10px] font-black uppercase italic tracking-widest mb-1">Precio de {property.operation}</p>
                                <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                    {formatCurrency(property.operation === OperationType.VENTA ? property.salePrice || 0 : property.rentPrice || 0, property.currency)}
                                </h3>
                                {property.pricePerM2 && (
                                    <p className="text-zinc-600 text-xs font-bold italic mt-1">${property.pricePerM2.toLocaleString()} p/m²</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleWhatsApp}
                                    style={{ backgroundColor: brandColor }}
                                    className="w-full py-4 rounded-3xl text-black font-black uppercase italic flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10"
                                >
                                    <MessageCircle size={20} />
                                    Me interesa esta propiedad
                                </button>
                                <button
                                    onClick={() => {
                                        const message = encodeURIComponent(`Hola, me gustaría agendar una visita para la propiedad "${property.title}" ubicada en ${property.address.colony}, ${property.address.city}. \\n\\n¿Cuándo podríamos coordinar una cita? \\n\\nLink: ${window.location.href}`);
                                        window.open(`https://wa.me/?text=${message}`, '_blank');
                                    }}
                                    className="w-full py-4 bg-zinc-800 text-white rounded-3xl font-black uppercase italic flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all"
                                >
                                    <Calendar size={20} />
                                    Solicitar Visita
                                </button>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                                    <User className="text-amber-500" size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase italic">Asesor Inmobiliario</p>
                                    <p className="text-white text-xs font-black uppercase italic truncate tracking-tight">Atención Personalizada</p>
                                </div>
                            </div>
                        </div>

                        {/* Social / Security Info */}
                        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
                                    <Info size={16} />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-500 italic">Transacción protegida y verificada por {agencyName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="print-only col-span-12 mt-12 pt-8 border-t border-gray-200">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-black uppercase italic tracking-tighter">Más información</h3>
                                <p className="text-gray-600 text-sm mt-1">Escanea el código QR para ver más detalles y fotos en línea.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Share2 size={16} className="text-amber-500" />
                                <span className="text-xs text-gray-500 font-mono">{window.location.href}</span>
                            </div>
                        </div>
                        <div className="bg-white p-2 border border-gray-100 rounded-lg">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                alt="QR Code"
                                className="w-24 h-24"
                            />
                        </div>
                    </div>
                    <div className="mt-8 text-center border-t border-gray-100 pt-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Documento generado por {agencyName} - {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicPropertyDetail;
