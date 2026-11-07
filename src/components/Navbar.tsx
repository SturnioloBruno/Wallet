import React from 'react';
import { LogOut, Activity, Wallet } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onLogout: () => void;
  onOpenDiagnostics: () => void;
  onOpenFunding: () => void;
  onOpenTransfer: () => void;
  activeSection?: string;
  onNavigateSection?: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  onLogout,
  onOpenDiagnostics,
  onOpenFunding,
  onOpenTransfer,
  activeSection = 'dashboard',
  onNavigateSection,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection?.('dashboard');
            }}
            className="text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            Billetera Virtual
          </a>
        </div>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigateSection?.('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
              activeSection === 'dashboard'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={onOpenFunding}
            className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Fondeo de Cuenta
          </button>

          <button
            onClick={onOpenTransfer}
            className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Transferir
          </button>

          <button
            onClick={() => onNavigateSection?.('historial')}
            className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
              activeSection === 'historial'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Historial de Movimientos
          </button>

          <button
            onClick={() => onNavigateSection?.('behindTheScenes')}
            className={`flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 text-left cursor-pointer px-2.5 py-1 rounded-lg ${
              activeSection === 'behindTheScenes'
                ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 border border-emerald-500/20'
            }`}
            title="Conoce la arquitectura RUP, microservicios y credenciales del desarrollador"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Detrás de Escena (CV &amp; RUP)</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Diagnóstico de Microservicios Cloud Run y Proxy"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Estado de Red</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action or profile / sign out */}
        <div className="flex items-center gap-3 shrink-0">
          {userEmail && (
            <div className="hidden lg:flex items-center text-xs text-slate-400 pr-2">
              <span className="truncate max-w-[180px]">{userEmail}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Cerrar Sesión del sistema"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </header>
  );
};
