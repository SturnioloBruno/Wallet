export type MedioOrigen =
  | 'TARJETA_CREDITO'
  | 'TARJETA_DEBITO'
  | 'TRANSFERENCIA_BANCARIA'
  | 'SALDO_INTERNO'
  | 'PASARELA_EXTERNA_STRIPE';

export interface UserLoginRequest {
  correoElectronico: string;
  contrasena: string;
}

export interface UserRegisterRequest {
  correoElectronico: string;
  nombre: string;
  contrasena: string;
}

export interface AuthResponse {
  tokenAcceso?: string;
  token?: string;
  accessToken?: string;
  mensaje?: string;
  [key: string]: unknown;
}

export interface SaldoResponse {
  saldoActual?: number | string;
  saldo?: number;
  monto?: number;
  balance?: number;
  moneda?: string;
  [key: string]: unknown;
}

export interface AliasResponse {
  alias?: string;
  [key: string]: unknown;
}

export interface UpdateAliasRequest {
  alias: string;
}

export interface FondeoRequest {
  monto: number;
  medioOrigen: MedioOrigen;
}

export interface TransferenciaRequest {
  aliasDestino: string;
  monto: number;
}

export interface Transaccion {
  id?: string | number;
  tipo?: string;
  tipoTransaccion?: string;
  movimiento?: 'CREDITO' | 'DEBITO' | 'CRÉDITO' | 'DÉBITO' | string;
  monto: number;
  estado?: 'COMPLETADA' | 'PENDIENTE' | 'FALLIDA' | 'APROBADA' | 'RECHAZADA' | string;
  fecha?: string;
  fechaCreacion?: string;
  timestamp?: string | number;
  descripcion?: string;
  medioOrigen?: string;
  aliasDestino?: string;
  aliasOrigen?: string;
  cuentaDestino?: string;
  cuentaOrigen?: string;
  [key: string]: unknown;
}

export interface ApiHttpError {
  status: number;
  statusText: string;
  message: string;
  details?: unknown;
  url?: string;
  isRateLimit?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}
