# Port Operations Simulator

Sistema de simulación de operaciones portuarias que simula el movimiento de remolcadores en un puerto, publicando eventos a RabbitMQ.

## 🏗️ Estructura del Proyecto

Este es un monorepo gestionado con Nx que contiene:

- **port-operations-simulator**: Aplicación backend en Node.js con TypeScript que simula movimientos de remolcadores

## 🚀 Características

- ✅ Simulación de múltiples remolcadores con diferentes características
- ✅ Publicación de eventos de movimiento a RabbitMQ
- ✅ Gestión de estados de remolcadores (IDLE, MOVING, DOCKED, ASSISTING)
- ✅ Simulación de posiciones en un área portuaria
- ✅ Configuración mediante variables de entorno

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm
- RabbitMQ (corriendo localmente o accesible remotamente)

## 🔧 Instalación

```bash
# Instalar dependencias
npm install
```

## 🎮 Uso

### Iniciar RabbitMQ

Si usas Docker:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### Ejecutar la Aplicación

```bash
# Ejecutar en modo desarrollo
npx nx serve port-operations-simulator

# O compilar y ejecutar
npx nx build port-operations-simulator
node dist/apps/port-operations-simulator/main.js
```

### Variables de Entorno

Puedes configurar las siguientes variables de entorno:

- `RABBITMQ_URL`: URL de conexión a RabbitMQ (por defecto: `amqp://localhost`)
- `SIMULATION_INTERVAL`: Intervalo de simulación en milisegundos (por defecto: `5000`)

Ejemplo:

```bash
RABBITMQ_URL=amqp://user:pass@localhost:5672 SIMULATION_INTERVAL=3000 npx nx serve port-operations-simulator
```

## 🚢 Remolcadores Simulados

El simulador inicializa 4 remolcadores con las siguientes características:

1. **Hercules** - Capacidad: 50, Velocidad: 15
2. **Neptune** - Capacidad: 60, Velocidad: 12
3. **Atlas** - Capacidad: 55, Velocidad: 14
4. **Titan** - Capacidad: 45, Velocidad: 16

## 📊 Formato de Eventos

Los eventos publicados a RabbitMQ tienen el siguiente formato:

```json
{
  "tugboatId": "1",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "fromPosition": {
    "x": 100,
    "y": 200
  },
  "toPosition": {
    "x": 300,
    "y": 400
  },
  "status": "MOVING"
}
```

## 🏗️ Arquitectura

```
apps/port-operations-simulator/
├── src/
│   ├── main.ts                          # Punto de entrada
│   ├── models/
│   │   └── tugboat.model.ts             # Modelos de datos
│   └── services/
│       ├── rabbitmq.service.ts          # Servicio RabbitMQ
│       └── tugboat.simulator.ts         # Simulador de remolcadores
```

## 🛠️ Comandos Útiles

```bash
# Ejecutar en modo desarrollo
npx nx serve port-operations-simulator

# Compilar la aplicación
npx nx build port-operations-simulator

# Linter
npx nx lint port-operations-simulator
```

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
