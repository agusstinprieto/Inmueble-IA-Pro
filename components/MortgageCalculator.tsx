
import React, { useState, useMemo } from 'react';
import {
    Calculator,
    DollarSign,
    Percent,
    Calendar,
    TrendingUp,
    Home,
    PiggyBank
} from 'lucide-react';
import { translations } from '../translations';
import { MortgageParams, MortgageResult } from '../types';

interface MortgageCalculatorProps {
    lang: 'es' | 'en';
    brandColor: string;
    defaultPrice?: number;
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
    lang,
    brandColor,
    defaultPrice = 1000000
}) => {
    const t = translations[lang];

    const [params, setParams] = useState<MortgageParams>({
        propertyPrice: defaultPrice,
        downPayment: defaultPrice * 0.2, // 20% default
        interestRate: 11.5, // Average MX rate
        termYears: 20
    });

    // Calculate mortgage
    const result: MortgageResult = useMemo(() => {
        const principal = params.propertyPrice - params.downPayment;
        const monthlyRate = params.interestRate / 100 / 12;
        const numberOfPayments = params.termYears * 12;

        if (principal <= 0 || monthlyRate <= 0 || numberOfPayments <= 0) {
            return {
                monthlyPayment: 0,
                totalPayment: 0,
                totalInterest: 0,
                loanAmount: 0
            };
        }

        // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        const monthlyPayment =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const totalPayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayment - principal;

        return {
            monthlyPayment: Math.round(monthlyPayment),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest),
            loanAmount: principal
        };
    }, [params]);

    // Down payment percentage
    const downPaymentPercent = Math.round((params.downPayment / params.propertyPrice) * 100);

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Quick term options
    const termOptions = [10, 15, 20, 25, 30];

    // Quick down payment percentages
    const downPaymentOptions = [10, 15, 20, 25, 30];

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: brandColor + '20' }}
                >
                    <Calculator size={24} style={{ color: brandColor }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.mortgage_calculator}</h1>
                    <p className="text-zinc-400 text-sm">Simula tu crédito hipotecario</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calculator Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                    {/* Property Price */}
                    <div>
                        <label className="flex items-center gap-2 text-white font-medium mb-3">
                            <Home size={18} style={{ color: brandColor }} />
                            {t.property_price}
                        </label>
                        <input
                            type="range"
                            min={500000}
                            max={50000000}
                            step={100000}
                            value={params.propertyPrice}
                            onChange={e => {
                                const price = parseInt(e.target.value);
                                setParams(prev => ({
                                    ...prev,
                                    propertyPrice: price,
                                    downPayment: Math.round(price * (downPaymentPercent / 100))
                                }));
                            }}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: brandColor }}
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-zinc-500 text-sm">$500k</span>
                            <span className="text-xl font-bold" style={{ color: brandColor }}>
                                {formatCurrency(params.propertyPrice)}
                            </span>
                            <span className="text-zinc-500 text-sm">$50M</span>
                        </div>
                    </div>

                    {/* Down Payment */}
                    <div>
                        <label className="flex items-center gap-2 text-white font-medium mb-3">
                            <PiggyBank size={18} style={{ color: brandColor }} />
                            {t.down_payment} ({downPaymentPercent}%)
                        </label>
                        <div className="flex gap-2 mb-3">
                            {downPaymentOptions.map(pct => (
                                <button
                                    key={pct}
                                    onClick={() => setParams(prev => ({
                                        ...prev,
                                        downPayment: Math.round(prev.propertyPrice * (pct / 100))
                                    }))}
                                    className={`
                    flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${downPaymentPercent === pct
                                            ? 'text-black'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }
                  `}
                                    style={downPaymentPercent === pct ? { backgroundColor: brandColor } : {}}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                        <input
                            type="range"
                            min={params.propertyPrice * 0.05}
                            max={params.propertyPrice * 0.5}
                            step={10000}
                            value={params.downPayment}
                            onChange={e => setParams(prev => ({ ...prev, downPayment: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: brandColor }}
                        />
                        <p className="text-center text-lg font-semibold text-white mt-2">
                            {formatCurrency(params.downPayment)}
                        </p>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <label className="flex items-center gap-2 text-white font-medium mb-3">
                            <Percent size={18} style={{ color: brandColor }} />
                            {t.interest_rate}
                        </label>
                        <input
                            type="range"
                            min={5}
                            max={20}
                            step={0.1}
                            value={params.interestRate}
                            onChange={e => setParams(prev => ({ ...prev, interestRate: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: brandColor }}
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-zinc-500 text-sm">5%</span>
                            <span className="text-xl font-bold" style={{ color: brandColor }}>
                                {params.interestRate.toFixed(1)}%
                            </span>
                            <span className="text-zinc-500 text-sm">20%</span>
                        </div>
                    </div>

                    {/* Loan Term */}
                    <div>
                        <label className="flex items-center gap-2 text-white font-medium mb-3">
                            <Calendar size={18} style={{ color: brandColor }} />
                            {t.loan_term}
                        </label>
                        <div className="flex gap-2">
                            {termOptions.map(years => (
                                <button
                                    key={years}
                                    onClick={() => setParams(prev => ({ ...prev, termYears: years }))}
                                    className={`
                    flex-1 py-3 rounded-lg font-medium transition-all
                    ${params.termYears === years
                                            ? 'text-black'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }
                  `}
                                    style={params.termYears === years ? { backgroundColor: brandColor } : {}}
                                >
                                    {years} años
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    {/* Monthly Payment Card */}
                    <div
                        className="rounded-xl p-6 text-center"
                        style={{ backgroundColor: brandColor + '20', borderColor: brandColor }}
                    >
                        <p className="text-zinc-400 text-sm mb-2">{t.monthly_payment}</p>
                        <p className="text-5xl font-bold" style={{ color: brandColor }}>
                            {formatCurrency(result.monthlyPayment)}
                        </p>
                        <p className="text-zinc-500 text-sm mt-2">por mes</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <DollarSign size={18} />
                                <span className="text-sm">Monto del Crédito</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(result.loanAmount)}
                            </p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <TrendingUp size={18} />
                                <span className="text-sm">{t.total_interest}</span>
                            </div>
                            <p className="text-2xl font-bold text-red-400">
                                {formatCurrency(result.totalInterest)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Calculator size={18} />
                            <span className="text-sm">{t.total_payment}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(result.totalPayment)}
                        </p>
                        <p className="text-zinc-500 text-sm mt-1">
                            En {params.termYears} años ({params.termYears * 12} pagos)
                        </p>
                    </div>

                    {/* Breakdown Visual */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-400 text-sm mb-3">Distribución del Pago Total</p>
                        <div className="h-4 rounded-full overflow-hidden flex">
                            <div
                                className="bg-green-500"
                                style={{ width: `${(params.downPayment / result.totalPayment) * 100}%` }}
                            />
                            <div
                                className="bg-blue-500"
                                style={{ width: `${(result.loanAmount / result.totalPayment) * 100}%` }}
                            />
                            <div
                                className="bg-red-500"
                                style={{ width: `${(result.totalInterest / result.totalPayment) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-sm">
                            <span className="flex items-center gap-2 text-zinc-400">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                Enganche
                            </span>
                            <span className="flex items-center gap-2 text-zinc-400">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                Capital
                            </span>
                            <span className="flex items-center gap-2 text-zinc-400">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                Intereses
                            </span>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-blue-400 font-medium mb-2">💡 Consejos</p>
                        <ul className="text-blue-300 text-sm space-y-1">
                            <li>• Un enganche mayor reduce el pago mensual</li>
                            <li>• Compara tasas entre diferentes bancos</li>
                            <li>• Considera los gastos de escrituración (3-5%)</li>
                            <li>• Revisa si hay comisión por apertura</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MortgageCalculator;
