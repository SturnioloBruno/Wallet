import React, { useState } from 'react';
import { ArchitectureDiagram } from '../data/architectureData';
import {
  Copy,
  Check,
  Code2,
  Layers,
  ExternalLink,
  Maximize2,
  Minimize2,
  Shield,
  Server,
  Database,
  ArrowRight,
  GitBranch,
  FileCode,
  Info,
} from 'lucide-react';

interface DiagramRendererProps {
  diagram: ArchitectureDiagram;
  onShowToast?: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ diagram, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'plantuml'>('visual');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyPlantUml = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(diagram.plantUmlCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = diagram.plantUmlCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onShowToast?.('Copiado al portapapeles', 'Código PlantUML listo para pegar en IntelliJ, VS Code o PlantUML Server.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast?.('Error al copiar', 'No se pudo acceder al portapapeles.', 'error');
    }
  };

  const getPlantUmlWebUrl = () => {
    // Generar URL hacia el servidor público de PlantUML con el código en texto plano
    try {
      const encoded = encodeURIComponent(diagram.plantUmlCode);
      return `https://www.plantuml.com/plantuml/uml/~h${encoded}`;
    } catch {
      return 'https://www.plantuml.com/plantuml';
    }
  };

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
        isExpanded ? 'fixed inset-4 z-50 overflow-y-auto bg-slate-950/98 border-emerald-500/50 p-6' : ''
      }`}
    >
      {/* Diagram Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {diagram.categoryLabel}
            </span>
            <span className="text-xs text-slate-500 font-mono truncate max-w-xs">{diagram.assetFile}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{diagram.title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">{diagram.subtitle}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Esquema Interactivo</span>
            </button>
            <button
              onClick={() => setActiveTab('plantuml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'plantuml'
                  ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código PlantUML</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            title={isExpanded ? 'Contraer vista' : 'Expandir a pantalla completa'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Architectural Narrative & Business Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Info className="w-3.5 h-3.5" />
              <span>Propósito Técnico RUP & Decisión de Diseño</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{diagram.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Impacto en Producción & Tolerancia a Fallos</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{diagram.businessImpact}</p>
          </div>
        </div>

        {/* Design Patterns & Tech Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider mr-1">Patrones:</span>
          {diagram.designPatterns.map((pat, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
            >
              {pat}
            </span>
          ))}

          <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider ml-2 mr-1">Stack:</span>
          {diagram.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* TAB 1: Visual Interactive View */}
        {activeTab === 'visual' && (
          <div className="space-y-6">
            {/* BCE Category Badges if available */}
            {diagram.bceRoles && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>Descomposición Formal RUP (Boundary - Control - Entity / DAO)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Boundary */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Boundary (Frontera REST)</span>
                    </div>
                    <ul className="space-y-1 text-xs font-mono text-slate-300">
                      {diagram.bceRoles.boundaries?.map((b, i) => (
                        <li key={i} className="truncate">
                          • {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Control */}
                  <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                    <div className="text-[11px] font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Control (Casos de Uso)</span>
                    </div>
                    <ul className="space-y-1 text-xs font-mono text-slate-300">
                      {diagram.bceRoles.controls?.map((c, i) => (
                        <li key={i} className="truncate">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Entity / DAO */}
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                    <div className="text-[11px] font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Entity / DAO (Persistencia)</span>
                    </div>
                    <ul className="space-y-1 text-xs font-mono text-slate-300">
                      {diagram.bceRoles.entitiesDaos?.map((e, i) => (
                        <li key={i} className="truncate">
                          • {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Key Nodes / Timeline Execution Flow */}
            {diagram.keyStepsOrNodes && diagram.keyStepsOrNodes.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Flujo de Ejecución & Componentes Clave:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {diagram.keyStepsOrNodes.map((step, idx) => {
                    const isHighlight = step.highlight;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isHighlight
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              step.type === 'boundary'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : step.type === 'control'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : step.type === 'security'
                                ? 'bg-rose-500/20 text-rose-300'
                                : step.type === 'gateway'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {step.type || 'Paso'}
                          </span>
                          <span className="font-mono text-xs text-slate-500">#{idx + 1}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5 leading-snug">{step.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SVG Interactive Architecture Canvas */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
                <GitBranch className="w-3 h-3 text-emerald-400" />
                <span>UML Renderer Engine</span>
              </div>

              {/* Dynamic Diagram Visualizer by ID */}
              {renderSpecializedSvg(diagram.id)}
            </div>
          </div>
        )}

        {/* TAB 2: PlantUML Raw Code */}
        {activeTab === 'plantuml' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Especificación Formal PlantUML (.puml)</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500 text-[11px]">{diagram.plantUmlCode.split('\n').length} líneas</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPlantUml}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar PlantUML'}</span>
                </button>

                <a
                  href={getPlantUmlWebUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <span>Abrir Servidor PlantUML</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 p-4 max-h-[460px] overflow-y-auto">
              <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                <code>{diagram.plantUmlCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized schematic renderer for each diagram
function renderSpecializedSvg(diagramId: string) {
  switch (diagramId) {
    case 'diagrama-despliegue':
      return (
        <div className="w-full py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Node 1: Browser */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-white">Cliente (Navegador)</div>
              <div className="text-[11px] text-slate-400">Single Page Application (SPA / React)</div>
              <div className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">Capa de Presentación</div>
            </div>

            {/* Protocol Arrow */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-mono text-emerald-400 mb-1">HTTPS / TLS 1.3</div>
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-emerald-500 relative flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-emerald-400 absolute right-0" />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Payload DTOs + Bearer</div>
            </div>

            {/* Node 2: Container Wallet */}
            <div className="p-4 rounded-xl bg-slate-900 border-2 border-emerald-500/60 text-center space-y-2 shadow-lg shadow-emerald-950/50">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-white">Contenedor Serverless</div>
              <div className="text-[11px] text-emerald-300 font-semibold">wallet-service.jar</div>
              <div className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-left">
                🔑 Clave Pública RSA (Validación en memoria)
              </div>
            </div>

            {/* Node 3 & 4: Databases */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center gap-3">
                <Database className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="text-left text-xs">
                  <div className="font-bold text-white">Almacenamiento Relacional</div>
                  <div className="text-[10px] text-slate-400 font-mono">Motor Distribuido / Transacciones ACID</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center gap-3">
                <Database className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left text-xs">
                  <div className="font-bold text-white">Almacén de Identidad</div>
                  <div className="text-[10px] text-slate-400 font-mono">No Relacional (Clave Privada RSA)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'diagrama-componentes':
      return (
        <div className="w-full py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subsistema Auth */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Microservicio Usuarios & Autenticación
                </span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                  Emisor de Tokens
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                📦 auth-service.jar
              </div>
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Módulo RSA: Custodia la Clave Privada para firmar tokens JWT</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Almacén No Relacional de Identidad</span>
              </div>
            </div>

            {/* Subsistema Wallet */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Microservicio Billetera Virtual
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                  Consumidor Criptográfico
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                📦 wallet-service.jar (Spring Boot)
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Módulo de Validación: Clave Pública RSA para verificar firmas en 0ms</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Almacenamiento Relacional (Persistencia Directa / Pool Optimizado)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="font-mono text-emerald-400">Contrato de Comunicación:</span>
            <span>API REST asíncrona / Intercambio de Clave Pública HTTPS sin dependencias en tiempo de ejecución.</span>
          </div>
        </div>
      );

    case 'secuencia-transferencia-interna':
      return (
        <div className="w-full py-4 space-y-3">
          <div className="space-y-2 text-xs font-mono">
            {[
              {
                num: '01',
                actor: 'Usuario Emisor → TransaccionBoundary',
                msg: 'POST /api/transacciones/transferencia-interna (Authorization: Bearer JWT)',
                badge: 'HTTP REST',
                color: 'text-emerald-400',
              },
              {
                num: '02',
                actor: 'TransaccionBoundary → JwtAuthFilter',
                msg: 'doFilter(): Valida matemáticamente firma asimétrica con Clave Pública RSA local',
                badge: 'RSA Crypto (0 ms DB)',
                color: 'text-cyan-400',
              },
              {
                num: '03',
                actor: 'JwtAuthFilter → TransferenciaInternaControl',
                msg: 'Inyecta idUsuarioAutenticado en contexto y delega ejecutarTransferenciaPorAlias()',
                badge: 'Control RUP',
                color: 'text-blue-400',
              },
              {
                num: '04',
                actor: 'TransferenciaInternaControl → BilleteraJdbcDAO',
                msg: 'buscarPorIdUsuario(origen) y buscarPorAlias(destino)',
                badge: 'DAO HikariCP',
                color: 'text-amber-400',
              },
              {
                num: '05',
                actor: 'TransferenciaInternaControl → Entity',
                msg: 'Validar suficiencia de fondos (saldo >= monto) y cuentas distintas',
                badge: 'Regla de Negocio',
                color: 'text-purple-400',
              },
              {
                num: '06',
                actor: 'TransferenciaInternaControl → BilleteraJdbcDAO',
                msg: 'actualizarSaldo(origen) && actualizarSaldo(destino) en transacción atómica',
                badge: 'PostgreSQL ACID',
                color: 'text-emerald-400',
              },
              {
                num: '07',
                actor: 'TransferenciaInternaControl → TransaccionDAO',
                msg: 'guardarTransferenciaInterna() -> HTTP 201 Created comprobante',
                badge: 'Audit Trail OK',
                color: 'text-emerald-400',
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-500">[{step.num}]</span>
                  <span className="font-semibold text-white">{step.actor}:</span>
                  <span className="text-slate-300">{step.msg}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${step.color} shrink-0`}>
                  {step.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'secuencia-usuario-sincronico':
      return (
        <div className="w-full py-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-emerald-400">1. Registro Inicial en Servicio de Identidad</div>
            <p className="text-slate-300">
              Usuario Boundary recibe datos → AutenticacionControl valida correo → UsuarioDao persiste en almacén NoSQL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fallback branch */}
            <div className="p-4 rounded-xl bg-rose-950/20 border-2 border-rose-500/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <Shield className="w-4 h-4" />
                <span>Rama A: Fallo de Red o Timeout (HTTP 503)</span>
              </div>
              <p className="text-slate-300">
                El nodo de Billetera no responde o falla la comunicación remota.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-rose-300 border border-rose-500/20">
                ⚡ Transacción Compensatoria (Saga):
                <br />
                Control -&gt; Dao: eliminarUsuario(idUsuario)
                <br />
                <span className="text-slate-400">// Reversión atómica en almacén de identidad para garantizar consistencia.</span>
              </div>
            </div>

            {/* Success branch */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Rama B: Apertura Exitosa (HTTP 201)</span>
              </div>
              <p className="text-slate-300">
                Billetera creada y asociada exitosamente al idUsuario en almacenamiento relacional.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 border border-emerald-500/20">
                ✅ Confirmación Sincrónica:
                <br />
                Usuario dado de alta + Billetera vinculada.
                <br />
                <span className="text-slate-400">// Estado consistente garantizado en ambos microservicios.</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'modelo-solucion-2':
      return (
        <div className="w-full py-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* Boundary */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Capa Boundary (Frontera)</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                BilleteraBoundary
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  + consultarSaldo()
                  <br />+ consultarAlias()
                  <br />+ actualizarAlias()
                  <br />+ aperturarBilletera()
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                TransaccionBoundary
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  + realizarFondeo()
                  <br />+ realizarTransferencia()
                  <br />+ consultarHistorial()
                </div>
              </div>
            </div>

            {/* Control */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Capa Control (Casos de Uso)</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                TransferenciaInternaControl
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">+ ejecutarTransferenciaPorAlias()</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                RealizarFondeoControl
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">+ ejecutarFondeoPorUsuario()</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                GestionBilleteraControl
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">+ verificarYConsultarSaldo()</div>
              </div>
            </div>

            {/* Entity / DAO */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Capa Entity / DAO (Infra)</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                BilleteraJdbcDAO
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  - jdbcTemplate: JdbcTemplate
                  <br />+ actualizarSaldo()
                  <br />+ buscarPorAlias()
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                Billetera &amp; Transaccion
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  • TransferenciaInterna (extends)
                  <br />• Fondeo (extends)
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-300">
          <p className="mb-2">Esquema vectorial interactivo sincronizado con la especificación PlantUML del proyecto.</p>
          <span className="text-emerald-400 font-mono text-[11px]">
            Seleccione la pestaña &quot;Código PlantUML&quot; para auditar la definición completa.
          </span>
        </div>
      );
  }
}
