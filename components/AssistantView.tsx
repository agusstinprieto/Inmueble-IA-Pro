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
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const t = {
        es: {
            title: 'Asistente Inmobiliario',
            placeholder: 'Escribe tu pregunta o usa el micrófono...',
            listening: 'Escuchando...',
            thinking: 'Pensando...',
            welcome: '¡Hola! Soy tu asistente experto en bienes raíces. Puedo ayudarte con contratos, marketing, estrategias de venta y más. ¿En qué puedo ayudarte?'
        },
        en: {
            title: 'Real Estate Assistant',
            placeholder: 'Type your question or use the microphone...',
            listening: 'Listening...',
            thinking: 'Thinking...',
            welcome: 'Hello! I\'m your expert real estate assistant. I can help you with contracts, marketing, sales strategies, and more. How can I help you?'
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

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        // Welcome message
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: t[lang].welcome,
                timestamp: new Date()
            }]);
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputText.trim();
        if (!messageText || isThinking) return;

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsThinking(true);

        try {
            // Import and call Gemini service
            const { chatWithAssistant } = await import('../services/gemini');

            const response = await chatWithAssistant(
                messageText,
                messages.slice(-10), // Last 10 messages for context
                lang,
                userName,
                agencyName
            );

            const assistantMessage: Message = {
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Speak response if not muted
            if (!isMuted && 'speechSynthesis' in window) {
                speakText(response);
            }
        } catch (error) {
            console.error('Assistant error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: lang === 'es'
                    ? 'Lo siento, hubo un error. Por favor intenta de nuevo.'
                    : 'Sorry, there was an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsThinking(false);
        }
    };

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
                >
                    <MessageCircle className="w-8 h-8 text-black" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </button>
            )}

            {/* Chat Interface */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9999] w-96 h-[600px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{t[lang].title}</h3>
                                <p className="text-xs text-black/60">IA Experta 24/7</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-zinc-800 text-white'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {msg.timestamp.toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="w-10 h-10 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors"
                            >
                                {isMuted ? (
                                    <VolumeX className="w-5 h-5 text-zinc-500" />
                                ) : (
                                    <Volume2 className="w-5 h-5 text-amber-400" />
                                )}
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={isListening ? t[lang].listening : t[lang].placeholder}
                                className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                disabled={isListening || isThinking}
                            />

                            <button
                                onClick={toggleListening}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening
                                    ? 'bg-red-500 animate-pulse'
                                    : 'bg-zinc-800 hover:bg-zinc-700'
                                    }`}
                            >
                                {isListening ? (
                                    <MicOff className="w-5 h-5 text-white" />
                                ) : (
                                    <Mic className="w-5 h-5 text-amber-400" />
                                )}
                            </button>

                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim() || isThinking}
                                className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                            >
                                <Send className="w-5 h-5 text-black" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AssistantView;
