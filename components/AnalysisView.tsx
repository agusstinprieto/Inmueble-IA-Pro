
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Loader2,
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Plus,
  Trash2,
  Save,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { analyzePropertyImages, generatePropertyDescription } from '../services/gemini';
import { translations } from '../translations';
import { Property, PropertyType, OperationType, PropertyStatus, PropertyAnalysis } from '../types';

interface AnalysisViewProps {
  onAddProperty: (property: Partial<Property>) => void;
  lang: 'es' | 'en';
  businessName: string;
  location: string;
  brandColor: string;
  agentId: string;
  agencyId: string;
}

interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  b64?: string;
  fileName: string;
  fileSize: number;
}

const MAX_DIMENSION = 1024;
const QUALITY = 0.7;

const AnalysisView: React.FC<AnalysisViewProps> = ({
  onAddProperty,
  lang,
  businessName,
  location,
  brandColor,
  agentId,
  agencyId
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PropertyAnalysis | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState<Partial<Property>>({
    type: PropertyType.CASA,
    operation: OperationType.VENTA,
    title: '',
    description: '',
    address: {
      street: '',
      exteriorNumber: '',
      colony: '',
      city: '',
      state: '',
      zipCode: ''
    },
    specs: {
      m2Total: 0,
      m2Built: 0,
      bedrooms: 0,
      bathrooms: 0,
      parking: 0,
      floors: 1
    },
    amenities: [],
    salePrice: 0,
    rentPrice: 0
  });

  // Process image for AI
  const processImage = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', QUALITY).split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError(null);
    const newItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const b64 = await processImage(file);
        newItems.push({
          id: `media_${Date.now()}_${i}`,
          src: URL.createObjectURL(file),
          type: 'image',
          b64,
          fileName: file.name,
          fileSize: file.size
        });
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    setMediaItems(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const b64 = await processImage(blob);
      setMediaItems(prev => [...prev, {
        id: `capture_${Date.now()}`,
        src: URL.createObjectURL(blob),
        type: 'image',
        b64,
        fileName: 'capture.jpg',
        fileSize: blob.size
      }]);
    }, 'image/jpeg', QUALITY);
  };

  // Run AI analysis
  const analyzeWithAI = async () => {
    if (mediaItems.length === 0) {
      setError('Agrega al menos una imagen para analizar');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Images = mediaItems.map(m => m.b64!).filter(Boolean);
      const result = await analyzePropertyImages(base64Images, businessName, location);

      if (result.properties.length > 0) {
        setAnalysisResult(result.properties[0]);
        // Update form with AI results
        const analysis = result.properties[0];
        setFormData(prev => ({
          ...prev,
          type: analysis.type as PropertyType,
          specs: {
            m2Total: analysis.estimatedSpecs.m2Total,
            m2Built: analysis.estimatedSpecs.m2Built,
            bedrooms: analysis.estimatedSpecs.bedrooms,
            bathrooms: analysis.estimatedSpecs.bathrooms,
            parking: analysis.estimatedSpecs.parking,
            floors: analysis.estimatedSpecs.floors
          },
          amenities: analysis.detectedAmenities,
          salePrice: analysis.estimatedPrice
        }));
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Error al analizar las imágenes. Intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate description with AI
  const generateDescription = async () => {
    try {
      const desc = await generatePropertyDescription(formData, lang);
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (err) {
      console.error('Error generating description:', err);
    }
  };

  // Remove media item
  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  // Save property
  const handleSave = () => {
    const property: Partial<Property> = {
      ...formData,
      id: `prop_${Date.now()}`,
      status: PropertyStatus.DISPONIBLE,
      agentId,
      agencyId,
      images: mediaItems.map(m => m.src),
      dateAdded: new Date().toISOString(),
      views: 0,
      favorites: 0
    };

    onAddProperty(property);

    // Reset form
    setMediaItems([]);
    setAnalysisResult(null);
    setFormData({
      type: PropertyType.CASA,
      operation: OperationType.VENTA,
      title: '',
      description: '',
      address: { street: '', exteriorNumber: '', colony: '', city: '', state: '', zipCode: '' },
      specs: { m2Total: 0, m2Built: 0, bedrooms: 0, bathrooms: 0, parking: 0, floors: 1 },
      amenities: [],
      salePrice: 0,
      rentPrice: 0
    });
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: brandColor + '20' }}
        >
          <Sparkles size={24} style={{ color: brandColor }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t.multimodal_analysis}</h1>
          <p className="text-zinc-400 text-sm">{t.upload_property_photo}</p>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="
                border-2 border-dashed border-zinc-700 rounded-xl p-8
                flex flex-col items-center justify-center gap-4
                cursor-pointer hover:border-zinc-500 transition-colors
                min-h-[200px]
              "
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brandColor + '20' }}
              >
                <Upload size={28} style={{ color: brandColor }} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{t.click_upload}</p>
                <p className="text-zinc-500 text-sm mt-1">JPG, PNG hasta 10MB</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={startCamera}
                className="
                  flex-1 flex items-center justify-center gap-2 py-3 px-4
                  bg-zinc-800 hover:bg-zinc-700 rounded-lg
                  text-white font-medium transition-colors
                "
              >
                <Camera size={20} />
                {t.take_photo}
              </button>
              <button
                onClick={() => setManualMode(!manualMode)}
                className="
                  flex items-center justify-center gap-2 py-3 px-4
                  bg-zinc-800 hover:bg-zinc-700 rounded-lg
                  text-white font-medium transition-colors
                "
              >
                <Plus size={20} />
                Manual
              </button>
            </div>
          </div>

          {/* Camera View */}
          {showCamera && (
            <div className="relative rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={capturePhoto}
                  className="
                    w-14 h-14 rounded-full flex items-center justify-center
                    text-white shadow-lg
                  "
                  style={{ backgroundColor: brandColor }}
                >
                  <Camera size={24} />
                </button>
                <button
                  onClick={stopCamera}
                  className="
                    w-14 h-14 rounded-full bg-red-500 
                    flex items-center justify-center text-white shadow-lg
                  "
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Media Preview */}
          {mediaItems.length > 0 && !showCamera && (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative group aspect-square">
                  <img
                    src={item.src}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="
                      absolute top-1 right-1 w-6 h-6 rounded-full
                      bg-red-500 text-white flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity
                    "
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {mediaItems.length > 0 && (
          <button
            onClick={analyzeWithAI}
            disabled={isAnalyzing}
            className="
              w-full mt-6 py-4 rounded-xl font-bold text-lg
              flex items-center justify-center gap-3
              transition-all duration-200 disabled:opacity-50
            "
            style={{
              backgroundColor: brandColor,
              color: '#000'
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                {t.scanning_property}
              </>
            ) : (
              <>
                <Sparkles size={24} />
                ANALIZAR CON IA
              </>
            )}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-green-400" size={24} />
            <h2 className="text-xl font-bold text-white">Resultado del Análisis</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Tipo</p>
              <p className="text-white font-bold text-lg">
                {t.property_types[analysisResult.type as keyof typeof t.property_types] || analysisResult.type}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Condición</p>
              <p className="text-white font-bold text-lg">
                {t.conditions[analysisResult.condition as keyof typeof t.conditions] || analysisResult.condition}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Precio Estimado</p>
              <p className="font-bold text-lg" style={{ color: brandColor }}>
                ${analysisResult.estimatedPrice?.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Rango</p>
              <p className="text-white font-bold text-lg">
                ${analysisResult.priceRange?.min?.toLocaleString()} - ${analysisResult.priceRange?.max?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Ruler className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.m2Built}</p>
              <p className="text-zinc-500 text-xs">m² Const.</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Bed className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.bedrooms}</p>
              <p className="text-zinc-500 text-xs">Recámaras</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Bath className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.bathrooms}</p>
              <p className="text-zinc-500 text-xs">Baños</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Car className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.parking}</p>
              <p className="text-zinc-500 text-xs">Estac.</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Building2 className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.floors}</p>
              <p className="text-zinc-500 text-xs">Niveles</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <Home className="text-zinc-400 mx-auto mb-1" size={20} />
              <p className="text-white font-bold">{analysisResult.estimatedSpecs?.m2Total}</p>
              <p className="text-zinc-500 text-xs">m² Terreno</p>
            </div>
          </div>

          {/* Amenities */}
          {analysisResult.detectedAmenities?.length > 0 && (
            <div className="mb-6">
              <p className="text-zinc-400 text-sm mb-2">{t.detected_amenities}</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.detectedAmenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: brandColor + '20', color: brandColor }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysisResult.suggestions?.length > 0 && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-400 font-medium mb-2">💡 Sugerencias de la IA</p>
              <ul className="text-blue-300 text-sm space-y-1">
                {analysisResult.suggestions.map((sug, idx) => (
                  <li key={idx}>• {sug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to catalog button */}
          <button
            onClick={handleSave}
            className="
              w-full py-4 rounded-xl font-bold text-lg
              flex items-center justify-center gap-3
              transition-all duration-200
            "
            style={{ backgroundColor: brandColor, color: '#000' }}
          >
            <Save size={24} />
            {t.add_to_catalog}
          </button>
        </div>
      )}

      {/* Manual Form (optional) */}
      {manualMode && !analysisResult && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Registro Manual</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Type & Operation */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Tipo de Propiedad</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as PropertyType }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                >
                  {Object.values(PropertyType).map(type => (
                    <option key={type} value={type}>
                      {t.property_types[type as keyof typeof t.property_types] || type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Operación</label>
                <select
                  value={formData.operation}
                  onChange={e => setFormData(prev => ({ ...prev, operation: e.target.value as OperationType }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                >
                  {Object.values(OperationType).map(op => (
                    <option key={op} value={op}>
                      {t.operations[op as keyof typeof t.operations] || op}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Casa en Residencial del Norte"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">m² Terreno</label>
                <input
                  type="number"
                  value={formData.specs?.m2Total || 0}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    specs: { ...prev.specs!, m2Total: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">m² Construcción</label>
                <input
                  type="number"
                  value={formData.specs?.m2Built || 0}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    specs: { ...prev.specs!, m2Built: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Recámaras</label>
                <input
                  type="number"
                  value={formData.specs?.bedrooms || 0}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    specs: { ...prev.specs!, bedrooms: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Baños</label>
                <input
                  type="number"
                  value={formData.specs?.bathrooms || 0}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    specs: { ...prev.specs!, bathrooms: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Estacionamiento</label>
                <input
                  type="number"
                  value={formData.specs?.parking || 0}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    specs: { ...prev.specs!, parking: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  {formData.operation === OperationType.RENTA ? 'Renta Mensual' : 'Precio Venta'}
                </label>
                <input
                  type="number"
                  value={formData.operation === OperationType.RENTA ? formData.rentPrice : formData.salePrice}
                  onChange={e => {
                    const price = parseInt(e.target.value) || 0;
                    if (formData.operation === OperationType.RENTA) {
                      setFormData(prev => ({ ...prev, rentPrice: price }));
                    } else {
                      setFormData(prev => ({ ...prev, salePrice: price }));
                    }
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="
              w-full mt-6 py-4 rounded-xl font-bold text-lg
              flex items-center justify-center gap-3
            "
            style={{ backgroundColor: brandColor, color: '#000' }}
          >
            <Save size={24} />
            Guardar Propiedad
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
