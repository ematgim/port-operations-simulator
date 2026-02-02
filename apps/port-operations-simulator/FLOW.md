# Port Operations Simulator - Flujo Completo

## Descripción

El simulador de operaciones portuarias ahora implementa un flujo completo y realista del movimiento de buques en el puerto, desde su entrada hasta su salida.

## Puntos Clave del Puerto

### 🚪 Punto de Entrada
- **Ubicación**: Norte del mapa (x: 500, y: 50)
- **Descripción**: Puerto Entrada Principal
- **Función**: Todos los buques aparecen aquí cuando llegan al puerto

### ⚓ Muelles (Docks)
El puerto cuenta con **6 muelles** distribuidos estratégicamente:

1. **Muelle A1** - (x: 200, y: 300)
2. **Muelle A2** - (x: 400, y: 350)
3. **Muelle B1** - (x: 600, y: 300)
4. **Muelle B2** - (x: 800, y: 350)
5. **Muelle C1** - (x: 300, y: 600)
6. **Muelle C2** - (x: 700, y: 600)

### 🌊 Punto de Salida
- **Ubicación**: Sur del mapa (x: 500, y: 950)
- **Descripción**: Puerto Salida Principal
- **Función**: Los buques salen del puerto por este punto

## Flujo de Operaciones

### 1. Llegada al Puerto (ARRIVING)
```
🚢 Buque aparece en el punto de entrada
   └─> Estado: ARRIVING
   └─> Posición: Cerca del punto de entrada (con variación aleatoria)
```

### 2. Solicitud de Asistencia (REQUESTING_ASSISTANCE)
```
⏱️ Después de 2 segundos
   └─> Estado: REQUESTING_ASSISTANCE
   └─> El buque solicita un remolcador
```

### 3. Asignación de Muelle y Remolcador
```
🎯 Sistema busca:
   ├─> Muelle disponible más cercano
   └─> Remolcador disponible más cercano
   
Si ambos están disponibles:
   ├─> Asigna muelle al buque
   ├─> Asigna remolcador al buque
   └─> Estado: WAITING_FOR_TUGBOAT
```

### 4. Remolque al Muelle (BEING_TOWED_TO_DOCK)
```
🚤 Remolcador se mueve hacia el buque
   └─> Al llegar: Estado = BEING_TOWED_TO_DOCK
   └─> Duración del remolque: 10 segundos (configurable)
   └─> Destino: Muelle asignado
```

### 5. Atracado (DOCKED)
```
⚓ Buque llega al muelle
   ├─> Estado: DOCKED
   ├─> Remolcador liberado (vuelve a IDLE)
   ├─> Posición: Coordenadas del muelle
   └─> Tiempo de permanencia: 60 segundos (configurable)
```

### 6. Listo para Salir (WAITING_FOR_DEPARTURE)
```
⏰ Después de 60 segundos atracado
   └─> Estado: WAITING_FOR_DEPARTURE
   └─> Solicita remolcador para salir
```

### 7. Remolque a la Salida (BEING_TOWED_TO_EXIT)
```
🚤 Remolcador se mueve hacia el buque
   ├─> Al llegar: Estado = BEING_TOWED_TO_EXIT
   ├─> Muelle liberado (disponible para otro buque)
   ├─> Duración del remolque: 8 segundos (configurable)
   └─> Destino: Punto de salida
```

### 8. Salida del Puerto (DEPARTED)
```
🌊 Buque llega al punto de salida
   ├─> Estado: DEPARTED
   ├─> Remolcador liberado (vuelve a IDLE)
   ├─> Posición: Coordenadas del punto de salida
   └─> Después de 5 segundos, el buque se elimina del sistema
```

## Estados de los Buques

| Estado | Descripción |
|--------|-------------|
| `ARRIVING` | Llegando al puerto |
| `REQUESTING_ASSISTANCE` | Solicitando remolcador |
| `WAITING_FOR_TUGBOAT` | Esperando que llegue el remolcador |
| `BEING_TOWED_TO_DOCK` | Siendo remolcado hacia el muelle |
| `DOCKED` | Atracado en el muelle |
| `WAITING_FOR_DEPARTURE` | Listo para salir, esperando remolcador |
| `BEING_TOWED_TO_EXIT` | Siendo remolcado hacia la salida |
| `DEPARTED` | Ha salido del puerto |

## Estados de los Remolcadores

| Estado | Descripción |
|--------|-------------|
| `IDLE` | Disponible para asignaciones |
| `MOVING` | Moviéndose hacia un buque |
| `ASSISTING` | Remolcando un buque |

## Variables de Configuración

Estas variables de entorno permiten ajustar el comportamiento del simulador:

```bash
# Intervalo de simulación (actualización del estado)
SIMULATION_INTERVAL=5000  # 5 segundos

# Intervalo de aparición de nuevos buques
VESSEL_SPAWN_INTERVAL=15000  # 15 segundos

# Tiempo de remolque hacia el muelle
TOWING_TO_DOCK_DURATION=10000  # 10 segundos

# Tiempo de remolque hacia la salida
TOWING_TO_EXIT_DURATION=8000  # 8 segundos

# Tiempo de permanencia en el muelle (en PortService)
DOCK_DURATION=60000  # 60 segundos
```

## Eventos Publicados en RabbitMQ

### VESSEL_ARRIVED
Cuando un buque llega al puerto
```json
{
  "type": "VESSEL_ARRIVED",
  "vesselId": "V1",
  "vesselName": "MSC Maria",
  "vesselType": "CONTAINER",
  "position": {"x": 495, "y": 48},
  "status": "ARRIVING",
  "timestamp": "2026-02-02T10:00:00Z"
}
```

### ASSIGNMENT
Cuando se asigna un remolcador a un buque
```json
{
  "type": "ASSIGNMENT",
  "vesselId": "V1",
  "tugboatId": "1",
  "destinationType": "DOCK" | "EXIT",
  "destination": "Muelle A1" | "Puerto Salida Principal",
  "estimatedArrivalTime": "2026-02-02T10:00:15Z"
}
```

### VESSEL_DOCKED
Cuando un buque atraca en un muelle
```json
{
  "type": "VESSEL_DOCKED",
  "vesselId": "V1",
  "dockName": "Muelle A1",
  "timestamp": "2026-02-02T10:00:10Z"
}
```

### VESSEL_DEPARTED
Cuando un buque sale del puerto
```json
{
  "type": "VESSEL_DEPARTED",
  "vesselId": "V1",
  "exitPoint": "Puerto Salida Principal",
  "timestamp": "2026-02-02T10:01:10Z"
}
```

### PORT_STATUS
Estado general del puerto
```json
{
  "type": "PORT_STATUS",
  "totalDocks": 6,
  "occupiedDocks": 3,
  "availableDocks": 3,
  "vesselsInPort": 3,
  "timestamp": "2026-02-02T10:00:00Z"
}
```

## Capacidad del Puerto

- **Remolcadores**: 4 (Hercules, Neptune, Atlas, Titan)
- **Muelles**: 6 (capacidad máxima de buques atracados simultáneamente)
- **Throughput**: Limitado por disponibilidad de remolcadores y muelles

## Lógica de Asignación

### Selección de Muelle
- Se busca el muelle disponible más cercano a la posición actual del buque
- Si no hay muelles disponibles, el buque espera

### Selección de Remolcador
- Se busca el remolcador disponible (IDLE) más cercano al buque
- Si no hay remolcadores disponibles, el buque espera

## Mapa del Puerto

```
      Norte (y=0)
           ↑
           |
     [ENTRADA] (500, 50)
           |
           |
   A1      A2      B1      B2
  (200)   (400)   (600)   (800)
   [⚓]     [⚓]     [⚓]     [⚓]
  (300)   (350)   (300)   (350)
           |
           |
       C1      C2
      (300)   (700)
       [⚓]     [⚓]
      (600)   (600)
           |
           |
      [SALIDA] (500, 950)
           |
           ↓
      Sur (y=1000)
```

## Casos Especiales

### Sin Muelles Disponibles
- El buque permanece en estado `REQUESTING_ASSISTANCE`
- El sistema revisa en cada ciclo si hay muelles disponibles
- Log: "⏳ No docks available for [vessel], waiting..."

### Sin Remolcadores Disponibles
- El buque permanece esperando en su estado actual
- Los remolcadores se liberan automáticamente al completar su tarea

### Múltiples Buques Esperando
- Se procesan en el orden que solicitan asistencia
- La asignación prioriza la distancia (remolcador más cercano)
