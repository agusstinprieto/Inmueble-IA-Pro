
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
    Loader2
} from 'lucide-react';
import { translations } from '../translations';
import { Property, PropertyType, OperationType, PropertyStatus } from '../types';
import { generatePropertyListing } from '../services/gemini';
import { pdfService } from '../services/pdfService';

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
    onClearEditingProperty
}) => {
    const t = translations[lang];

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

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
    const handleGenerateAd = async (property: Property) => {
        setGeneratingAd(true);
        try {
            const ad = await generatePropertyListing(property, lang, businessName, location);
            setAdText(ad);
        } catch (err) {
            console.error('Error generating ad:', err);
            setAdText('Error al generar anuncio');
        } finally {
            setGeneratingAd(false);
        }
    };

    // Copy ad to clipboard
    const copyAd = () => {
        navigator.clipboard.writeText(adText);
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
                        <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
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
                            onClick={e => { e.stopPropagation(); }}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                            <Heart size={18} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); }}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                            <Share2 size={18} />
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
                    </div>
                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {property.address?.colony}, {property.address?.city}
                    </p>
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
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: brandColor + '20' }}
                    >
                        <Building2 size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase">{t.property_catalog}</h1>
                        <p className="text-zinc-400 text-sm uppercase">{stats.available} DE {stats.total} DISPONIBLES</p>
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
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
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
                                <img
                                    src={selectedProperty.images[0]}
                                    alt={selectedProperty.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="text-zinc-600" size={80} />
                                </div>
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
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedProperty.title}</h2>
                                    <p className="text-zinc-400 flex items-center gap-2 mt-1">
                                        <MapPin size={16} />
                                        {selectedProperty.address?.street} {selectedProperty.address?.exteriorNumber},
                                        {selectedProperty.address?.colony}, {selectedProperty.address?.city}
                                    </p>
                                </div>
                                <div className="text-right">
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
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <Sparkles size={20} style={{ color: brandColor }} />
                                        Generar Anuncio con IA
                                    </h3>
                                    <button
                                        onClick={() => handleGenerateAd(selectedProperty)}
                                        disabled={generatingAd}
                                        className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                                        style={{ backgroundColor: brandColor, color: '#000' }}
                                    >
                                        {generatingAd ? 'Generando...' : 'Generar'}
                                    </button>
                                </div>
                                {adText && (
                                    <div className="bg-zinc-900 rounded-lg p-4">
                                        <p className="text-zinc-300 whitespace-pre-wrap text-sm">{adText}</p>
                                        <button
                                            onClick={copyAd}
                                            className="mt-3 text-sm text-zinc-400 hover:text-white flex items-center gap-1"
                                        >
                                            📋 Copiar anuncio
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
            )}

            {/* Add Property Modal */}
            {showAddModal && onAddProperty && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white uppercase italic">AGREGAR PROPIEDAD</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
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
                                        salePrice: formData.get('operation') === 'VENTA' ? Number(formData.get('price')) : undefined,
                                        rentPrice: formData.get('operation') === 'RENTA' ? Number(formData.get('price')) : undefined,
                                        address: {
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
                                            bedrooms: Number(formData.get('bedrooms')),
                                            bathrooms: Number(formData.get('bathrooms')),
                                            parking: Number(formData.get('parking')),
                                            m2Built: Number(formData.get('m2Built')),
                                            m2Total: Number(formData.get('m2Total')),
                                            floors: Number(formData.get('floors'))
                                        },
                                        description: formData.get('description') as string
                                    };

                                    onAddProperty(newProperty);
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

                                    <div>
                                        <label className="text-xs text-zinc-400 block mb-1">Precio</label>
                                        <input
                                            name="price"
                                            type="number"
                                            required
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                            placeholder="1500000"
                                        />
                                    </div>
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

                                {/* Specs */}
                                <div className="border-t border-zinc-800 pt-4">
                                    <h3 className="text-white font-semibold mb-3">Especificaciones</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Recámaras</label>
                                            <input name="bedrooms" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Baños</label>
                                            <input name="bathrooms" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Estacionamientos</label>
                                            <input name="parking" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">M² Construidos</label>
                                            <input name="m2Built" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">M² Terreno</label>
                                            <input name="m2Total" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Pisos</label>
                                            <input name="floors" type="number" defaultValue={1} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs text-zinc-400 block mb-1">Descripción</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                        placeholder="Descripción detallada de la propiedad..."
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-semibold hover:bg-zinc-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-xl font-semibold text-black"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        Agregar Propiedad
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Property Modal */}
            {showEditModal && editingProperty && onEditProperty && (
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
                                        salePrice: formData.get('operation') === 'VENTA' ? Number(formData.get('price')) : editingProperty!.salePrice,
                                        rentPrice: formData.get('operation') === 'RENTA' ? Number(formData.get('price')) : editingProperty!.rentPrice,
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
                                        description: formData.get('description') as string,
                                        status: formData.get('status') as PropertyStatus
                                    };

                                    onEditProperty(updatedProperty);
                                    setShowEditModal(false);
                                    setEditingProperty(null);
                                    if (onClearEditingProperty) onClearEditingProperty();
                                }}
                                className="space-y-4"
                            >
                                {/* Status Toggle */}
                                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                                    <label className="text-xs text-zinc-400 block mb-2 uppercase font-black italic">Estado de Disponibilidad</label>
                                    <div className="flex gap-2">
                                        {Object.values(PropertyStatus).map(status => (
                                            <label key={status} className="flex-1 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value={status}
                                                    defaultChecked={editingProperty.status === status}
                                                    className="hidden peer"
                                                />
                                                <div className="py-2 text-center rounded-lg border border-zinc-700 text-[10px] font-bold uppercase peer-checked:bg-white peer-checked:text-black transition-all">
                                                    {status}
                                                </div>
                                            </label>
                                        ))}
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
                                        <input
                                            name="price"
                                            type="number"
                                            required
                                            defaultValue={editingProperty.operation === 'VENTA' ? editingProperty.salePrice : editingProperty.rentPrice}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                        />
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
                                            <input name="bedrooms" type="number" defaultValue={editingProperty.specs.bedrooms} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Baños</label>
                                            <input name="bathrooms" type="number" defaultValue={editingProperty.specs.bathrooms} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Estacionamientos</label>
                                            <input name="parking" type="number" defaultValue={editingProperty.specs.parking} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">M² Construidos</label>
                                            <input name="m2Built" type="number" defaultValue={editingProperty.specs.m2Built} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">M² Terreno</label>
                                            <input name="m2Total" type="number" defaultValue={editingProperty.specs.m2Total} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 block mb-1">Pisos</label>
                                            <input name="floors" type="number" defaultValue={editingProperty.specs.floors} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                                        </div>
                                    </div>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesView;
