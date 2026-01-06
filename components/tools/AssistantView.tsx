import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, X, Send, Volume2, VolumeX, Copy, Download } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AssistantViewProps {
    lang: 'es' | 'en';
    userName?: string;
    agencyName?: string;
}

const AssistantView: React.FC<AssistantViewProps> = ({ lang, userName, agencyName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isHandsFree, setIsHandsFree] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const t = {
        es: {
            title: agencyName ? `Asistente de ${agencyName}` : 'Asesor de Bienes Raíces',
            placeholder: 'Escribe o habla...',
            listening: 'Escuchando...',
            thinking: 'Pensando...',
            handsFreeOn: 'Manos libres activado',
            handsFreeOff: 'Manos libres desactivado'
        },
        en: {
            title: agencyName ? `${agencyName} Assistant` : 'Real Estate Agent',
            placeholder: 'Type or speak...',
            listening: 'Listening...',
            thinking: 'Thinking...',
            handsFreeOn: 'Hands-free on',
            handsFreeOff: 'Hands-free off'
        }
    };

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = lang === 'es' ? 'es-MX' : 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                setIsListening(false);
                handleSendMessage(transcript, true); // True indicates voice input
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                // Restart if hands-free and not a critical error
                if (isHandsFree && event.error !== 'not-allowed') {
                    setTimeout(() => {
                        if (isHandsFree && !isSpeaking && !isThinking && isOpen) {
                            try { recognitionRef.current.start(); setIsListening(true); } catch (e) { }
                        }
                    }, 1000);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [lang]);

    // Centralized Mic Orchestrator for Hands-Free Mode
    useEffect(() => {
        let timer: any;
        if (isHandsFree && isOpen && !isSpeaking && !isThinking && !isListening) {
            timer = setTimeout(() => {
                try {
                    recognitionRef.current?.start();
                    setIsListening(true);
                } catch (e) {
                    // Silently fail if already started
                }
            }, 500);
        }
        return () => clearTimeout(timer);
    }, [isHandsFree, isSpeaking, isThinking, isListening, isOpen]);

    // Welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeText = lang === 'es'
                ? `Hola, soy tu asesor en bienes raíces. ¿En qué te puedo ayudar?`
                : `Hi, I'm your real estate advisor. How can I help you?`;

            setMessages([{
                role: 'assistant',
                content: welcomeText,
                timestamp: new Date()
            }]);
        }
    }, [lang]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            setIsHandsFree(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setIsHandsFree(true);
            } catch (e) {
                console.error('Recognition start error:', e);
            }
        }
    };

    // State for voice selection
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Initialize voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Filter by current language
            const targetLang = lang === 'es' ? 'es' : 'en';
            const filtered = voices.filter(v =>
                v.lang.toLowerCase().startsWith(targetLang)
            );
            setAvailableVoices(filtered);

            if (filtered.length > 0 && !selectedVoice) {
                // Prioritize Google or Premium voices as requested
                const preferredVoice = filtered.find(v =>
                    v.name.includes('Google') ||
                    v.name.includes('Premium') ||
                    v.name.includes('Sabina')
                );
                setSelectedVoice(preferredVoice || filtered[0]);
            }
        };

        loadVoices();

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [lang]);

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setIsPaused(false); // Reset pause state on new speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';

        if (selectedVoice) {
            utterance.voice = selectedVoice;

            // Optimization for Google voices to sound less robotic
            if (selectedVoice.name.includes('Google')) {
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
            } else {
                // For Microsoft/Native voices, usually default is best
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
            }
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const togglePause = () => {
        if (!isSpeaking) return;

        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleExport = () => {
        if (messages.length === 0) return;

        const textContent = messages.map(m =>
            `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n\n');

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSendMessage = async (text?: string, isVoiceInput: boolean = false) => {
        const messageText = text || inputText.trim();
        if (!messageText || isThinking) return;

        const userMessage: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsThinking(true);

        try {
            const { chatWithAssistant } = await import('../../services/gemini');
            const response = await chatWithAssistant(
                messageText,
                messages.slice(-10),
                lang,
                userName && !userName.includes('-') ? userName : undefined,
                agencyName
            );

            const assistantMessage: Message = {
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Only speak if not muted AND input was speech
            if (!isMuted && isVoiceInput && 'speechSynthesis' in window) {
                speakText(response);
            }
        } catch (error: any) {
            console.error('Assistant error detail:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: lang === 'es' ? `Error: ${error.message || 'Intenta de nuevo.'}` : `Error: ${error.message || 'Try again.'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            if (isHandsFree) setIsHandsFree(false);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 left-4 lg:left-auto lg:bottom-6 lg:right-6 z-[9999] w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
                >
                    <Mic className="w-6 h-6 lg:w-8 lg:h-8 text-black" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="absolute left-16 lg:-left-32 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Asistente de Voz</span>
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9999] w-96 h-[600px] max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans">
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between transition-colors duration-500 ${isHandsFree ? 'bg-gradient-to-r from-green-600/50 to-amber-600/50 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center relative">
                                <MessageCircle className="w-6 h-6 text-white" />
                                {isHandsFree && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900 animate-ping"></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-black text-white text-sm italic uppercase tracking-wider">{t[lang].title}</h3>
                                <p className="text-xs text-black/60 font-bold italic uppercase tracking-widest">
                                    {isHandsFree ? 'MODO ACTIVO' : 'IA EXPERTA 24/7'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="w-8 h-8 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
                                title={lang === 'es' ? "Exportar Chat" : "Export Chat"}
                            >
                                <Download className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="w-8 h-8 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
                                title="Configurar Voz"
                            >
                                <Volume2 className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsHandsFree(false);
                                    if (isSpeaking) window.speechSynthesis.cancel();
                                    if (isListening) recognitionRef.current?.stop();
                                }}
                                className="w-8 h-8 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="bg-zinc-800 p-4 border-b border-zinc-700 animate-in slide-in-from-top-2">
                            <h4 className="text-white text-xs font-bold mb-2 uppercase tracking-wider text-amber-500">Configuración de Voz</h4>
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-400">Seleccionar Voz:</label>
                                <select
                                    className="w-full bg-zinc-900 text-white text-xs p-2 rounded border border-zinc-700"
                                    value={selectedVoice?.name || ''}
                                    onChange={(e) => {
                                        const voice = availableVoices.find(v => v.name === e.target.value);
                                        setSelectedVoice(voice || null);
                                        // Test voice immediately
                                        if (voice) {
                                            window.speechSynthesis.cancel();
                                            const u = new SpeechSynthesisUtterance("Prueba de voz.");
                                            u.voice = voice;
                                            window.speechSynthesis.speak(u);
                                        }
                                    }}
                                >
                                    {availableVoices.map(v => (
                                        <option key={v.name} value={v.name}>
                                            {v.name.replace('Microsoft', '').replace('Desktop', '')}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-zinc-500 italic">
                                    * Selecciona "Google Español" o "Microsoft Sabina" para mejor calidad.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-amber-500 text-black shadow-lg rounded-tr-none' : 'bg-zinc-800 text-white border border-zinc-700 rounded-tl-none'} relative`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-6">{msg.content}</p>
                                    <p className="text-[10px] opacity-50 mt-1 text-right">
                                        {msg.timestamp.toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>

                                    <button
                                        onClick={() => handleCopy(msg.content, idx)}
                                        className={`absolute top-2 right-2 p-1 rounded-full bg-black/10 hover:bg-black/20 transition-all opacity-0 group-hover:opacity-100 ${copiedIndex === idx ? 'opacity-100 text-green-600' : ''}`}
                                        title="Copiar"
                                    >
                                        {copiedIndex === idx ? <div className="w-3 h-3 bg-green-500 rounded-full" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex gap-1 border border-zinc-700 rounded-tl-none">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">

                        {/* Pause Indicator Overlay */}
                        {isSpeaking && (
                            <div className="absolute top-[-40px] left-0 w-full flex justify-center pointer-events-none">
                                <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                                    {isPaused ? '⏸️ Audio Pausado' : '🔊 Reproduciendo...'}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="w-10 h-10 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors group"
                                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                            >
                                {isMuted ? <VolumeX className="w-5 h-5 text-zinc-500" /> : <Volume2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />}
                            </button>

                            {/* Pause/Play Button - Only visible when speaking or paused */}
                            {(isSpeaking || isPaused) && (
                                <button
                                    onClick={togglePause}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPaused ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-zinc-800 text-white'}`}
                                    title={isPaused ? "Reanudar" : "Pausar"}
                                >
                                    {isPaused ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                    )}
                                </button>
                            )}

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(undefined, false)}
                                placeholder={isListening ? 'Escuchando...' : t[lang].placeholder}
                                className={`flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${isListening ? 'ring-2 ring-green-500/50 placeholder-green-400' : ''}`}
                                disabled={isListening || isThinking}
                            />

                            <button
                                onClick={toggleListening}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-lg shadow-red-500/20 animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                                title={isHandsFree ? 'Desactivar Micrófono' : 'Activar Micrófono'}
                            >
                                {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-amber-400" />}
                            </button>

                            <button
                                onClick={() => handleSendMessage(undefined, false)}
                                disabled={!inputText.trim() || isThinking}
                                className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all shadow-lg shadow-amber-500/10"
                            >
                                <Send className="w-5 h-5 text-black" />
                            </button>
                        </div>
                        {isHandsFree && (
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">
                                    Modo Conversación Activo
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AssistantView;
