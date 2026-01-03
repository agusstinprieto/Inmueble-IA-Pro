import React from 'react';
import { CreditCard, Check, Zap, AlertTriangle, ExternalLink, Shield } from 'lucide-react';
import { AgencyBilling, StripeSubscription } from '../types';
import { stripeService } from '../services/stripeService';

interface BillingViewProps {
    billing: AgencyBilling;
    subscription?: StripeSubscription;
    lang: 'es' | 'en';
}

const BillingView: React.FC<BillingViewProps> = ({ billing, subscription, lang }) => {

    // Usage percentage
    const usagePercent = Math.min(100, Math.round((billing.currentMonthTokens / billing.monthlyTokenLimit) * 100));

    // Pricing Config
    // Pricing Config
    // Pricing Config
    const plans = [
        {
            id: 'INDEPENDENT',
            name: lang === 'es' ? 'Agente Independiente' : 'Independent Agent',
            price: lang === 'es' ? '$599 MXN' : '$29 USD',
            period: '/mo',
            tokens: '1,000,000 Tokens',
            features: [
                lang === 'es' ? 'Asistente IA 24/7' : '24/7 AI Assistant',
                lang === 'es' ? 'Computer Vision (Fotos)' : 'Computer Vision',
                lang === 'es' ? 'Generador de Anuncios' : 'Ad Generator',
                lang === 'es' ? 'Soporte Prioritario' : 'Priority Support'
            ],
            color: 'text-amber-400',
            bg: 'bg-amber-400',
            priceId: 'price_independent_monthly'
        },
        {
            id: 'AGENCY',
            name: lang === 'es' ? 'Agencia Inmobiliaria' : 'Real Estate Agency',
            price: lang === 'es' ? '$3,000 MXN' : '$149 USD',
            period: '/mo',
            tokens: lang === 'es' ? 'Tokens Ilimitados*' : 'Unlimited Tokens*',
            features: [
                lang === 'es' ? 'Multi-Agente (Hasta 10)' : 'Multi-Agent (Up to 10)',
                lang === 'es' ? 'Panel Administrativo' : 'Admin Dashboard',
                lang === 'es' ? 'Llave API Propia (BYOK)' : 'Own API Key (BYOK)',
                lang === 'es' ? 'Marca Blanca Total' : 'Full White Label'
            ],
            color: 'text-purple-400',
            bg: 'bg-purple-400',
            priceId: 'price_agency_monthly'
        }
    ];

    const handleSubscribe = async (priceId: string) => {
        try {
            await stripeService.createCheckoutSession(priceId, billing.agencyId);
        } catch (error) {
            console.error('Billing error:', error);
            alert('Error al iniciar el pago.');
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-amber-500" />
                    {lang === 'es' ? 'Facturación y Suscripción' : 'Billing & Subscription'}
                </h1>
                <p className="text-zinc-400">
                    {lang === 'es'
                        ? 'Gestiona tu plan, métodos de pago y descarga facturas.'
                        : 'Manage your plan, payment methods and download invoices.'}
                </p>
            </div>

            {/* Current Plan & Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Plan Status */}
                <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">
                        {lang === 'es' ? 'PLAN ACTUAL' : 'CURRENT PLAN'}
                    </h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className={`text-4xl font-black ${billing.plan === 'PRO' ? 'text-amber-400' : 'text-white'}`}>
                            {billing.plan}
                        </span>
                        {billing.status === 'ACTIVE' && (
                            <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full mb-2 font-medium border border-green-500/20">
                                {lang === 'es' ? 'ACTIVO' : 'ACTIVE'}
                            </span>
                        )}
                    </div>
                    {billing.customApiKey && (
                        <div className="flex items-center gap-2 mt-4 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 text-xs font-medium">BYOK Habilitado</span>
                        </div>
                    )}
                </div>

                {/* Token Usage */}
                <div className="md:col-span-2 bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Zap className="w-32 h-32 text-white" />
                    </div>

                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4 flex justify-between">
                        <span>{lang === 'es' ? 'CONSUMO DE TOKENS' : 'TOKEN USAGE'}</span>
                        <span className="text-white">{billing.currentMonthTokens.toLocaleString()} / {billing.monthlyTokenLimit.toLocaleString()}</span>
                    </h3>

                    <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full ${usagePercent > 80 ? 'bg-red-500' : 'bg-amber-500'} transition-all duration-1000 ease-out`}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>

                    <p className="text-xs text-zinc-500 mt-2">
                        {usagePercent > 80 && (
                            <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {lang === 'es' ? 'Estás cerca de tu límite mensual.' : 'You are reaching your monthly limit.'}
                            </span>
                        )}
                        {!billing.customApiKey && usagePercent < 80 && (
                            lang === 'es' ? 'Se restablece el día 1 del próximo mes.' : 'Resets on the 1st of next month.'
                        )}
                    </p>
                </div>
            </div>

            {/* Upgrade Options */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6">
                    {lang === 'es' ? 'Planes Disponibles' : 'Available Plans'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative bg-zinc-900 border ${billing.plan === plan.id ? 'border-amber-500 ring-1 ring-amber-500' : 'border-zinc-700'} rounded-2xl p-6 transition-all hover:border-zinc-500 flex flex-col`}>
                            {billing.plan === plan.id && (
                                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                    PLAN ACTUAL
                                </div>
                            )}

                            <h3 className={`text-xl font-bold ${plan.color} mb-2`}>{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black text-white">{plan.price}</span>
                                <span className="text-zinc-500 text-sm">{plan.period}</span>
                            </div>

                            <div className="space-y-3 mb-8 flex-1">
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                    <Zap className="w-4 h-4 text-white" />
                                    <span className="text-white font-medium text-sm">{plan.tokens}</span>
                                </div>
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-zinc-300 text-sm">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan.priceId)}
                                disabled={billing.plan === plan.id}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                    ${billing.plan === plan.id
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02]'}`}
                            >
                                {billing.plan === plan.id
                                    ? (lang === 'es' ? 'Plan Activo' : 'Current Plan')
                                    : (lang === 'es' ? 'Seleccionar Plan' : 'Select Plan')
                                }
                                {billing.plan !== plan.id && <ExternalLink className="w-4 h-4" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center pt-8 border-t border-zinc-800">
                <p className="text-zinc-600 text-xs">
                    Protected by Stripe. TLS 256-bit encryption. <br />
                    {lang === 'es' ? '¿Necesitas ayuda con tu facturación?' : 'Need help with billing?'}
                    <a href="#" className="ml-1 text-amber-500 hover:underline">Contactar Soporte</a>
                </p>
            </div>

        </div>
    );
};

export default BillingView;
