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
    SearchX
} from 'lucide-react';
import { translations } from '../translations';
import { LibraryResource, ResourceCategory } from '../types';
import { supabase } from '../services/supabase';

interface LibraryViewProps {
    lang: 'es' | 'en';
    brandColor: string;
}

const LibraryView: React.FC<LibraryViewProps> = ({ lang, brandColor }) => {
    const t = translations[lang];
    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('real_estate_resources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map Snake Case to Camel Case if necessary (Supabase might already do it depends on config)
            const mappedData: LibraryResource[] = (data || []).map(item => ({
                id: item.id,
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

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{t.real_estate_library}</h1>
                <p className="text-zinc-400 text-sm">{t.library_desc}</p>
            </div>

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
                            {resource.type === 'video' || resource.type === 'course' ? (
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
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-amber-500 transition-colors"
                                    >
                                        {resource.type === 'pdf' ? t.download_pdf : t.view}
                                        <ChevronRight size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LibraryView;
