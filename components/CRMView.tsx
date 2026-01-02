
import React, { useState } from 'react';
import {
    Users,
    Plus,
    Search,
    Phone,
    Mail,
    MessageCircle,
    Calendar,
    Edit2,
    Trash2,
    ChevronRight,
    Filter,
    UserPlus,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    Building2,
    MapPin,
    X,
    Flame,
    Snowflake,
    Zap,
    Target,
    Sparkles,
    ShieldCheck,
    TrendingUp
} from 'lucide-react';
import { translations } from '../translations';
import { Client, ClientStatus, FollowUp, Property, OperationType, PropertyType, ClientSegment } from '../types';
import { sendFollowUp, sendPropertyInfo, sendGreeting, openWhatsApp } from '../services/whatsapp';

interface CRMViewProps {
    clients: Client[];
    properties: Property[];
    onAddClient: (client: Partial<Client>) => void;
    onUpdateClient: (client: Client) => void;
    onDeleteClient: (id: string) => void;
    onAddFollowUp: (clientId: string, followUp: Partial<FollowUp>) => void;
    lang: 'es' | 'en';
    brandColor: string;
    agentName: string;
}

const CRMView: React.FC<CRMViewProps> = ({
    clients,
    properties,
    onAddClient,
    onUpdateClient,
    onDeleteClient,
    onAddFollowUp,
    lang,
    brandColor,
    agentName
}) => {
    const t = translations[lang];

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ClientStatus | 'ALL'>('ALL');
    const [segmentFilter, setSegmentFilter] = useState<ClientSegment | 'ALL'>('ALL');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Segmentation Logic
    const getClientSegment = (client: Client): ClientSegment => {
        // 1. VIP (Inversionista)
        if (client.budgetMax >= 5000000) return ClientSegment.VIP;

        // 2. HOT (Próximo)
        if (client.status === ClientStatus.EN_NEGOCIACION) return ClientSegment.HOT;

        // 3. COLD (Archivo)
        if (client.status === ClientStatus.PERDIDO) return ClientSegment.COLD;

        const lastFollowUp = client.followUps.length > 0
            ? new Date(client.followUps[client.followUps.length - 1].date)
            : new Date(client.dateAdded);
        const daysSinceActivity = (Date.now() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceActivity > 15) return ClientSegment.COLD;

        // 4. WARM (En Espera)
        if (client.status === ClientStatus.CONTACTADO || client.followUps.length > 2) return ClientSegment.WARM;

        // 5. NEW (Nuevo)
        return ClientSegment.NEW;
    };

    // New client form
    const [newClient, setNewClient] = useState<Partial<Client>>({
        name: '',
        phone: '',
        email: '',
        interest: OperationType.VENTA,
        preferredTypes: [],
        budgetMin: 0,
        budgetMax: 0,
        preferredZones: [],
        notes: '',
        status: ClientStatus.NUEVO,
        followUps: [],
        viewedProperties: [],
        source: ''
    });

    // Follow up form
    const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUp>>({
        type: 'LLAMADA',
        notes: '',
        completed: false
    });

    // Filter clients
    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone.includes(searchQuery) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
        const matchesSegment = segmentFilter === 'ALL' || getClientSegment(client) === segmentFilter;

        return matchesSearch && matchesStatus && matchesSegment;
    });

    // Segment UI Data
    const segmentConfig: Record<ClientSegment, { color: string, icon: any }> = {
        [ClientSegment.VIP]: { color: '#f59e0b', icon: Sparkles },
        [ClientSegment.HOT]: { color: '#ef4444', icon: Flame },
        [ClientSegment.WARM]: { color: '#8b5cf6', icon: Zap },
        [ClientSegment.COLD]: { color: '#6b7280', icon: Snowflake },
        [ClientSegment.NEW]: { color: '#3b82f6', icon: Target }
    };

    // Status colors
    const getStatusColor = (status: ClientStatus) => {
        const colors: Record<ClientStatus, string> = {
            [ClientStatus.NUEVO]: '#3b82f6',
            [ClientStatus.CONTACTADO]: '#8b5cf6',
            [ClientStatus.EN_NEGOCIACION]: '#f59e0b',
            [ClientStatus.CERRADO]: '#22c55e',
            [ClientStatus.PERDIDO]: '#ef4444'
        };
        return colors[status];
    };

    // ... (rest of filtering code)

    // Add or Update client
    const handleSaveClient = () => {
        if (isEditing && selectedClient) {
            // Update existing
            const updatedClient: Client = {
                ...selectedClient,
                ...newClient,
                // Ensure ID and immutable fields are preserved, though newClient shouldn't have them usually
            };
            onUpdateClient(updatedClient);
            setSelectedClient(updatedClient); // Update selection to show changes
        } else {
            // Add new
            const client: Partial<Client> = {
                ...newClient,
                id: `client_${Date.now()}`, // Temp ID, ignored by DB
                agentId: '', // Set by parent
                dateAdded: new Date().toISOString()
            };
            onAddClient(client);
        }

        setShowAddModal(false);
        setIsEditing(false);
        setNewClient({
            name: '',
            phone: '',
            email: '',
            interest: OperationType.VENTA,
            preferredTypes: [],
            budgetMin: 0,
            budgetMax: 0,
            preferredZones: [],
            notes: '',
            status: ClientStatus.NUEVO,
            followUps: [],
            viewedProperties: [],
            source: ''
        });
    };

    const handleEditClient = () => {
        if (!selectedClient) return;
        setNewClient({
            name: selectedClient.name,
            phone: selectedClient.phone,
            email: selectedClient.email,
            interest: selectedClient.interest,
            preferredTypes: selectedClient.preferredTypes,
            budgetMin: selectedClient.budgetMin,
            budgetMax: selectedClient.budgetMax,
            preferredZones: selectedClient.preferredZones,
            notes: selectedClient.notes,
            status: selectedClient.status,
            source: selectedClient.source,
            followUps: selectedClient.followUps,
            viewedProperties: selectedClient.viewedProperties
        });
        setIsEditing(true);
        setShowAddModal(true);
    };

    // Add follow up
    const handleAddFollowUp = () => {
        if (!selectedClient) return;

        const followUp: Partial<FollowUp> = {
            type: newFollowUp.type as FollowUp['type'],
            notes: newFollowUp.notes || '',
            completed: true,
            scheduledDate: new Date().toISOString()
        };

        onAddFollowUp(selectedClient.id, followUp);

        setShowFollowUpModal(false);
        setNewFollowUp({ type: 'LLAMADA', notes: '', completed: false });
    };

    // Send WhatsApp
    const handleSendWhatsApp = (client: Client, type: 'greeting' | 'followup' | 'property', property?: Property) => {
        if (type === 'greeting') {
            sendGreeting(client, agentName, lang);
        } else if (type === 'followup') {
            sendFollowUp(client, lang);
        } else if (type === 'property' && property) {
            sendPropertyInfo(client, property, lang);
        }
    };

    // Stats
    const stats = {
        total: clients.length,
        new: clients.filter(c => c.status === ClientStatus.NUEVO).length,
        negotiating: clients.filter(c => c.status === ClientStatus.EN_NEGOCIACION).length,
        closed: clients.filter(c => c.status === ClientStatus.CERRADO).length,
        vip: clients.filter(c => getClientSegment(c) === ClientSegment.VIP).length
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
                        <Users size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase">{t.client_management}</h1>
                        <p className="text-zinc-400 text-sm uppercase">GESTIÓN DE PROSPECTOS Y SEGUIMIENTOS</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="
            flex items-center justify-center gap-2 px-5 py-3
            rounded-xl font-semibold
          "
                    style={{ backgroundColor: brandColor, color: '#000' }}
                >
                    <UserPlus size={20} />
                    {t.add_client}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Total Clientes</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Nuevos</p>
                    <p className="text-3xl font-bold text-blue-400 mt-1">{stats.new}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">En Negociación</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">{stats.negotiating}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Inversionistas VIP</p>
                    <p className="text-3xl font-bold text-amber-500 mt-1">{stats.vip}</p>
                </div>
            </div>

            {/* Segmentation Bar */}
            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex flex-wrap gap-2">
                <button
                    onClick={() => setSegmentFilter('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all ${segmentFilter === 'ALL' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                    Todos
                </button>
                {Object.values(ClientSegment).map(segment => {
                    const Config = segmentConfig[segment];
                    const Icon = Config.icon;
                    return (
                        <button
                            key={segment}
                            onClick={() => setSegmentFilter(segment)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all
                                ${segmentFilter === segment ? 'bg-zinc-800 ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-white'}
                            `}
                            style={segmentFilter === segment ? { color: Config.color } : {}}
                        >
                            <Icon size={14} />
                            {t.client_segments[segment]}
                        </button>
                    );
                })}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder={t.search_clients}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ClientStatus | 'ALL')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                    <option value="ALL">Todos los estados</option>
                    {Object.values(ClientStatus).map(status => (
                        <option key={status} value={status}>
                            {t.client_status[status as keyof typeof t.client_status]}
                        </option>
                    ))}
                </select>
            </div>

            {/* Client List & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client List */}
                <div className="lg:col-span-2 space-y-3">
                    {filteredClients.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                            <Users className="mx-auto text-zinc-600 mb-3" size={48} />
                            <p className="text-zinc-400">No hay clientes</p>
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className={`
                  bg-zinc-900 border rounded-xl p-4 cursor-pointer
                  transition-all hover:border-zinc-600
                  ${selectedClient?.id === client.id ? 'border-2' : 'border-zinc-800'}
                `}
                                style={selectedClient?.id === client.id ? { borderColor: brandColor } : {}}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: brandColor + '40' }}
                                        >
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{client.name}</h3>
                                            <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} /> {client.phone}
                                                </span>
                                                {client.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={14} /> {client.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const segment = getClientSegment(client);
                                            const Config = segmentConfig[segment];
                                            const Icon = Config.icon;
                                            return (
                                                <span
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase italic"
                                                    style={{ backgroundColor: Config.color + '20', color: Config.color }}
                                                >
                                                    <Icon size={10} />
                                                    {t.client_segments[segment]}
                                                </span>
                                            );
                                        })()}
                                        <span
                                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase italic"
                                            style={{
                                                backgroundColor: getStatusColor(client.status) + '20',
                                                color: getStatusColor(client.status)
                                            }}
                                        >
                                            {t.client_status[client.status as keyof typeof t.client_status]}
                                        </span>
                                        <ChevronRight className="text-zinc-500" size={20} />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-zinc-500 text-sm">
                                    <span className="flex items-center gap-1">
                                        <DollarSign size={14} />
                                        ${client.budgetMin?.toLocaleString()} - ${client.budgetMax?.toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 size={14} />
                                        {t.operations[client.interest as keyof typeof t.operations]}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {client.followUps.length} seguimientos
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Client Details Panel */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-fit sticky top-4">
                    {selectedClient ? (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">{selectedClient.name}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEditClient}
                                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteClient(selectedClient.id)}
                                        className="p-2 bg-zinc-800 rounded-lg hover:bg-red-500/20 text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-sm flex items-center gap-2">
                                    <Phone size={16} /> {selectedClient.phone}
                                </p>
                                {selectedClient.email && (
                                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                                        <Mail size={16} /> {selectedClient.email}
                                    </p>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleSendWhatsApp(selectedClient, 'greeting')}
                                    className="flex items-center justify-center gap-2 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => setShowFollowUpModal(true)}
                                    className="flex items-center justify-center gap-2 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                >
                                    <Calendar size={16} />
                                    Seguimiento
                                </button>
                            </div>

                            {/* Status Update */}
                            <div>
                                <p className="text-zinc-400 text-sm mb-2">Estado</p>
                                <select
                                    value={selectedClient.status}
                                    onChange={e => {
                                        const updated = { ...selectedClient, status: e.target.value as ClientStatus };
                                        onUpdateClient(updated);
                                        setSelectedClient(updated);
                                    }}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    {Object.values(ClientStatus).map(status => (
                                        <option key={status} value={status}>
                                            {t.client_status[status as keyof typeof t.client_status]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Follow-ups */}
                            <div>
                                <p className="text-zinc-400 text-sm mb-2">{t.follow_ups}</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedClient.followUps.length === 0 ? (
                                        <p className="text-zinc-500 text-sm">Sin seguimientos</p>
                                    ) : (
                                        selectedClient.followUps.map(fu => (
                                            <div key={fu.id} className="bg-zinc-800 rounded-lg p-3 text-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span
                                                        className="px-2 py-0.5 rounded text-xs"
                                                        style={{ backgroundColor: brandColor + '20', color: brandColor }}
                                                    >
                                                        {fu.type}
                                                    </span>
                                                    <span className="text-zinc-500 text-xs">
                                                        {new Date(fu.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-300">{fu.notes}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedClient.notes && (
                                <div>
                                    <p className="text-zinc-400 text-sm mb-2">{t.notes}</p>
                                    <p className="text-zinc-300 text-sm bg-zinc-800 rounded-lg p-3">{selectedClient.notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="mx-auto text-zinc-600 mb-3" size={40} />
                            <p className="text-zinc-500">Selecciona un cliente</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">{t.add_client}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.name} *</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.phone} *</label>
                                <input
                                    type="tel"
                                    value={newClient.phone}
                                    onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    placeholder="+52 871 123 4567"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.email}</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    placeholder="cliente@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Interés</label>
                                <select
                                    value={newClient.interest}
                                    onChange={e => setNewClient(prev => ({ ...prev, interest: e.target.value as OperationType }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    {Object.values(OperationType).map(op => (
                                        <option key={op} value={op}>{t.operations[op as keyof typeof t.operations]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">Presupuesto Mín</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <input
                                            type="text"
                                            value={newClient.budgetMin ? newClient.budgetMin.toLocaleString('en-US') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setNewClient(prev => ({ ...prev, budgetMin: value ? parseInt(value) : 0 }));
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-3 text-white placeholder-zinc-500"
                                            placeholder="0,000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">Presupuesto Máx</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <input
                                            type="text"
                                            value={newClient.budgetMax ? newClient.budgetMax.toLocaleString('en-US') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setNewClient(prev => ({ ...prev, budgetMax: value ? parseInt(value) : 0 }));
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-3 text-white placeholder-zinc-500"
                                            placeholder="0,000"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Fuente</label>
                                <select
                                    value={newClient.source}
                                    onChange={e => setNewClient(prev => ({ ...prev, source: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Portal">Portal Inmobiliario</option>
                                    <option value="Referido">Referido</option>
                                    <option value="Letrero">Letrero</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.notes}</label>
                                <textarea
                                    value={newClient.notes}
                                    onChange={e => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    rows={3}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                            <button
                                onClick={handleSaveClient}
                                disabled={!newClient.name || !newClient.phone}
                                className="w-full py-3 rounded-xl font-bold disabled:opacity-50"
                                style={{ backgroundColor: brandColor, color: '#000' }}
                            >
                                {isEditing ? t.save_changes : t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Follow-up Modal */}
            {showFollowUpModal && selectedClient && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-md">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Nuevo Seguimiento</h3>
                            <button onClick={() => setShowFollowUpModal(false)} className="text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Tipo</label>
                                <select
                                    value={newFollowUp.type}
                                    onChange={e => setNewFollowUp(prev => ({ ...prev, type: e.target.value as FollowUp['type'] }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    <option value="LLAMADA">📞 Llamada</option>
                                    <option value="WHATSAPP">💬 WhatsApp</option>
                                    <option value="EMAIL">✉️ Email</option>
                                    <option value="VISITA">🏠 Visita</option>
                                    <option value="OTRO">📝 Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.notes}</label>
                                <textarea
                                    value={newFollowUp.notes}
                                    onChange={e => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    rows={3}
                                    placeholder="¿Qué se habló o acordó?"
                                />
                            </div>
                            <button
                                onClick={handleAddFollowUp}
                                className="w-full py-3 rounded-xl font-bold"
                                style={{ backgroundColor: brandColor, color: '#000' }}
                            >
                                Registrar Seguimiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMView;
