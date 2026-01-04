import React from 'react';
import { AlertTriangle, TrendingUp, X, ArrowUpCircle } from 'lucide-react';

interface UsageLimitAlertProps {
    featureName: string;
    current: number;
    limit: number;
    percentage: number;
    onClose?: () => void;
    onUpgrade?: () => void;
}

export default function UsageLimitAlert({
    featureName,
    current,
    limit,
    percentage,
    onClose,
    onUpgrade
}: UsageLimitAlertProps) {
    const isLimitReached = percentage >= 100;
    const isApproaching = percentage >= 80 && percentage < 100;

    if (!isApproaching && !isLimitReached) {
        return null;
    }

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-md ${isLimitReached ? 'animate-pulse' : ''}`}>
            <div className={`rounded-xl border p-4 shadow-2xl backdrop-blur-lg ${isLimitReached
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isLimitReached ? (
                            <AlertTriangle className="text-red-500" size={24} />
                        ) : (
                            <TrendingUp className="text-amber-500" size={24} />
                        )}
                        <h3 className={`font-bold ${isLimitReached ? 'text-red-500' : 'text-amber-500'
                            }`}>
                            {isLimitReached ? '🚨 Límite Alcanzado' : '⚠️ Cerca del Límite'}
                        </h3>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-white text-sm mb-2">
                        {isLimitReached ? (
                            <>Has alcanzado el límite mensual de <strong>{featureName}</strong>.</>
                        ) : (
                            <>Estás usando el <strong>{percentage}%</strong> de tu límite de <strong>{featureName}</strong>.</>
                        )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{current} / {limit} usados este mes</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mt-3">
                        <div
                            className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {onUpgrade && (
                        <button
                            onClick={onUpgrade}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isLimitReached
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-black'
                                }`}
                        >
                            <ArrowUpCircle size={16} />
                            Actualizar Plan
                        </button>
                    )}
                    {!isLimitReached && onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-sm transition-all"
                        >
                            Entendido
                        </button>
                    )}
                </div>

                {isLimitReached && (
                    <p className="text-xs text-zinc-500 mt-3 text-center">
                        No podrás usar esta función hasta que actualices tu plan o el próximo mes.
                    </p>
                )}
            </div>
        </div>
    );
}
