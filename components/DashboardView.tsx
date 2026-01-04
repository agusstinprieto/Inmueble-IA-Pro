
import React from 'react';
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    Calendar,
    Clock,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    FileText,
    Activity
} from 'lucide-react';
import { translations } from '../translations';
import { Property, Client, Sale, PropertyStatus, PropertyType } from '../types';

interface DashboardViewProps {
    properties: Property[];
    clients: Client[];
    sales: Sale[];
    lang: 'es' | 'en';
    brandColor: string;
    businessName: string;
    onNavigate: (view: string) => void;
    onViewPublic: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    properties,
    clients,
    sales,
    lang,
    brandColor,
    businessName,
    onNavigate,
    onViewPublic
}) => {
    const t = translations[lang];

    // Calculate metrics
    const metrics = {
        totalProperties: properties.length,
        availableProperties: properties.filter(p => p.status === PropertyStatus.DISPONIBLE).length,
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status !== 'CERRADO' && c.status !== 'PERDIDO').length,
        monthlySales: sales.filter(s => {
            const saleDate = new Date(s.dateClosed);
            const now = new Date();
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }).length,
        monthlyRevenue: sales.filter(s => {
            const saleDate = new Date(s.dateClosed);
            const now = new Date();
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }).reduce((sum, s) => sum + (s.finalPrice || 0), 0),
        totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
        inventoryValue: properties
            .filter(p => p.status === PropertyStatus.DISPONIBLE)
            .reduce((sum, p) => sum + (p.salePrice || p.rentPrice || 0), 0)
    };

    // Properties by type
    const propertiesByType = Object.values(PropertyType).map(type => ({
        type,
        count: properties.filter(p => p.type === type).length
    })).filter(item => item.count > 0);

    // Helper for relative time
    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return lang === 'es' ? 'Hace unos momentos' : 'Just now';

        const minutes = Math.floor(diffInSeconds / 60);
        if (minutes < 60) return lang === 'es' ? `Hace ${minutes} min` : `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return lang === 'es' ? `Hace ${hours} horas` : `${hours} hours ago`;

        const days = Math.floor(hours / 24);
        if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
        if (days < 7) return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;

        return date.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US');
    };

    // Calculate dynamic recent activity
    const recentActivity = React.useMemo(() => {
        const activities = [];

        // Properties
        properties.forEach(p => {
            activities.push({
                type: 'property',
                action: lang === 'es' ? `Nueva propiedad: ${p.title}` : `New property: ${p.title}`,
                timestamp: new Date(p.dateAdded)
            });
        });

        // Clients
        clients.forEach(c => {
            activities.push({
                type: 'client',
                action: lang === 'es' ? `Nuevo cliente: ${c.name}` : `New client: ${c.name}`,
                timestamp: new Date(c.dateAdded)
            });
        });

        // Sales
        sales.forEach(s => {
            const prop = properties.find(p => p.id === s.propertyId);
            activities.push({
                type: 'sale',
                action: lang === 'es' ? `Venta cerrada: ${prop?.title || 'Propiedad'}` : `Sale closed: ${prop?.title || 'Property'}`,
                timestamp: new Date(s.dateClosed)
            });
        });

        // Sort by newest first and take top 5
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5)
            .map(item => ({
                ...item,
                time: getRelativeTime(item.timestamp)
            }));
    }, [properties, clients, sales, lang]);

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
        }
        return '$' + value.toLocaleString();
    };

    // Top properties by views
    const topProperties = [...properties]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: brandColor + '20' }}
                    >
                        <Activity size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {lang === 'es' ? 'DASHBOARD' : 'OPERATIONAL'} <span style={{ color: brandColor }}>{lang === 'es' ? 'OPERATIVO' : 'DASHBOARD'}</span>
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">
                            {lang === 'es' ? `BIENVENIDO A ${businessName.toUpperCase()}` : `WELCOME TO ${businessName.toUpperCase()}`}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm">
                        <Clock size={16} />
                        {new Date().toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                    <button
                        onClick={onViewPublic}
                        style={{ backgroundColor: brandColor + '20', color: brandColor, border: `1px solid ${brandColor}40` }}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase italic hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Eye size={16} />
                        Ver Portal Público
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => onNavigate('properties')}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none hover:border-amber-500/50 transition-all cursor-pointer text-left w-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: brandColor + '20' }}
                        >
                            <Building2 size={20} style={{ color: brandColor }} />
                        </div>
                        <span className="flex items-center text-green-400 text-sm">
                            <ArrowUpRight size={16} /> +5
                        </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{t.available_properties}</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.availableProperties}</p>
                    <p className="text-zinc-500 text-xs mt-1">de {metrics.totalProperties} totales</p>
                </button>

                <button
                    onClick={() => onNavigate('clients')}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none hover:border-blue-500/50 transition-all cursor-pointer text-left w-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#3b82f620' }}
                        >
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <span className="flex items-center text-green-400 text-sm">
                            <ArrowUpRight size={16} /> +12
                        </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{t.active_clients}</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.activeClients}</p>
                    <p className="text-zinc-500 text-xs mt-1">de {metrics.totalClients} totales</p>
                </button>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#22c55e20' }}
                        >
                            <DollarSign size={20} className="text-green-500" />
                        </div>
                        <span className="flex items-center text-green-400 text-sm">
                            <ArrowUpRight size={16} /> +23%
                        </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{t.monthly_sales}</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.monthlySales}</p>
                    <p className="text-zinc-500 text-xs mt-1">{formatCurrency(metrics.monthlyRevenue)}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#f59e0b20' }}
                        >
                            <Eye size={20} className="text-amber-500" />
                        </div>
                        <span className="flex items-center text-green-400 text-sm">
                            <ArrowUpRight size={16} /> +45
                        </span>
                    </div>
                    <p className="text-zinc-400 text-sm">Visitas Totales</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.totalViews}</p>
                    <p className="text-zinc-500 text-xs mt-1">este mes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventory Value */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
                    <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} style={{ color: brandColor }} />
                        VALOR DEL INVENTARIO
                    </h3>

                    <div className="mb-6">
                        <p className="text-4xl font-bold" style={{ color: brandColor }}>
                            {formatCurrency(metrics.inventoryValue)}
                        </p>
                        <p className="text-zinc-500 text-sm">en propiedades disponibles</p>
                    </div>

                    {/* Properties by Type */}
                    <div className="space-y-3">
                        <p className="text-zinc-400 text-sm">DISTRIBUCIÓN POR TIPO</p>
                        {propertiesByType.map(item => (
                            <div key={item.type} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-zinc-300 text-sm">
                                            {t.property_types[item.type as keyof typeof t.property_types]}
                                        </span>
                                        <span className="text-white font-medium">{item.count}</span>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(item.count / metrics.totalProperties) * 100}%`,
                                                backgroundColor: brandColor
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
                    <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                        <Activity size={20} style={{ color: brandColor }} />
                        {t.recent_activity}
                    </h3>

                    <div className="space-y-4">
                        {recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: brandColor + '20' }}
                                >
                                    {activity.type === 'property' && <Building2 size={14} style={{ color: brandColor }} />}
                                    {activity.type === 'client' && <Users size={14} style={{ color: brandColor }} />}
                                    {activity.type === 'sale' && <DollarSign size={14} style={{ color: brandColor }} />}
                                    {activity.type === 'view' && <Eye size={14} style={{ color: brandColor }} />}
                                </div>
                                <div>
                                    <p className="text-white text-sm">{activity.action}</p>
                                    <p className="text-zinc-500 text-xs">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Properties */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
                <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} style={{ color: brandColor }} />
                    PROPIEDADES MÁS VISTAS
                </h3>

                {topProperties.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">Sin datos aún</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-zinc-500 text-sm border-b border-zinc-800">
                                    <th className="text-left py-3 font-medium">Propiedad</th>
                                    <th className="text-left py-3 font-medium">Tipo</th>
                                    <th className="text-left py-3 font-medium">Ubicación</th>
                                    <th className="text-right py-3 font-medium">Precio</th>
                                    <th className="text-right py-3 font-medium">Vistas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProperties.map(property => (
                                    <tr key={property.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                    {property.images?.[0] ? (
                                                        <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 size={16} className="text-zinc-600" />
                                                    )}
                                                </div>
                                                <span className="text-white font-medium truncate max-w-[200px]">
                                                    {property.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-zinc-400 text-sm">
                                                {t.property_types[property.type as keyof typeof t.property_types]}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-zinc-400 text-sm">
                                                {property.address?.colony}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className="font-medium" style={{ color: brandColor }}>
                                                {formatCurrency(property.salePrice || property.rentPrice || 0)}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className="text-white font-medium">
                                                {property.views || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <button
                    onClick={() => onNavigate('properties')}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer relative z-20 shadow-sm dark:shadow-none"
                >
                    <Building2 size={24} style={{ color: brandColor }} />
                    <p className="text-zinc-900 dark:text-white font-medium mt-2">AGREGAR PROPIEDAD</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Registrar nueva</p>
                </button>
                <button
                    onClick={() => onNavigate('clients')}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer relative z-20 shadow-sm dark:shadow-none"
                >
                    <Users size={24} style={{ color: brandColor }} />
                    <p className="text-white font-medium mt-2">NUEVO CLIENTE</p>
                    <p className="text-zinc-500 text-sm">Registrar lead</p>
                </button>
                <button
                    onClick={() => onNavigate('contracts')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-600 transition-all cursor-pointer relative z-20"
                >
                    <FileText size={24} style={{ color: brandColor }} />
                    <p className="text-white font-medium mt-2">CREAR CONTRATO</p>
                    <p className="text-zinc-500 text-sm">Generar documento</p>
                </button>
                <button
                    onClick={() => onNavigate('analytics')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-600 transition-all cursor-pointer relative z-20"
                >
                    <BarChart3 size={24} style={{ color: brandColor }} />
                    <p className="text-white font-medium mt-2">VER REPORTES</p>
                    <p className="text-zinc-500 text-sm">Análisis detallado</p>
                </button>
            </div>
        </div >
    );
};

export default DashboardView;
