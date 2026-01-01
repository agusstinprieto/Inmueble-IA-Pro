
import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Upload,
    Trash2,
    ExternalLink,
    Search,
    Grid,
    List,
    Filter,
    Plus,
    Maximize2,
    CheckCircle2,
    AlertCircle,
    Edit2,
    X
} from 'lucide-react';
import { Property, PropertyStatus } from '../types';

import { translations } from '../translations';
import { uploadPropertyImage, updateProperty } from '../services/supabase';

interface GalleryViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
    onUpdateProperty?: (property: Property) => void;
    onEditRequest?: (property: Property) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({
    properties,
    lang,
    brandColor,
    onUpdateProperty,
    onEditRequest
}) => {
    const t = translations[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploading, setIsUploading] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const filteredProperties = properties.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedProperty || !e.target.files || e.target.files.length === 0) return;

        const currentCount = selectedProperty.images?.length || 0;
        if (currentCount + e.target.files.length > 10) {
            alert(lang === 'es'
                ? 'Límite de 10 fotos por propiedad alcanzado'
                : 'Limit of 10 photos per property reached');
            return;
        }

        setIsUploading(true);
        try {
            console.log('Cargando fotos para:', selectedProperty.title);
            const files = Array.from(e.target.files);

            // Upload to Supabase Storage
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i] as File;
                const url = await uploadPropertyImage(file, selectedProperty.id, i);
                if (url) newUrls.push(url);
            }

            if (newUrls.length > 0) {
                const updatedProperty = {
                    ...selectedProperty,
                    images: [...(selectedProperty.images || []), ...newUrls]
                };

                // Update in DB
                const saved = await updateProperty(updatedProperty);

                if (saved) {
                    setSelectedProperty(saved); // Update local view
                    if (onUpdateProperty) onUpdateProperty(saved); // Propagate to parent
                    alert(lang === 'es' ? '✅ Fotos cargadas correctamente' : '✅ Photos uploaded successfully');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(lang === 'es' ? 'Error al subir fotos' : 'Error uploading photos');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDeleteImage = async (imgToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedProperty || !confirm(lang === 'es' ? '¿Estás seguro de eliminar esta foto?' : 'Are you sure you want to delete this photo?')) return;

        try {
            const newImages = selectedProperty.images.filter(img => img !== imgToDelete);
            const updatedProperty = { ...selectedProperty, images: newImages };

            const saved = await updateProperty(updatedProperty);
            if (saved) {
                setSelectedProperty(saved);
                if (onUpdateProperty) onUpdateProperty(saved);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting image');
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                        {lang === 'es' ? 'GALERÍA DE' : 'IMAGE'} <span style={{ color: brandColor }}>{lang === 'es' ? 'MULTIMEDIA' : 'GALLERY'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">{lang === 'es' ? 'Gestión visual de inventario y activos' : 'Visual management of inventory and assets'}</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Properties Selector */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder={lang === 'es' ? 'Buscar propiedad...' : 'Search property...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filteredProperties.length > 0 ? filteredProperties.map((prop) => (
                            <button
                                key={prop.id}
                                onClick={() => setSelectedProperty(prop)}
                                className={`w-full p-4 flex gap-4 text-left border-b border-zinc-800/50 last:border-0 hover:bg-white/5 transition-all ${selectedProperty?.id === prop.id ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''}`}
                            >
                                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden relative">
                                    {prop.images && prop.images[0] ? (
                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-full h-full p-4 text-zinc-700" />
                                    )}
                                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] font-black text-white">
                                        {prop.images?.length || 0} FOTOS
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{prop.title}</h4>
                                    <p className="text-[10px] text-zinc-500 italic mt-1">{prop.address.city}, {prop.address.colony}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${prop.status === PropertyStatus.DISPONIBLE ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {prop.status}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )) : (
                            <div className="p-8 text-center text-zinc-600 italic text-sm italic">
                                {lang === 'es' ? 'No se encontraron propiedades' : 'No properties found'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Gallery Content */}
                <div className="lg:col-span-8">
                    {selectedProperty ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic uppercase">{selectedProperty.title}</h2>
                                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                                        <ImageIcon size={16} />
                                        {selectedProperty.images?.length || 0} {lang === 'es' ? 'recursos multimedia registrados' : 'multimedia assets registered'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            if (onEditRequest && selectedProperty) {
                                                onEditRequest(selectedProperty);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-xl font-black text-xs uppercase italic cursor-pointer hover:bg-zinc-700 transition-all active:scale-95 shadow-lg border border-zinc-700"
                                    >
                                        <Edit2 size={16} />
                                        {lang === 'es' ? 'Editar Info' : 'Edit Info'}
                                    </button>
                                    <label className={`flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase italic cursor-pointer hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload size={16} />
                                        {isUploading ? (lang === 'es' ? 'Cargando...' : 'Uploading...') : (lang === 'es' ? 'Cargar Fotos' : 'Upload Photos')}
                                        <input type="file" multiple className="hidden" onChange={handleAddPhotos} accept="image/*" disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            {selectedProperty.images && selectedProperty.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {selectedProperty.images.map((img, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700/50 hover:border-amber-500/50 transition-all cursor-pointer">
                                            <img src={img} alt={`${selectedProperty.title} ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedImage(img);
                                                    }}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-all shadow-lg"
                                                >
                                                    <Maximize2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteImage(img, e)}
                                                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-all shadow-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase rounded shadow-lg italic">
                                                    PRINCIPAL
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-800 rounded-2xl hover:border-zinc-600 hover:bg-white/5 transition-all cursor-pointer aspect-square">
                                        <Plus size={32} className="text-zinc-600" />
                                        <span className="text-zinc-500 text-[10px] font-black uppercase italic tracking-widest">{lang === 'es' ? 'Añadir Más' : 'Add More'}</span>
                                        <input type="file" multiple className="hidden" onChange={handleAddPhotos} accept="image/*" />
                                    </label>
                                </div>
                            ) : (
                                <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto">
                                            <ImageIcon className="text-zinc-700" size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-zinc-400 font-black uppercase italic">{lang === 'es' ? 'Sin imágenes' : 'No images'}</h3>
                                            <p className="text-zinc-600 text-xs mt-2">{lang === 'es' ? 'Esta propiedad aún no tiene material visual. Comienza cargando las mejores tomas.' : 'This property has no visual material yet. Start by uploading the best shots.'}</p>
                                        </div>
                                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-[10px] uppercase italic cursor-pointer transition-all border border-zinc-700">
                                            <Upload size={16} />
                                            {lang === 'es' ? 'Seleccionar Archivos' : 'Select Files'}
                                            <input type="file" multiple className="hidden" onChange={handleAddPhotos} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex items-center justify-center bg-zinc-900/20 border-2 border-dashed border-zinc-900 rounded-3xl">
                            <div className="text-center space-y-4 px-6">
                                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800">
                                    <ImageIcon className="text-zinc-800" size={40} />
                                </div>
                                <div>
                                    <h3 className="text-zinc-700 font-black uppercase text-xl italic">{lang === 'es' ? 'Selecciona una Propiedad' : 'Select a Property'}</h3>
                                    <p className="text-zinc-800 text-sm max-w-sm mx-auto">{lang === 'es' ? 'Elige una propiedad del panel izquierdo para gestionar su contenido multimedia de manera profesional.' : 'Choose a property from the left panel to manage its multimedia content professionally.'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setExpandedImage(null)}>
                    <button
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Expanded"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default GalleryView;
