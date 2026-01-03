import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsageStats, UsageStats, isApproachingLimit, isLimitReached } from '../services/usageLimits';
import { Camera, FileText, Mic, FileSignature, TrendingUp, AlertTriangle, CheckCircle, ArrowUpCircle } from 'lucide-react';

export default function UsageDashboardView() {
    const { user, agencyId } = useAuth();
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const lang = 'es'; // TODO: Get from context

    useEffect(() => {
        loadUsageStats();
    }, [agencyId]);

    const loadUsageStats = async () => {
        if (!agencyId) return;

        try {
            setLoading(true);
            const data = await getUsageStats(agencyId);
            setStats(data);
        } catch (error) {
            console.error('Error loading usage stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFeatureIcon = (feature: string) => {
        switch (feature) {
            case 'propertyAnalysis': return <Camera className="text-blue-500" size={24} />;
            case 'adGeneration': return <FileText className="text-green-500" size={24} />;
            case 'voiceQueries': return <Mic className="text-purple-500" size={24} />;
            case 'contracts': return <FileSignature className="text-amber-500" size={24} />;
            default: return null;
        }
    };

    const getFeatureName = (feature: string) => {
        const names: Record<string, string> = {
            propertyAnalysis: 'Análisis de Propiedades',
            adGeneration: 'Generación de Anuncios',
            voiceQueries: 'Consultas de Voz',
            contracts: 'Generación de Contratos'
        };
        return names[feature] || feature;
    };

    const getProgressColor = (percentage: number) => {
        if (isLimitReached(percentage)) return 'bg-red-500';
        if (isApproachingLimit(percentage)) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getStatusIcon = (percentage: number) => {
        if (isLimitReached(percentage)) return <AlertTriangle className="text-red-500" size={20} />;
        if (isApproachingLimit(percentage)) return <TrendingUp className="text-amber-500" size={20} />;
        return <CheckCircle className="text-green-500" size={20} />;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-white">Cargando estadísticas...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-6">
                <div className="text-white">No se pudieron cargar las estadísticas de uso.</div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                        Uso de <span className="text-amber-500">Recursos</span>
                    </h1>
                    <p className="text-zinc-400">
                        Monitorea tu consumo mensual de IA y funciones premium.
                    </p>
                </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-zinc-400 text-sm mb-1">Plan Actual</p>
                        <h2 className="text-2xl font-black text-white">{stats.tierDisplayName}</h2>
                    </div>
                    <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                        <ArrowUpCircle size={20} />
                        Actualizar Plan
                    </button>
                </div>
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(stats.features).map(([feature, data]) => {
                    const isUnlimited = data.limit === -1;
                    const percentage = data.percentage;

                    return (
                        <div
                            key={feature}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getFeatureIcon(feature)}
                                    <div>
                                        <h3 className="text-white font-bold">{getFeatureName(feature)}</h3>
                                        <p className="text-zinc-500 text-sm">
                                            {isUnlimited ? 'Ilimitado' : `${data.current} / ${data.limit} este mes`}
                                        </p>
                                    </div>
                                </div>
                                {!isUnlimited && getStatusIcon(percentage)}
                            </div>

                            {/* Progress Bar */}
                            {!isUnlimited && (
                                <div>
                                    <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressColor(percentage)} transition-all duration-500`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-zinc-500">
                                            {percentage}% usado
                                        </span>
                                        {isApproachingLimit(percentage) && !isLimitReached(percentage) && (
                                            <span className="text-xs text-amber-500 font-semibold">
                                                ⚠️ Cerca del límite
                                            </span>
                                        )}
                                        {isLimitReached(percentage) && (
                                            <span className="text-xs text-red-500 font-semibold">
                                                🚨 Límite alcanzado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isUnlimited && (
                                <div className="text-center py-2">
                                    <span className="text-green-500 font-semibold text-sm">
                                        ✨ Sin límites en este plan
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upgrade Suggestion */}
            {Object.values(stats.features).some(f => f.percentage >= 80 && f.limit !== -1) && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <TrendingUp className="text-blue-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold mb-2">
                                💡 Considera actualizar tu plan
                            </h3>
                            <p className="text-zinc-300 text-sm mb-4">
                                Estás usando tu plan al máximo. Actualiza para obtener más recursos y desbloquear funciones premium.
                            </p>
                            <a
                                href="/pricing.html"
                                target="_blank"
                                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                            >
                                Ver Planes
                                <ArrowUpCircle size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-3">ℹ️ Información</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                    <li>• Los límites se reinician el primer día de cada mes</li>
                    <li>• Puedes comprar créditos adicionales si necesitas más recursos</li>
                    <li>• Los planes Enterprise tienen recursos ilimitados</li>
                    <li>• Contacta a soporte para personalizar tu plan</li>
                </ul>
            </div>
        </div>
    );
}
