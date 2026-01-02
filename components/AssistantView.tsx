import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, X, Send, Volume2, VolumeX } from 'lucide-react';

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

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const t = {
        es: {
            title: 'Asistente Inmobiliario',
            placeholder: 'Escribe o habla...',
            listening: 'Escuchando...',
            thinking: 'Pensando...',
            handsFreeOn: 'Manos libres activado',
            handsFreeOff: 'Manos libres desactivado'
        },
        en: {
            title: 'Real Estate Assistant',
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
                handleSendMessage(transcript);
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
                ? `¡Hola! ¿En qué te ayudo hoy?`
                : `Hi! How can I help you today?`;

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

    const handleSendMessage = async (text?: string) => {
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
            const { chatWithAssistant } = await import('../services/gemini');
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

            if (!isMuted && 'speechSynthesis' in window) {
                speakText(response);
            }
        } catch (error) {
            console.error('Assistant error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: lang === 'es' ? 'Error. Intenta de nuevo.' : 'Error. Try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            if (isHandsFree) setIsHandsFree(false);
        } finally {
            setIsThinking(false);
        }
    };

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';

        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;

            const femalePatterns = [
                'Google español', 'Dalia', 'Helena', 'Sabina', 'Elsa', 'Zira', 'Microsoft Salma',
                'Microsoft Larisa', 'Monica', 'Libby', 'Lucia', 'google us english female', 'swara',
                'Hilda', 'Pilar', 'Rosa', 'Lorena', 'Google UK English Female', 'Microsoft Elena',
                'Microsoft Laura', 'Microsoft Dalia', 'Google US English'
            ];

            const maleExclusions = [
                'male', 'guy', 'david', 'pablo', 'raul', 'antonio', 'sergio', 'kevin', 'james',
                'paul', 'stefan', 'jorge', 'juan', 'ricardo', 'diego', 'carlos', 'paco', 'luis',
                'enrique', 'fernando', 'manuel', 'jose', 'javier', 'alberto', 'rafael', 'antonio'
            ];

            const qualityPatterns = ['Natural', 'Online', 'Neural', 'Premium'];
            const targetLang = lang === 'es' ? 'es' : 'en';

            // Filter strictly: exclude males AND must be target language
            let availableVoices = voices.filter(v =>
                v.lang.toLowerCase().startsWith(targetLang) &&
                !maleExclusions.some(m => v.name.toLowerCase().includes(m))
            );

            // If no voices left after strict filtering, allow any for that lang but still exclude males
            if (availableVoices.length === 0) {
                availableVoices = voices.filter(v =>
                    v.lang.toLowerCase().startsWith(targetLang) &&
                    !v.name.toLowerCase().includes('male') &&
                    !v.name.toLowerCase().includes('guy')
                );
            }

            let selectedVoice = null;

            // Tier 1: Search for known high-quality female voices (Online/Natural)
            for (const q of qualityPatterns) {
                for (const name of femalePatterns) {
                    selectedVoice = availableVoices.find(v =>
                        (v.name.includes(name) || v.name.toLowerCase().includes(name.toLowerCase())) &&
                        v.name.includes(q)
                    );
                    if (selectedVoice) break;
                }
                if (selectedVoice) break;
            }

            // Tier 2: Any Online voice for the language
            if (!selectedVoice) {
                selectedVoice = availableVoices.find(v => v.name.includes('Online'));
            }

            // Tier 3: Search for any quality female voice pattern
            if (!selectedVoice) {
                for (const name of femalePatterns) {
                    selectedVoice = availableVoices.find(v =>
                        v.name.toLowerCase().includes(name.toLowerCase())
                    );
                    if (selectedVoice) break;
                }
            }

            // Tier 4: Search for quality tags in target language
            if (!selectedVoice) {
                for (const q of qualityPatterns) {
                    selectedVoice = availableVoices.find(v => v.name.includes(q));
                    if (selectedVoice) break;
                }
            }

            // Tier 5: Just pick the first non-male voice for the language
            if (!selectedVoice) {
                selectedVoice = availableVoices[0] || voices.find(v => v.lang.startsWith(targetLang));
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                const isVerifiedFemale = femalePatterns.some(p => selectedVoice!.name.toLowerCase().includes(p.toLowerCase()));
                const isMicrosoft = selectedVoice.name.includes('Microsoft');

                // Fine-tuning for naturalness
                utterance.pitch = isVerifiedFemale ? 1.05 : 1.2;
                utterance.rate = isMicrosoft ? 0.95 : 1.0;
            } else {
                utterance.pitch = 1.25;
                utterance.rate = 1.0;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                // Mic restart is now handled by the centralized effect
            };

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        } else {
            setVoiceAndSpeak();
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
                >
                    <Mic className="w-8 h-8 text-black" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="absolute -left-32 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Asistente de Voz</span>
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9999] w-96 h-[600px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    <div className={`p-4 flex items-center justify-between transition-colors duration-500 ${isHandsFree ? 'bg-gradient-to-r from-green-600/50 to-amber-600/50 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center relative">
                                <MessageCircle className="w-6 h-6 text-white" />
                                {isHandsFree && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900 animate-ping"></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{t[lang].title}</h3>
                                <p className="text-xs text-black/70 font-medium">
                                    {isHandsFree ? 'ESCUCHANDO SIEMPRE' : 'IA Experta 24/7'}
                                </p>
                            </div>
                        </div>
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

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-amber-500 text-black shadow-lg' : 'bg-zinc-800 text-white border border-zinc-700'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {msg.timestamp.toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex gap-1 border border-zinc-700">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="w-10 h-10 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors group"
                                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                            >
                                {isMuted ? <VolumeX className="w-5 h-5 text-zinc-500" /> : <Volume2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />}
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={isListening ? 'Habla ahora...' : t[lang].placeholder}
                                className={`flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${isListening ? 'ring-2 ring-green-500/50' : ''}`}
                                disabled={isListening || isThinking}
                            />

                            <button
                                onClick={toggleListening}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                                title={isHandsFree ? 'Desactivar Manos Libres' : 'Activar Micrófono'}
                            >
                                {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-amber-400" />}
                            </button>

                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim() || isThinking}
                                className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all shadow-lg shadow-amber-500/10"
                            >
                                <Send className="w-5 h-5 text-black" />
                            </button>
                        </div>
                        {isHandsFree && (
                            <div className="flex items-center justify-center gap-2 mt-3 overflow-hidden">
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest animate-pulse">
                                    Modo Conversación Abierta Activo
                                </p>
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AssistantView;
