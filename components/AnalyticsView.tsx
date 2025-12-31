
import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Home,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Activity,
    Target,
    Clock,
    Briefcase
} from 'lucide-react';
import { Property, Client, Sale, Agent } from '../types';
import { translations } from '../translations';

interface AnalyticsViewProps {
    properties: Property[];
    clients: Client[];
    sales: Sale[];
    agents: Agent[];
    lang: 'es' | 'en';
    brandColor: string;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    properties,
    clients,
    sales,
    agents,
    lang,
    brandColor
}) => {
    const t = translations[lang];

    const totalVolume = sales.reduce((acc, s) => acc + s.finalPrice, 0);
    const avgCommission = totalVolume * 0.05;
    const activeListings = properties.length;
    const conversionRate = ((sales.length / (clients.length || 1)) * 100).toFixed(1);

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {lang === 'es' ? 'BUSINESS' : 'BUSINESS'} <br />
                        <span style={{ color: brandColor }}>{lang === 'es' ? 'INTELLIGENCE' : 'INTELLIGENCE'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">{lang === 'es' ? 'Análisis predictivo y métricas de rendimiento' : 'Predictive analysis and performance metrics'}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <Calendar className="text-zinc-500" size={18} />
                    <span className="text-xs font-black text-white uppercase italic">{lang === 'es' ? 'Últimos 30 días' : 'Last 30 days'}</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Volumen Total' : 'Total Volume'}</p>
                            <h3 className="text-2xl font-black text-white mt-2 italic tracking-tighter">${(totalVolume / 1000000).toFixed(1)}M</h3>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px] font-bold">
                                <ArrowUpRight size={12} />
                                <span>+8.4%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <DollarSign className="text-amber-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0"></div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Conversión' : 'Conversion'}</p>
                            <h3 className="text-2xl font-black text-white mt-2 italic tracking-tighter">{conversionRate}%</h3>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px] font-bold">
                                <ArrowUpRight size={12} />
                                <span>+2.1%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Target className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0"></div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Prospectos' : 'Leads'}</p>
                            <h3 className="text-2xl font-black text-white mt-2 italic tracking-tighter">{clients.length}</h3>
                            <div className="flex items-center gap-1 mt-2 text-red-400 text-[10px] font-bold">
                                <ArrowDownRight size={12} />
                                <span>-1.2%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <Users className="text-purple-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/40 to-purple-500/0"></div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-green-500/30 transition-all">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{lang === 'es' ? 'Comisiones' : 'Commissions'}</p>
                            <h3 className="text-2xl font-black text-white mt-2 italic tracking-tighter">${(avgCommission / 1000).toFixed(0)}k</h3>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px] font-bold">
                                <ArrowUpRight size={12} />
                                <span>+14%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <TrendingUp className="text-green-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500/40 to-green-500/0"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart Simulation */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="text-zinc-500" size={20} />
                            <h3 className="text-white font-black italic uppercase tracking-tighter">{lang === 'es' ? 'Crecimiento Operativo' : 'Operational Growth'}</h3>
                        </div>
                        <select className="bg-black border border-zinc-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg focus:outline-none">
                            <option>ANUAL (2024)</option>
                            <option>MENSUAL</option>
                        </select>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 pt-8">
                        {[45, 60, 40, 75, 50, 90, 65, 80, 55, 100, 85, 95].map((val, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div
                                    style={{ height: `${val}%` }}
                                    className={`w-full rounded-t-xl transition-all duration-1000 ${i === 9 ? 'bg-amber-500' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}
                                ></div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-zinc-600 uppercase">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Distribution */}
                <div className="bg-black border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                    <div className="flex items-center gap-3">
                        <PieChart className="text-zinc-500" size={20} />
                        <h3 className="text-white font-black italic uppercase tracking-tighter">{lang === 'es' ? 'Mix de Inventario' : 'Inventory Mix'}</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase italic tracking-widest mb-1">
                                <span className="text-zinc-400">Casas</span>
                                <span className="text-white">65%</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase italic tracking-widest mb-1">
                                <span className="text-zinc-400">Departamentos</span>
                                <span className="text-white">20%</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[20%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase italic tracking-widest mb-1">
                                <span className="text-zinc-400">Terrenos</span>
                                <span className="text-white">10%</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[10%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase italic tracking-widest mb-1">
                                <span className="text-zinc-400">Otros</span>
                                <span className="text-white">5%</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-700 w-[5%] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Activity className="text-purple-500" size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">{lang === 'es' ? 'Liquidez de Mercado' : 'Market Liquidity'}</p>
                                <p className="text-xs font-bold text-white italic">Alta (Velocidad: 45 días)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agents Performance Benchmarking */}
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Briefcase className="text-zinc-500" size={20} />
                        <h3 className="text-white font-black italic uppercase tracking-tighter">{lang === 'es' ? 'Benchmarks por Agente' : 'Agent Benchmarks'}</h3>
                    </div>
                    <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase italic transition-all">{lang === 'es' ? 'Ver Reporte Detallado' : 'View Detailed Report'}</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-zinc-800/50 pb-4">
                                <th className="pb-4 font-black">Agente</th>
                                <th className="pb-4 font-black text-center">Ventas Cerradas</th>
                                <th className="pb-4 text-center font-black">Ticket Promedio</th>
                                <th className="pb-4 text-center font-black">Comisiones Est.</th>
                                <th className="pb-4 text-right font-black">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {agents.map((agent) => (
                                <tr key={agent.id} className="group hover:bg-white/5 transition-all">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-zinc-500 group-hover:text-amber-500 transition-colors">
                                                {agent.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase italic tracking-tighter">{agent.name}</p>
                                                <p className="text-[9px] text-zinc-600 font-bold italic">{agent.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="text-sm font-black text-zinc-300 italic">{sales.filter(s => s.agentId === agent.id).length}</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="text-sm font-black text-zinc-300 italic">$2.5M</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="text-sm font-black text-amber-500 italic">$125,000</span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase italic rounded-full border border-green-500/20">Optimal</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
