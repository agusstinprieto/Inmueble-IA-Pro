
import React, { useState } from 'react';
import {
    FileText,
    Plus,
    Download,
    Eye,
    Trash2,
    Calendar,
    DollarSign,
    User,
    Building2,
    CheckCircle,
    XCircle,
    Edit2,
    X,
    Printer
} from 'lucide-react';
import { translations } from '../../translations';
import { Contract, ContractType, Property, Client } from '../../types';
import {
    PURCHASE_AGREEMENT_TEMPLATE_ES,
    PURCHASE_AGREEMENT_TEMPLATE_EN,
    LEASE_AGREEMENT_TEMPLATE_ES,
    LEASE_AGREEMENT_TEMPLATE_EN,
    PROMISE_AGREEMENT_TEMPLATE_ES,
    PROMISE_AGREEMENT_TEMPLATE_EN
} from './ContractTemplates';

interface ContractsViewProps {
    contracts: Contract[];
    properties: Property[];
    clients: Client[];
    onAddContract: (contract: Partial<Contract>) => void;
    onDeleteContract: (id: string) => void;
    lang: 'es' | 'en';
    brandColor: string;
    businessName: string;
}

const ContractsView: React.FC<ContractsViewProps> = ({
    contracts,
    properties,
    clients,
    onAddContract,
    onDeleteContract,
    lang,
    brandColor,
    businessName
}) => {
    const t = translations[lang];

    const [showModal, setShowModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState<Partial<Contract>>({
        type: ContractType.COMPRAVENTA,
        propertyId: '',
        clientId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amount: 0,
        deposit: 0,
        terms: PURCHASE_AGREEMENT_TEMPLATE_ES,
        signed: false
    });

    React.useEffect(() => {
        const property = properties.find(p => p.id === formData.propertyId);
        const isUSA = property?.address?.country === 'USA';

        let template = '';

        switch (formData.type) {
            case ContractType.COMPRAVENTA:
                template = isUSA ? PURCHASE_AGREEMENT_TEMPLATE_EN : PURCHASE_AGREEMENT_TEMPLATE_ES;
                break;
            case ContractType.ARRENDAMIENTO:
                template = isUSA ? LEASE_AGREEMENT_TEMPLATE_EN : LEASE_AGREEMENT_TEMPLATE_ES;
                break;
            case ContractType.PROMESA:
                template = isUSA ? PROMISE_AGREEMENT_TEMPLATE_EN : PROMISE_AGREEMENT_TEMPLATE_ES;
                break;
        }

        // Only update if terms are empty or if we are switching templates basically (logic simplifies to: if we have a template and (terms empty or property changed so might need lang switch))
        // Actually, simpler logic: if terms is empty OR if the specific type was just selected (handled by dependency).
        // Safest approach: Update if terms matches one of the defaults (meaning user hasn't customized) or is empty.
        // For now, let's keep it simple: If empty or we detect a country switch logic might be needed.
        // Let's just update if terms is empty.
        if (!formData.terms || formData.terms === '') {
            setFormData(prev => ({ ...prev, terms: template }));
        } else if (property) {
            // If property exists, enforce the correct language template if the current text matches the WRONG language template
            // (e.g. user selected Mexico property but had English template loaded).
            // This is a bit complex to regex, so we'll just force update if it matches the 'other' language default.
            const otherLangTemplate = isUSA ? PURCHASE_AGREEMENT_TEMPLATE_ES : PURCHASE_AGREEMENT_TEMPLATE_EN; // Simplified for Compraventa check
            // This is getting complicated. Let's just trust the "empty" check for now, and rely on the user clearing it if they change properties across borders, 
            // OR we can force it if the user switches property.
            // Let's just set it if it's empty, OR if the propertyId changed in the dependency array.
            // Actually, if I switch properties, I probably want the template to update.
            setFormData(prev => ({ ...prev, terms: template }));
        }
    }, [formData.type, formData.propertyId, properties]);

    // Contract type labels
    const typeLabels: Record<ContractType, { label: string; icon: string }> = {
        [ContractType.COMPRAVENTA]: { label: 'Compraventa', icon: '🏠' },
        [ContractType.ARRENDAMIENTO]: { label: 'Arrendamiento', icon: '🔑' },
        [ContractType.PROMESA]: { label: 'Promesa', icon: '📋' }
    };

    // Get property/client by ID
    const getProperty = (id: string) => properties.find(p => p.id === id);
    const getClient = (id: string) => clients.find(c => c.id === id);

    // Create contract
    const handleCreateContract = () => {
        const contract: Partial<Contract> = {
            ...formData,
            id: `contract_${Date.now()}`,
            agentId: '', // Set by parent
            dateCreated: new Date().toISOString()
        };
        onAddContract(contract);
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            type: ContractType.COMPRAVENTA,
            propertyId: '',
            clientId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            amount: 0,
            deposit: 0,
            terms: PURCHASE_AGREEMENT_TEMPLATE_ES,
            signed: false
        });
    };

    // Generate PDF (placeholder)
    const generatePDF = (contract: Contract) => {
        const property = getProperty(contract.propertyId);
        const client = getClient(contract.clientId);

        // In production, use jsPDF or similar
        const content = `
CONTRATO DE ${typeLabels[contract.type].label.toUpperCase()}

${businessName}
Fecha: ${new Date(contract.dateCreated).toLocaleDateString()}

PROPIEDAD: ${property?.title || 'N/A'}
DIRECCIÓN: ${property?.address?.colony}, ${property?.address?.city}

CLIENTE: ${client?.name || 'N/A'}
TELÉFONO: ${client?.phone || 'N/A'}

MONTO: $${contract.amount?.toLocaleString()}
DEPÓSITO: $${contract.deposit?.toLocaleString() || '0'}

VIGENCIA: ${new Date(contract.startDate).toLocaleDateString()} - ${contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Indefinido'}

TÉRMINOS Y CONDICIONES:
${contract.terms || 'Términos estándar aplican.'}

_____________________________
Firma del Cliente

_____________________________
Firma del Representante
    `;

        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato_${contract.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
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
                        <FileText size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            GENERADOR DE <span style={{ color: brandColor }}>CONTRATOS</span>
                        </h1>
                        <p className="text-zinc-500 font-bold italic uppercase tracking-widest">
                            {lang === 'es' ? 'GESTIÓN DE DOCUMENTOS LEGALES' : 'LEGAL DOCUMENT MANAGEMENT'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: brandColor, color: '#000' }}
                >
                    <Plus size={20} />
                    {t.new_contract}
                </button>
            </div>

            {/* Contract Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Object.entries(typeLabels).map(([type, { label, icon }]) => (
                    <div
                        key={type}
                        onClick={() => {
                            let defaultTemplate = '';
                            switch (type as ContractType) {
                                case ContractType.COMPRAVENTA: defaultTemplate = PURCHASE_AGREEMENT_TEMPLATE_ES; break;
                                case ContractType.ARRENDAMIENTO: defaultTemplate = LEASE_AGREEMENT_TEMPLATE_ES; break;
                                case ContractType.PROMESA: defaultTemplate = PROMISE_AGREEMENT_TEMPLATE_ES; break;
                            }

                            setFormData(prev => ({
                                ...prev,
                                type: type as ContractType,
                                terms: defaultTemplate
                            }));
                            setShowModal(true);
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 cursor-pointer hover:border-zinc-600 transition-all"
                    >
                        <span className="text-4xl">{icon}</span>
                        <h3 className="text-white font-semibold mt-3">{label}</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            {type === ContractType.COMPRAVENTA && 'Para operaciones de venta'}
                            {type === ContractType.ARRENDAMIENTO && 'Para rentas mensuales'}
                            {type === ContractType.PROMESA && 'Acuerdo preliminar'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Contracts List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white uppercase">Contratos Generados</h2>
                </div>

                {contracts.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="mx-auto text-zinc-600 mb-3" size={48} />
                        <p className="text-zinc-400">No hay contratos generados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {contracts.map(contract => {
                            const property = getProperty(contract.propertyId);
                            const client = getClient(contract.clientId);

                            return (
                                <div key={contract.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-800/50 gap-4">
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl mt-1 sm:mt-0">{typeLabels[contract.type].icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium">{typeLabels[contract.type].label}</h3>
                                                {contract.signed ? (
                                                    <CheckCircle className="text-green-400" size={16} />
                                                ) : (
                                                    <XCircle className="text-zinc-500" size={16} />
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-sm mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Building2 size={14} /> {property?.title || 'Propiedad'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User size={14} /> {client?.name || 'Cliente'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={14} /> ${contract.amount?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedContract(contract);
                                                setShowPreview(true);
                                            }}
                                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => generatePDF(contract)}
                                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteContract(contract.id)}
                                            className="p-2 bg-zinc-800 rounded-lg hover:bg-red-500/20 text-red-400"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">{t.new_contract}</h3>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Tipo de Contrato</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ContractType }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    {Object.entries(typeLabels).map(([type, { label }]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Propiedad *</label>
                                <select
                                    value={formData.propertyId}
                                    onChange={e => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    <option value="">Seleccionar propiedad...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">Cliente *</label>
                                <select
                                    value={formData.clientId}
                                    onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">{t.start_date}</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">{t.end_date}</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">Monto *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <input
                                            type="text"
                                            value={formData.amount ? formData.amount.toLocaleString('en-US') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setFormData(prev => ({ ...prev, amount: value ? parseInt(value) : 0 }));
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-3 text-white placeholder-zinc-500"
                                            placeholder="0,000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1">{t.deposit}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <input
                                            type="text"
                                            value={formData.deposit ? formData.deposit.toLocaleString('en-US') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setFormData(prev => ({ ...prev, deposit: value ? parseInt(value) : 0 }));
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-3 text-white placeholder-zinc-500"
                                            placeholder="0,000"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-1">{t.contract_terms}</label>
                                <textarea
                                    value={formData.terms}
                                    onChange={e => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                    rows={4}
                                    placeholder="Términos y condiciones adicionales..."
                                />
                            </div>
                            <button
                                onClick={handleCreateContract}
                                disabled={!formData.propertyId || !formData.clientId || !formData.amount}
                                className="w-full py-3 rounded-xl font-bold disabled:opacity-50"
                                style={{ backgroundColor: brandColor, color: '#000' }}
                            >
                                Generar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && selectedContract && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-black">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">CONTRATO DE {typeLabels[selectedContract.type].label.toUpperCase()}</h2>
                                <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-black">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="border-b-2 border-black pb-4 mb-4">
                                <h3 className="font-bold text-lg">{businessName}</h3>
                                <p className="text-gray-600">Fecha: {new Date(selectedContract.dateCreated).toLocaleDateString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-semibold text-gray-600 mb-2">PROPIEDAD</h4>
                                    <p className="font-medium">{getProperty(selectedContract.propertyId)?.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {getProperty(selectedContract.propertyId)?.address?.colony},
                                        {getProperty(selectedContract.propertyId)?.address?.city}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600 mb-2">CLIENTE</h4>
                                    <p className="font-medium">{getClient(selectedContract.clientId)?.name}</p>
                                    <p className="text-sm text-gray-600">{getClient(selectedContract.clientId)?.phone}</p>
                                </div>
                            </div>

                            <div className="bg-gray-100 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-gray-500 text-sm">MONTO</p>
                                        <p className="text-xl font-bold">${selectedContract.amount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">DEPÓSITO</p>
                                        <p className="text-xl font-bold">${selectedContract.deposit?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">VIGENCIA</p>
                                        <p className="text-sm font-medium">
                                            {new Date(selectedContract.startDate).toLocaleDateString()} -<br />
                                            {selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString() : 'Indefinido'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedContract.terms && (
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-2">TÉRMINOS Y CONDICIONES</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContract.terms}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
                                <div className="text-center">
                                    <div className="border-b border-black mb-2 h-16"></div>
                                    <p className="text-sm text-gray-600">Firma del Cliente</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-black mb-2 h-16"></div>
                                    <p className="text-sm text-gray-600">Firma del Representante</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => generatePDF(selectedContract)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-semibold"
                                >
                                    <Download size={20} />
                                    Descargar
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-900 rounded-xl font-semibold"
                                >
                                    <Printer size={20} />
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsView;
