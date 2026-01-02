import React, { useState, useEffect } from 'react';
import {
    Search,
    MapPin,
    Phone,
    Mail,
    Globe,
    Plus,
    X,
    Map as MapIcon,
    ChevronRight,
    Building,
    Check
} from 'lucide-react';
import { translations } from '../translations';
import { Notary } from '../types';
import { supabase } from '../services/supabase';

interface NotaryDirectoryViewProps {
    lang: 'es' | 'en';
    brandColor: string;
    agencyId?: string;
}

const NotaryDirectoryView: React.FC<NotaryDirectoryViewProps> = ({ lang, brandColor, agencyId }) => {
    const t = translations[lang];
    const [notaries, setNotaries] = useState<Notary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('ALL');
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Notary>>({
        name: '',
        notaryNumber: '',
        city: 'Torreón',
        address: '',
        phone: '',
        email: '',
        website: ''
    });

    const cities = ['Torreón', 'Gómez Palacio', 'Ciudad Lerdo'];

    useEffect(() => {
        fetchNotaries();
    }, []);

    const fetchNotaries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notaries')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            const mappedData: Notary[] = (data || []).map(item => ({
                id: item.id,
                agencyId: item.agency_id,
                name: item.name,
                notaryNumber: item.notary_number,
                city: item.city,
                address: item.address,
                phone: item.phone,
                email: item.email,
                website: item.website,
                coordinates: item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined,
                dateAdded: item.created_at
            }));

            setNotaries(mappedData);
        } catch (error) {
            console.error('Error fetching notaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNotary = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('notaries')
                .insert([{
                    name: formData.name,
                    notary_number: formData.notaryNumber,
                    city: formData.city,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    website: formData.website,
                    agency_id: agencyId
                }]);

            if (error) throw error;
            setShowAddForm(false);
            fetchNotaries();
            setFormData({ city: 'Torreón' });
        } catch (error) {
            console.error('Error adding notary:', error);
            alert('Error al agregar notaría');
        }
    };

    const filteredNotaries = notaries.filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.notaryNumber.includes(searchQuery) ||
            n.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = cityFilter === 'ALL' || n.city === cityFilter;
        return matchesSearch && matchesCity;
    });

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.notary_directory}</h1>
                    <p className="text-zinc-400 text-sm">{t.notary_directory_desc}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: brandColor, color: '#000' }}
                >
                    <Plus size={20} />
                    {t.add_notary}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder={t.search_notaries}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="ALL">{t.city_filter}</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-white text-sm">
                    {filteredNotaries.map(notary => (
                        <div
                            key={notary.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                    <Building size={24} className="text-amber-500" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                    <Check size={12} /> VERIFICADA
                                </span>
                            </div>

                            <h3 className="font-bold text-lg mb-1">{notary.name}</h3>
                            <p className="text-zinc-500 mb-4 flex items-center gap-1">
                                {notary.city} • Notaría No. {notary.notaryNumber}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-zinc-800">
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-zinc-500 mt-0.5" />
                                    <span className="text-zinc-300">{notary.address}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-zinc-500" />
                                    <span className="text-zinc-300">{notary.phone}</span>
                                </div>
                                {notary.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-zinc-500" />
                                        <span className="text-zinc-300">{notary.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                                    <Phone size={14} /> Llamar
                                </button>
                                <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                                    <MapIcon size={14} /> Ubicar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{t.add_notary}</h2>
                            <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                                <X className="text-zinc-500" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddNotary} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nombre de la Notaría</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Número</label>
                                    <input
                                        type="text"
                                        value={formData.notaryNumber}
                                        onChange={(e) => setFormData({ ...formData, notaryNumber: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Ciudad</label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                    >
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Dirección Completa</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 rounded-xl font-bold mt-4 transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
                                style={{ backgroundColor: brandColor, color: '#000' }}
                            >
                                GUARDAR NOTARIA
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotaryDirectoryView;
