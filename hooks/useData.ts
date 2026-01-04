import React, { useState, useEffect } from 'react';
import {
    getProperties, addProperty, updateProperty, deleteProperty, uploadPropertyImages,
    getClients, addClient, updateClient, deleteClient,
    getAgents, addAgent, updateAgent, deleteAgent,
    getContracts, addContract, deleteContract,
    getSales, addSale,
    getGlobalProperties
} from '../services/supabase';
import { Property, Client, Agent, Contract, Sale, PropertyStatus, ClientStatus, Profile, Agency } from '../types';

export interface UseDataReturn {
    properties: Property[];
    clients: Client[];
    agents: Agent[];
    contracts: Contract[];
    sales: Sale[];
    setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    loadUserData: () => Promise<void>;
    loadPublicData: (globalMode?: boolean) => Promise<void>;
    handleAddProperty: (property: Partial<Property>, onSuccess?: () => void) => Promise<void>;
    handleEditProperty: (property: Property) => Promise<void>;
    handleDeleteProperty: (id: string, confirmMessage: string) => Promise<void>;
    handleAddClient: (client: Partial<Client>) => Promise<void>;
    handleUpdateClient: (client: Client) => Promise<void>;
    handleDeleteClient: (id: string, confirmMessage: string) => Promise<void>;
    handleAddAgent: (agent: Partial<Agent>) => Promise<void>;
    handleUpdateAgent: (agent: Agent) => Promise<void>;
    handleDeleteAgent: (id: string) => Promise<void>;
    handleAddContract: (contract: Partial<Contract>) => Promise<void>;
    handleDeleteContract: (id: string, confirmMessage: string) => Promise<void>;
    handleAddSale: (sale: Sale) => Promise<void>;
    handleToggleFavorite: (property: Property) => Promise<void>;
}

export function useData(
    userId: string | null,
    profile: Profile | null,
    agency: Agency | null,
    isAuthenticated: boolean
): UseDataReturn {
    const [properties, setProperties] = useState<Property[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);

    // Load data when authenticated
    useEffect(() => {
        if (isAuthenticated && userId) {
            loadUserData();
        }
    }, [isAuthenticated, userId, profile?.agencyId]);

    const loadUserData = async () => {
        if (!isAuthenticated || !userId) return;

        try {
            const agencyId = profile?.agencyId;

            const [props, ags, cls, conts, sls] = await Promise.all([
                getProperties(agencyId),
                getAgents(agencyId),
                getClients(agencyId),
                getContracts(agencyId),
                getSales(agencyId)
            ]);

            setProperties(props);
            setAgents(ags);
            setClients(cls);
            setContracts(conts);
            setSales(sls);
            console.log(`✅ Loaded data for agency: ${agencyId || 'Personal'}`);
        } catch (err) {
            console.error('loadData error:', err);
        }
    };

    const loadPublicData = async (globalMode = false) => {
        try {
            if (globalMode) {
                const props = await getGlobalProperties();
                setProperties(props);
            } else {
                const props = await getProperties();
                setProperties(props);
            }
        } catch (err) {
            console.error('loadPublicData error:', err);
        }
    };

    // ============ PROPERTY HANDLERS ============

    const handleAddProperty = async (property: Partial<Property>, onSuccess?: () => void) => {
        try {
            const tempId = `prop_${Date.now()}`;

            let imageUrls: string[] = [];
            if (property.images && property.images.length > 0) {
                console.log(`📸 Uploading ${property.images.length} images to Supabase Storage...`);
                imageUrls = await uploadPropertyImages(property.images, tempId);
                console.log(`✅ Uploaded ${imageUrls.length} images`);
            }

            const newProperty = {
                ...property,
                images: imageUrls.length > 0 ? imageUrls : undefined,
                status: PropertyStatus.DISPONIBLE,
                agentId: userId || undefined,
                agencyId: undefined,
                views: 0,
                favorites: 0
            } as Partial<Property>;

            const savedProperty = await addProperty(newProperty, profile?.agencyId, profile?.branchId, agency?.googleSheetsUrl);

            if (savedProperty) {
                setProperties(prev => [savedProperty, ...prev]);
                console.log('✅ Propiedad guardada y sincronizada con Sheets');
                alert("✅ Propiedad guardada exitosamente.\n\nSerás redirigido al Inventario para verla.");
                if (onSuccess) onSuccess();
            } else {
                alert("Error al guardar la propiedad. Verifica que tu usuario tenga una agencia asignada.");
            }
        } catch (error) {
            console.error('❌ Error al guardar propiedad:', error);
            alert("Ocurrió un error inesperado al guardar la propiedad.");
        }
    };

    const handleEditProperty = async (property: Property) => {
        try {
            const updated = await updateProperty(property, agency?.googleSheetsUrl);
            if (updated) {
                setProperties(prev => prev.map(p => p.id === property.id ? updated : p));
                console.log('✅ Propiedad actualizada en BD y Sheets');
            }
        } catch (error) {
            console.error('❌ Error al editar propiedad:', error);
        }
    };

    const handleDeleteProperty = async (id: string, confirmMessage: string) => {
        if (!confirm(confirmMessage)) return;
        try {
            const success = await deleteProperty(id);
            if (success) {
                setProperties(prev => prev.filter(p => p.id !== id));
                console.log('✅ Propiedad eliminada de BD');
            }
        } catch (error) {
            console.error('❌ Error al eliminar propiedad:', error);
        }
    };

    const handleToggleFavorite = async (property: Property) => {
        const updatedProperty = { ...property, favorites: (property.favorites || 0) + 1 };
        setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
        await updateProperty(updatedProperty);
    };

    // ============ CLIENT HANDLERS ============

    const handleAddClient = async (client: Partial<Client>) => {
        try {
            const clientToSave = {
                ...client,
                agentId: userId || undefined
            };

            const newClient = await addClient(clientToSave, profile?.agencyId, agency?.googleSheetsUrl);
            if (newClient) {
                setClients(prev => [newClient, ...prev]);
                console.log('✅ Cliente guardado en BD');
            }
        } catch (error) {
            console.error('❌ Error al guardar cliente:', error);
            alert('Error al guardar cliente');
        }
    };

    const handleUpdateClient = async (client: Client) => {
        try {
            const updated = await updateClient(client);
            if (updated) {
                setClients(prev => prev.map(c => c.id === client.id ? updated : c));
                console.log('✅ Cliente actualizado en BD');
            }
        } catch (error) {
            console.error('❌ Error al actualizar cliente:', error);
        }
    };

    const handleDeleteClient = async (id: string, confirmMessage: string) => {
        if (!confirm(confirmMessage)) return;
        try {
            const success = await deleteClient(id);
            if (success) {
                setClients(prev => prev.filter(c => c.id !== id));
                console.log('✅ Cliente eliminado de BD');
            }
        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
        }
    };

    // ============ AGENT HANDLERS ============

    const handleAddAgent = async (agent: Partial<Agent>) => {
        const newAgent = await addAgent(agent, profile?.agencyId);
        if (newAgent) {
            setAgents(prev => [...prev, newAgent]);
        }
    };

    const handleUpdateAgent = async (agent: Agent) => {
        const updated = await updateAgent(agent);
        if (updated) {
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
    };

    const handleDeleteAgent = async (id: string) => {
        const success = await deleteAgent(id);
        if (success) {
            setAgents(prev => prev.filter(a => a.id !== id));
        }
    };

    // ============ CONTRACT HANDLERS ============

    const handleAddContract = async (contract: Partial<Contract>) => {
        try {
            const newContract = await addContract(contract, profile?.agencyId);
            if (newContract) {
                setContracts(prev => [newContract, ...prev]);
                console.log('✅ Contrato guardado en BD');
            }
        } catch (error) {
            console.error('❌ Error al guardar contrato:', error);
        }
    };

    const handleDeleteContract = async (id: string, confirmMessage: string) => {
        if (!confirm(confirmMessage)) return;
        try {
            const success = await deleteContract(id);
            if (success) {
                setContracts(prev => prev.filter(c => c.id !== id));
                console.log('✅ Contrato eliminado de BD');
            }
        } catch (error) {
            console.error('❌ Error al eliminar contrato:', error);
        }
    };

    // ============ SALES HANDLERS ============

    const handleAddSale = async (sale: Sale) => {
        try {
            const newSale = await addSale(sale, profile?.agencyId);
            if (newSale) {
                setSales(prev => [newSale, ...prev]);
                console.log('✅ Venta guardada en BD');
            }

            // Update property status
            const property = properties.find(p => p.id === sale.propertyId);
            if (property) {
                const newStatus = sale.type === 'VENTA' ? PropertyStatus.VENDIDA : PropertyStatus.RENTADA;
                const updatedProperty = { ...property, status: newStatus };
                setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
                await updateProperty(updatedProperty);
            }

            // Update client status
            const client = clients.find(c => c.id === sale.clientId);
            if (client) {
                const updatedClient = { ...client, status: ClientStatus.CERRADO };
                setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
                await updateClient(updatedClient);
            }
        } catch (error) {
            console.error('Error handling new sale:', error);
        }
    };

    return {
        properties,
        clients,
        agents,
        contracts,
        sales,
        setProperties,
        setClients,
        setAgents,
        setContracts,
        setSales,
        loadUserData,
        loadPublicData,
        handleAddProperty,
        handleEditProperty,
        handleDeleteProperty,
        handleAddClient,
        handleUpdateClient,
        handleDeleteClient,
        handleAddAgent,
        handleUpdateAgent,
        handleDeleteAgent,
        handleAddContract,
        handleDeleteContract,
        handleAddSale,
        handleToggleFavorite
    };
}
