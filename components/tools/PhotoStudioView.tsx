import React, { useState, useRef, useEffect } from 'react';
import {
    Wand2,
    Eraser,
    ImageIcon,
    Upload,
    Download,
    Undo,
    Redo,
    Maximize2,
    Brush,
    Sofa,
    Layout,
    Loader2,
    Trash2,
    Save,
    Sparkles
} from 'lucide-react';

interface PhotoStudioViewProps {
    lang: 'es' | 'en';
    brandColor: string;
}

type ToolMode = 'cleanup' | 'staging';

export default function PhotoStudioView({ lang, brandColor }: PhotoStudioViewProps) {
    const [activeTool, setActiveTool] = useState<ToolMode>('cleanup');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [prompt, setPrompt] = useState('');
    const [stagingStyle, setStagingStyle] = useState('modern');

    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Translations
    const t = {
        es: {
            title: 'Estudio Fotográfico IA',
            subtitle: 'Mejora tus fotos inmobiliarias con inteligencia artificial generativa.',
            cleanup: 'Limpieza Mágica',
            staging: 'Virtual Staging',
            upload: 'Subir Foto',
            processing: 'Procesando...',
            download: 'Descargar',
            brushSize: 'Tamaño del Pincel',
            removeObject: 'Borrar Objetos',
            removeDesc: 'Pinta sobre los objetos que quieras eliminar (cables, basura, personas).',
            addFurniture: 'Amueblar Habitación',
            addDesc: 'Describe el estilo y tipo de muebles que deseas agregar.',
            promptPlaceholder: 'Ej: Sala de estar moderna con sofá beige y plantas...',
            style: 'Estilo de Decoración',
            styles: {
                modern: 'Moderno',
                scandinavian: 'Escandinavo',
                industrial: 'Industrial',
                minimalist: 'Minimalista',
                luxury: 'Lujo'
            },
            generate: 'Generar',
            reset: 'Reiniciar',
            save: 'Guardar Resultado',
            dragDrop: 'Arrastra y suelta una imagen aquí'
        },
        en: {
            title: 'AI Photo Studio',
            subtitle: 'Enhance your real estate photos with generative AI.',
            cleanup: 'Magic Cleanup',
            staging: 'Virtual Staging',
            upload: 'Upload Photo',
            processing: 'Processing...',
            download: 'Download',
            brushSize: 'Brush Size',
            removeObject: 'Remove Objects',
            removeDesc: 'Paint over objects you want to remove (wires, trash, people).',
            addFurniture: 'Furnish Room',
            addDesc: 'Describe the style and type of furniture you want to add.',
            promptPlaceholder: 'Ex: Modern living room with beige sofa and plants...',
            style: 'Decor Style',
            styles: {
                modern: 'Modern',
                scandinavian: 'Scandinavian',
                industrial: 'Industrial',
                minimalist: 'Minimalist',
                luxury: 'Luxury'
            },
            generate: 'Generate',
            reset: 'Reset',
            save: 'Save Result',
            dragDrop: 'Drag and drop an image here'
        }
    };

    const text = t[lang];

    // Mock processing function
    const handleProcess = () => {
        if (!selectedImage) return;

        setIsProcessing(true);
        // Simulate AI processing time
        setTimeout(() => {
            setIsProcessing(false);
            // In a real implementation, this would update the image with the AI result
            // For now we just show a toast or feedback
            alert(lang === 'es' ? '¡Procesamiento simulado completado! (Se requiere API real)' : 'Simulated processing complete! (Real API required)');
        }, 2000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: brandColor + '20' }}
                    >
                        <Sparkles size={24} style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            PHOTO STUDIO <span style={{ color: brandColor }}>IA</span>
                        </h1>
                        <p className="text-zinc-500 font-bold italic uppercase tracking-widest">
                            {lang === 'es' ? 'CARGA FOTOS Y DEJA QUE LA IA HAGA EL TRABAJO' : 'UPLOAD PHOTOS AND LET AI DO THE WORK'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Toolbar / Controls */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-4">

                    {/* Mode Switcher */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-1.5 flex border border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setActiveTool('cleanup')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTool === 'cleanup'
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Eraser size={16} />
                            {text.cleanup}
                        </button>
                        <button
                            onClick={() => setActiveTool('staging')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTool === 'staging'
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Sofa size={16} />
                            {text.staging}
                        </button>
                    </div>

                    {/* Controls Panel */}
                    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-6 overflow-y-auto">

                        {activeTool === 'cleanup' ? (
                            // CLEANUP CONTROLS
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div>
                                    <h3 className="text-zinc-900 dark:text-white font-bold flex items-center gap-2 mb-2">
                                        <Brush className="text-amber-500" size={18} />
                                        {text.removeObject}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {text.removeDesc}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-2">
                                        <span>{text.brushSize}</span>
                                        <span>{brushSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex justify-center mt-4">
                                        <div
                                            className="rounded-full bg-amber-500/50 border-2 border-amber-500 transition-all duration-200"
                                            style={{ width: brushSize, height: brushSize }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // STAGING CONTROLS
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div>
                                    <h3 className="text-zinc-900 dark:text-white font-bold flex items-center gap-2 mb-2">
                                        <Layout className="text-amber-500" size={18} />
                                        {text.addFurniture}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {text.addDesc}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                            {text.style}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(text.styles).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setStagingStyle(key)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${stagingStyle === key
                                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                                                        }`}
                                                >
                                                    {label as string}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                            Prompt
                                        </label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={text.promptPlaceholder}
                                            className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none h-32"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                            <button
                                onClick={handleProcess}
                                disabled={!selectedImage || isProcessing}
                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-wide py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {text.processing}
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        {text.generate}
                                    </>
                                )}
                            </button>

                            {selectedImage && (
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wide py-3 rounded-xl transition-all text-xs"
                                >
                                    {text.reset}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-zinc-200 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative flex flex-col shadow-inner">
                    {/* Canvas Toolbar */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={() => {
                                const canvas = canvasRef.current;
                                const ctx = canvas?.getContext('2d');
                                if (canvas && ctx) {
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                }
                            }}
                            className="p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Clear Mask"
                        >
                            <Trash2 size={18} />
                        </button>
                        <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                        <button className="p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Download">
                            <Download size={18} />
                        </button>
                    </div>

                    <div
                        ref={containerRef}
                        className="flex-1 flex items-center justify-center p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100 relative"
                    >
                        {!selectedImage ? (
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                                    <Upload className="text-zinc-400 dark:text-zinc-500" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-1">{text.upload}</h3>
                                    <p className="text-zinc-500 text-sm mb-4">{text.dragDrop}</p>
                                </div>
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-amber-500/20">
                                    <ImageIcon size={18} />
                                    <span>{text.upload}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden group">
                                <img
                                    ref={imageRef}
                                    src={selectedImage}
                                    alt="Workspace"
                                    className="max-w-full max-h-[80vh] object-contain block select-none"
                                    draggable={false}
                                    onLoad={() => {
                                        if (canvasRef.current && imageRef.current) {
                                            canvasRef.current.width = imageRef.current.width;
                                            canvasRef.current.height = imageRef.current.height;
                                        }
                                    }}
                                />

                                {/* Interactive Canvas Layer */}
                                <canvas
                                    ref={canvasRef}
                                    className={`absolute inset-0 w-full h-full touch-none ${activeTool === 'cleanup' ? 'cursor-crosshair' : 'cursor-default'}`}
                                    onMouseDown={(e) => {
                                        if (activeTool !== 'cleanup') return;
                                        const canvas = canvasRef.current;
                                        const ctx = canvas?.getContext('2d');
                                        if (!canvas || !ctx) return;

                                        const rect = canvas.getBoundingClientRect();
                                        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                                        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

                                        ctx.beginPath();
                                        ctx.moveTo(x, y);
                                        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'; // Amber 500 with 50% opacity
                                        ctx.lineWidth = brushSize;
                                        ctx.lineCap = 'round';
                                        ctx.lineJoin = 'round';

                                        // Start drawing flag
                                        canvas.dataset.drawing = 'true';
                                    }}
                                    onMouseMove={(e) => {
                                        if (activeTool !== 'cleanup' || canvasRef.current?.dataset.drawing !== 'true') return;
                                        const canvas = canvasRef.current;
                                        const ctx = canvas?.getContext('2d');
                                        if (!canvas || !ctx) return;

                                        const rect = canvas.getBoundingClientRect();
                                        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                                        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

                                        ctx.lineTo(x, y);
                                        ctx.stroke();
                                    }}
                                    onMouseUp={() => {
                                        if (canvasRef.current) canvasRef.current.dataset.drawing = 'false';
                                    }}
                                    onMouseLeave={() => {
                                        if (canvasRef.current) canvasRef.current.dataset.drawing = 'false';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
