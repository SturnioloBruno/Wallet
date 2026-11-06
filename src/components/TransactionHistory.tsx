import React, { useState, useMemo } from 'react';
import {
  Transaccion,
  ApiHttpError,
} from '../types/wallet';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  History,
  FileText,
  X,
  PlusCircle,
  Send,
  AlertCircle,
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaccion[];
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onOpenFunding: () => void;
  onOpenTransfer: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
  error,
  onRefresh,
  onOpenFunding,
  onOpenTransfer,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CREDITO' | 'DEBITO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);

  // Normalize movement type helper
  const getMovement = (tx: Transaccion): 'CREDITO' | 'DEBITO' => {
    const raw = (tx.movimiento || '').toUpperCase();
    if (raw.includes('CREDIT') || raw.includes('CRÉDIT') || raw.includes('INGRESO') || raw.includes('FONDEO')) {
      return 'CREDITO';
    }
    if (raw.includes('DEBIT') || raw.includes('DÉBIT') || raw.includes('EGRESO') || raw.includes('TRANSFER')) {
      return 'DEBITO';
    }
    // Fallback based on transaction type if movimiento is missing
    const tipo = (tx.tipo || tx.tipoTransaccion || '').toUpperCase();
    if (tipo.includes('FONDEO') || tipo.includes('DEPOSITO') || tipo.includes('RECEPCION')) {
      return 'CREDITO';
    }
    return 'DEBITO';
  };

  // Format currency
  const formatMonto = (amount: number, movimiento: 'CREDITO' | 'DEBITO') => {
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));

    return movimiento === 'CREDITO' ? `+${formatted}` : `-${formatted}`;
  };

  // Format date helper
  const formatDate = (tx: Transaccion) => {
    const raw = tx.fecha || tx.fechaCreacion || tx.timestamp;
    if (!raw) return 'Fecha reciente';
    try {
      const date = new Date(raw);
      if (isNaN(date.getTime())) return String(raw);
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(raw);
    }
  };

  // Clean status indicator
  const renderStatus = (status?: string) => {
    const st = (status || 'COMPLETADA').toUpperCase();
    if (st.includes('COMPLET') || st.includes('APROB') || st.includes('EXITO')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Completada</span>
        </span>
      );
    }
    if (st.includes('PENDI') || st.includes('PROCES')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Pendiente</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium">
        <XCircle className="w-3.5 h-3.5" />
        <span>{status || 'Fallida'}</span>
      </span>
    );
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      const mov = getMovement(tx);
      if (filterType !== 'ALL' && mov !== filterType) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const tipo = (tx.tipo || tx.tipoTransaccion || '').toLowerCase();
        const desc = (tx.descripcion || '').toLowerCase();
        const aliasDest = (tx.aliasDestino || '').toLowerCase();
        const aliasOrig = (tx.aliasOrigen || '').toLowerCase();
        const medio = (tx.medioOrigen || '').toLowerCase();
        const id = String(tx.id || '').toLowerCase();

        return (
          tipo.includes(query) ||
          desc.includes(query) ||
          aliasDest.includes(query) ||
          aliasOrig.includes(query) ||
          medio.includes(query) ||
          id.includes(query)
        );
      }

      return true;
    });
  }, [transactions, filterType, searchQuery]);

  return (
    <div id="historial" className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
      
      {/* Table Header Section */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Historial de Movimientos
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registro cronológico de fondeos y transferencias (GET /api/transacciones/historial)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5">
          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('CREDITO')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'CREDITO'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Créditos (+)
            </button>
            <button
              onClick={() => setFilterType('DEBITO')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'DEBITO'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Débitos (-)
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por alias, tipo o ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Cache or Error Notice */}
      {error && transactions.length === 0 && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs underline hover:text-white font-medium cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
              <th className="py-3 px-4 sm:px-6">Tipo / Movimiento</th>
              <th className="py-3 px-4 sm:px-6">Detalle / Destino</th>
              <th className="py-3 px-4 sm:px-6">Fecha</th>
              <th className="py-3 px-4 sm:px-6">Estado</th>
              <th className="py-3 px-4 sm:px-6 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading && transactions.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="h-4 bg-slate-800 rounded w-28 mb-1" />
                    <div className="h-3 bg-slate-850 rounded w-16" />
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="h-4 bg-slate-800 rounded w-36" />
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="h-3 bg-slate-800 rounded w-24" />
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="h-4 bg-slate-800 rounded w-20" />
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="h-4 bg-slate-800 rounded w-24 ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredList.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {searchQuery || filterType !== 'ALL'
                        ? 'No se encontraron movimientos con los filtros actuales'
                        : 'Aún no tienes movimientos registrados'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {searchQuery || filterType !== 'ALL'
                        ? 'Intenta restablecer la búsqueda o el filtro de créditos y débitos.'
                        : 'Realiza tu primer fondeo de cuenta o transfiere dinero a otro usuario para comenzar.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onOpenFunding}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Fondeo de Cuenta</span>
                      </button>
                      <button
                        onClick={onOpenTransfer}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Transferir</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Populated list
              filteredList.map((tx, idx) => {
                const mov = getMovement(tx);
                const isCredito = mov === 'CREDITO';
                const tipoDisplay = tx.tipo || tx.tipoTransaccion || (isCredito ? 'FONDEO' : 'TRANSFERENCIA');
                const detailDisplay =
                  tx.aliasDestino ? `Hacia: ${tx.aliasDestino}` :
                  tx.aliasOrigen ? `Desde: ${tx.aliasOrigen}` :
                  tx.medioOrigen ? `Medio: ${tx.medioOrigen}` :
                  tx.descripcion || 'Operación de billetera';

                return (
                  <tr
                    key={tx.id || idx}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Tipo / Movimiento */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredito
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isCredito ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white tracking-tight">
                            {tipoDisplay}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {mov === 'CREDITO' ? 'Crédito a favor' : 'Débito'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Detalle */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-slate-300 font-mono text-[11px] truncate max-w-[200px] sm:max-w-xs">
                        {detailDisplay}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(tx)}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      {renderStatus(tx.estado)}
                    </td>

                    {/* Monto */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <span
                        className={`font-mono-numbers text-sm font-bold ${
                          isCredito ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {formatMonto(tx.monto, mov)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Drawer / Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Comprobante de Transacción</h3>
                <p className="text-xs text-slate-400">Detalles registrados en el microservicio</p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Tipo:</span>
                <span className="font-semibold text-white">
                  {selectedTx.tipo || selectedTx.tipoTransaccion || 'Operación'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Movimiento:</span>
                <span className="font-semibold text-white">
                  {getMovement(selectedTx)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Monto:</span>
                <span className="font-mono-numbers font-bold text-emerald-400 text-sm">
                  {formatMonto(selectedTx.monto, getMovement(selectedTx))}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Estado:</span>
                <div>{renderStatus(selectedTx.estado)}</div>
              </div>

              {selectedTx.aliasDestino && (
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Alias Destino:</span>
                  <span className="font-mono text-cyan-300">{selectedTx.aliasDestino}</span>
                </div>
              )}

              {selectedTx.medioOrigen && (
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Medio de Origen:</span>
                  <span className="font-mono text-slate-300">{selectedTx.medioOrigen}</span>
                </div>
              )}

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="text-slate-300">{formatDate(selectedTx)}</span>
              </div>
            </div>

            {/* Raw JSON inspection collapsible for transparency & debugging */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <details className="text-[11px] text-slate-400">
                <summary className="cursor-pointer hover:text-slate-300 select-none">
                  Ver payload crudo recibido (JSON)
                </summary>
                <pre className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedTx, null, 2)}
                </pre>
              </details>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
