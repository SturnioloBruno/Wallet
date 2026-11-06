import React, { useState } from 'react';
import { X, Activity, Server, Shield, RefreshCw, CheckCircle2, XCircle, Key, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

interface ApiDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onTokenUpdated?: () => void;
}

export const ApiDiagnosticsModal: React.FC<ApiDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onTokenUpdated,
}) => {
  const [connectionMode, setConnectionMode] = useState<'auto' | 'direct' | 'proxy'>(
    api.getConnectionMode()
  );
  const [isPinging, setIsPinging] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    auth: boolean;
    wallet: boolean;
    authLatency: number;
    walletLatency: number;
  }>({
    tested: false,
    auth: false,
    wallet: false,
    authLatency: 0,
    walletLatency: 0,
  });

  const [currentToken, setCurrentToken] = useState<string>(api.getToken() || '');
  const [copiedToken, setCopiedToken] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  if (!isOpen) return null;

  const handleModeChange = (mode: 'auto' | 'direct' | 'proxy') => {
    setConnectionMode(mode);
    api.setConnectionMode(mode);
    onShowToast('Modo de conexión actualizado', `Configurado en modo: ${mode.toUpperCase()}`, 'info');
  };

  const handleTestHealth = async () => {
    setIsPinging(true);
    try {
      const res = await api.checkHealth();
      setHealthStatus({
        tested: true,
        ...res,
      });
      onShowToast('Prueba de conectividad completada', 'Se consultó el estado de ambos microservicios.', 'info');
    } catch {
      onShowToast('Error en prueba', 'No se pudo contactar a los microservicios.', 'error');
    } finally {
      setIsPinging(false);
    }
  };

  const handleCopyToken = () => {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    onShowToast('Token copiado', 'El token JWT Bearer está en el portapapeles.', 'success');
  };

  const handleApplyManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    api.setToken(manualTokenInput.trim());
    setCurrentToken(manualTokenInput.trim());
    setShowTokenInput(false);
    setManualTokenInput('');
    onShowToast('Token actualizado', 'Se guardó el nuevo token Bearer para las peticiones.', 'success');
    onTokenUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Diagnóstico y Red de Microservicios
            </h3>
            <p className="text-xs text-slate-400">Google Cloud Run southamerica-east1</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Microservices list & health check */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Endpoints Base Configurados
              </h4>
              <button
                onClick={handleTestHealth}
                disabled={isPinging}
                className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Probar Conectividad</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Auth service card */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200">Servicio de Autenticación</span>
                  {healthStatus.tested && (
                    <span className="flex items-center gap-1 text-[11px]">
                      {healthStatus.auth ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{healthStatus.authLatency}ms</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sin respuesta directa</span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  https://usuarios-836529000285.southamerica-east1.run.app
                </div>
              </div>

              {/* Wallet service card */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200">Servicio de Billetera y Transacciones</span>
                  {healthStatus.tested && (
                    <span className="flex items-center gap-1 text-[11px]">
                      {healthStatus.wallet ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{healthStatus.walletLatency}ms</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sin respuesta directa</span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  https://wallet-836529000285.southamerica-east1.run.app
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Estrategia de Enrutamiento HTTP
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleModeChange('proxy')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  connectionMode === 'proxy'
                    ? 'bg-emerald-950/20 border-emerald-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Proxy Local</span>
                  <span className="text-[9px] text-emerald-400 uppercase font-mono">Anti-CORS</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Reenvío integrado sin preflight para vista previa.
                </div>
              </button>

              <button
                onClick={() => handleModeChange('auto')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  connectionMode === 'auto'
                    ? 'bg-cyan-950/20 border-cyan-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Automático</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Proxy prioritario con fallback resiliente.
                </div>
              </button>

              <button
                onClick={() => handleModeChange('direct')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  connectionMode === 'direct'
                    ? 'bg-blue-950/20 border-blue-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Directo</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Llamadas directas a dominios Cloud Run.
                </div>
              </button>
            </div>
          </div>

          {/* Current Bearer Token */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Token Bearer Almacenado
              </h4>
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                {showTokenInput ? 'Cancelar' : 'Reemplazar token manualmente'}
              </button>
            </div>

            {showTokenInput ? (
              <form onSubmit={handleApplyManualToken} className="space-y-2 mt-2">
                <textarea
                  rows={3}
                  required
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Pegar token JWT (sin el prefijo 'Bearer ')..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Guardar y Usar Token
                </button>
              </form>
            ) : currentToken ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="font-mono text-[11px] text-slate-300 truncate max-w-sm">
                  {currentToken.slice(0, 32)}...{currentToken.slice(-16)}
                </span>
                <button
                  onClick={handleCopyToken}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Copiar token"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No hay token activo. Inicia sesión en la vista de autenticación.
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
