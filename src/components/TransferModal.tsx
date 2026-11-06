import React, { useState } from 'react';
import { X, Send, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { ApiHttpError } from '../types/wallet';

interface TransferModalProps {
  isOpen: boolean;
  currentBalance: number;
  currentAlias: string;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  currentBalance,
  currentAlias,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [aliasDestino, setAliasDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const parsedMonto = parseFloat(monto) || 0;
  const isBalanceExceeded = parsedMonto > currentBalance;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAlias = aliasDestino.trim().toLowerCase();

    if (!cleanAlias) {
      setErrorMsg('Debe ingresar un alias de destino válido.');
      return;
    }

    if (currentAlias && cleanAlias === currentAlias.toLowerCase()) {
      setErrorMsg('No puedes transferirte a tu propio alias.');
      return;
    }

    if (parsedMonto <= 0) {
      setErrorMsg('El monto a transferir debe ser mayor a $0.');
      return;
    }

    setErrorMsg(null);
    setIsConfirming(true);
  };

  const handleExecuteTransfer = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.transferenciaInterna({
        aliasDestino: aliasDestino.trim().toLowerCase(),
        monto: parsedMonto,
      });

      const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(parsedMonto);

      onShowToast(
        'Transferencia enviada',
        `Se transfirieron ${formatted} exitosamente al alias "${aliasDestino.trim()}".`,
        'success'
      );

      onSuccess();
      onClose();
      setIsConfirming(false);
      setAliasDestino('');
      setMonto('');
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      setErrorMsg(apiErr.message || 'Error al ejecutar la transferencia interna.');
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Transferencia Interna</h3>
            <p className="text-xs text-slate-400">POST /api/transacciones/transferencia-interna</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {!isConfirming ? (
          <form onSubmit={handleReview} className="space-y-4">
            {/* Destination Alias */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Alias de Destino
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={aliasDestino}
                  onChange={(e) => setAliasDestino(e.target.value.toLowerCase().trim())}
                  placeholder="ej. juan.finanzas.cvu"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl font-mono text-sm text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ingresa el alias registrado del destinatario en el sistema.
              </p>
            </div>

            {/* Monto */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Monto a Transferir (ARS)
                </label>
                <span className="text-[11px] text-slate-400 font-mono-numbers">
                  Saldo: ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-base font-semibold">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-9 pr-16 py-2.5 bg-slate-950 border rounded-xl font-mono-numbers text-lg text-white placeholder-slate-600 focus:outline-none focus:ring-1 ${
                    isBalanceExceeded
                      ? 'border-rose-500/80 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMonto(currentBalance.toString())}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  MÁXIMO
                </button>
              </div>

              {isBalanceExceeded && (
                <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  El monto excede su saldo disponible actual.
                </p>
              )}
            </div>

            {/* Submit button to review */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isBalanceExceeded || parsedMonto <= 0 || !aliasDestino.trim()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-40 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Revisar Transferencia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 pb-2 border-b border-slate-800">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Confirmar datos de la transferencia</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Alias Destino:</span>
                <span className="font-mono font-bold text-cyan-300">{aliasDestino}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Monto a Enviar:</span>
                <span className="font-mono-numbers font-bold text-white text-base">
                  ${parsedMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Saldo Restante Estimado:</span>
                <span className="font-mono-numbers text-slate-300">
                  ${(currentBalance - parsedMonto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Las transferencias internas se procesan en tiempo real y no pueden ser canceladas una vez confirmadas.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Enviando dinero...</span>
                  </>
                ) : (
                  <span>Confirmar y Enviar</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
