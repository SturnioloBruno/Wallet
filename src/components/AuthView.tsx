import React, { useState } from 'react';
import { api } from '../services/api';
import { ApiHttpError } from '../types/wallet';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Globe,
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (token: string, email: string) => void;
  onOpenDiagnostics: () => void;
  onOpenBehindTheScenes?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onOpenDiagnostics,
  onOpenBehindTheScenes,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({
        correoElectronico: loginEmail,
        contrasena: loginPassword,
      });

      const token = response.tokenAcceso || response.token || response.accessToken || '';
      onAuthSuccess(token, loginEmail);
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      setErrorMessage(
        apiErr.message || 'Error al autenticar. Verifique sus credenciales o el estado del microservicio.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      await api.register({
        nombre: regName,
        correoElectronico: regEmail,
        contrasena: regPassword,
      });

      setSuccessMessage('¡Usuario registrado con éxito! Ahora puede iniciar sesión con sus credenciales.');
      // Pre-fill login email and switch to login tab
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setMode('login');
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      setErrorMessage(
        apiErr.message || 'Error en el registro. Verifique que el correo no esté ya registrado.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Bar for Auth Screen */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Billetera Virtual</span>
          <span className="text-slate-600">·</span>
          <span>Microservicios en Contenedores</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBehindTheScenes}
            className="flex items-center gap-1.5 px-3 py-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg transition-all cursor-pointer font-medium"
            title="Ver arquitectura RUP, microservicios y CV de Bruno Sturniolo"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Detrás de Escena (CV &amp; RUP)</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diagnóstico de Red</span>
          </button>
        </div>
      </div>

      {/* Main Centered Container */}
      <div className="max-w-md w-full mx-auto my-auto pt-6 pb-8">
        
        {/* Recruiter / HR Highlight Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Sobre el Desarrollador
            </span>
            <span className="text-[11px] font-medium text-slate-400">Bruno S. Sturniolo</span>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-white leading-snug">
            Backend Developer con Cultura DevOps
          </h2>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Aplicaciones ligeras, económicas y de alto rendimiento (persistencia híbrida, RUP, modelado BCE y despliegues serverless).
          </p>
          <button
            type="button"
            onClick={onOpenBehindTheScenes}
            className="w-full mt-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ver Detrás de Escena &amp; Contacto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Sistema de Billetera Virtual
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Acceso seguro a su cuenta financiera, transferencias inmediatas y consulta de saldos.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          
          {/* Segmented Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Autenticando...
                    </span>
                  ) : (
                    <>
                      <span>Ingresar al Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Form: REGISTER */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Bruno Sturniolo"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Registrando usuario...
                    </span>
                  ) : (
                    <>
                      <span>Crear Cuenta en Billetera</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Microservice Endpoint Info Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-300">Microservicio de Autenticación:</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 truncate">
              {mode === 'login' ? 'POST /api/usuarios/autenticacion' : 'POST /api/usuarios/registro'}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-400 space-y-2">
        <p>Capa de Presentación SPA conectada a microservicios en la nube</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenBehindTheScenes}
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
          >
            Detrás de Escena &amp; Arquitectura RUP (CV Técnico)
          </button>
          <span>·</span>
          <span>Desarrollado por Bruno S. Sturniolo</span>
        </div>
      </footer>
    </div>
  );
};
