
import { AlertCircle, Camera, Car, Disc, Film, Fingerprint, Image as ImageIcon, Loader2, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { analyzeVehicleMedia } from '../services/gemini';
import { uploadPartImage } from '../services/supabase';
import { translations } from '../translations';
import { AnalysisResult, Part, PartCategory, PartStatus } from '../types';

interface AnalysisViewProps {
  onAddParts: (parts: Part[]) => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
}

interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  b64?: string;
  fileName: string;
  fileSize: number;
}

const MAX_IA_DIMENSION = 640;
const QUALITY = 0.5;

const AnalysisView: React.FC<AnalysisViewProps> = ({ onAddParts, lang, businessName, location }) => {
  const t = translations[lang];
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingParts, setPendingParts] = useState<Part[] | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const processSecurely = async (file: File | Blob) => {
    const bitmap = await createImageBitmap(file);
    const scale = MAX_IA_DIMENSION / Math.max(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return new Promise<{ b64: string; preview: string }>((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            b64: (reader.result as string).split(',')[1],
            preview: URL.createObjectURL(blob!)
          });
        };
        reader.readAsDataURL(blob!);
      }, 'image/jpeg', QUALITY);
    });
  };

  const startCamera = async () => {
    setErrorMessage(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err: any) {
      setErrorMessage(lang === 'es' ? "Error al acceder a la cámara." : "Error accessing camera.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const { b64, preview } = await processSecurely(blob);
        const newItem: MediaItem = {
          id: crypto.randomUUID(),
          src: preview,
          type: 'image',
          b64,
          fileName: `capture_${Date.now()}.jpg`,
          fileSize: blob.size
        };
        setMediaItems(prev => [...prev, newItem]);
        stopCamera();
      }, 'image/jpeg', 0.8);
    } catch (e) {
      setErrorMessage(lang === 'es' ? "Error al capturar la imagen." : "Error capturing image.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    setAnalyzing(true);
    try {
      const items: MediaItem[] = [...mediaItems];
      for (const file of files) {
        if (file.type.startsWith('video')) {
          items.push({
            id: crypto.randomUUID(),
            src: URL.createObjectURL(file),
            type: 'video',
            fileName: file.name,
            fileSize: file.size
          });
        } else {
          const { b64, preview } = await processSecurely(file);
          items.push({
            id: crypto.randomUUID(),
            src: preview,
            type: 'image',
            b64,
            fileName: file.name,
            fileSize: file.size
          });
        }
      }
      setMediaItems(items);
    } catch {
      setErrorMessage('Error procesando archivos');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const extractFrameFromVideo = async (src: string) => {
    const video = document.createElement('video');
    video.src = src;
    await new Promise(r => (video.onloadedmetadata = r));
    video.currentTime = Math.min(1, video.duration / 2);
    await new Promise(r => (video.onseeked = r));
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    canvas.getContext('2d')!.drawImage(video, 0, 0, 480, 360);
    return canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
  };

  const startMediaAnalysis = async () => {
    if (!mediaItems.length) return;
    setAnalyzing(true);
    setErrorMessage(null);
    try {
      const images: string[] = [];
      for (const item of mediaItems) {
        if (item.type === 'image' && item.b64) images.push(item.b64);
        if (item.type === 'video') images.push(await extractFrameFromVideo(item.src));
      }

      const result: AnalysisResult = await analyzeVehicleMedia(images, businessName, location);

      const allParts: Part[] = result.groups.flatMap((group, groupIdx) =>
        group.parts.map((p, partIdx) => ({
          id: `${Date.now()}-${groupIdx}-${partIdx}`,
          name: p.name,
          category: p.category as PartCategory,
          vehicleInfo: { ...group.vehicle },
          condition: p.condition,
          suggestedPrice: p.suggestedPrice,
          minPrice: p.minPrice || 0,
          status: PartStatus.AVAILABLE,
          dateAdded: new Date().toISOString()
        }))
      );

      setPendingParts(allParts);
    } catch (e) {
      console.error(e);
      setErrorMessage('Error en el análisis de IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (pendingParts && mediaItems.length > 0) {
      setAnalyzing(true);
      try {
        let imageUrl: string | undefined;
        const firstItem = mediaItems.find(i => i.type === 'image' && i.b64);

        if (firstItem && firstItem.b64) {
          const byteCharacters = atob(firstItem.b64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          const fileName = `part_${Date.now()}_${businessName.replace(/\s+/g, '_')}.jpg`;
          const uploadedUrl = await uploadPartImage(blob, fileName);
          console.log('DEBUG: Uploaded Image URL:', uploadedUrl);
          if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const partsWithImages = pendingParts.map(p => ({
          ...p,
          imageUrl: imageUrl || p.imageUrl
        }));

        onAddParts(partsWithImages);
        setPendingParts(null);
        setMediaItems([]);
      } catch (err) {
        console.error('Error saving with images:', err);
        setErrorMessage('Error al subir imágenes');
      } finally {
        setAnalyzing(false);
      }
    } else if (pendingParts) {
      onAddParts(pendingParts);
      setPendingParts(null);
      setMediaItems([]);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 overflow-x-hidden">
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-12 left-0 right-0 flex justify-between items-center px-12">
            <button onClick={stopCamera} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white"><X /></button>
            <button onClick={capturePhoto} className="w-24 h-24 bg-amber-500 rounded-full border-[6px] border-black flex items-center justify-center shadow-2xl active:scale-95 transition-all">
              <Disc className="w-8 h-8 text-black" />
            </button>
            <div className="w-14 h-14"></div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-black text-white flex gap-3 items-center italic tracking-tighter uppercase mb-8">
        <Film className="text-amber-500 w-8 h-8" /> {t.multimodal_analysis}
      </h2>

      {!pendingParts ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className={`min-h-[16rem] md:h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${mediaItems.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'}`}>
              {analyzing ? (
                <div className="flex flex-col items-center p-4">
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-amber-500 animate-pulse">{t.scanning}</p>
                </div>
              ) : mediaItems.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4 p-6 overflow-y-auto max-h-full">
                  {mediaItems.map(item => (
                    <div key={item.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-500/50 group">
                      {item.type === 'video' ? <div className="absolute inset-0 bg-black flex items-center justify-center"><Film className="text-amber-500" /></div> : <img src={item.src} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <X className="w-4 h-4 text-white cursor-pointer" onClick={() => setMediaItems(prev => prev.filter(i => i.id !== item.id))} />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-white/5"><Plus className="text-zinc-500" /></div>
                    <div onClick={startCamera} className="w-20 h-20 rounded-xl border-2 border-dashed border-amber-500/30 flex items-center justify-center cursor-pointer hover:bg-amber-500/10"><Camera className="text-amber-500" /></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center text-center">
                  <Upload className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-6">{t.click_upload}</p>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full px-6 sm:px-0 sm:w-auto mt-4">
                    <button
                      onClick={startCamera}
                      className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-amber-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/10"
                      style={{ color: 'var(--brand-text-color)' }}
                    >
                      <Camera className="w-4 h-4" />{t.take_photo}
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-zinc-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-700 active:scale-95 transition-all outline outline-1 outline-white/5 shadow-xl"><ImageIcon className="w-4 h-4" />Archivos</button>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
            <button
              onClick={startMediaAnalysis}
              disabled={analyzing || mediaItems.length === 0}
              className="mt-8 w-full bg-amber-500 hover:brightness-110 disabled:bg-zinc-800 disabled:text-zinc-600 font-black py-6 rounded-3xl flex justify-center items-center gap-4 transition-all uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-amber-500/20 disabled:shadow-none"
              style={{ color: (analyzing || mediaItems.length === 0) ? undefined : 'var(--brand-text-color)' }}
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {lang === 'es' ? 'ANALIZAR TODO EL LOTE' : 'ANALYZE ALL MEDIA'}
            </button>
          </div>
          {errorMessage && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl flex items-center gap-4"><AlertCircle /><p className="text-xs font-black uppercase tracking-widest">{errorMessage}</p></div>}
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-zinc-900/80 border border-white/5 p-8 rounded-3xl">
            <div>
              <h3 className="text-white font-black text-xl uppercase tracking-tight italic">RESULTADOS MULTI-VEHÍCULO</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Se detectaron {Array.from(new Set(pendingParts.map(p => `${p.vehicleInfo.make} ${p.vehicleInfo.model}`))).length} modelos distintos</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button onClick={() => setPendingParts(null)} className="flex-1 md:flex-none px-8 py-5 bg-zinc-800 text-zinc-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">DESCARTAR</button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 md:flex-none px-8 py-5 bg-amber-500 hover:brightness-110 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3 active:scale-95 transition-all"
                style={{ color: 'var(--brand-text-color)' }}
              >
                <Save className="w-4 h-4" />CONFIRMAR TODO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingParts.map((part) => (
              <div key={part.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 relative hover:border-amber-500/30 transition-all flex flex-col h-full">
                <button onClick={() => setPendingParts(prev => prev ? prev.filter(p => p.id !== part.id) : null)} className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-600 hover:text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                <div className="mb-3">
                  <span className="text-[8px] font-black bg-zinc-800 text-amber-500 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest inline-block">{part.vehicleInfo.year} {part.vehicleInfo.make}</span>
                </div>
                <h4 className="text-white font-black text-sm uppercase mb-4 line-clamp-2">{part.name}</h4>
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-auto">
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Precio</p>
                    <p className="text-lg font-mono font-black text-green-500">${part.suggestedPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">VIN Detectado</p>
                    <p className="text-[10px] font-mono font-black text-zinc-400 truncate">{part.vehicleInfo.vin || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
