import {
  UserLoginRequest,
  UserRegisterRequest,
  AuthResponse,
  SaldoResponse,
  AliasResponse,
  FondeoRequest,
  TransferenciaRequest,
  Transaccion,
  ApiHttpError,
} from '../types/wallet';

const DEFAULT_AUTH_BASE = 'https://usuarios-836529000285.southamerica-east1.run.app';
const DEFAULT_WALLET_BASE = 'https://wallet-836529000285.southamerica-east1.run.app';

const PROXY_AUTH_BASE = '/proxy-auth';
const PROXY_WALLET_BASE = '/proxy-wallet';

const TOKEN_STORAGE_KEY = 'billetera_token_acceso';
const USER_INFO_KEY = 'billetera_usuario_info';
const CONNECTION_MODE_KEY = 'billetera_connection_mode'; // 'auto' | 'direct' | 'proxy'

// Cache storage keys
const CACHE_SALDO_KEY = 'billetera_cache_saldo';
const CACHE_ALIAS_KEY = 'billetera_cache_alias';
const CACHE_HISTORIAL_KEY = 'billetera_cache_historial';
const CACHE_UPDATED_KEY = 'billetera_cache_last_updated';

export class WalletApiService {
  private static instance: WalletApiService;
  private onUnauthorizedCallback?: () => void;
  private onRateLimitChangeCallback?: (isThrottled: boolean, retryInMs?: number) => void;

  // Rate-limiting & Queue state
  private walletRequestQueue: Promise<unknown> = Promise.resolve();
  private lastWalletRequestFinishTime = 0;
  private minWalletRequestIntervalMs = 450; // Minimum spacing between requests to prevent 429

  private constructor() {}

  public static getInstance(): WalletApiService {
    if (!WalletApiService.instance) {
      WalletApiService.instance = new WalletApiService();
    }
    return WalletApiService.instance;
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public setOnRateLimitChange(callback: (isThrottled: boolean, retryInMs?: number) => void) {
    this.onRateLimitChangeCallback = callback;
  }

  // --- Auth Token Management ---
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  public setToken(token: string, persist: boolean = true) {
    if (persist) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  public clearToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    this.clearCache();
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && token.trim().length > 0;
  }

  public setUserInfo(info: { correoElectronico?: string; nombre?: string }) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
  }

  public getUserInfo(): { correoElectronico?: string; nombre?: string } | null {
    try {
      const data = localStorage.getItem(USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // --- Local Cache & Pre-rendering Management ---
  public getCachedSaldo(): number | null {
    try {
      const val = localStorage.getItem(CACHE_SALDO_KEY);
      return val !== null ? parseFloat(val) : null;
    } catch {
      return null;
    }
  }

  public setCachedSaldo(saldo: number) {
    try {
      localStorage.setItem(CACHE_SALDO_KEY, String(saldo));
      this.setCachedLastUpdated();
    } catch {
      // Ignore storage quota errors
    }
  }

  public getCachedAlias(): string | null {
    try {
      return localStorage.getItem(CACHE_ALIAS_KEY);
    } catch {
      return null;
    }
  }

  public setCachedAlias(alias: string) {
    try {
      localStorage.setItem(CACHE_ALIAS_KEY, alias);
      this.setCachedLastUpdated();
    } catch {
      // Ignore storage quota errors
    }
  }

  public getCachedHistorial(): Transaccion[] | null {
    try {
      const val = localStorage.getItem(CACHE_HISTORIAL_KEY);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  public setCachedHistorial(historial: Transaccion[]) {
    try {
      localStorage.setItem(CACHE_HISTORIAL_KEY, JSON.stringify(historial));
      this.setCachedLastUpdated();
    } catch {
      // Ignore storage quota errors
    }
  }

  public getCachedLastUpdated(): Date | null {
    try {
      const val = localStorage.getItem(CACHE_UPDATED_KEY);
      return val ? new Date(parseInt(val, 10)) : null;
    } catch {
      return null;
    }
  }

  private setCachedLastUpdated() {
    try {
      localStorage.setItem(CACHE_UPDATED_KEY, String(Date.now()));
    } catch {
      // Ignore storage quota errors
    }
  }

  public clearCache() {
    localStorage.removeItem(CACHE_SALDO_KEY);
    localStorage.removeItem(CACHE_ALIAS_KEY);
    localStorage.removeItem(CACHE_HISTORIAL_KEY);
    localStorage.removeItem(CACHE_UPDATED_KEY);
  }

  // --- Connection Mode Config ---
  public getConnectionMode(): 'auto' | 'direct' | 'proxy' {
    const saved = localStorage.getItem(CONNECTION_MODE_KEY);
    if (saved === 'direct' || saved === 'proxy') return saved;
    return 'auto';
  }

  public setConnectionMode(mode: 'auto' | 'direct' | 'proxy') {
    localStorage.setItem(CONNECTION_MODE_KEY, mode);
  }

  // --- Base URL Resolver ---
  private getBaseUrl(service: 'auth' | 'wallet', forceProxy = false): string {
    const isStaticHost = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:'
    );

    const mode = this.getConnectionMode();
    if (!isStaticHost && (forceProxy || mode === 'proxy')) {
      return service === 'auth' ? PROXY_AUTH_BASE : PROXY_WALLET_BASE;
    }
    return service === 'auth' ? DEFAULT_AUTH_BASE : DEFAULT_WALLET_BASE;
  }

  // --- Internal Helper: Sleep ---
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- Queued & Rate-Limited Request Executor ---
  private async request<T>(
    service: 'auth' | 'wallet',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // For wallet requests, enforce sequential queuing with spacing
    if (service === 'wallet') {
      const executeInQueue = async () => {
        // Enforce spacing since previous request
        const now = Date.now();
        const timeSinceLast = now - this.lastWalletRequestFinishTime;
        if (timeSinceLast < this.minWalletRequestIntervalMs) {
          const waitTime = this.minWalletRequestIntervalMs - timeSinceLast;
          await this.sleep(waitTime);
        }

        try {
          return await this.dispatchRequestWithRetries<T>(service, endpoint, options);
        } finally {
          this.lastWalletRequestFinishTime = Date.now();
        }
      };

      // Chain onto the promise queue
      const nextPromise = this.walletRequestQueue.then(executeInQueue, executeInQueue);
      this.walletRequestQueue = nextPromise.catch(() => {});
      return (await nextPromise) as T;
    }

    // For auth service, execute directly
    return await this.dispatchRequestWithRetries<T>(service, endpoint, options);
  }

  /**
   * Dispatches the request with auto-retry on HTTP 429 and CORS fallback
   */
  private async dispatchRequestWithRetries<T>(
    service: 'auth' | 'wallet',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const mode = this.getConnectionMode();
    const tryDirectFirst = mode === 'direct' || mode === 'auto';
    const primaryUrl = `${this.getBaseUrl(service, !tryDirectFirst)}${endpoint}`;

    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await this.executeFetch<T>(primaryUrl, { ...options, headers });
      } catch (err: unknown) {
        const apiErr = err as ApiHttpError;

        // --- HTTP 429 HANDLING: Exponential Backoff (1.5s, 3s, 6s) ---
        if (apiErr.status === 429 && attempt < maxRetries) {
          const backoffMs = Math.round(1500 * Math.pow(2, attempt));
          attempt++;
          console.warn(`[WalletApi] HTTP 429 Rate Limiting detectado en ${endpoint}. Reintentando en ${backoffMs}ms (intento ${attempt}/${maxRetries})...`);
          
          if (this.onRateLimitChangeCallback) {
            this.onRateLimitChangeCallback(true, backoffMs);
          }

          await this.sleep(backoffMs);

          if (this.onRateLimitChangeCallback) {
            this.onRateLimitChangeCallback(false);
          }
          continue;
        }

        // If it failed due to a network error / CORS (status 0) and mode is auto, retry via local proxy
        const isStaticHost = typeof window !== 'undefined' && (
          window.location.hostname.includes('github.io') ||
          window.location.protocol === 'file:'
        );

        if (
          !isStaticHost &&
          mode === 'auto' &&
          tryDirectFirst &&
          (apiErr.status === 0 || apiErr.message.includes('CORS') || apiErr.message.includes('Failed to fetch'))
        ) {
          console.warn(`[WalletApi] Fallback a proxy local para ${endpoint} debido a restricción de red/CORS`);
          const fallbackUrl = `${this.getBaseUrl(service, true)}${endpoint}`;
          return await this.executeFetch<T>(fallbackUrl, { ...options, headers });
        }

        // Final failure after retries
        throw err;
      }
    }

    throw {
      status: 429,
      statusText: 'Too Many Requests',
      message: 'El servidor está regulando las peticiones concurrentes. Utilizando datos en caché mientras se restablece el servicio.',
      isRateLimit: true,
      url: primaryUrl,
    } as ApiHttpError;
  }

  private async executeFetch<T>(url: string, options: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (networkError: unknown) {
      const message = networkError instanceof Error ? networkError.message : 'Error de red o conexión';
      const errorObj: ApiHttpError = {
        status: 0,
        statusText: 'Network Error / CORS',
        message: `No se pudo establecer conexión con el servicio (${message}). Si el navegador bloquea la petición por CORS, puede activar el Proxy Local en Ajustes de Red.`,
        url,
      };
      throw errorObj;
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.clearToken();
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }
    }

    // Handle 429 Too Many Requests specifically
    if (response.status === 429) {
      const errorObj: ApiHttpError = {
        status: 429,
        statusText: 'Too Many Requests',
        message: 'Límite de peticiones alcanzado (429). Regulando frecuencia de consultas.',
        isRateLimit: true,
        url,
      };
      throw errorObj;
    }

    if (!response.ok) {
      let errorBody: unknown = null;
      let detailedMsg = '';

      try {
        const text = await response.text();
        try {
          errorBody = JSON.parse(text);
          if (typeof errorBody === 'object' && errorBody !== null) {
            const body = errorBody as Record<string, unknown>;
            detailedMsg = (body.mensaje || body.message || body.error || body.detalle || '') as string;
          }
        } catch {
          detailedMsg = text;
        }
      } catch {
        detailedMsg = response.statusText;
      }

      const formattedMessage = this.formatErrorMessage(response.status, detailedMsg, url);

      const errorObj: ApiHttpError = {
        status: response.status,
        statusText: response.statusText,
        message: formattedMessage,
        details: errorBody,
        url,
      };

      throw errorObj;
    }

    // Success response parsing
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  private formatErrorMessage(status: number, serverMsg: string, url: string): string {
    const cleanServerMsg = serverMsg ? `: ${serverMsg}` : '';
    switch (status) {
      case 400:
        return `Petición Incorrecta (400)${cleanServerMsg || '. Verifique que los datos ingresados sean válidos.'}`;
      case 401:
        return `Sesión no autorizada o expirada (401)${cleanServerMsg || '. Por favor inicie sesión nuevamente.'}`;
      case 403:
        return `Acceso denegado (403)${cleanServerMsg || '. No tiene permisos para realizar esta operación.'}`;
      case 404:
        return `Recurso no encontrado (404)${cleanServerMsg || `. El endpoint o dato solicitado no fue hallado (${url}).`}`;
      case 409:
        return `Conflicto en la operación (409)${cleanServerMsg || '. El recurso o dato ya se encuentra registrado.'}`;
      case 422:
        return `Entidad no procesable (422)${cleanServerMsg || '. Los datos no cumplen con las validaciones de negocio.'}`;
      case 429:
        return `Servidor ocupado (429)${cleanServerMsg || '. Regulando velocidad de consultas para proteger el servicio.'}`;
      case 500:
        return `Error interno del servidor (500)${cleanServerMsg || '. Ocurrió una falla en el microservicio en Cloud Run.'}`;
      case 502:
      case 503:
      case 504:
        return `Servicio no disponible (${status})${cleanServerMsg || '. El microservicio en Cloud Run puede estar iniciando o en mantenimiento.'}`;
      default:
        return `Error de comunicación (${status})${cleanServerMsg || '.'}`;
    }
  }

  // ==========================================
  // 1. SERVICIO DE AUTENTICACIÓN
  // ==========================================

  public async login(req: UserLoginRequest): Promise<AuthResponse> {
    const payload = {
      correoElectronico: req.correoElectronico.trim(),
      contrasena: req.contrasena,
    };

    const res = await this.request<AuthResponse | string>('auth', '/api/usuarios/autenticacion', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    let token = '';
    if (typeof res === 'string') {
      token = res;
    } else if (res && typeof res === 'object') {
      token = (res.tokenAcceso || res.token || res.accessToken || '') as string;
    }

    if (!token) {
      throw {
        status: 500,
        statusText: 'Invalid Auth Response',
        message: 'El servidor respondió exitosamente pero no entregó un token de acceso válido.',
        details: res,
      } as ApiHttpError;
    }

    this.setToken(token);
    this.setUserInfo({ correoElectronico: req.correoElectronico });

    return typeof res === 'object' ? res : { tokenAcceso: token };
  }

  public async register(req: UserRegisterRequest): Promise<unknown> {
    const payload = {
      correoElectronico: req.correoElectronico.trim(),
      nombre: req.nombre.trim(),
      contrasena: req.contrasena,
    };

    return await this.request('auth', '/api/usuarios/registro', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // 2. SERVICIO DE BILLETERA Y TRANSACCIONES
  // ==========================================

  public async getSaldo(): Promise<number> {
    const res = await this.request<any>('wallet', '/api/billeteras/saldo', {
      method: 'GET',
    });

    let val = 0;
    if (typeof res === 'number') val = res;
    else if (typeof res === 'string') {
      const num = parseFloat(res);
      val = isNaN(num) ? 0 : num;
    } else if (res && typeof res === 'object') {
      // CORRECCIÓN DE CONTRATO: Capturamos la clave exacta emitida por el backend (saldoActual)
      if (typeof res.saldoActual === 'number') val = res.saldoActual;
      else if (typeof res.saldo === 'number') val = res.saldo;
      else if (typeof res.monto === 'number') val = res.monto;
      else if (typeof res.balance === 'number') val = res.balance;
      else if (typeof res.saldoActual === 'string') {
        const parsed = parseFloat(res.saldoActual);
        val = isNaN(parsed) ? 0 : parsed;
      }
    }

    // Update local cache
    this.setCachedSaldo(val);
    return val;
  }

  public async getAlias(): Promise<string> {
    const res = await this.request<AliasResponse | string>('wallet', '/api/billeteras/alias', {
      method: 'GET',
    });

    let val = '';
    if (typeof res === 'string') val = res;
    else if (res && typeof res === 'object' && typeof res.alias === 'string') {
      val = res.alias;
    }

    // Update local cache
    if (val) {
      this.setCachedAlias(val);
    }
    return val;
  }

  public async updateAlias(alias: string): Promise<unknown> {
    const payload = { alias: alias.trim() };
    const res = await this.request('wallet', '/api/billeteras/alias', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    this.setCachedAlias(alias.trim());
    return res;
  }

  public async fondeo(req: FondeoRequest): Promise<unknown> {
    const payload = {
      monto: Number(req.monto),
      medioOrigen: req.medioOrigen,
    };
    return await this.request('wallet', '/api/transacciones/fondeo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async transferenciaInterna(req: TransferenciaRequest): Promise<unknown> {
    const payload = {
      aliasDestino: req.aliasDestino.trim(),
      monto: Number(req.monto),
    };
    return await this.request('wallet', '/api/transacciones/transferencia-interna', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getHistorial(): Promise<Transaccion[]> {
    const res = await this.request<unknown>('wallet', '/api/transacciones/historial', {
      method: 'GET',
    });

    let list: Transaccion[] = [];
    if (Array.isArray(res)) {
      list = res as Transaccion[];
    } else if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      if (Array.isArray(obj.content)) list = obj.content as Transaccion[];
      else if (Array.isArray(obj.transacciones)) list = obj.transacciones as Transaccion[];
      else if (Array.isArray(obj.historial)) list = obj.historial as Transaccion[];
      else if (Array.isArray(obj.items)) list = obj.items as Transaccion[];
      else if (Array.isArray(obj.data)) list = obj.data as Transaccion[];
    }

    // Update local cache
    this.setCachedHistorial(list);
    return list;
  }

  private isSyncLocked = false;

  public isLocked(): boolean {
    return this.isSyncLocked;
  }

  public async executeBlockingSequentialSync(callbacks?: {
    onSaldo?: (val: number) => void;
    onAlias?: (val: string) => void;
    onHistorial?: (list: Transaccion[]) => void;
    onError?: (err: ApiHttpError, step: 'saldo' | 'alias' | 'historial') => void;
  }): Promise<boolean> {
    if (this.isSyncLocked) return false;
    this.isSyncLocked = true;
    try {
      await this.syncDashboardSequentially(callbacks);
      return true;
    } finally {
      this.isSyncLocked = false;
    }
  }

  // --- Sequential Dashboard Sync with 400ms-500ms Delays ---
  public async syncDashboardSequentially(callbacks?: {
    onSaldo?: (val: number) => void;
    onAlias?: (val: string) => void;
    onHistorial?: (list: Transaccion[]) => void;
    onError?: (err: ApiHttpError, step: 'saldo' | 'alias' | 'historial') => void;
  }): Promise<void> {
    const delayBetweenSteps = 450;

    // Step 1: Saldo
    try {
      const saldoVal = await this.getSaldo();
      callbacks?.onSaldo?.(saldoVal);
    } catch (err: unknown) {
      callbacks?.onError?.(err as ApiHttpError, 'saldo');
    }

    await this.sleep(delayBetweenSteps);

    // Step 2: Alias
    try {
      const aliasVal = await this.getAlias();
      callbacks?.onAlias?.(aliasVal);
    } catch (err: unknown) {
      callbacks?.onError?.(err as ApiHttpError, 'alias');
    }

    await this.sleep(delayBetweenSteps);

    // Step 3: Historial
    try {
      const historialVal = await this.getHistorial();
      callbacks?.onHistorial?.(historialVal);
    } catch (err: unknown) {
      callbacks?.onError?.(err as ApiHttpError, 'historial');
    }
  }

  /**
   * Health check diagnostic
   */
  public async checkHealth(): Promise<{ auth: boolean; wallet: boolean; authLatency: number; walletLatency: number }> {
    const checkService = async (service: 'auth' | 'wallet', endpoint: string) => {
      const start = performance.now();
      try {
        const url = `${this.getBaseUrl(service)}${endpoint}`;
        const res = await fetch(url, { method: 'OPTIONS' }).catch(() => fetch(url, { method: 'GET' }));
        const latency = Math.round(performance.now() - start);
        return { ok: res.status < 500, latency };
      } catch {
        const latency = Math.round(performance.now() - start);
        return { ok: false, latency };
      }
    };

    const authRes = await checkService('auth', '/api/usuarios/autenticacion');
    await this.sleep(400); // Respect rate-limit spacing in health checks
    const walletRes = await checkService('wallet', '/api/billeteras/saldo');

    return {
      auth: authRes.ok,
      wallet: walletRes.ok,
      authLatency: authRes.latency,
      walletLatency: walletRes.latency,
    };
  }
}

export const api = WalletApiService.getInstance();
