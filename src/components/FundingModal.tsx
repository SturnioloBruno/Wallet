import React, { useState } from 'react';
import { X, PlusCircle, CreditCard, Landmark, Wallet, Globe2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { MedioOrigen, ApiHttpError } from '../types/wallet';

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

const MEDIOS_ORIGEN: {
  id: MedioOrigen;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'TARJETA_DEBITO',
    label: 'Tarjeta de Débito',
    description: 'Acreditación instantánea sin comisión adicional',
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'TARJETA_CREDITO',
    label: 'Tarjeta de Crédito',
    description: 'Financiamiento directo con confirmación inmediata',
    icon: <CreditCard className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'TRANSFERENCIA_BANCARIA',
    label: 'Transferencia Bancaria',
    description: 'Depósito interbancario vía CVU o CBU',
    icon: <Landmark className="w-5 h-5 text-indigo-400" />,
  },
  {
    id: 'SALDO_INTERNO',
    label: 'Saldo Interno',
    description: 'Compensación de fondos de cuenta vinculada',
    icon: <Wallet className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'PASARELA_EXTERNA_STRIPE',
    label: 'Pasarela Externa Stripe',
    description: 'Procesamiento internacional multimoneda',
    icon: <Globe2 className="w-5 h-5 text-purple-400" />,
  },
];

const PRESETS = [1000, 5000, 10000, 25000, 50000];

export const FundingModal: React.FC<FundingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [monto, setMonto] = useState<string>('5000');
  const [medioOrigen, setMedioOrigen] = useState<MedioOrigen>('TARJETA_DEBITO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);

    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setErrorMsg('Por favor ingrese un monto mayor a $0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.fondeo({
        monto: parsedMonto,
        medioOrigen,
      });

      const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(parsedMonto);

      onShowToast('Fondeo exitoso', `Se acreditaron ${formatted} en tu cuenta.`, 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      setErrorMsg(apiErr.message || 'Error al procesar el fondeo de la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
        
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
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Fondeo de Cuenta</h3>
            <p className="text-xs text-slate-400">POST /api/transacciones/fondeo</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Monto a Ingresar (ARS)
            </label>
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
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl font-mono-numbers text-lg text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMonto(val.toString())}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                    monto === val.toString()
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  ${val.toLocaleString('es-AR')}
                </button>
              ))}
            </div>
          </div>

          {/* Medium selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Medio de Origen del Pago
            </label>
            <div className="space-y-2">
              {MEDIOS_ORIGEN.map((medio) => (
                <label
                  key={medio.id}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    medioOrigen === medio.id
                      ? 'bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="medioOrigen"
                    value={medio.id}
                    checked={medioOrigen === medio.id}
                    onChange={() => setMedioOrigen(medio.id)}
                    className="sr-only"
                  />
                  <div className="shrink-0">{medio.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>{medio.label}</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        {medio.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {medio.description}
                    </div>
                  </div>
                  {medioOrigen === medio.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Procesando fondeo...</span>
                </>
              ) : (
                <span>Confirmar e Ingresar Fondos</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
