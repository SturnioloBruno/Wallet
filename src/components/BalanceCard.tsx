import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, PlusCircle, Send, Wallet, AlertCircle } from 'lucide-react';

interface BalanceCardProps {
  saldo: number;
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onOpenFunding: () => void;
  onOpenTransfer: () => void;
  lastUpdated?: Date | null;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  saldo,
  isLoading,
  error,
  onRefresh,
  onOpenFunding,
  onOpenTransfer,
  lastUpdated,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Currency formatter
  const formattedBalance = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(saldo);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
      {/* Decorative hairline gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-transparent" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Saldo Financiero Disponible</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
              aria-label={isVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${
                isLoading ? 'animate-spin text-emerald-400' : ''
              }`}
              title="Actualizar saldo desde el microservicio"
              aria-label="Actualizar saldo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono-numbers">
              {isVisible ? formattedBalance : '$ ••••••••'}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap items-center gap-2">
            <span>GET /api/billeteras/saldo</span>
            {lastUpdated && (
              <>
                <span aria-hidden="true">·</span>
                <span>Actualizado: {lastUpdated.toLocaleTimeString()}</span>
              </>
            )}
            {error && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Caché local</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action CTAs */}
      <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center gap-3">
        <button
          onClick={onOpenFunding}
          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingresar Dinero</span>
        </button>

        <button
          onClick={onOpenTransfer}
          className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-100 border border-slate-700/70 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-cyan-400" />
          <span>Transferir</span>
        </button>
      </div>
    </div>
  );
};
