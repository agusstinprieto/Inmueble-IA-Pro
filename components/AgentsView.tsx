
import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    UserCheck,
    Search,
    Phone,
    Mail,
    TrendingUp,
    Award,
    Star,
    Settings,
    MoreVertical,
    ChevronRight,
    Shield,
    Building2,
    PieChart,
    Plus,
    X,
    Edit2,
    Trash2,
    Check
} from 'lucide-react';
import { Agent, Property, Sale, Client } from '../types';
import { translations } from '../translations';

interface AgentsViewProps {
    agents: Agent[];
    properties: Property[];
    sales: Sale[];
    clients: Client[];
    lang: 'es' | 'en';
    brandColor: string;
    businessName: string;
    onAddAgent?: (agent: Partial<Agent>) => Promise<void>;
    onEditAgent?: (agent: Agent) => Promise<void>;
    onDeleteAgent?: (id: string) => Promise<void>;
}

const AgentsView: React.FC<AgentsViewProps> = ({
    agents,
    properties,
    sales,
    clients,
    lang,
    brandColor,
    businessName,
    onAddAgent,
    onEditAgent,
    onDeleteAgent
}) => {
    const t = translations[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [formData, setFormData] = useState<Partial<Agent>>({
        name: '',
        email: '',
        phone: '',
        commission: 0,
        active: true
    });

    const filteredAgents = (agents || []).filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: lang === 'es' ? 'MXN' : 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getAgentPerformance = (agentId: string) => {
        const agentSales = sales.filter(s => s.agentId === agentId);
        const agentProperties = properties.filter(p => p.agentId === agentId);
        const agentClients = clients.filter(c => c.agentId === agentId);
        const totalVolume = agentSales.reduce((acc, s) => acc + s.finalPrice, 0);

        return {
            salesCount: agentSales.length,
            propertiesCount: agentProperties.length,
            clientsCount: agentClients.length,
            totalVolume
        };
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                        {lang === 'es' ? 'GESTIÓN DE' : 'TEAM'} <span style={{ color: brandColor }}>{lang === 'es' ? 'AGENTES' : 'MANAGEMENT'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">{lang === 'es' ? 'Control de equipo y métricas de rendimiento' : 'Team control and performance metrics'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm font-bold border border-zinc-700">
                        <Building2 size={18} />
                        {lang === 'es' ? 'Mi Agencia' : 'My Agency'}
                    </button>
                    <button
                        onClick={() => {
                            setEditingAgent(null);
                            setFormData({ name: '', email: '', phone: '', commission: 0, active: true });
                            setShowModal(true);
                        }}
                        style={{ backgroundColor: brandColor }}
                        className="flex items-center gap-2 px-5 py-2.5 text-black rounded-xl transition-all font-black text-sm uppercase italic active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                        <UserPlus size={18} />
                        {lang === 'es' ? 'Añadir Agente' : 'Add Agent'}
                    </button>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <Users className="text-amber-500" size={32} />
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Total Agentes' : 'Total Agents'}</p>
                        <h3 className="text-3xl font-black text-white mt-1">{(agents || []).length}</h3>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
                        <Award className="text-green-500" size={32} />
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Top Performer' : 'Top Performer'}</p>
                        <h3 className="text-lg font-black text-white mt-1 italic uppercase">Próximamente</h3>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <PieChart className="text-blue-500" size={32} />
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Distribución' : 'Distribution'}</p>
                        <h3 className="text-lg font-black text-white mt-1 italic uppercase">Eficiencia: 94%</h3>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Users className="text-zinc-500" size={20} />
                    <span className="text-white font-black italic uppercase text-sm tracking-tighter">Directorio de Equipo</span>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder={lang === 'es' ? 'Buscar por nombre o email...' : 'Search by name or email...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.length > 0 ? filteredAgents.map((agent) => {
                    const stats = getAgentPerformance(agent.id);
                    return (
                        <div key={agent.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-amber-500/50 transition-all">
                            {/* Agent Card Header */}
                            <div className="p-6 border-b border-zinc-800">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {agent.photo ? (
                                                <img src={agent.photo} alt={agent.name} className="w-16 h-16 rounded-2xl object-cover" />
                                            ) : (
                                                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
                                                    <UserCheck className="text-zinc-500" size={28} />
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full" title="Activo"></div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white group-hover:text-amber-500 transition-colors uppercase italic tracking-tighter">{agent.name}</h3>
                                            <p className="text-zinc-500 text-xs font-bold flex items-center gap-1">
                                                <Shield size={12} className="text-amber-500" />
                                                {agent.agencyId === 'admin' ? 'ADMINISTRADOR' : 'AGENTE ASOCIADO'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingAgent(agent);
                                                setFormData({ ...agent });
                                                setShowModal(true);
                                            }}
                                            className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(lang === 'es' ? '¿Estás seguro de eliminar este agente?' : 'Are you sure you want to delete this agent?')) {
                                                    onDeleteAgent?.(agent.id);
                                                }
                                            }}
                                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{lang === 'es' ? 'Prop.' : 'Prop.'}</p>
                                        <p className="text-lg font-black text-white">{stats.propertiesCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{lang === 'es' ? 'Ventas' : 'Sales'}</p>
                                        <p className="text-lg font-black text-white">{stats.salesCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{lang === 'es' ? 'Leads' : 'Leads'}</p>
                                        <p className="text-lg font-black text-white">{stats.clientsCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Card Footer */}
                            <div className="bg-black/40 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Phone size={14} className="text-zinc-500" />
                                            {agent.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Mail size={14} className="text-zinc-500" />
                                            {agent.email}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{lang === 'es' ? 'Facturación' : 'Revenue'}</p>
                                        <p className="text-sm font-black text-amber-500">{formatCurrency(stats.totalVolume)}</p>
                                    </div>
                                </div>

                                <button
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 italic"
                                >
                                    {lang === 'es' ? 'Ver Perfil Completo' : 'View Full Profile'}
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-20 text-center">
                        <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                        <h3 className="text-zinc-400 font-black uppercase italic">{lang === 'es' ? 'No se encontraron agentes' : 'No agents found'}</h3>
                        <p className="text-zinc-600 text-sm">{lang === 'es' ? 'Prueba ajustando tu búsqueda' : 'Try adjusting your search'}</p>
                    </div>
                )}
            </div>

            {/* Modal de Agente */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
                                {editingAgent ? (lang === 'es' ? 'Editar Agente' : 'Edit Agent') : (lang === 'es' ? 'Nuevo Agente' : 'New Agent')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (editingAgent) {
                                await onEditAgent?.({ ...editingAgent, ...formData } as Agent);
                            } else {
                                await onAddAgent?.({ ...formData, agencyId: 'demo' });
                            }
                            setShowModal(false);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="juan@ejemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="55 1234 5678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Comisión (%)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.commission}
                                    onChange={e => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                                    className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="Ej: 5"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors font-bold text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{ backgroundColor: brandColor }}
                                    className="px-6 py-2.5 text-black rounded-xl font-black text-sm uppercase italic shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    {editingAgent ? 'Guardar Cambios' : 'Crear Agente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsView;
