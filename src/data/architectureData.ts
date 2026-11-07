export interface ArchitectureDiagram {
  id: string;
  title: string;
  subtitle: string;
  category: 'arquitectura' | 'secuencia' | 'clases-bce' | 'casos-de-uso' | 'dominio';
  categoryLabel: string;
  assetFile: string;
  description: string;
  businessImpact: string;
  designPatterns: string[];
  techStack: string[];
  plantUmlCode: string;
  bceRoles?: {
    boundaries?: string[];
    controls?: string[];
    entitiesDaos?: string[];
  };
  keyStepsOrNodes?: Array<{
    title: string;
    description: string;
    highlight?: boolean;
    type?: 'boundary' | 'control' | 'dao' | 'infra' | 'security' | 'gateway';
  }>;
}

export const ARCHITECTURE_DIAGRAMS: ArchitectureDiagram[] = [
  {
    id: 'diagrama-despliegue',
    title: 'Diagrama de Despliegue - Topología de Infraestructura',
    subtitle: 'Nodos distribuidos, aislamiento criptográfico y canales físicos',
    category: 'arquitectura',
    categoryLabel: 'Topología Serverless',
    assetFile: '/assets/aistudio/diagramaDeDespliegue_8526ded1.txt',
    description:
      'Define la topología física y de contenedores en entornos serverless modernos. Resuelve el desacoplamiento entre el subsistema de billetera financiera y el subsistema de gestión de usuarios, garantizando soberanía de datos y validación perimetral sin dependencias circulares.',
    businessImpact:
      'Garantiza alta disponibilidad, escalabilidad horizontal elástica y latencia mínima al validar autenticación en memoria mediante clave pública RSA sin saturar el almacén de datos de identidad.',
    designPatterns: ['Zero-Trust Architecture', 'Stateless Microservices', 'Connection Pooling'],
    techStack: ['Contenedores en la Nube (Java/Tomcat)', 'Base Relacional Distribuida', 'NoSQL para Identidad', 'RSA 2048-bit', 'HTTPS/TLS'],
    keyStepsOrNodes: [
      {
        title: 'Cliente SPA (Navegador)',
        description: 'Interfaz en Single Page Application servida con modo predibujo local y cola síncrona contra microservicios backend.',
        type: 'boundary',
      },
      {
        title: 'Microservicio Wallet (Contenedor Serverless)',
        description: 'Contenedor Java/Tomcat con wallet-service.jar. Custodia la Clave Pública RSA para validar tokens sin llamadas de red a usuarios.',
        type: 'infra',
        highlight: true,
      },
      {
        title: 'Almacenamiento Relacional Distribuido',
        description: 'Instancia relacional de baja latencia con tablas billetera y transaccion. Conexión de alto rendimiento con pool optimizado.',
        type: 'dao',
      },
      {
        title: 'Plataforma de Identidad & NoSQL',
        description: 'Microservicio independiente que almacena la Clave Privada RSA para emitir y firmar los JWT con almacenamiento de usuarios.',
        type: 'security',
      },
    ],
    plantUmlCode: `@startuml
skinparam backgroundColor white
skinparam defaultTextAlignment center

title Diagrama de Despliegue - Topología de Infraestructura

node "Cliente (Navegador / App Frontend)" as Client {
    artifact "Interfaz de Usuario (SPA / Mobile)"
}

node "Google Cloud Run\\n(Contenedor Java / Tomcat)" as WalletNode {
    component "wallet-service.jar\\n(Boundary, Control, DAO)" as WalletComp
    note right of WalletComp
      **Recurso Local:**
      Almacena la Clave Pública RSA
      para validar la firma de los tokens
      sin consultar la base de datos ajena.
    end note
}

node "Neon Cloud (PostgreSQL)" as DBNode {
    database "Instancia Relacional\\n(Tablas: billetera, transaccion)" as RelDB
}

node "Google Firebase Platform" as FirebaseNode {
    component "Auth & User Service\\n(Microservicio Independiente)" as UserComp
    note right of UserComp
      **Recurso Local:**
      Almacena la Clave Privada RSA
      exclusiva para emitir y firmar
      los JWT de autenticación.
    end note
    database "Firebase NoSQL / Firestore\\n(Colección: usuarios)" as NoSQLDB
}

' Canales de comunicación física y protocolos
Client --> WalletNode : HTTPS (Requests de Billetera)
WalletNode --> DBNode : TCP/IP (HikariCP / Pool de Conexiones JDBC)
WalletNode ..> FirebaseNode : HTTPS (Validación asimétrica / Fetch Clave Pública)
UserComp --> NoSQLDB : Operaciones de Persistencia NoSQL
@enduml`,
  },
  {
    id: 'diagrama-componentes',
    title: 'Diagrama de Componentes - Subsistemas Distribuidos',
    subtitle: 'Aislamiento de empaquetados JAR, criptografía asimétrica y persistencia políglota',
    category: 'arquitectura',
    categoryLabel: 'Componentes & Criptografía',
    assetFile: '/assets/aistudio/diagramaDeComponentes_a0d24dbf.txt',
    description:
      'Ilustra la separación de módulos de compilación entre auth-service.jar y wallet-service.jar. Establece el contrato de clave pública para el desacoplamiento total de dependencias en tiempo de ejecución.',
    businessImpact:
      'Evita el típico antipatrón del "monolito distribuido": si el servicio de autenticación sufre un reinicio o mantenimiento, los usuarios ya autenticados pueden continuar operando su billetera sin interrupciones.',
    designPatterns: ['Asymmetric Cryptographic Handshake', 'Polyglot Persistence', 'Hexagonal/Clean Architecture'],
    techStack: ['RSA Private/Public Keys', 'auth-service.jar', 'wallet-service.jar', 'Spring JDBC Template'],
    keyStepsOrNodes: [
      {
        title: 'auth-service.jar + Módulo Clave Privada',
        description: 'Firma criptográfica no repudiable de payloads JWT con algoritmo RSA SHA-256.',
        type: 'security',
      },
      {
        title: 'Firebase NoSQL Datastore',
        description: 'Persistencia documental optimizada para consultas de credenciales y metadatos de usuario.',
        type: 'dao',
      },
      {
        title: 'wallet-service.jar + Módulo Clave Pública',
        description: 'Verificación matemática ultra-rápida de la firma JWT en cada request perimetral.',
        type: 'control',
        highlight: true,
      },
      {
        title: 'Neon PostgreSQL Relacional',
        description: 'Motor ACID estricto con bloqueos a nivel de fila y consistencia transaccional para saldos.',
        type: 'dao',
      },
    ],
    plantUmlCode: `@startuml
skinparam backgroundColor white
skinparam defaultTextAlignment center

title Diagrama de Componentes - Subsistemas Distribuidos

package "Microservicio de Usuarios y Autenticación" {
    [auth-service.jar] as AuthJar
    [Módulo de Criptografía RSA (Clave Privada)] as CryptoModule
    database "Firebase / NoSQL Datastore" as UserDB
    
    AuthJar --> CryptoModule : firma tokens
    AuthJar --> UserDB : persiste usuarios
}

package "Microservicio de Billetera Virtual" {
    [wallet-service.jar] as WalletJar
    [Módulo de Validación Criptográfica (Clave Pública)] as ValidationModule
    database "Neon PostgreSQL" as WalletDB
    
    WalletJar --> ValidationModule : verifica tokens
    WalletJar --> WalletDB : ejecuta JDBC Template
}

' Contrato de comunicación entre componentes compilados
WalletJar ..> AuthJar : API REST / Intercambio de Clave Pública (HTTPS)
@enduml`,
  },
  {
    id: 'modelo-solucion-2',
    title: 'Modelo de la Solución 2 (BCE Completo)',
    subtitle: 'Arquitectura por Capas Formal: Boundary, Control, Entity y DAOs desacoplados',
    category: 'clases-bce',
    categoryLabel: 'Diseño RUP / BCE',
    assetFile: '/assets/aistudio/modeloDeLaSolucion2_6b47ab5e.txt',
    description:
      'Diagrama maestro de clases aplicando el estándar RUP / BCE (Boundary-Control-Entity). Desacopla la interfaz perimetral HTTP, los casos de uso específicos y la capa de acceso a datos implementada con Spring JdbcTemplate.',
    businessImpact:
      'Facilita la mantenibilidad a largo plazo y la cobertura de pruebas unitarias al 100% sobre la capa de Control sin requerir mockear frameworks web pesados ni contenedores de servlet.',
    designPatterns: ['Boundary-Control-Entity (BCE)', 'DAO Pattern', 'Client Adapter', 'Single Responsibility'],
    techStack: ['Java 21/25', 'Spring Boot', 'Spring JdbcTemplate', 'JWT Filter'],
    bceRoles: {
      boundaries: ['UsuarioBoundary', 'BilleteraBoundary', 'TransaccionBoundary'],
      controls: [
        'AutenticacionControl',
        'GestionBilleteraControl',
        'RealizarFondeoControl',
        'TransferenciaInternaControl',
        'ConsultarHistorialControl',
        'AperturaBilleteraControl',
      ],
      entitiesDaos: ['BilleteraJdbcDAO', 'Billetera', 'Transaccion', 'TransferenciaInterna', 'Fondeo', 'AuthServiceAdapter', 'BilleteraClientAdapter'],
    },
    keyStepsOrNodes: [
      {
        title: 'Capa de Frontera (Boundary)',
        description: 'Exposición REST formal: BilleteraBoundary, TransaccionBoundary y UsuarioBoundary. Validan DTOs y cabeceras.',
        type: 'boundary',
      },
      {
        title: 'Capa de Control (Casos de Uso)',
        description: 'Controladores puros orientados a RUP: TransferenciaInternaControl, RealizarFondeoControl, AperturaBilleteraControl.',
        type: 'control',
        highlight: true,
      },
      {
        title: 'Capa de Entidades & DAO',
        description: 'BilleteraJdbcDAO con JdbcTemplate para cero overhead de ORM, entidades Billetera, Transaccion y jerarquías polimórficas.',
        type: 'dao',
      },
    ],
    plantUmlCode: `@startuml
skinparam classAttributeIconSize 0
skinparam backgroundColor white
skinparam defaultTextAlignment center

package "Microservicio de Usuarios y Autenticación" {
    class UsuarioBoundary {
        + registrarUsuario(request: UsuarioRequestDto): ResponseEntity
        + autenticarYGenerarToken(request: AuthRequestDto): ResponseEntity
    }

    class AutenticacionControl {
        - usuarioRepository: UsuarioRepository
        - tokenProvider: TokenProvider
        - billeteraClientAdapter: BilleteraClientAdapter
        + registrarYValidarCorreo(correo: String, nombre: String): String
        + generarTokenFirmadoRSA(usuarioId: String): String
    }

    class BilleteraClientAdapter {
        - walletServiceEndpoint: String
        + solicitarAperturaBilletera(idUsuario: String): boolean
    }

    class UsuarioEntity {
        - idUsuario: String
        - correoElectronico: String
        - contraseñaHash: String
        - verificado: boolean
        + verificarCorreo(): boolean
    }
}

package "Microservicio de Billetera Virtual (Wallet System)" {
    
    package "Capa de Frontera (Boundary)" {
        class BilleteraBoundary {
            + consultarSaldo(request: HttpServletRequest): ResponseEntity
            + consultarAlias(request: HttpServletRequest): ResponseEntity
            + actualizarAlias(request: HttpServletRequest, requestDto: AliasRequestDto): ResponseEntity
            + aperturarBilletera(request: AperturaBilleteraDto): ResponseEntity
        }

        class TransaccionBoundary {
            + realizarFondeo(requestHttp: HttpServletRequest, request: FondeoRequestDto): ResponseEntity
            + realizarTransferencia(request: HttpServletRequest, transferenciaDto: TransferenciaRequestDto): ResponseEntity
            + consultarHistorial(requestHttp: HttpServletRequest): ResponseEntity
        }
    }

    package "Capa de Control (Control / Casos de Uso)" {
        class GestionBilleteraControl {
            - billeteraDAO: BilleteraDAO
            + verificarYConsultarSaldo(idUsuario: String, montoRequerido: Double): boolean
            + obtenerSaldoPorUsuario(idUsuario: String): Double
            + actualizarAliasPorUsuario(idUsuario: String, nuevoAlias: String): void
            + obtenerAliasPorUsuario(idUsuario: String): String
        }

        class RealizarFondeoControl {
            - billeteraDAO: BilleteraDAO
            - transaccionDAO: TransaccionDAO
            + ejecutarFondeoPorUsuario(idUsuario: String, monto: Double, medioOrigen: MedioOrigen): void
        }

        class TransferenciaInternaControl {
            - billeteraDAO: BilleteraDAO
            - transaccionDAO: TransaccionDAO
            + ejecutarTransferenciaPorAlias(idUsuarioOrigen: String, aliasDestino: String, monto: Double): void
        }

        class ConsultarHistorialControl {
            - billeteraDAO: BilleteraDAO
            - transaccionDAO: TransaccionDAO
            + obtenerHistorialPorUsuario(idUsuario: String): List<Transaccion>
        }

        class AperturaBilleteraControl {
            - billeteraDAO: BilleteraDAO
            + ejecutarApertura(idUsuario: String): void
        }
    }

    package "Capa de Entidades e Infraestructura (Entity / DAO)" {
        class AuthServiceAdapter {
            - publicKeyEndpoint: String
            + verificarFirmaTokenRSA(token: String): String
        }

        class Billetera {
            - idBilletera: Long
            - idUsuario: String
            - saldoActual: Double
            - alias: String
            + getSaldoActual(): Double
            + getAlias(): String
        }

        class Transaccion {
            - idTransaccion: Long
            - idBilletera: Long
            - fechaHora: Date
            - monto: Double
            - estado: String
            - tipoMovimiento: String
            - tipoTransaccion: String
        }

        class TransferenciaInterna {
            - idBilleteraDestino: Long
        }

        class Fondeo {
            - medioOrigen: MedioOrigen
        }

        class BilleteraJdbcDAO {
            - jdbcTemplate: JdbcTemplate
            + guardar(billetera: Billetera): void
            + actualizarSaldo(idBilletera: Long, nuevoSaldo: Double): void
            + actualizarAlias(idBilletera: Long, nuevoAlias: String): void
            + buscarPorIdUsuario(idUsuario: String): Optional<Billetera>
            + buscarPorAlias(alias: String): Optional<Billetera>
        }
    }
}

' Relaciones arquitectónicas cruzadas entre Microservicios
BilleteraBoundary --> GestionBilleteraControl : delega orquestación >
TransaccionBoundary --> RealizarFondeoControl : delega >
TransaccionBoundary --> TransferenciaInternaControl : delega >
TransaccionBoundary --> ConsultarHistorialControl : delega >
BilleteraBoundary --> AperturaBilleteraControl : delega >

AuthServiceAdapter ..> UsuarioBoundary : consume API REST / Clave Pública (RSA) >

' Relación del Adaptador Síncrono del Servicio de Usuarios hacia la Billetera
AutenticacionControl --> BilleteraClientAdapter : delega apertura síncrona >
BilleteraClientAdapter ..> BilleteraBoundary : HTTP POST /api/billeteras/apertura >

' Relaciones internas de la Billetera (BCE)
GestionBilleteraControl --> BilleteraJdbcDAO : utiliza >
RealizarFondeoControl --> BilleteraJdbcDAO : utiliza >
TransferenciaInternaControl --> BilleteraJdbcDAO : utiliza >
ConsultarHistorialControl --> BilleteraJdbcDAO : utiliza >
AperturaBilleteraControl --> BilleteraJdbcDAO : utiliza >

Billetera "1" o-- "*" Transaccion : registra >
Transaccion <|-- TransferenciaInterna : hereda >
Transaccion <|-- Fondeo : hereda >

' Relaciones internas del Microservicio de Usuarios
UsuarioBoundary --> AutenticacionControl : delega >
AutenticacionControl --> UsuarioEntity : persiste / valida >
@enduml`,
  },
  {
    id: 'secuencia-transferencia-interna',
    title: 'Diagrama de Secuencia: Transferencia Interna',
    subtitle: 'Validación perimetral JWT RSA, verificación de fondos y persistencia atómica',
    category: 'secuencia',
    categoryLabel: 'Secuencia & Criptografía',
    assetFile: '/assets/aistudio/diagramaDeSecuencia_transfInterna__4dccefee.txt',
    description:
      'Flujo detallado de extremo a extremo para la ejecución de una transferencia monetaria entre usuarios por alias. Destaca la intercepción perimetral con filtro criptográfico y la doble actualización atómica de saldo en PostgreSQL.',
    businessImpact:
      'Garantiza prevención total de doble gasto, previene fraude por spoofing de identidad gracias a la validación asimétrica RSA y asegura que el emisor cuente con fondos suficientes antes de cualquier modificación de saldos.',
    designPatterns: ['Intercepting Filter (Security)', 'Unit of Work / Transactional Boundary', 'Idempotency'],
    techStack: ['JwtAuthFilter', 'TransferenciaInternaControl', 'BilleteraJdbcDAO', 'PostgreSQL Row Locking'],
    keyStepsOrNodes: [
      {
        title: '01. Intercepción Perimetral (JwtAuthFilter)',
        description: 'Extrae el header Authorization Bearer, valida matemáticamente la firma RSA con clave pública local e inyecta idUsuario.',
        type: 'security',
        highlight: true,
      },
      {
        title: '02. Búsqueda de Billeteras por Alias y Usuario',
        description: 'BilleteraJdbcDAO localiza la cuenta origen por idUsuario y la cuenta destino por alias.',
        type: 'dao',
      },
      {
        title: '03. Validación de Reglas de Negocio',
        description: 'Entity verifica suficiencia de fondos y que la cuenta destino no sea idéntica a la cuenta origen.',
        type: 'control',
      },
      {
        title: '04. Actualización Atómica y Registro',
        description: 'Doble actualización en PostgreSQL con TransaccionDAO registrando el asiento contable (HTTP 201 Created).',
        type: 'dao',
      },
    ],
    plantUmlCode: `@startuml
skinparam BoxPadding 10
skinparam ParticipantPadding 10
skinparam monochrome true
skinparam shadowing false

actor "Usuario Emisor" as User
participant "TransaccionBoundary\\n(Frontera)" as Boundary
participant "JwtAuthFilter\\n(Seguridad Perimetral)" as Filter
participant "TransferenciaInternaControl\\n(Control / Caso de Uso)" as Control
participant "BilleteraJdbcDAO\\n(Persistencia DAO)" as Dao
participant "Entity\\n(Billetera Origen/Destino)" as Wallet
participant "TransaccionDAO\\n(Historial)" as TxDao

autonumber "<b>[00]"

User -> Boundary: POST /api/transacciones/transferencia-interna (Authorization: Bearer JWT, TransferenciaRequestDto)
activate Boundary

Boundary -> Filter: doFilter() - Extrae y valida firma asimétrica RSA
activate Filter
Filter --> Boundary: idUsuarioAutenticado inyectado en Request Context
deactivate Filter

Boundary -> Control: ejecutarTransferenciaPorAlias(idUsuarioOrigen, aliasDestino, monto)
activate Control

Control -> Dao: buscarPorIdUsuario(idUsuarioOrigen)
activate Dao
Dao --> Control: Billetera Origen (idBilletera, saldoActual)
deactivate Dao

Control -> Dao: buscarPorAlias(aliasDestino)
activate Dao
Dao --> Control: Billetera Destino (idBilletera, saldoActual)
deactivate Dao

Control -> Wallet: Validar suficiencia de fondos y cuenta distinta
Control -> Dao: actualizarSaldo(idOrigen, nuevoSaldoOrigen)
Control -> Dao: actualizarSaldo(idDestino, nuevoSaldoDestino)

Control -> TxDao: guardarTransferenciaInterna(transferencia)
activate TxDao
TxDao --> Control: Transacción Registrada OK
deactivate TxDao

Control --> Boundary: Ejecución Exitosa (HTTP 201 Created)
deactivate Control

Boundary --> User: Respuesta Formal de Transferencia Exitosa
deactivate Boundary
@enduml`,
  },
  {
    id: 'secuencia-usuario-sincronico',
    title: 'Diagrama de Secuencia: Apertura Sincrónica & Transacción Compensatoria',
    subtitle: 'Consistencia distribuida estricta: Rollback automático en Firestore ante fallas del nodo de Billetera',
    category: 'secuencia',
    categoryLabel: 'Resiliencia & Saga',
    assetFile: '/assets/aistudio/diagramaDeSecuencia_usuarioSincronico__851c4d3e.txt',
    description:
      'Muestra cómo el sistema resuelve el problema clásico de sistemas distribuidos en el registro de un nuevo usuario. Al solicitar la apertura sincrónica de cuenta en el subsistema de billetera, si ocurre un fallo de red o timeout (HTTP 503), se dispara inmediatamente una transacción compensatoria (eliminarUsuario en Firestore) para evitar registros huérfanos.',
    businessImpact:
      'Previene estados corruptos en la base de datos (usuarios creados sin billetera asociada) sin necesidad de recurrir a costosos protocolos Two-Phase Commit (2PC) que degradan el rendimiento.',
    designPatterns: ['Compensating Transaction (Saga Pattern)', 'Fail-Fast Distributed Architecture', 'Atomic Reversal'],
    techStack: ['Spring Boot', 'BilleteraClientAdapter', 'Google Firestore ACID Compensation', 'HTTP 503 Handling'],
    keyStepsOrNodes: [
      {
        title: '01. Registro Inicial en Firestore',
        description: 'UsuarioDao valida unicidad del correo electrónico y persiste el documento del usuario.',
        type: 'dao',
      },
      {
        title: '02. Llamada Sincrónica a Billetera',
        description: 'BilleteraClientAdapter invoca POST /api/billeteras/apertura hacia el nodo en Cloud Run.',
        type: 'infra',
      },
      {
        title: '03. Rama de Fallo: Transacción Compensatoria',
        description: 'Si ocurre Timeout o Connection Refused (HTTP 503), AutenticacionControl ejecuta eliminarUsuario(idUsuario) en Firestore (Rollback compensatorio).',
        type: 'security',
        highlight: true,
      },
      {
        title: '04. Rama de Éxito: Confirmación OK',
        description: 'Si el nodo de Billetera responde 201 Created, se finaliza con éxito retornando la respuesta formal.',
        type: 'control',
      },
    ],
    plantUmlCode: `@startuml
skinparam BoxPadding 10
skinparam ParticipantPadding 10
skinparam monochrome true
skinparam shadowing false

actor "Usuario / Cliente" as User
participant "UsuarioBoundary\\n(Frontera)" as Boundary
participant "AutenticacionControl\\n(Control)" as Control
participant "UsuarioDao\\n(Firestore)" as Dao
participant "BilleteraClientAdapter\\n(Adaptador Red)" as Adapter
participant "BilleteraBoundary\\n(Frontera Billetera)" as WalletBoundary

autonumber "<b>[00]"

User -> Boundary: Registrar Usuario (correo, nombre, contraseña)
activate Boundary

Boundary -> Control: registrarUsuario(correo, nombre, contraseña)
activate Control

Control -> Dao: buscarPorCorreo(correo)
activate Dao
Dao --> Control: null (Correo disponible)
deactivate Dao

Control -> Dao: guardar(nuevoUsuario)
activate Dao
Dao --> Control: Persistencia Firestore EXITOSA
deactivate Dao

' Bloque de comunicación síncrona con el subsistema de billeteras
group Apertura Sincrónica de Cuenta Financiera
    Control -> Adapter: solicitarAperturaBilletera(idUsuario)
    activate Adapter
    
    Adapter -> WalletBoundary: HTTP POST /api/billeteras/apertura (idUsuario)
    activate WalletBoundary
    
    alt Fallo de Red o Timeout en el Nodo Billetera
        WalletBoundary --> Adapter: Excepción / Connection Refused (HTTP 503)
        deactivate WalletBoundary
        
        Adapter --> Control: Error de Comunicación Remota
        deactivate Adapter
        
        ' Transacción compensatoria por consistencia estricta
        Control -> Dao: eliminarUsuario(idUsuario) (Compensación ACID)
        activate Dao
        Dao --> Control: Usuario Revertido OK
        deactivate Dao
        
        Control --> Boundary: Retornar Error Transaccional (Subsistema No Disponible)
        
    else Apertura Exitosa en la Billetera
        WalletBoundary --> Adapter: Billetera Creada Exitosamente (HTTP 201 Created)
        deactivate WalletBoundary
        
        Adapter --> Control: Confirmación OK
        deactivate Adapter
        
        Control --> Boundary: Usuario Registrado y Billetera Asociada OK
    end
end

Boundary --> User: Respuesta formal de la operación
deactivate Control
deactivate Boundary
@enduml`,
  },
  {
    id: 'casos-de-uso',
    title: 'Diagrama de Casos de Uso RUP (Wallet System)',
    subtitle: 'Alcance funcional, extensiones <<extend>> de comprobantes e integración con pasarelas externas',
    category: 'casos-de-uso',
    categoryLabel: 'Requisitos & Casos de Uso',
    assetFile: '/assets/aistudio/casosDeUso_e65d6e58.txt',
    description:
      'Estructura los casos de uso del sistema según la metodología RUP. Organiza las operaciones del actor Usuario (Fondeo, Retiro, Transferencias, Disputas, Notificaciones) y las relaciones con el actor Pasarela de Pago externa.',
    businessImpact:
      'Garantiza trazabilidad completa entre requisitos de negocio, especificaciones formales de casos de uso y las clases controladoras implementadas en Java.',
    designPatterns: ['Use Case Driven Development', 'Actor-System Boundary', 'Extension Points (<<extend>>)'],
    techStack: ['Metodología RUP', 'UML 2.5', 'Clean Specifications'],
    keyStepsOrNodes: [
      {
        title: 'Actor Usuario',
        description: 'Interactúa con Consultar Saldo, Fondeo, Retiro, Transferencia Interna/Externa, Disputa y Notificaciones.',
        type: 'boundary',
      },
      {
        title: 'Casos de Uso Core',
        description: 'Realizar Fondeo, Realizar Retiro, Transferencia Interna y Transferencia Externa.',
        type: 'control',
        highlight: true,
      },
      {
        title: 'Extensión Opcional (<<extend>>)',
        description: 'Descargar / Compartir Comprobante se extiende limpiamente sobre todas las operaciones transaccionales.',
        type: 'control',
      },
      {
        title: 'Actor Externo: Pasarela de Pago',
        description: 'Fondeo, Retiro y Transferencia Externa conectan con el subsistema de compensación bancaria.',
        type: 'gateway',
      },
    ],
    plantUmlCode: `@startuml
left to right direction
skinparam packageStyle rectangle
skinparam usecase {
  BackgroundColor LightBlue
  BorderColor DarkBlue
  ArrowColor Black
}

actor "Usuario" as User
actor "Pasarela de Pago" as Gateway << Sistema Externo >>

rectangle "Billetera Virtual (Wallet System)" {
  usecase "Consultar Saldo e Historial" as UC_ConsultarSaldo
  usecase "Realizar Fondeo" as UC_Fondeo
  usecase "Realizar Retiro" as UC_Retiro
  usecase "Transferencia Interna" as UC_TransfInt
  usecase "Transferencia Externa" as UC_TransfExt
  
  usecase "Descargar / Compartir Comprobante" as UC_Comprobante
  usecase "Abrir Disputa" as UC_Disputa
  usecase "Configurar Notificaciones" as UC_ConfigNotif
  usecase "Consultar Notificaciones" as UC_VerNotif
}

' Relaciones directas del Usuario (ordenadas para evitar cruces)
User --> UC_ConsultarSaldo
User --> UC_Fondeo
User --> UC_Retiro
User --> UC_TransfInt
User --> UC_TransfExt
User --> UC_Disputa
User --> UC_ConfigNotif
User --> UC_VerNotif

' Comprobante como extensión limpia y opcional
UC_Comprobante .up.> UC_Fondeo : <<extend>>
UC_Comprobante .up.> UC_Retiro : <<extend>>
UC_Comprobante .up.> UC_TransfExt : <<extend>>
UC_Comprobante .up.> UC_TransfInt : <<extend>>

' Conexiones paralelas y limpias con el Sistema Externo (Sin cruces de líneas)
UC_Fondeo ---> Gateway
UC_Retiro ---> Gateway
UC_TransfExt ---> Gateway
@enduml`,
  },
  {
    id: 'modelo-dominio-problema',
    title: 'Modelo del Dominio del Problema',
    subtitle: 'Entidades conceptuales, cardinalidades y especialización jerárquica de movimientos financieros',
    category: 'dominio',
    categoryLabel: 'Modelo de Dominio',
    assetFile: '/assets/aistudio/modeloDelProblema_f9f643a6.txt',
    description:
      'Captura el modelo de dominio puro sin acoplamiento a tecnologías de persistencia. Define la relación 1 a 1 entre Usuario y Billetera, 1 a N con Transacciones y la jerarquía de herencia entre Fondeo, Retiro, Transferencia Interna y Transferencia Externa.',
    businessImpact:
      'Garantiza un lenguaje ubicuo consistente entre los stakeholders de negocio, auditoría contable y el equipo de ingeniería.',
    designPatterns: ['Domain-Driven Design (Core Domain)', 'Polymorphic Domain Entities', 'Ubiquitous Language'],
    techStack: ['UML Domain Modeling', 'Double-Entry Accounting Concepts'],
    keyStepsOrNodes: [
      {
        title: 'Usuario [1] -- [1] Billetera',
        description: 'Relación biunívoca obligatoria que define la titularidad de los fondos.',
        type: 'boundary',
      },
      {
        title: 'Billetera [1] o-- [*] Transaccion',
        description: 'Agregado raíz que custodia el historial inmutable de movimientos financieros.',
        type: 'control',
        highlight: true,
      },
      {
        title: 'Jerarquía Polimórfica',
        description: 'Fondeo, Retiro, TransferenciaInterna y TransferenciaExterna heredan atributos de Transacción.',
        type: 'dao',
      },
      {
        title: 'Entidades Colaboradoras',
        description: 'PasarelaDePago, Disputa (origen 0..1) y Comprobante (relación 1 a 1).',
        type: 'gateway',
      },
    ],
    plantUmlCode: `@startuml
skinparam classAttributeIconSize 0
skinparam backgroundColor white
skinparam defaultTextAlignment center

class Usuario {
    correoElectronico
    nombre
}

class Billetera {
    idBilletera
    saldoActual
}

class Transaccion {
    idTransaccion
    fechaHora
    monto
    estado
}

class Fondeo {
    medioOrigen
}

class Retiro {
    cuentaDestino
}

class TransferenciaInterna {
    aliasDestino
}

class TransferenciaExterna {
    cvuCbuDestino
}

class PasarelaDePago {
    nombrePasarela
    estadoConexion
}

class Disputa {
    idDisputa
    motivo
    estadoDisputa
}

class Comprobante {
    numeroOperacion
    formato
}

' Relaciones estructurales y cardinalidades del dominio
Usuario "1" -- "1" Billetera : posee >
Billetera "1" o-- "*" Transaccion : registra >

' Especialización conceptual de Transacciones (Jerarquía de Dominio)
Transaccion <|-- Fondeo
Transaccion <|-- Retiro
Transaccion <|-- TransferenciaInterna
Transaccion <|-- TransferenciaExterna

' Colaboraciones con agentes externos y entidades accesorias
Transaccion "*" --> "0..1" PasarelaDePago : utiliza a través de API >
Transaccion "1" -- "0..1" Disputa : puede originar >
Transaccion "1" -- "1" Comprobante : genera >
@enduml`,
  },
  {
    id: 'modelo-solucion-antiguo',
    title: 'Modelo de la Solución Antiguo (Evolución de Arquitectura)',
    subtitle: 'Iteración temprana que evidencia el refinamiento continuo hacia microservicios desacoplados',
    category: 'clases-bce',
    categoryLabel: 'Evolución Arquitectónica',
    assetFile: '/assets/aistudio/modeloDeLaSolucionAntiguo_24869986.txt',
    description:
      'Documenta la versión preliminar de la arquitectura del proyecto. Permite a los evaluadores técnicos y líderes de ingeniería apreciar el proceso iterativo e incremental característico de RUP, evidenciando cómo la solución evolucionó desde un modelo concentrado hacia una arquitectura distribuida por capas con clave pública/privada.',
    businessImpact:
      'Demuestra madurez profesional: la capacidad de evaluar trade-offs técnicos, detectar cuellos de botella y refactorizar hacia arquitecturas más sólidas sin perder funcionalidad.',
    designPatterns: ['Architecture Evolution Tracking', 'Iterative & Incremental Refactoring (RUP)'],
    techStack: ['Spring Boot Legacy Model', 'Repository Pattern', 'PasarelaDePagoAdapter'],
    keyStepsOrNodes: [
      {
        title: 'WalletAPIController (Frontera Inicial)',
        description: 'Controlador monolítico inicial que concentraba lógica perimetral.',
        type: 'boundary',
      },
      {
        title: 'TransferenciaExternaControl',
        description: 'Controlador con lógica de rollback ACID local y adaptación directa a PasarelaDePagoAdapter.',
        type: 'control',
        highlight: true,
      },
      {
        title: 'Transición Arquitectónica',
        description: 'Este modelo sirvió de base para dar el salto hacia el Modelo de la Solución 2 con división de microservicios y criptografía RSA.',
        type: 'infra',
      },
    ],
    plantUmlCode: `@startuml
skinparam classAttributeIconSize 0
skinparam backgroundColor white
skinparam defaultTextAlignment center

package "Capa de Frontera (Boundary)" {
    class WalletAPIController {
        + procesarTransferenciaExterna(authHeader: String, request: TransferenciaDto): ResponseEntity
        + consultarSaldo(authHeader: String): ResponseEntity
    }
}

package "Capa de Control (Control / Casos de Uso)" {
    class TransferenciaExternaControl {
        - jwtValidatorService: JwtValidatorService
        - billeteraRepository: BilleteraRepository
        - transaccionRepository: TransaccionRepository
        + ejecutarTransferenciaExterna(usuarioId: Long, monto: Double, cbuDestino: String): Transaccion
        - ejecutarRollbackACID(transaccionId: Long, monto: Double): void
    }
}

package "Capa de Entidades (Entity - Modelo de Dominio)" {
    class Usuario {
        - idUsuario: Long
        - correoElectronico: String
        - nombre: String
        + getCorreoElectronico(): String
    }

    class Billetera {
        - idBilletera: Long
        - saldoActual: Double
        + debitar(monto: Double): void
        + acreditar(monto: Double): void
        + verificarSaldo(monto: Double): boolean
    }

    class Transaccion {
        - idTransaccion: Long
        - fechaHora: Date
        - monto: Double
        - estado: String
        + actualizarEstado(estado: String): void
    }

    class TransferenciaExterna {
        - cvuCbuDestino: String
        + validarCbuFormato(): boolean
    }

    class PasarelaDePagoAdapter {
        - urlEndpoint: String
        + invocarPagoExterno(monto: Double, destino: String): boolean
    }
}

' Relaciones arquitectónicas del Modelo de Solución (BCE)
WalletAPIController --> TransferenciaExternaControl : delega orquestación >
TransferenciaExternaControl --> Billetera : gestiona saldo >
TransferenciaExternaControl --> Transaccion : persiste / actualiza >
TransferenciaExternaControl --> PasarelaDePagoAdapter : comunica red externa >

' Relaciones estructurales heredadas del Dominio
Usuario "1" *-- "1" Billetera : posee >
Billetera "1" o-- "*" Transaccion : registra >
Transaccion <|-- TransferenciaExterna : hereda >
@enduml`,
  },
];

export const CANDIDATE_PROFILE = {
  fullName: 'Bruno Sebastian Sturniolo',
  headline: 'Backend Developer con Cultura DevOps',
  tagline: 'Especialista en aplicaciones ligeras, económicas y altamente eficaces',
  summary:
    'Especialista en construir soluciones backend de alto rendimiento con arquitectura formal RUP/BCE, optimización de recursos, almacenamiento híbrido (relacional y no relacional) y despliegues serverless eficientes en contenedores en la nube.',
  email: 'brunosebastian.sturniolo@gmail.com',
  phone: '+54 266-5039175',
  githubUrl: 'https://github.com/SturnioloBruno',
  repositoryUrl: 'https://github.com/SturnioloBruno/Wallet',
  repository: 'SturnioloBruno/Wallet',
  location: 'Infraestructura Serverless Moderna · Microservicios en Contenedores',
  backendHighlights: [
    'Diseño artesanal a mano mediante iteraciones estructuradas bajo metodología RUP.',
    'Separación formal por capas BCE: Boundary (REST), Control (Casos de Uso) y Entity/DAO.',
    'Persistencia ligera sin ORMs pesados sobre bases de datos relacionales distribuidas.',
    'Seguridad asimétrica RSA 2048-bit: verificación matemática en memoria sin consultas remotas.',
    'Consistencia distribuida con Transacciones Compensatorias (Patrón Saga) ante fallas de red.',
  ],
  frontendHighlights: [
    'Interfaz SPA potenciada guiando a la IA con criterios avanzados de arquitectura y red.',
    'Mitigación de límites de tasa en microservicios backend mediante Mutex síncrono en cliente.',
    'Modo predibujo local instantáneo: cero llamadas innecesarias al montar componentes.',
    'Tipado TypeScript estricto sincronizado con los contratos DTO del backend.',
    'Despliegues ligeros y optimizados para entornos estáticos y contenedores.',
  ],
  efficiencyMetrics: [
    { label: 'Costos de Infraestructura', val: 'Altamente Optimizados', desc: 'Arquitectura ligera de bajo consumo con escalabilidad elástica' },
    { label: 'Persistencia', val: 'Híbrida Distribuida', desc: 'Relacional transaccional y No Relacional para identidad' },
    { label: 'Arquitectura', val: 'Nube Ligera / Serverless', desc: 'Contenedores elásticos y despliegue desacoplado' },
    { label: 'Latencia de Auth', val: 'Sub-milisegundo', desc: 'Validación perimetral con clave pública RSA en memoria' },
  ],
  techTags: [
    'Java 25',
    'Spring Boot',
    'Cultura DevOps',
    'Metodología RUP',
    'Modelado BCE',
    'Almacenamiento Relacional',
    'NoSQL para Identidad',
    'Contenedores Serverless',
    'Docker Multi-stage',
    'RSA 2048 / JWT',
    'TypeScript & SPA',
    'CI/CD Pipelines',
  ],
};
