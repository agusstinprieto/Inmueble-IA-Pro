
import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Sale, Property, Client, OperationType } from '../types';
import { translations } from '../translations';

interface SalesViewProps {
  sales: Sale[];
  properties: Property[];
  clients: Client[];
  lang: 'es' | 'en';
  brandColor: string;
  businessName: string;
  onAddSale?: (sale: any) => Promise<void>;
}

const SalesView: React.FC<SalesViewProps> = ({
  sales,
  properties,
  clients,
  lang,
  brandColor,
  businessName,
  onAddSale
}) => {
  const t = translations[lang];
  const [filterType, setFilterType] = useState<'ALL' | 'VENTA' | 'RENTA'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const totalSales = sales.reduce((acc, sale) => acc + sale.finalPrice, 0);
  const salesCount = sales.filter(s => s.type === OperationType.VENTA).length;
  const rentalsCount = sales.filter(s => s.type === OperationType.RENTA).length;
  const avgComission = sales.reduce((acc, sale) => acc + (sale.commission || 0), 0) / (sales.length || 1);

  const filteredSales = sales.filter(sale => {
    const matchesFilter = filterType === 'ALL' || sale.type === filterType;
    const property = properties.find(p => p.id === sale.propertyId);
    const client = clients.find(c => c.id === sale.clientId);
    const matchesSearch =
      (property?.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: lang === 'es' ? 'MXN' : 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    if (sales.length === 0) {
      alert(lang === 'es' ? 'No hay datos para exportar' : 'No data to export');
      return;
    }

    const headers = ['ID', 'Fecha', 'Propiedad', 'Cliente', 'Tipo', 'Precio', 'Comision'];
    const csvContent = [
      headers.join(','),
      ...sales.map(sale => {
        const property = properties.find(p => p.id === sale.propertyId);
        const client = clients.find(c => c.id === sale.clientId);
        return [
          sale.id,
          new Date(sale.id.startsWith('sale_') ? parseInt(sale.id.split('_')[1]) : Date.now()).toLocaleDateString(),
          `"${property?.title || 'Unknown'}"`,
          `"${client?.name || 'Unknown'}"`,
          sale.type,
          sale.finalPrice,
          sale.commission
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ventas_cerradas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onAddSale) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Find linked entities
    const propertyId = formData.get('propertyId') as string;
    const property = properties.find(p => p.id === propertyId);
    const clientId = formData.get('clientId') as string;

    const newSale = {
      propertyId,
      clientId,
      agentId: property?.agentId || 'agustin', // Fallback
      type: property?.operation || OperationType.VENTA,
      finalPrice: Number(formData.get('price')),
      commission: Number(formData.get('commission')),
    };

    await onAddSale(newSale);

    setIsSubmitting(false);
    setShowAddModal(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            {lang === 'es' ? 'MOVIMIENTOS' : 'TRANSACTIONS'} <span style={{ color: brandColor }}>{lang === 'es' ? 'CERRADOS' : 'CLOSED'}</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{lang === 'es' ? 'Historial de ventas y rentas finalizadas' : 'History of completed sales and rentals'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm font-bold border border-zinc-700"
          >
            <Download size={18} />
            {lang === 'es' ? 'Exportar' : 'Export'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: brandColor }}
            className="flex items-center gap-2 px-5 py-2.5 text-black rounded-xl transition-all font-black text-sm uppercase italic active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            {lang === 'es' ? 'Nuevo Cierre' : 'New Closing'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full -translate-y-12 translate-x-12 group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{lang === 'es' ? 'Volumen Total' : 'Total Volume'}</p>
              <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(totalSales)}</h3>
              <div className="flex items-center gap-1 mt-2 text-green-400 text-xs font-bold">
                <ArrowUpRight size={14} />
                <span>+12.5% {lang === 'es' ? 'este mes' : 'this month'}</span>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <TrendingUp className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{lang === 'es' ? 'Comisiones' : 'Commissions'}</p>
              <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(totalSales * 0.05)}</h3>
              <p className="text-zinc-600 text-[10px] mt-1 italic uppercase tracking-tighter">Promedio: 5.0%</p>
            </div>
            <div className="p-3 bg-zinc-800 rounded-xl">
              <DollarSign className="text-zinc-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{lang === 'es' ? 'Ventas' : 'Sales'}</p>
              <h3 className="text-2xl font-black text-white mt-2">{salesCount}</h3>
              <p className="text-zinc-600 text-[10px] mt-1 italic uppercase tracking-tighter">Unidades cerradas</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Home className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{lang === 'es' ? 'Rentas' : 'Rentals'}</p>
              <h3 className="text-2xl font-black text-white mt-2">{rentalsCount}</h3>
              <p className="text-zinc-600 text-[10px] mt-1 italic uppercase tracking-tighter">Contratos activos</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Calendar className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50">
        <div className="flex items-center gap-2 p-1 bg-black rounded-xl border border-zinc-800 w-full md:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {lang === 'es' ? 'Todos' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('VENTA')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'VENTA' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {lang === 'es' ? 'Ventas' : 'Sales'}
          </button>
          <button
            onClick={() => setFilterType('RENTA')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'RENTA' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {lang === 'es' ? 'Rentas' : 'Rentals'}
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder={lang === 'es' ? 'Buscar por propiedad o cliente...' : 'Search by property or client...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-black/40">
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Fecha' : 'Date'}</th>
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Propiedad' : 'Property'}</th>
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Cliente' : 'Client'}</th>
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Tipo' : 'Type'}</th>
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Precio Final' : 'Final Price'}</th>
                <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'es' ? 'Status' : 'Status'}</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? filteredSales.map((sale) => {
                const property = properties.find(p => p.id === sale.propertyId);
                const client = clients.find(c => c.id === sale.clientId);
                return (
                  <tr key={sale.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar size={14} />
                        {new Date(sale.dateClosed).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">{property?.title || 'Propiedad Desconocida'}</p>
                        <p className="text-xs text-zinc-500 italic mt-0.5">{property?.address.city}, {property?.type}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                          {client?.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-zinc-300">{client?.name || 'Cliente'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm ${sale.type === OperationType.VENTA
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                        {sale.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-white">{formatCurrency(sale.finalPrice)}</p>
                      <p className="text-[10px] text-green-500 font-bold mt-0.5">+{formatCurrency(sale.finalPrice * 0.05)} COM</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold italic">
                        <CheckCircle2 size={14} />
                        COMPLETADO
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="w-10 h-10 text-zinc-800" />
                      <div>
                        <p className="text-zinc-400 font-bold">{lang === 'es' ? 'No hay cierres registrados' : 'No closed deals found'}</p>
                        <p className="text-zinc-600 text-sm">{lang === 'es' ? 'Vuelve a revisar tus filtros de búsqueda' : 'Check your search filters again'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-800">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white uppercase italic mb-6">
                {lang === 'es' ? 'Registrar Nuevo Cierre' : 'Register New Closing'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Propiedad</label>
                  <select name="propertyId" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                    <option value="">Seleccionar Propiedad</option>
                    {properties.filter(p => p.status === 'DISPONIBLE').map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.operation})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Cliente</label>
                  <select name="clientId" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Precio Final</label>
                    <input name="price" type="number" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Comisión Generada</label>
                    <input name="commission" type="number" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="0.00" />
                  </div>
                </div>

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
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-semibold text-black"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? 'Guardando...' : 'Registrar Cierre'}
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

export default SalesView;
