import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    FileText,
    Video,
    BookOpen,
    ExternalLink,
    Download,
    Play,
    Clock,
    ChevronRight,
    SearchX,
    X
} from 'lucide-react';
import { translations } from '../translations';
import { LibraryResource, ResourceCategory, ResourceType } from '../types';
import { supabase } from '../services/supabase';

interface LibraryViewProps {
    lang: 'es' | 'en';
    brandColor: string;
    agencyId?: string;
}

const LibraryView: React.FC<LibraryViewProps> = ({ lang, brandColor, agencyId }) => {
    const t = translations[lang];
    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        url: '',
        type: 'pdf' as ResourceType,
        category: ResourceCategory.CONTRACTS,
        description: ''
    });

    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchResources();
    }, [agencyId]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('real_estate_resources')
                .select('*')
                .order('created_at', { ascending: false });

            if (agencyId) {
                query = query.or(`agency_id.is.null,agency_id.eq.${agencyId}`);
            } else {
                query = query.is('agency_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mappedData: LibraryResource[] = (data || []).map(item => ({
                id: item.id,
                agencyId: item.agency_id,
                title: item.title,
                type: item.type,
                category: item.category,
                url: item.url,
                thumbnailUrl: item.thumbnail_url,
                description: item.description,
                dateAdded: item.created_at
            }));
            setResources(mappedData);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agencyId) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('real_estate_resources')
                .insert([{
                    title: newResource.title,
                    url: newResource.url,
                    type: newResource.type,
                    category: newResource.category,
                    description: newResource.description,
                    agency_id: agencyId
                }]);

            if (error) throw error;

            setNewResource({
                title: '',
                url: '',
                type: 'pdf',
                category: ResourceCategory.CONTRACTS,
                description: ''
            });
            setShowAddForm(false);
            fetchResources();
        } catch (error) {
            console.error('Error adding resource:', error);
            alert('Error al agregar el recurso.');
        } finally {
            setLoading(false);
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || res.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={24} className="text-red-500" />;
            case 'video': return <Video size={24} className="text-blue-500" />;
            case 'course': return <BookOpen size={24} className="text-green-500" />;
            default: return <ExternalLink size={24} className="text-zinc-500" />;
        }
    };

    const getEmbedUrl = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    };

    const isPlayableUrl = (url: string) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4') || url.endsWith('.webm');
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                        {lang === 'es' ? 'Biblioteca' : 'Library'} <span className="text-amber-500">{lang === 'es' ? 'Inmobiliaria' : 'Resources'}</span>
                    </h1>
                    <p className="text-zinc-400">
                        {lang === 'es' ? 'Recursos y capacitación para tu equipo.' : 'Resources and training for your team.'}
                    </p>
                </div>
                {agencyId && (
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
                    >
                        {showAddForm ? t.cancel : t.add_resource}
                    </button>
                )}
            </div>

            {/* Add Resource Form */}
            {showAddForm && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
                    <form onSubmit={handleAddResource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.name}</label>
                            <input
                                required
                                type="text"
                                placeholder="Nombre del recurso..."
                                value={newResource.title}
                                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.resource_url}</label>
                            <input
                                required
                                type="url"
                                placeholder="https://..."
                                value={newResource.url}
                                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.resource_type}</label>
                            <select
                                value={newResource.type}
                                onChange={(e) => setNewResource({ ...newResource, type: e.target.value as ResourceType })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="pdf">PDF Document</option>
                                <option value="video">Video (YouTube/MP4)</option>
                                <option value="link">External Link</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.resource_category}</label>
                            <select
                                value={newResource.category}
                                onChange={(e) => setNewResource({ ...newResource, category: e.target.value as ResourceCategory })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {Object.values(ResourceCategory).map(cat => (
                                    <option key={cat} value={cat}>{t.categories[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.description}</label>
                            <textarea
                                rows={2}
                                placeholder="Breve descripción..."
                                value={newResource.description}
                                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                            >
                                {t.save}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${selectedCategory === 'ALL'
                            ? 'bg-white text-black font-bold'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                            }`}
                    >
                        {t.all_resources}
                    </button>
                    {Object.values(ResourceCategory).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-white text-black font-bold'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            {t.categories[cat]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 animate-pulse">{t.loading}</p>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <SearchX size={40} className="text-zinc-700" />
                    </div>
                    <h3 className="text-white font-bold text-lg">{t.no_results}</h3>
                    <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2">
                        No pudimos encontrar recursos que coincidan con tu búsqueda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <div
                            key={resource.id}
                            className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-black/50 flex flex-col"
                        >
                            {/* Card Media (if video/thumbnail) */}
                            {resource.type === 'video' || resource.type === 'course' || isPlayableUrl(resource.url) ? (
                                <div className="relative aspect-video bg-black overflow-hidden">
                                    {resource.thumbnailUrl ? (
                                        <img
                                            src={resource.thumbnailUrl}
                                            alt={resource.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                            <Video className="text-zinc-600" size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-glow">
                                            <Play size={24} className="text-black fill-current ml-1" />
                                        </div>
                                    </div>
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white flex items-center gap-1 font-bold">
                                        <Clock size={10} />
                                        {resource.type.toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-zinc-950 flex items-center justify-center relative border-b border-zinc-800">
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-500 to-transparent"></div>
                                    {getIcon(resource.type)}
                                    <div className="absolute bottom-3 right-3 opacity-30">
                                        <FileText size={60} />
                                    </div>
                                </div>
                            )}

                            {/* Card Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 py-1 bg-zinc-800 rounded">
                                        {t.categories[resource.category]}
                                    </span>
                                </div>
                                <h3 className="text-white font-bold group-hover:text-amber-500 transition-colors mb-2 line-clamp-2">
                                    {resource.title}
                                </h3>
                                <p className="text-zinc-500 text-xs line-clamp-2 mb-6 leading-relaxed">
                                    {resource.description}
                                </p>

                                <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                                    <p className="text-[10px] text-zinc-600">
                                        Agregado el {new Date(resource.dateAdded).toLocaleDateString()}
                                    </p>
                                    {resource.type === 'video' || isPlayableUrl(resource.url) ? (
                                        <button
                                            onClick={() => setSelectedVideoUrl(resource.url)}
                                            className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-amber-500 transition-colors"
                                        >
                                            {t.view}
                                            <Play size={14} />
                                        </button>
                                    ) : (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-amber-500 transition-colors"
                                        >
                                            {resource.type === 'pdf' ? t.download_pdf : t.view}
                                            <ChevronRight size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Video Player Modal */}
            {selectedVideoUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                            <h3 className="text-white font-black uppercase italic tracking-tighter">Productor de Video IA</h3>
                            <button
                                onClick={() => setSelectedVideoUrl(null)}
                                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="relative aspect-video bg-black">
                            {getEmbedUrl(selectedVideoUrl).includes('youtube.com/embed') ? (
                                <iframe
                                    src={`${getEmbedUrl(selectedVideoUrl)}?autoplay=1`}
                                    title="Video Player"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                // Native video player support fallback
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <video
                                        src={selectedVideoUrl}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                    >
                                        Tu navegador no soporta la reproducción de este video.
                                    </video>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryView;
