import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Transaccion, ToastMessage, ApiHttpError } from './types/wallet';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { BalanceCard } from './components/BalanceCard';
import { AliasCard } from './components/AliasCard';
import { FundingModal } from './components/FundingModal';
import { TransferModal } from './components/TransferModal';
import { TransactionHistory } from './components/TransactionHistory';
import { ApiDiagnosticsModal } from './components/ApiDiagnosticsModal';
import { ToastContainer } from './components/ToastContainer';
import { BehindTheScenes } from './components/BehindTheScenes';
import { ShieldCheck, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownLeft, Database, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  const [userEmail, setUserEmail] = useState<string>(
    api.getUserInfo()?.correoElectronico || ''
  );

  // =========================================================================
  // PREDIBUJO PURO DESDE CACHÉ LOCAL (CERO LLAMADAS DE RED EN EL MONTAJE)
  // =========================================================================
  const [saldo, setSaldo] = useState<number>(() => api.getCachedSaldo() ?? 0);
  const [alias, setAlias] = useState<string>(() => api.getCachedAlias() ?? '');
  const [historial, setHistorial] = useState<Transaccion[]>(() => api.getCachedHistorial() ?? []);
  const [lastSaldoUpdated, setLastSaldoUpdated] = useState<Date | null>(() => api.getCachedLastUpdated());

  // =========================================================================
  // ESTADO GLOBAL DE CARGA (MUTEX LÓGICO)
  // =========================================================================
  const [isSyncingInFlight, setIsSyncingInFlight] = useState<boolean>(false);

  // Errores
  const [saldoError, setSaldoError] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [historialError, setHistorialError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Modales
  const [isFundingOpen, setIsFundingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Navegación
  const [activeSection, setActiveSection] = useState<'dashboard' | 'historial' | 'behindTheScenes'>('dashboard');

  // Listener para enlaces directos tipo #detras-de-escena o #behind-the-scenes
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('detras-de-escena') || h.includes('behind-the-scenes') || h.includes('cv') || h.includes('desarrollo') || h.includes('arquitectura')) {
        setActiveSection('behindTheScenes');
      } else if (h.includes('historial')) {
        setActiveSection('historial');
      } else if (h.includes('dashboard')) {
        setActiveSection('dashboard');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Notificaciones Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = {
        id,
        title,
        message,
        type,
        timestamp: Date.now(),
      };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listener de 401 Unauthorized
  useEffect(() => {
    api.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      showToast(
        'Sesión expirada',
        'Tu token de sesión venció o no es válido (401). Inicia sesión nuevamente.',
        'warning'
      );
    });
  }, [showToast]);

  // =========================================================================
  // SECUENCIADOR BLOQUEANTE OBLIGATORIO (ÚNICO PUNTO DE CONTACTO CON LA RED)
  // Solo se dispara cuando el usuario presiona explícitamente "Sincronizar Billetera"
  // =========================================================================
  const handleExplicitSync = useCallback(async () => {
    // Verificación Mutex: Si ya está en vuelo, abortar inmediatamente
    if (isSyncingInFlight || api.isLocked()) {
      console.warn('[App] Sincronización rechazada: Mutex isSyncingInFlight ya está activo.');
      return;
    }

    setIsSyncingInFlight(true);
    setGlobalError(null);
    setSaldoError(null);
    setAliasError(null);
    setHistorialError(null);

    try {
      const executed = await api.executeBlockingSequentialSync({
        onSaldo: (val) => {
          setSaldo(val);
          setLastSaldoUpdated(new Date());
          setSaldoError(null);
        },
        onAlias: (val) => {
          setAlias(val);
          setAliasError(null);
        },
        onHistorial: (list) => {
          setHistorial(list);
          setHistorialError(null);
        },
        onError: (err, step) => {
          if (err.isRateLimit) {
            console.warn(`[Sync] Paso ${step} pausado por Rate Limiting (429). Conservando valores locales.`);
            return;
          }
          if (step === 'saldo') setSaldoError(err.message);
          if (step === 'alias') setAliasError(err.message);
          if (step === 'historial') setHistorialError(err.message);
        },
      });

      if (executed) {
        showToast('Sincronización completada', 'Datos actualizados secuencialmente desde Cloud Run.', 'success');
      }
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      if (!apiErr.isRateLimit) {
        setGlobalError(apiErr.message || 'Error en la sincronización.');
      }
    } finally {
      setIsSyncingInFlight(false);
    }
  }, [isSyncingInFlight, showToast]);

  // =========================================================================
  // NOTA ARQUITECTÓNICA:
  // Se eliminaron estrictamente todos los useEffect automáticos de red al montar.
  // La interfaz se dibuja 100% desde la caché local sin tocar la red.
  // =========================================================================

  // Handlers
  const handleAuthSuccess = (token: string, email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    showToast('Bienvenido', `Sesión iniciada con éxito como ${email}. Presione "Sincronizar Billetera" para refrescar saldo.`, 'success');
  };

  const handleLogout = () => {
    api.clearToken();
    setIsAuthenticated(false);
    setSaldo(0);
    setAlias('');
    setHistorial([]);
    showToast('Sesión cerrada', 'Has cerrado la sesión de tu billetera con éxito.', 'info');
  };

  const handleFundingSuccess = () => {
    // Al finalizar fondeo, se ofrece sincronizar bajo demanda
    handleExplicitSync();
  };

  const handleTransferSuccess = () => {
    // Al finalizar transferencia, se ofrece sincronizar bajo demanda
    handleExplicitSync();
  };

  const handleAliasUpdated = (newAlias: string) => {
    setAlias(newAlias);
  };

  // Si está en la sección 'behindTheScenes', renderizarla directamente tanto para invitados/reclutadores como usuarios autenticados
  if (activeSection === 'behindTheScenes') {
    return (
      <>
        <BehindTheScenes
          onBack={() => setActiveSection('dashboard')}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Si no está autenticado, renderizar la vista de Login/Registro
  if (!isAuthenticated) {
    return (
      <>
        <AuthView
          onAuthSuccess={handleAuthSuccess}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenBehindTheScenes={() => setActiveSection('behindTheScenes')}
        />
        <ApiDiagnosticsModal
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          onShowToast={showToast}
          onTokenUpdated={handleExplicitSync}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar Contract (1 fila, 3 zonas) */}
      <Navbar
        userEmail={userEmail}
        onLogout={handleLogout}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenFunding={() => setIsFundingOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        activeSection={activeSection}
        onNavigateSection={(sec) => {
          setActiveSection(sec as 'dashboard' | 'historial' | 'behindTheScenes');
          if (sec !== 'behindTheScenes') {
            const element = document.getElementById(sec);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de Sincronización en Curso (Mutex Activo) */}
        {isSyncingInFlight && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-200 text-xs flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              <span>
                Secuenciador Bloqueante Activo: Consultando Saldo, Alias e Historial con pausas de resguardo...
              </span>
            </div>
            <span className="font-mono text-[11px] text-cyan-400">Mutex Bloqueado</span>
          </div>
        )}

        {/* Global Connection / Status Header */}
        <div id="dashboard" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Billetera Financiera
            </h1>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                <span>Modo Predibujo Local Activo</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Cero llamadas automáticas de fondo</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-300">Mutex Protegido</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExplicitSync}
              disabled={isSyncingInFlight}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-400 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              title="Disparar secuenciador síncrono de saldo, alias e historial"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingInFlight ? 'animate-spin text-cyan-300' : 'text-white'}`}
              />
              <span>{isSyncingInFlight ? 'Sincronizando (Bloqueado)...' : 'Sincronizar Billetera'}</span>
            </button>
          </div>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={handleExplicitSync}
              disabled={isSyncingInFlight}
              className="underline font-semibold hover:text-white cursor-pointer"
            >
              Reintentar Secuencia
            </button>
          </div>
        )}

        {/* Top Metric Cards: Saldo & Alias (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceCard
            saldo={saldo}
            isLoading={isSyncingInFlight}
            error={saldoError}
            onRefresh={handleExplicitSync}
            onOpenFunding={() => setIsFundingOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            lastUpdated={lastSaldoUpdated}
          />

          <AliasCard
            alias={alias}
            isLoading={isSyncingInFlight}
            onRefresh={handleExplicitSync}
            onAliasUpdated={handleAliasUpdated}
            onShowToast={showToast}
          />
        </div>

        {/* Quick Summary Strip: Total Movements & Actions */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block text-[11px]">Movimientos Registrados</span>
              <span className="font-mono-numbers font-bold text-white text-base">
                {historial.length} transacciones
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-slate-400 block text-[11px]">Última Sincronización</span>
              <span className="font-mono-numbers text-slate-300">
                {lastSaldoUpdated ? lastSaldoUpdated.toLocaleTimeString() : 'Predibujado desde memoria local'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsFundingOpen(true)}
              disabled={isSyncingInFlight}
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Nuevo Fondeo</span>
            </button>
            <button
              onClick={() => setIsTransferOpen(true)}
              disabled={isSyncingInFlight}
              className="px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Nueva Transferencia</span>
            </button>
          </div>
        </div>

        {/* Transaction History Section */}
        <TransactionHistory
          transactions={historial}
          isLoading={isSyncingInFlight}
          error={historialError}
          onRefresh={handleExplicitSync}
          onOpenFunding={() => setIsFundingOpen(true)}
          onOpenTransfer={() => setIsTransferOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-300">Billetera Virtual SPA</span>
            <span aria-hidden="true">·</span>
            <span>Microservicios Usuarios & Wallet</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveSection('behindTheScenes')}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Detrás de Escena (CV &amp; RUP)</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Diagnóstico de Red
            </button>
            <span>·</span>
            <span>Microservicios en Contenedores Serverless</span>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <FundingModal
        isOpen={isFundingOpen}
        onClose={() => setIsFundingOpen(false)}
        onSuccess={handleFundingSuccess}
        onShowToast={showToast}
      />

      <TransferModal
        isOpen={isTransferOpen}
        currentBalance={saldo}
        currentAlias={alias}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={handleTransferSuccess}
        onShowToast={showToast}
      />

      <ApiDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onShowToast={showToast}
        onTokenUpdated={handleExplicitSync}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
