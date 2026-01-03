import React from 'react';
import { CreditCard, Check, Zap, AlertTriangle, ExternalLink, Shield } from 'lucide-react';
import { AgencyBilling, StripeSubscription } from '../types';
import { stripeService } from '../services/stripeService';

interface BillingViewProps {
    billing: AgencyBilling;
    subscription?: StripeSubscription;
    lang: 'es' | 'en';
    brandColor: string;
}

const BillingView: React.FC<BillingViewProps> = ({ billing, subscription, lang, brandColor }) => {

    // Usage percentage
    const usagePercent = Math.min(100, Math.round((billing.currentMonthTokens / billing.monthlyTokenLimit) * 100));

    // Pricing Config
    // Pricing Config
    // Pricing Config
    const plans = [
        {
            id: 'INDEPENDENT',
            name: lang === 'es' ? 'Agente Pro' : 'Pro Agent',
            price: lang === 'es' ? '$599 MXN' : '$29 USD',
            period: '/mo',
            tokens: '1,000,000 Tokens',
            features: [
                lang === 'es' ? 'Asistente IA 24/7' : '24/7 AI Assistant',
                lang === 'es' ? 'Valuaciones PDF' : 'PDF Valuations',
                lang === 'es' ? 'Computer Vision' : 'Computer Vision',
                lang === 'es' ? 'Soporte Prioritario' : 'Priority Support'
            ],
            color: 'text-amber-400',
            bg: 'bg-amber-400',
            priceId: 'price_agent_pro'
        },
        {
            id: 'AGENCY',
            name: lang === 'es' ? 'Agencia Core' : 'Agency Core',
            price: lang === 'es' ? '$2,499 MXN' : '$125 USD',
            period: '/mo',
            tokens: '5,000,000 Tokens',
            features: [
                lang === 'es' ? 'Equipo hasta 5 agentes' : 'Team up to 5 agents',
                lang === 'es' ? 'Panel de Control' : 'Agency Dashboard',
                lang === 'es' ? 'CRM Integrado' : 'Integrated CRM',
                lang === 'es' ? 'Reportes Personalizados' : 'Custom Reports'
            ],
            color: 'text-blue-400',
            bg: 'bg-blue-400',
            priceId: 'price_agency_core'
        },
        {
            id: 'ENTERPRISE',
            name: lang === 'es' ? 'Enterprise Premium' : 'Enterprise Premium',
            price: lang === 'es' ? '$5,999 MXN' : '$299 USD',
            period: '/mo',
            tokens: lang === 'es' ? 'Tokens Ilimitados*' : 'Unlimited Tokens*',
            features: [
                lang === 'es' ? 'Marca Blanca Total' : 'Full White Label',
                lang === 'es' ? 'Llave API Propia (BYOK)' : 'Own API Key (BYOK)',
                lang === 'es' ? 'Usuarios Ilimitados' : 'Unlimited Users',
                lang === 'es' ? 'Soporte 24/7 Dedicado' : '24/7 Dedicated Support'
            ],
            color: 'text-purple-400',
            bg: 'bg-purple-400',
            priceId: 'price_enterprise_premium'
        }
    ];

    const handleSubscribe = (planName: string, price: string) => {
        const phoneNumber = "528713911135"; // USER phone from context/history
        const message = lang === 'es'
            ? `Hola! Me interesa activar el plan *${planName}* (${price}) en Inmueble IA Pro. ¿Me podrías ayudar con el proceso de pago?`
            : `Hello! I'm interested in activating the *${planName}* plan (${price}) in Inmueble IA Pro. Could you help me with the payment process?`;

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: brandColor + '20' }}
                    >
                        <CreditCard size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {lang === 'es' ? 'FACTURACIÓN Y' : 'BILLING &'} <span style={{ color: brandColor }}>{lang === 'es' ? 'SUSCRIPCIÓN' : 'SUBSCRIPTION'}</span>
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">
                            {lang === 'es' ? 'GESTIONA TU PLAN Y MÉTODOS DE PAGO' : 'MANAGE YOUR PLAN AND PAYMENT METHODS'}
                        </p>
                    </div>
                </div>
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
                                onClick={() => handleSubscribe(plan.name, plan.price)}
                                disabled={billing.plan === plan.id}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
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
