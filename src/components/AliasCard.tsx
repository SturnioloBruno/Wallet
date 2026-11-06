import React, { useState } from 'react';
import { Copy, Check, Edit3, AtSign, RefreshCw, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ApiHttpError } from '../types/wallet';

interface AliasCardProps {
  alias: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAliasUpdated: (newAlias: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export const AliasCard: React.FC<AliasCardProps> = ({
  alias,
  isLoading,
  onRefresh,
  onAliasUpdated,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newAliasInput, setNewAliasInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
      setCopied(true);
      onShowToast('Alias copiado', `El alias "${alias}" se copió al portapapeles.`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Error al copiar', 'No se pudo acceder al portapapeles del navegador.', 'error');
    }
  };

  const handleStartEdit = () => {
    setNewAliasInput(alias || '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAliasInput.trim();
    if (!trimmed) {
      setEditError('El alias no puede estar vacío.');
      return;
    }

    if (trimmed === alias) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await api.updateAlias(trimmed);
      onAliasUpdated(trimmed);
      setIsEditing(false);
      onShowToast('Alias actualizado', `Tu nuevo alias financiero es "${trimmed}".`, 'success');
    } catch (err: unknown) {
      const apiErr = err as ApiHttpError;
      setEditError(apiErr.message || 'Error al actualizar el alias.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-transparent" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <AtSign className="w-4 h-4 text-cyan-400" />
            <span>Alias Financiero Único</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${
                isLoading ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Recargar alias"
              aria-label="Recargar alias"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alias Content */}
        {!isEditing ? (
          <div className="my-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="font-mono text-base sm:text-lg font-bold text-cyan-300 truncate tracking-wide">
                {alias ? alias : isLoading ? 'Cargando...' : 'Sin alias asignado'}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={handleCopy}
                  disabled={!alias}
                  className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  title="Copiar alias"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleStartEdit}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Modificar alias"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Utiliza este alias para recibir transferencias internas inmediatamente.
            </p>
          </div>
        ) : (
          /* Inline Edit Form */
          <form onSubmit={handleSaveAlias} className="my-2 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Nuevo Alias Financiero
              </label>
              <input
                type="text"
                autoFocus
                required
                value={newAliasInput}
                onChange={(e) => setNewAliasInput(e.target.value.toLowerCase().trim())}
                placeholder="ejemplo.wallet.cvu"
                className="w-full px-3.5 py-2 bg-slate-950 border border-cyan-500/50 rounded-xl font-mono text-sm text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {editError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Alias</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>PUT /api/billeteras/alias</span>
        <button
          onClick={handleStartEdit}
          className="text-cyan-400 hover:underline cursor-pointer"
        >
          Editar alias
        </button>
      </div>
    </div>
  );
};
