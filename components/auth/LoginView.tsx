
import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Loader2, AlertCircle, Globe } from 'lucide-react';
import { signInWithBusinessId } from '../../services/supabase';

// Legacy interface for compatibility with existing code
export interface ClientConfig {
  id: string;
  name: string;
  location: string;
  scriptUrl: string;
  brandingColor: string;
  role: 'admin' | 'employee';
}

interface LoginViewProps {
  brandColor: string;
  lang: 'es' | 'en';
  onToggleLang: () => void;
  onEnterGuest: (mode?: 'agency' | 'global') => void;
}

const LoginView: React.FC<LoginViewProps> = ({ brandColor, lang, onToggleLang, onEnterGuest }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Authenticate with Supabase
      // username can be agency ID (which defaults to @inmuebleiapro.local) or email
      const authData = await signInWithBusinessId(username, password);

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // The application will reactively update state via Supabase's auth listener in App.tsx
    } catch (err: any) {
      console.error('Login error:', err);

      // User-friendly error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Acceso denegado. Credenciales inválidas.');
      } else if (err.message?.includes('Perfil de negocio')) {
        setError('Perfil de negocio no configurado.');
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(245,158,11,0.08),_transparent_70%)] pointer-events-none"></div>

      <div className={`w-full max-w-md bg-zinc-900/50 border ${error ? 'border-red-500/50 shadow-red-500/5' : 'border-white/5'} backdrop-blur-xl rounded-[3rem] p-6 md:p-10 shadow-2xl transition-all duration-300 relative overflow-hidden`}>
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 relative group">
            <ShieldCheck className={`w-10 h-10 ${error ? 'text-red-500' : 'text-amber-500'} transition-colors`} />
            <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping opacity-20 group-hover:opacity-40"></div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase relative z-10">
            INMUEBLE <span className="text-amber-500">IA PRO</span>
          </h1>
          <button
            type="button"
            onClick={onToggleLang}
            className="absolute top-6 right-6 text-[10px] font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white/60 uppercase tracking-widest transition-colors z-20"
          >
            {lang}
          </button>
        </div>
        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] -mt-8 mb-8 italic opacity-60 text-center">Plataforma Inmobiliaria</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white uppercase tracking-widest ml-4">ID de Agencia</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-amber-500 transition-colors" />
              <input
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all placeholder:text-white/20"
                placeholder="AGENCIA_ID"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white uppercase tracking-widest ml-4">Clave de Seguridad</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all placeholder:text-white/20"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INICIAR SESIÓN'}
          </button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[8px] font-black text-white/20 uppercase tracking-widest italic">O</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            type="button"
            onClick={onEnterGuest}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            EXPLORAR COMO INVITADO
          </button>
          <button
            type="button"
            onClick={() => onEnterGuest('global')}
            className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-black py-4 rounded-2xl transition-all border border-indigo-500/20 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-[0.98] mt-2"
          >
            <Globe className="w-4 h-4" />
            VER PORTAL GLOBAL
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
