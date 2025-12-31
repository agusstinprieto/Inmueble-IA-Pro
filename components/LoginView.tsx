
import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { signInWithBusinessId, getBusinessProfile, BusinessProfile } from '../services/supabase';

// Legacy interface for compatibility with existing code
export interface ClientConfig {
  id: string;
  name: string;
  location: string;
  scriptUrl: string;
  brandingColor: string;
}

interface LoginViewProps {
  onLogin: (client: ClientConfig) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
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
      const authData = await signInWithBusinessId(username, password);

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // Fetch business profile from Supabase database
      const profile = await getBusinessProfile(authData.user.id);

      if (!profile) {
        throw new Error('Perfil de negocio no encontrado');
      }

      // Convert to ClientConfig format for compatibility
      const clientConfig: ClientConfig = {
        id: profile.business_id,
        name: profile.business_name,
        location: profile.location,
        scriptUrl: profile.script_url,
        brandingColor: profile.branding_color || '#f59e0b'
      };

      onLogin(clientConfig);
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

      <div className={`w-full max-w-md bg-zinc-900/50 border ${error ? 'border-red-500/50 shadow-red-500/5' : 'border-white/5'} backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl transition-all duration-300 relative overflow-hidden`}>
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 relative group">
            <ShieldCheck className={`w-10 h-10 ${error ? 'text-red-500' : 'text-amber-500'} transition-colors`} />
            <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping opacity-20 group-hover:opacity-40"></div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
            GESTIÓN DE STOCK <span className="text-amber-500">OS</span>
          </h1>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic opacity-60">Terminal Multi-Cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white uppercase tracking-widest ml-4">ID de Empresa</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-amber-500 transition-colors" />
              <input
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all placeholder:text-white/20"
                placeholder="CLIENT_ID"
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONECTAR TERMINAL'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
