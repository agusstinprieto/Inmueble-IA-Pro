
import React, { useState, useMemo } from 'react';
import {
    Building2,
    Search,
    Filter,
    Grid3X3,
    List,
    MapPin,
    Bed,
    Bath,
    Car,
    Ruler,
    DollarSign,
    Calculator,
    Eye,
    Heart,
    Share2,
    Edit2,
    Trash2,
    Plus,
    Sparkles,
    X,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    FileText,
    Download,
    Loader2,
    Check,
    Map,
    RotateCcw,
    Globe
} from 'lucide-react';
import PropertyMap from './PropertyMap';
import { translations } from '../../translations';
import { Property, PropertyType, OperationType, PropertyStatus, Agent } from '../../types';
import { generatePropertyListing, generateSocialAd } from '../../services/gemini';
import { uploadPropertyImage } from '../../services/supabase';
import { pdfService } from '../../services/pdfService';

interface PropertiesViewProps {
    properties: Property[];
    onAddProperty?: (property: Partial<Property>) => void;
    onEditProperty: (property: Property) => void;
    onDeleteProperty: (id: string) => void;
    onViewProperty: (property: Property) => void;
    lang: 'es' | 'en';
    brandColor: string;
    businessName: string;
    location: string;
    editingPropertyProp?: Property | null;
    onClearEditingProperty?: () => void;
    agents: Agent[];
    userRole: string;
    userId: string;
    onOpenCalculator: (price: number) => void;
    onToggleFavorite?: (property: Property) => void;
}

const PropertiesView: React.FC<PropertiesViewProps> = ({
    properties,
    onAddProperty,
    onEditProperty,
    onDeleteProperty,
    onViewProperty,
    lang,
    brandColor,
    businessName,
    location,
    editingPropertyProp,
    onClearEditingProperty,
    agents,
    userRole,
    userId,
    onOpenCalculator,
    onToggleFavorite
}) => {
    const t = translations[lang];

    const getAgentInfo = (id: string) => {
        const agent = agents.find(a => a.id === id);
        return {
            name: agent ? agent.name : (lang === 'es' ? 'Asesor no asignado' : 'Unassigned Agent'),
            photo: agent?.photo
        };
    };

    const isAdmin = userRole === 'super_admin' || userRole === 'agency_owner' || userRole === 'branch_manager';

    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<PropertyType | 'ALL'>('ALL');
    const [operationFilter, setOperationFilter] = useState<OperationType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'ALL'>('ALL');
    const [bedroomsFilter, setBedroomsFilter] = useState<number | 'ALL'>('ALL');
    const [bathroomsFilter, setBathroomsFilter] = useState<number | 'ALL'>('ALL');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 999999999 });
    const [sortBy, setSortBy] = useState<'price' | 'date' | 'views'>('date');

    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [generatingAd, setGeneratingAd] = useState(false);
    const [adText, setAdText] = useState('');
    const [adPlatform, setAdPlatform] = useState<'generic' | 'facebook' | 'whatsapp'>('generic');
    const [isCopied, setIsCopied] = useState(false);

    const resetFilters = () => {
        setSearchQuery('');
        setTypeFilter('ALL');
        setOperationFilter('ALL');
        setStatusFilter('ALL');
        setBedroomsFilter('ALL');
        setBathroomsFilter('ALL');
        setPriceRange({ min: 0, max: 999999999 });
        setSortBy('date');
    };


    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [tempAddImages, setTempAddImages] = useState<string[]>([]);

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        let result = properties.filter(prop => {
            const matchesSearch =
                prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.address?.colony?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = typeFilter === 'ALL' || prop.type === typeFilter;
            const matchesOperation = operationFilter === 'ALL' || prop.operation === operationFilter;
            const matchesStatus = statusFilter === 'ALL' || prop.status === statusFilter;
            const matchesBedrooms = bedroomsFilter === 'ALL' || prop.specs.bedrooms >= bedroomsFilter;
            const matchesBathrooms = bathroomsFilter === 'ALL' || prop.specs.bathrooms >= bathroomsFilter;

            const price = prop.operation === 'RENTA' ? prop.rentPrice : prop.salePrice;
            const matchesPrice = (price || 0) >= priceRange.min && (price || 0) <= priceRange.max;

            return matchesSearch && matchesType && matchesOperation && matchesStatus && matchesPrice && matchesBedrooms && matchesBathrooms;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'price') {
                const priceA = a.operation === 'RENTA' ? a.rentPrice : a.salePrice;
                const priceB = b.operation === 'RENTA' ? b.rentPrice : b.salePrice;
                return (priceB || 0) - (priceA || 0);
            } else if (sortBy === 'views') {
                return (b.views || 0) - (a.views || 0);
            } else {
                return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
            }
        });

        return result;
    }, [properties, searchQuery, typeFilter, operationFilter, statusFilter, priceRange, sortBy, bedroomsFilter, bathroomsFilter]);

    // Handle external edit request
    React.useEffect(() => {
        if (editingPropertyProp) {
            setEditingProperty(editingPropertyProp);
            setShowEditModal(true);
        }
    }, [editingPropertyProp]);

    // Stats
    const stats = {
        total: properties.length,
        available: properties.filter(p => p.status === PropertyStatus.DISPONIBLE).length,
        sale: properties.filter(p => p.operation === OperationType.VENTA).length,
        rent: properties.filter(p => p.operation === OperationType.RENTA).length
    };

    // Status colors
    const getStatusColor = (status: PropertyStatus) => {
        const colors: Record<PropertyStatus, string> = {
            [PropertyStatus.DISPONIBLE]: '#22c55e',
            [PropertyStatus.APARTADA]: '#f59e0b',
            [PropertyStatus.VENDIDA]: '#3b82f6',
            [PropertyStatus.RENTADA]: '#8b5cf6'
        };
        return colors[status];
    };

    // Generate ad
    const handleGenerateAd = async (property: Property, platform: 'generic' | 'facebook' | 'whatsapp' = 'generic') => {
        setGeneratingAd(true);
        setAdPlatform(platform);
        setAdText(''); // Clear previous ad text to show state change

        try {
            let ad = '';
            if (platform === 'generic') {
                ad = await generatePropertyListing(property, lang, businessName, location);
            } else {
                ad = await generateSocialAd(property, platform, businessName, location);
            }
            setAdText(ad);
        } catch (err) {
            console.error('Error generating ad:', err);
            setAdText('Error al generar anuncio. Verifica tu conexión o intenta de nuevo.');
        } finally {
            setGeneratingAd(false);
        }
    };

    // Copy ad to clipboard
    const copyAd = () => {
        navigator.clipboard.writeText(adText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Download PDF
    const handleDownloadPDF = async (property: Property) => {
        setDownloadingPdf(property.id);
        try {
            await pdfService.generatePropertySheet(property, {
                name: businessName,
                color: brandColor,
                phone: translations[lang].phone || '',
                email: translations[lang].email || ''
            });
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            setDownloadingPdf(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProperty || !e.target.files) return;

        const currentCount = editingProperty.images?.length || 0;
        if (currentCount + e.target.files.length > 10) {
            alert('Límite de 10 fotos por propiedad alcanzado / Limit of 10 photos reached');
            return;
        }

        setIsUploading(true);
        try {
            const files = Array.from(e.target.files);
            const newUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i] as File;
                // Add timestamp to ensure unique filenames if needed or just rely on index
                const url = await uploadPropertyImage(file, editingProperty.id, editingProperty.images.length + i);
                if (url) newUrls.push(url);
            }

            if (newUrls.length > 0) {
                setEditingProperty({
                    ...editingProperty,
                    images: [...(editingProperty.images || []), ...newUrls]
                });
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Error al subir imágenes');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        if (!editingProperty) return;
        const newImages = editingProperty.images.filter((_, idx) => idx !== indexToRemove);
        setEditingProperty({
            ...editingProperty,
            images: newImages
        });
    };

    const handleManualAddImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files as FileList);
        const newImages = files.map(file => URL.createObjectURL(file));
        setTempAddImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveManualAddImage = (index: number) => {
        setTempAddImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedProperty || !e.target.files) return;

        const currentCount = selectedProperty.images?.length || 0;
        if (currentCount + e.target.files.length > 10) {
            alert('Límite de 10 fotos por propiedad alcanzado / Limit of 10 photos reached');
            return;
        }

        setIsUploading(true);
        try {
            const files = Array.from(e.target.files);
            const newUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i] as File;
                const url = await uploadPropertyImage(file, selectedProperty.id, (selectedProperty.images?.length || 0) + i);
                if (url) newUrls.push(url);
            }

            if (newUrls.length > 0) {
                // Update local state
                const updatedProperty = {
                    ...selectedProperty,
                    images: [...(selectedProperty.images || []), ...newUrls]
                };
                setSelectedProperty(updatedProperty);

                // Call parent update if exists to refresh grid
                if (onEditProperty) onEditProperty(updatedProperty); // Using onEditProperty as a general update handler if suitable, or strict update
            }
        } catch (error) {
            console.error('Error uploading detail images:', error);
            alert('Error al subir imágenes');
        } finally {
            setIsUploading(false);
        }
    };

    // Property Card
    const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
        const price = property.operation === 'RENTA' ? property.rentPrice : property.salePrice;

        return (
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all cursor-pointer group"
                onClick={() => {
                    setSelectedProperty(property);
                    setShowDetailModal(true);
                }}
            >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-zinc-800">
                    {property.images?.[0] ? (
                        property.images[0].toLowerCase().match(/\.(mp4|webm|mov|avi)($|\?)/) ? (
                            <video src={property.images[0]} className="w-full h-full object-cover" />
                        ) : (
                            <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="text-zinc-600" size={48} />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span
                            className="px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: property.operation === 'VENTA' ? '#3b82f6' : '#8b5cf6' }}
                        >
                            {t.operations[property.operation as keyof typeof t.operations]}
                        </span>
                        <span
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ backgroundColor: getStatusColor(property.status), color: '#fff' }}
                        >
                            {t.status[property.status as keyof typeof t.status]}
                        </span>
                        {property.isPublicGlobal && (
                            <span className="px-2 py-1 rounded text-[10px] font-black bg-white text-black flex items-center gap-1 shadow-lg animate-pulse uppercase italic">
                                <Globe size={10} />
                                Global
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setEditingProperty(property);
                                setShowEditModal(true);
                            }}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                            title="Editar"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                handleDownloadPDF(property);
                            }}
                            disabled={downloadingPdf === property.id}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-50"
                            title="Descargar Ficha PDF"
                        >
                            {downloadingPdf === property.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                if (onToggleFavorite) onToggleFavorite(property);
                            }}
                            className={`p-2 rounded-full transition-colors ${property.favorites > 0 ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                            title="Me gusta"
                        >
                            <Heart size={18} fill={property.favorites > 0 ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                const text = `Mira esta propiedad: ${property.title} - ${property.operation}`;
                                const url = window.location.origin + '?p=' + property.id;
                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
                                window.open(whatsappUrl, '_blank');
                            }}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                            title="Compartir por WhatsApp"
                        >
                            <Share2 size={18} />
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                const price = property.operation === 'RENTA' ? property.rentPrice : property.salePrice;
                                if (price) onOpenCalculator(price);
                            }}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                            title="Calcular Hipoteca"
                        >
                            <Calculator size={18} />
                        </button>
                    </div>

                    {/* Image count */}
                    {property.images?.length > 1 && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 rounded text-white text-xs">
                            📷 {property.images.length}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold line-clamp-1">{property.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {t.property_types[property.type as keyof typeof t.property_types]}
                        </span>
                    </div>

                    <p className="text-zinc-400 text-sm flex items-center gap-1 mb-3">
                        <MapPin size={14} />
                        {property.address?.colony}, {property.address?.city}
                    </p>

                    <div className="flex items-center gap-3 text-zinc-500 text-sm mb-3">
                        {property.specs?.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                                <Bed size={14} /> {property.specs.bedrooms}
                            </span>
                        )}
                        {property.specs?.bathrooms > 0 && (
                            <span className="flex items-center gap-1">
                                <Bath size={14} /> {property.specs.bathrooms}
                            </span>
                        )}
                        {property.specs?.parking > 0 && (
                            <span className="flex items-center gap-1">
                                <Car size={14} /> {property.specs.parking}
                            </span>
                        )}
                        {property.specs?.m2Built > 0 && (
                            <span className="flex items-center gap-1">
                                <Ruler size={14} /> {property.specs.m2Built} m²
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold" style={{ color: brandColor }}>
                            ${price?.toLocaleString()}
                            {property.operation === 'RENTA' && <span className="text-sm font-normal text-zinc-500">/mes</span>}
                        </span>
                        <div className="flex items-center gap-1 text-zinc-500 text-sm">
                            <Eye size={14} /> {property.views || 0}
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                        {getAgentInfo(property.agentId).photo ? (
                            <img
                                src={getAgentInfo(property.agentId).photo}
                                alt={getAgentInfo(property.agentId).name}
                                className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 border border-zinc-700">
                                {getAgentInfo(property.agentId).name.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs text-zinc-500 truncate">
                            {getAgentInfo(property.agentId).name}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Property Row (list view)
    const PropertyRow: React.FC<{ property: Property }> = ({ property }) => {
        const price = property.operation === 'RENTA' ? property.rentPrice : property.salePrice;

        return (
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-all cursor-pointer"
                onClick={() => {
                    setSelectedProperty(property);
                    setShowDetailModal(true);
                }}
            >
                <div className="w-24 h-24 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
                    {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="text-zinc-600" size={32} />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{property.title}</h3>
                        <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ backgroundColor: getStatusColor(property.status), color: '#fff' }}
                        >
                            {t.status[property.status as keyof typeof t.status]}
                        </span>
                        {property.isPublicGlobal && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-white text-black flex items-center gap-1 uppercase italic">
                                <Globe size={8} />
                                Global
                            </span>
                        )}
                    </div>
                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {property.address?.colony}, {property.address?.city}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {getAgentInfo(property.agentId).photo ? (
                            <img
                                src={getAgentInfo(property.agentId).photo}
                                alt={getAgentInfo(property.agentId).name}
                                className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 border border-zinc-700">
                                {getAgentInfo(property.agentId).name.charAt(0)}
                            </div>
                        )}
                        <span className="text-[10px] text-zinc-500 italic">
                            {getAgentInfo(property.agentId).name}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 text-sm mt-2">
                        <span className="flex items-center gap-1"><Bed size={14} /> {property.specs?.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath size={14} /> {property.specs?.bathrooms}</span>
                        <span className="flex items-center gap-1"><Ruler size={14} /> {property.specs?.m2Built} m²</span>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xl font-bold" style={{ color: brandColor }}>
                        ${price?.toLocaleString()}
                    </span>
                    <p className="text-zinc-500 text-sm">
                        {t.operations[property.operation as keyof typeof t.operations]}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setEditingProperty(property);
                            setShowEditModal(true);
                        }}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDeleteProperty(property.id); }}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-red-500/20 text-red-400"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            const price = property.operation === 'RENTA' ? property.rentPrice : property.salePrice;
                            if (price) onOpenCalculator(price);
                        }}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                        title="Calcular Hipoteca"
                    >
                        <Calculator size={18} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: brandColor + '20' }}
                    >
                        <Building2 size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            CATÁLOGO DE <span style={{ color: brandColor }}>PROPIEDADES</span>
                        </h1>
                        <p className="text-zinc-500 font-bold italic uppercase tracking-widest">
                            {stats.available} de {stats.total} disponibles
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {onAddProperty && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Plus size={20} />
                            Agregar Propiedad
                        </button>
                    )}
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                        >
                            <Grid3X3 size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-2 rounded ${viewMode === 'map' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                        >
                            <Map size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm uppercase">TOTAL</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm uppercase">DISPONIBLES</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.available}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm uppercase">EN VENTA</p>
                    <p className="text-3xl font-bold text-blue-400 mt-1">{stats.sale}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm uppercase">EN RENTA</p>
                    <p className="text-3xl font-bold text-purple-400 mt-1">{stats.rent}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row flex-wrap gap-3">
                <div className="relative w-full md:w-auto md:flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder={t.search_properties}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as PropertyType | 'ALL')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="ALL">{t.filter_by_type}</option>
                    {Object.values(PropertyType).map(type => (
                        <option key={type} value={type}>{t.property_types[type as keyof typeof t.property_types]}</option>
                    ))}
                </select>
                <select
                    value={bedroomsFilter}
                    onChange={e => setBedroomsFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="ALL">Recámaras</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                </select>
                <select
                    value={bathroomsFilter}
                    onChange={e => setBathroomsFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="ALL">Baños</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                </select>
                <select
                    value={operationFilter}
                    onChange={e => setOperationFilter(e.target.value as OperationType | 'ALL')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="ALL">{t.filter_by_operation}</option>
                    {Object.values(OperationType).map(op => (
                        <option key={op} value={op}>{t.operations[op as keyof typeof t.operations]}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'price' | 'date' | 'views')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="date">Más recientes</option>
                    <option value="price">Mayor precio</option>
                    <option value="views">Más vistas</option>
                </select>
                <button
                    onClick={resetFilters}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-800 rounded-xl px-4 py-3 text-white transition-colors flex items-center gap-2"
                    title="Resetear Filtros"
                >
                    <RotateCcw size={20} />
                    <span className="hidden md:inline">Reset</span>
                </button>
            </div>

            {/* Properties Grid/List */}
            {filteredProperties.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <Building2 className="mx-auto text-zinc-600 mb-4" size={64} />
                    <p className="text-zinc-400 text-lg">{t.no_results}</p>
                    <p className="text-zinc-500 text-sm mt-2">Intenta con otros filtros</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProperties.map(property => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : viewMode === 'map' ? (
                <div className="h-[600px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <PropertyMap
                        properties={filteredProperties}
                        onPropertyClick={onViewProperty}
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProperties.map(property => (
                        <PropertyRow key={property.id} property={property} />
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedProperty && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Gallery */}
                        <div className="relative aspect-video bg-zinc-800">
                            {selectedProperty.images?.[0] ? (
                                selectedProperty.images[0].toLowerCase().match(/\.(mp4|webm|mov|avi)($|\?)/) ? (
                                    <video src={selectedProperty.images[0]} className="w-full h-full object-cover" controls />
                                ) : (
                                    <img
                                        src={selectedProperty.images[0]}
                                        alt={selectedProperty.title}
                                        className="w-full h-full object-cover"
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center group cursor-pointer relative">
                                    <Building2 className="text-zinc-600 group-hover:opacity-50 transition-opacity" size={80} />
                                    <label className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Plus size={48} className="text-white mb-2" />
                                        <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full">Agregar Fotos</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleDetailImageUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            )}
                            {/* Add button overlay for existing images too if needed, but primarily for empty state as requested */}
                            {selectedProperty.images?.[0] && (
                                <label className="absolute bottom-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full cursor-pointer text-white transition-colors">
                                    <Plus size={24} />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleDetailImageUpload}
                                        disabled={isUploading}
                                    />
                                </label>
                            )}
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                <span
                                    className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
                                    style={{ backgroundColor: selectedProperty.operation === 'VENTA' ? '#3b82f6' : '#8b5cf6' }}
                                >
                                    {t.operations[selectedProperty.operation as keyof typeof t.operations]}
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedProperty.title}</h2>
                                    <p className="text-zinc-400 flex items-center gap-2 mt-1 text-sm lg:text-base">
                                        <MapPin size={16} className="flex-shrink-0" />
                                        <span>
                                            {selectedProperty.address?.street} {selectedProperty.address?.exteriorNumber}, {' '}
                                            {selectedProperty.address?.colony}, {selectedProperty.address?.city}
                                        </span>
                                    </p>
                                </div>
                                <div className="text-left lg:text-right">
                                    <p className="text-3xl font-bold" style={{ color: brandColor }}>
                                        ${(selectedProperty.operation === 'RENTA' ? selectedProperty.rentPrice : selectedProperty.salePrice)?.toLocaleString()}
                                    </p>
                                    {selectedProperty.operation === 'RENTA' && (
                                        <p className="text-zinc-500">/mes</p>
                                    )}
                                </div>
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Bed className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.bedrooms}</p>
                                    <p className="text-zinc-500 text-xs">{t.bedrooms}</p>
                                </div>
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Bath className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.bathrooms}</p>
                                    <p className="text-zinc-500 text-xs">{t.bathrooms}</p>
                                </div>
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Car className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.parking}</p>
                                    <p className="text-zinc-500 text-xs">{t.parking}</p>
                                </div>
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Ruler className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.m2Built}</p>
                                    <p className="text-zinc-500 text-xs">{t.m2_built}</p>
                                </div>
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Building2 className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.floors}</p>
                                    <p className="text-zinc-500 text-xs">{t.floors}</p>
                                </div>
                                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                                    <Ruler className="mx-auto text-zinc-400 mb-1" size={24} />
                                    <p className="text-xl font-bold text-white">{selectedProperty.specs?.m2Total}</p>
                                    <p className="text-zinc-500 text-xs">{t.m2_total}</p>
                                </div>
                            </div>

                            {/* Agent Info */}
                            <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getAgentInfo(selectedProperty.agentId).photo ? (
                                        <img
                                            src={getAgentInfo(selectedProperty.agentId).photo}
                                            alt={getAgentInfo(selectedProperty.agentId).name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xl font-bold border-2 border-zinc-600">
                                            {getAgentInfo(selectedProperty.agentId).name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Asesor Asignado</p>
                                        <p className="text-white font-semibold text-lg">{getAgentInfo(selectedProperty.agentId).name}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-right">
                                    <p className="text-[10px] text-zinc-500 italic uppercase">Agente Verificado</p>
                                    <div className="flex gap-0.5 mt-0.5 justify-end">
                                        {[1, 2, 3, 4, 5].map(s => <Sparkles key={s} size={8} className="text-amber-500" />)}
                                    </div>
                                </div>
                            </div>


                            {/* Description */}
                            {selectedProperty.description && (
                                <div className="mb-6">
                                    <h3 className="text-white font-semibold mb-2">{t.description}</h3>
                                    <p className="text-zinc-400">{selectedProperty.description}</p>
                                </div>
                            )}

                            {/* Amenities */}
                            {selectedProperty.amenities?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-white font-semibold mb-2">Amenidades</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProperty.amenities.map((amenity, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full text-sm"
                                                style={{ backgroundColor: brandColor + '20', color: brandColor }}
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Generate Ad Section */}
                            <div className="bg-zinc-800 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <Sparkles size={20} style={{ color: brandColor }} />
                                        Generar Anuncio IA
                                    </h3>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => handleGenerateAd(selectedProperty, 'generic')}
                                        disabled={generatingAd}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex-1 transition-colors ${adPlatform === 'generic' ? 'bg-white text-black' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }`}
                                    >
                                        📄 Estándar
                                    </button>
                                    <button
                                        onClick={() => handleGenerateAd(selectedProperty, 'facebook')}
                                        disabled={generatingAd}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex-1 transition-colors ${adPlatform === 'facebook' ? 'bg-[#1877F2] text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }`}
                                    >
                                        📘 Facebook
                                    </button>
                                    <button
                                        onClick={() => handleGenerateAd(selectedProperty, 'whatsapp')}
                                        disabled={generatingAd}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex-1 transition-colors ${adPlatform === 'whatsapp' ? 'bg-[#25D366] text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }`}
                                    >
                                        💬 WhatsApp
                                    </button>
                                </div>

                                {generatingAd ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="animate-spin text-zinc-500" size={24} />
                                        <span className="ml-2 text-zinc-500 text-sm">Creando copy perfecto...</span>
                                    </div>
                                ) : adText && (
                                    <div className="bg-zinc-900 rounded-lg p-4 animate-fade-in relative group">
                                        <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{adText}</p>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={copyAd}
                                                className="bg-zinc-800 p-2 rounded-lg text-white hover:bg-zinc-700 shadow-lg"
                                                title="Copiar texto"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={copyAd}
                                            className={`mt-4 w-full py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors ${isCopied
                                                ? 'bg-green-600 text-white'
                                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                                }`}
                                        >
                                            {isCopied ? <Check size={16} /> : null}
                                            {isCopied ? '¡Copiado!' : '📋 Copiar al portapapeles'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditingProperty(selectedProperty);
                                        setShowEditModal(true);
                                        setShowDetailModal(false);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 rounded-xl text-white font-semibold hover:bg-zinc-700"
                                >
                                    <Edit2 size={20} />
                                    {t.edit}
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
                                    style={{ backgroundColor: brandColor, color: '#000' }}
                                >
                                    <MessageCircle size={20} />
                                    Contactar
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF(selectedProperty)}
                                    disabled={downloadingPdf === selectedProperty.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 rounded-xl text-white font-semibold hover:bg-zinc-700 disabled:opacity-50"
                                >
                                    {downloadingPdf === selectedProperty.id ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    PDF
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteProperty(selectedProperty.id);
                                        setShowDetailModal(false);
                                    }}
                                    className="px-4 py-3 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Add Property Modal */}
            {
                showAddModal && onAddProperty && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white uppercase italic">AGREGAR PROPIEDAD</h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setTempAddImages([]);
                                        }}
                                        className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const newProperty: Partial<Property> = {
                                            title: formData.get('title') as string,
                                            type: formData.get('type') as PropertyType,
                                            operation: formData.get('operation') as OperationType,
                                            salePrice: formData.get('operation') === 'VENTA' ? Number(String(formData.get('price')).replace(/,/g, '')) : undefined,
                                            rentPrice: formData.get('operation') === 'RENTA' ? Number(String(formData.get('price')).replace(/,/g, '')) : undefined,
                                            address: {
                                                street: formData.get('street') as string,
                                                exteriorNumber: formData.get('exteriorNumber') as string,
                                                colony: formData.get('colony') as string,
                                                city: formData.get('city') as string,
                                                state: formData.get('state') as string,
                                                zipCode: formData.get('zipCode') as string,
                                                country: formData.get('country') as 'MEXICO' | 'USA'
                                            },
                                            images: tempAddImages,
                                            currency: formData.get('country') === 'USA' ? 'USD' : 'MXN',
                                            specs: {
                                                bedrooms: Number(formData.get('bedrooms')),
                                                bathrooms: Number(formData.get('bathrooms')),
                                                parking: Number(formData.get('parking')),
                                                m2Built: Number(formData.get('m2Built')),
                                                m2Total: Number(formData.get('m2Total')),
                                                floors: Number(formData.get('floors'))
                                            },
                                            description: formData.get('description') as string,
                                            agencyId: properties[0]?.agencyId || '',
                                            isPublicGlobal: formData.get('isPublicGlobal') === 'on'
                                        };

                                        onAddProperty(newProperty);
                                        setTempAddImages([]);
                                        setShowAddModal(false);
                                    }}
                                    className="space-y-4"
                                >
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs text-zinc-400 block mb-1">Título</label>
                                            <input
                                                name="title"
                                                type="text"
                                                required
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                placeholder="Casa en venta..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                                            <select name="type" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                {Object.values(PropertyType).map(type => (
                                                    <option key={type} value={type}>{t.property_types[type as keyof typeof t.property_types]}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Operación</label>
                                            <select name="operation" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                {Object.values(OperationType).map(op => (
                                                    <option key={op} value={op}>{t.operations[op as keyof typeof t.operations]}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">País</label>
                                            <select name="country" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                <option value="MEXICO">México</option>
                                                <option value="USA">USA</option>
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <label className="text-xs text-zinc-400 block mb-1">Precio</label>
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                            <input
                                                name="price"
                                                type="text"
                                                required
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-zinc-500"
                                                placeholder="0,000"
                                                onInput={(e) => {
                                                    const input = e.currentTarget;
                                                    let value = input.value.replace(/\D/g, '');
                                                    if (value) {
                                                        value = parseInt(value).toLocaleString('en-US');
                                                        input.value = value;
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Agent Assignment (Visible/Enabled based on role) */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="text-xs text-zinc-400 block mb-1 uppercase font-black italic">Asesor Responsable</label>
                                        <select
                                            name="agentId"
                                            disabled={!isAdmin}
                                            defaultValue={userId}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                                        >
                                            {agents.map(agent => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name} {agent.id === userId ? '(Tú)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {!isAdmin && <p className="text-[10px] text-zinc-500 mt-1 italic">* Solo administradores pueden asignar a otros asesores.</p>}
                                    </div>

                                    {/* Global Portal Toggle */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
                                        const checkbox = document.getElementById('isPublicGlobalAdd') as HTMLInputElement;
                                        if (checkbox) checkbox.checked = !checkbox.checked;
                                    }}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                                <Globe size={18} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic uppercase tracking-tight">Publicar en Portal Global</p>
                                                <p className="text-[10px] text-zinc-500 font-bold italic">Mostrar esta propiedad en el marketplace nacional.</p>
                                            </div>
                                        </div>
                                        <input
                                            id="isPublicGlobalAdd"
                                            name="isPublicGlobal"
                                            type="checkbox"
                                            className="w-5 h-5 rounded-md border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <h3 className="text-white font-semibold mb-3">Dirección</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Calle</label>
                                                <input name="street" type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Número Exterior</label>
                                                <input name="exteriorNumber" type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Colonia</label>
                                                <input name="colony" type="text" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Ciudad</label>
                                                <input name="city" type="text" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Estado</label>
                                                <input name="state" type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Código Postal</label>
                                                <input name="zipCode" type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specs & Description */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <h3 className="text-white font-semibold mb-3">Especificaciones y Descripción</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Recámaras</label>
                                                <input
                                                    name="bedrooms"
                                                    type="number"
                                                    defaultValue={0}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Baños</label>
                                                <input
                                                    name="bathrooms"
                                                    type="number"
                                                    defaultValue={0}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Pisos</label>
                                                <input
                                                    name="floors"
                                                    type="number"
                                                    defaultValue={1}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">M² Const.</label>
                                                <input
                                                    name="m2Built"
                                                    type="number"
                                                    defaultValue={0}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">M² Terreno</label>
                                                <input
                                                    name="m2Total"
                                                    type="number"
                                                    defaultValue={0}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Estacionam.</label>
                                                <input
                                                    name="parking"
                                                    type="number"
                                                    defaultValue={0}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-3">
                                                <label className="text-xs text-zinc-400 block mb-1">Descripción</label>
                                                <textarea
                                                    name="description"
                                                    rows={2}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                    placeholder="Descripción detallada..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Manual Image Upload */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                            <Sparkles size={16} className="text-amber-500" />
                                            Fotos de la Propiedad
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            {tempAddImages.map((src, idx) => (
                                                <div key={idx} className="relative aspect-square bg-zinc-800 rounded-xl overflow-hidden group border border-zinc-700">
                                                    <img src={src} className="w-full h-full object-cover" alt="" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveManualAddImage(idx)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    {idx === 0 && (
                                                        <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            Principal
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {tempAddImages.length < 10 && (
                                                <label className="border-2 border-dashed border-zinc-800 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-zinc-700 hover:bg-white/5 transition-all group">
                                                    <Plus className="text-zinc-600 group-hover:text-amber-500 mb-1 transition-colors" size={24} />
                                                    <span className="text-[10px] text-zinc-600 group-hover:text-amber-500 font-bold uppercase tracking-widest transition-colors">Añadir</span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,video/*"
                                                        className="hidden"
                                                        onChange={handleManualAddImageUpload}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-600 italic">Sube hasta 10 fotos. La primera será la principal.</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-4 pb-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setTempAddImages([]);
                                            }}
                                            className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-semibold hover:bg-zinc-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 rounded-xl font-bold text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ backgroundColor: brandColor }}
                                        >
                                            Agregar Propiedad
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Edit Property Modal */}
            {
                showEditModal && editingProperty && onEditProperty && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white uppercase italic">EDITAR PROPIEDAD</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingProperty(null);
                                            if (onClearEditingProperty) onClearEditingProperty();
                                        }}
                                        className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const updatedProperty: Property = {
                                            ...editingProperty!,
                                            title: formData.get('title') as string,
                                            type: formData.get('type') as PropertyType,
                                            operation: formData.get('operation') as OperationType,
                                            salePrice: formData.get('operation') === 'VENTA' ? Number(String(formData.get('price')).replace(/,/g, '')) : editingProperty!.salePrice,
                                            rentPrice: formData.get('operation') === 'RENTA' ? Number(String(formData.get('price')).replace(/,/g, '')) : editingProperty!.rentPrice,
                                            address: {
                                                ...editingProperty!.address,
                                                street: formData.get('street') as string,
                                                exteriorNumber: formData.get('exteriorNumber') as string,
                                                colony: formData.get('colony') as string,
                                                city: formData.get('city') as string,
                                                state: formData.get('state') as string,
                                                zipCode: formData.get('zipCode') as string,
                                                country: formData.get('country') as 'MEXICO' | 'USA'
                                            },
                                            currency: formData.get('country') === 'USA' ? 'USD' : 'MXN',
                                            specs: {
                                                ...editingProperty!.specs,
                                                bedrooms: Number(formData.get('bedrooms')),
                                                bathrooms: Number(formData.get('bathrooms')),
                                                parking: Number(formData.get('parking')),
                                                m2Built: Number(formData.get('m2Built')),
                                                m2Total: Number(formData.get('m2Total')),
                                                floors: Number(formData.get('floors'))
                                            },
                                            isPublicGlobal: formData.get('isPublicGlobal') === 'on',
                                            description: formData.get('description') as string,
                                            status: formData.get('status') as PropertyStatus,
                                            agentId: formData.get('agentId') as string || editingProperty.agentId
                                        };

                                        onEditProperty(updatedProperty);
                                        setShowEditModal(false);
                                        setEditingProperty(null);
                                        if (onClearEditingProperty) onClearEditingProperty();
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
                                        const checkbox = document.getElementById('isPublicGlobalEdit') as HTMLInputElement;
                                        if (checkbox) checkbox.checked = !checkbox.checked;
                                    }}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                                <Globe size={18} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic uppercase tracking-tight">Publicar en Portal Global</p>
                                                <p className="text-[10px] text-zinc-500 font-bold italic">Mantener visible en el marketplace nacional.</p>
                                            </div>
                                        </div>
                                        <input
                                            id="isPublicGlobalEdit"
                                            name="isPublicGlobal"
                                            type="checkbox"
                                            defaultChecked={editingProperty.isPublicGlobal}
                                            className="w-5 h-5 rounded-md border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20"
                                        />
                                    </div>

                                    {/* Images Section */}
                                    <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                                        <label className="text-xs text-zinc-400 block mb-3 uppercase font-black italic">Galería de Fotos</label>

                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {editingProperty.images?.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img src={img} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className={`aspect-square rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {isUploading ? (
                                                    <Loader2 size={24} className="animate-spin text-zinc-500" />
                                                ) : (
                                                    <>
                                                        <Plus size={24} className="text-zinc-500 mb-1" />
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Agregar</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,video/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs text-zinc-400 block mb-1">Título</label>
                                            <input
                                                name="title"
                                                type="text"
                                                required
                                                defaultValue={editingProperty.title}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                                            <select name="type" defaultValue={editingProperty.type} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                {Object.values(PropertyType).map(type => (
                                                    <option key={type} value={type}>{t.property_types[type as keyof typeof t.property_types]}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Operación</label>
                                            <select name="operation" defaultValue={editingProperty.operation} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                {Object.values(OperationType).map(op => (
                                                    <option key={op} value={op}>{t.operations[op as keyof typeof t.operations]}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">País</label>
                                            <select name="country" defaultValue={editingProperty.address.country} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                                                <option value="MEXICO">México</option>
                                                <option value="USA">USA</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Precio</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                                <input
                                                    name="price"
                                                    type="text"
                                                    required
                                                    defaultValue={(editingProperty.operation === 'VENTA' ? editingProperty.salePrice : editingProperty.rentPrice)?.toLocaleString('en-US')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-zinc-500"
                                                    onInput={(e) => {
                                                        const input = e.currentTarget;
                                                        let value = input.value.replace(/\D/g, '');
                                                        if (value) {
                                                            value = parseInt(value).toLocaleString('en-US');
                                                            input.value = value;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <h3 className="text-white font-semibold mb-3">Dirección</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Calle</label>
                                                <input name="street" type="text" defaultValue={editingProperty.address.street} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Número Exterior</label>
                                                <input name="exteriorNumber" type="text" defaultValue={editingProperty.address.exteriorNumber} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Colonia</label>
                                                <input name="colony" type="text" required defaultValue={editingProperty.address.colony} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Ciudad</label>
                                                <input name="city" type="text" required defaultValue={editingProperty.address.city} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Estado</label>
                                                <input name="state" type="text" defaultValue={editingProperty.address.state} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Código Postal</label>
                                                <input name="zipCode" type="text" defaultValue={editingProperty.address.zipCode} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specs */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <h3 className="text-white font-semibold mb-3">Especificaciones</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Recámaras</label>
                                                <input
                                                    name="bedrooms"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.bedrooms}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Baños</label>
                                                <input
                                                    name="bathrooms"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.bathrooms}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Estacionamientos</label>
                                                <input
                                                    name="parking"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.parking}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">M² Construidos</label>
                                                <input
                                                    name="m2Built"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.m2Built}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">M² Terreno</label>
                                                <input
                                                    name="m2Total"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.m2Total}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-1">Pisos</label>
                                                <input
                                                    name="floors"
                                                    type="number"
                                                    defaultValue={editingProperty.specs.floors}
                                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/^0+(?=\d)/, '')}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Reassignment (Only for Admins) */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="text-xs text-zinc-400 block mb-1 uppercase font-black italic">Asesor Responsable</label>
                                        <select
                                            name="agentId"
                                            disabled={!isAdmin}
                                            defaultValue={editingProperty.agentId}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                                        >
                                            {agents.map(agent => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name} {agent.id === userId ? '(Yo)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {!isAdmin && <p className="text-[10px] text-zinc-500 mt-1 italic">* Solo el administrador puede reasignar esta propiedad.</p>}
                                    </div>

                                    {/* Description */}
                                    <div>

                                        <label className="text-xs text-zinc-400 block mb-1">Descripción</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            defaultValue={editingProperty.description}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setEditingProperty(null);
                                                if (onClearEditingProperty) onClearEditingProperty();
                                            }}
                                            className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-semibold hover:bg-zinc-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 rounded-xl font-semibold text-black"
                                            style={{ backgroundColor: brandColor }}
                                        >
                                            Actualizar Propiedad
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div >
                    </div >
                )
            }
        </div >
    );
};

export default PropertiesView;
