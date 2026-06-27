# Enterprise Automation Opportunity Intake Hub

## Complete Setup, Architecture, Operation, and Maintenance Guide

This document is the primary technical guide for the Enterprise Automation Opportunity Intake Hub. It explains what the application does, how its frontend, .NET API, and Azure PostgreSQL database work together, how to set it up on another computer, and how to troubleshoot or extend it safely.

## 1. Project overview

The application manages automation opportunities through an end-to-end enterprise delivery pipeline. A user submits an opportunity, and the application moves it through classification, qualification, scoring, discovery, requirements creation, solution design, ROI approval, prioritization, pod allocation, and sprint readiness.

The active application architecture is:

```text
Browser
  |
  v
React 19 + TypeScript + Vite
  |
  | Relative /api requests
  v
Vite development proxy
  |
  | http://localhost:3001
  v
ASP.NET Core 8 Minimal API
  |
  | Entity Framework Core + Npgsql
  v
Azure Database for PostgreSQL
```

The frontend is tied to the ASP.NET Core API through relative `/api` requests. During development, Vite proxies these requests to `http://localhost:3001`.

## 2. Main technologies

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Zustand for application state
- Recharts for charts
- Tailwind/PostCSS-based styling
- Lucide React icons

### Active backend

- ASP.NET Core 8 Minimal API
- Entity Framework Core 8
- Npgsql PostgreSQL provider
- Swagger/OpenAPI

### Database

- Azure Database for PostgreSQL
- PostgreSQL JSONB for the complete opportunity payload
- Relational columns for frequently accessed opportunity fields

### Legacy backend

The `server/` directory contains the earlier Express, Prisma, and SQLite implementation. It is retained as legacy/reference code.

The normal command:

```powershell
npm run dev
```

starts the ASP.NET Core backend, not the Express backend. Do not add new backend functionality to `server/` unless the application is intentionally being switched back to the Node implementation.

## 3. Repository structure

```text
Enterprise_automation/
|-- backend-dotnet/                 Active ASP.NET Core backend
|   |-- Data/
|   |   |-- AppDbContext.cs         EF Core table and column mappings
|   |   `-- init-postgres.sql       PostgreSQL schema and default data
|   |-- Endpoints/
|   |   `-- ApiEndpoints.cs         HTTP API definitions
|   |-- Models/
|   |   `-- Entities.cs             Database entities
|   |-- Services/
|   |   |-- DefaultData.cs          Default stages and integrations
|   |   |-- OpportunityJson.cs      Opportunity JSON normalization
|   |   |-- PipelineResolver.cs     Enabled-stage progression
|   |   `-- WorkflowEngine.cs       Workflow actions and generated artifacts
|   |-- Properties/
|   |   `-- launchSettings.json     Local ports and launch profiles
|   |-- EnterpriseAutomation.Api.csproj
|   |-- Program.cs                  Service registration and middleware
|   `-- appsettings.json            Base backend configuration
|-- src/                            React frontend
|   |-- components/                 Shared and layout components
|   |-- models/types.ts             Frontend domain types
|   |-- pages/                      Workflow screens
|   |-- state/store.ts              Zustand state and API calls
|   |-- utils/pipeline.ts           Stage, route, and status mappings
|   |-- App.tsx                     Frontend routes
|   `-- main.tsx                    React entry point
|-- server/                         Legacy Express/Prisma backend
|-- package.json                    Frontend scripts and dependencies
|-- vite.config.ts                  Vite configuration and API proxy
`-- PROJECT_GUIDE.md                This guide
```

## 4. Workflow stages

The default workflow contains these stages:

| Order | Persisted stage | Frontend route |
|---:|---|---|
| 1 | Submitted | `/intake` |
| 2 | Classified | `/classification` |
| 3 | Qualified | `/qualification` |
| 4 | Scored | `/scoring` |
| 5 | Discovery | `/discovery` |
| 6 | PRD Creation | `/prd` |
| 7 | Solution Designed | `/solution` |
| 8 | ROI Approved | `/roi` |
| 9 | Prioritized | `/prioritization` |
| 10 | Pod Allocated | `/pods` |
| 11 | Sprint Ready | `/sprint-readiness` |

Stage names, frontend routes, and opportunity statuses are related but are not interchangeable. The mappings are centralized in:

- `src/utils/pipeline.ts` on the frontend
- `backend-dotnet/Services/PipelineResolver.cs` on the backend

When changing a stage name or adding a stage, update both mapping layers and the default stage data. Avoid hardcoding stage labels inside page-specific button handlers.

## 5. Prerequisites

Install the following on the computer that will run the project:

- Git
- Node.js 22 LTS or another version compatible with the installed Vite release
- npm
- .NET 8 SDK
- PostgreSQL command-line tools (`psql`) or pgAdmin
- Access to the Azure PostgreSQL server

Verify the tools:

```powershell
git --version
node --version
npm --version
dotnet --version
psql --version
```

### Using a .NET 11 SDK

The backend project targets `net8.0`. A newer SDK may be able to build it, but the .NET 8 targeting pack and runtime may still be required.

Check installed SDKs and runtimes:

```powershell
dotnet --list-sdks
dotnet --list-runtimes
```

Do not change the project to `net11.0` simply because .NET 11 is installed. .NET 11 is a preview at the time this guide was written. The safest setup is to install .NET 8 alongside newer SDKs and keep:

```xml
<TargetFramework>net8.0</TargetFramework>
```

## 6. Get the project onto another computer

Clone the repository:

```powershell
git clone <REPOSITORY_URL>
cd Enterprise_automation
```

If the project is copied manually, generated directories do not need to be transferred:

```text
node_modules/
dist/
backend-dotnet/bin/
backend-dotnet/obj/
```

Install frontend dependencies:

```powershell
npm install
```

Restore backend packages:

```powershell
dotnet restore backend-dotnet/EnterpriseAutomation.Api.csproj
```

## 7. Configure Azure Database for PostgreSQL

### 7.1 Collect connection information

In Azure Portal, open the Azure Database for PostgreSQL Flexible Server and collect:

```text
Host:       <server>.postgres.database.azure.com
Port:       5432
Database:   enterprise_automation
Username:   <Azure PostgreSQL username>
Password:   <Azure PostgreSQL password>
SSL mode:   Require
```

Use the exact host and username shown by the Azure connection page.

### 7.2 Configure networking

For a server with public access:

1. Open the PostgreSQL server in Azure Portal.
2. Open **Networking**.
3. Ensure public access is enabled.
4. Add the current computer's public client IP address.
5. Save the rule.
6. Allow a few minutes for the firewall change to take effect.

Do not allow every public IP address for normal operation.

For a server using private/VNet access, the computer must have network connectivity to that VNet, normally through a VPN, private endpoint, peering, or an Azure-hosted environment. Adding a public firewall rule will not make a private server publicly reachable.

### 7.3 Create the application database

If `enterprise_automation` does not already exist, connect to the default database:

```powershell
psql "host=<SERVER>.postgres.database.azure.com port=5432 dbname=postgres user=<USERNAME> sslmode=require"
```

Create the database:

```sql
CREATE DATABASE enterprise_automation;
```

Exit:

```sql
\q
```

The Azure account must have permission to create databases. If it does not, ask the Azure PostgreSQL administrator to create the database.

### 7.4 Initialize the schema

From the repository root:

```powershell
psql "host=<SERVER>.postgres.database.azure.com port=5432 dbname=enterprise_automation user=<USERNAME> sslmode=require" -f backend-dotnet/Data/init-postgres.sql
```

Alternatively:

1. Connect to the Azure server with pgAdmin.
2. Select the `enterprise_automation` database.
3. Open Query Tool.
4. Open `backend-dotnet/Data/init-postgres.sql`.
5. Execute the script.

The initialization script is safe to rerun for existing objects because it uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.

It creates:

- `opportunities`
- `stage_configs`
- `documents`
- `integration_configs`
- `audit_trails`
- Supporting indexes
- Default pipeline stages
- Mock integration records

The integration credentials inserted by the script are placeholders. They are not usable production secrets.

## 8. Configure the backend connection

The backend reads:

```text
ConnectionStrings:DefaultConnection
```

ASP.NET Core converts the environment variable name:

```text
ConnectionStrings__DefaultConnection
```

to that configuration key.

Set it in PowerShell before starting the backend:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=<SERVER>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<USERNAME>;Password=<PASSWORD>;Ssl Mode=Require"
```

This variable applies only to the current PowerShell process and child processes. Set it again after opening a new terminal.

For macOS or Linux:

```bash
export ConnectionStrings__DefaultConnection="Host=<SERVER>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<USERNAME>;Password=<PASSWORD>;Ssl Mode=Require"
```

Do not commit real credentials to:

- `backend-dotnet/appsettings.json`
- source code
- SQL files
- frontend environment files

For Azure App Service, add an application setting named:

```text
ConnectionStrings__DefaultConnection
```

and place the complete Npgsql connection string in its value.

## 9. Run the application

### 9.1 Run frontend and backend together

Set the connection string, then run:

```powershell
npm run dev
```

This launches:

- ASP.NET Core API on `http://localhost:3001`
- Swagger on `http://localhost:3001/swagger`
- Vite frontend, normally on `http://localhost:5173`

Keep the terminal open while using the application.

### 9.2 Run the services separately

Backend terminal:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=<SERVER>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<USERNAME>;Password=<PASSWORD>;Ssl Mode=Require"
npm run dev:backend
```

Frontend terminal:

```powershell
npm run dev:frontend
```

Running services separately is useful for isolating startup errors.

### 9.3 Important npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the .NET backend and Vite frontend together |
| `npm run dev:backend` | Start only the ASP.NET Core backend |
| `npm run dev:frontend` | Start only the Vite frontend |
| `npm run dev:backend:node` | Start the legacy Express backend |
| `npm run build` | Type-check and create the production frontend build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the built frontend |

The Prisma and seed scripts in `package.json` belong to the legacy Node backend. They do not initialize the active Azure PostgreSQL/.NET implementation.

## 10. Verify the setup

### 10.1 Backend health

Open:

```text
http://localhost:3001/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "time": "..."
}
```

### 10.2 Swagger

Open:

```text
http://localhost:3001/swagger
```

Swagger is enabled in the Development environment.

### 10.3 Database-backed endpoints

Open:

```text
http://localhost:3001/api/stages
http://localhost:3001/api/opportunities
```

`/api/stages` should return the default ordered pipeline stages. `/api/opportunities` may return an empty array until an opportunity is created.

### 10.4 Frontend

Open:

```text
http://localhost:5173
```

Confirm that:

1. The dashboard loads without API errors.
2. The stage configuration page displays stages.
3. A new opportunity can be submitted.
4. The opportunity appears on the dashboard.
5. Workflow actions persist after refreshing the browser.

### 10.5 Build checks

Frontend:

```powershell
npm run build
npm run lint
```

Backend:

```powershell
dotnet build backend-dotnet/EnterpriseAutomation.Api.csproj
```

## 11. API reference

All active backend endpoints use the `/api` prefix.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |

### Stages

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/stages` | List configured stages and ensure defaults exist |
| PUT | `/api/stages/{id}` | Update a stage's name, order, enabled state, roles, or options |

### Opportunities

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/opportunities` | List opportunities, newest updated first |
| GET | `/api/opportunities/{id}` | Get one opportunity |
| POST | `/api/opportunities` | Create an opportunity |
| PUT | `/api/opportunities/{id}` | Merge updates into an opportunity |
| POST | `/api/opportunities/{id}/advance` | Advance to the next enabled stage |
| DELETE | `/api/opportunities/{id}` | Delete an opportunity |

### Workflow actions

The shared workflow endpoint is:

```text
POST /api/workflow/opportunities/{id}/actions/{action}
```

Supported actions:

| Action | Result |
|---|---|
| `accept-classification` | Accept generated classification |
| `override-classification` | Save a manually overridden classification |
| `approve-qualification` | Approve L1 qualification |
| `request-more-info` | Mark qualification as needing more information |
| `reject-qualification` | Reject the opportunity |
| `generate-score` | Generate scoring and complexity information |
| `apply-discovery` | Save or generate discovery output |
| `apply-prd` | Save or generate the PRD |
| `generate-solution` | Generate a solution recommendation |
| `approve-roi` | Generate/approve the business case |
| `prioritize` | Mark the opportunity prioritized |
| `allocate-pod` | Generate and save a pod allocation |
| `generate-backlog` | Generate backlog items |
| `assess-sprint-readiness` | Evaluate sprint readiness |

The frontend should call `runWorkflowAction(...)` in `src/state/store.ts` rather than implementing independent page-level persistence.

### Documents and context

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/documents/{opportunityId}/{docType}/export` | Export generated text content |
| POST | `/api/context/upload` | Upload opportunity context using multipart form data |
| GET | `/api/context/{opportunityId}` | List uploaded context metadata |

### Generated content and integrations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/llm/generate` | Return generated draft content |
| POST | `/api/integrations/sharepoint/sync` | Return a mock SharePoint synchronization result |

The current LLM and SharePoint endpoints are simulations. They do not call live Azure OpenAI or SharePoint services.

## 12. Data model

### `opportunities`

Stores:

- `id`
- `process_name`
- `current_stage`
- `status`
- Complete opportunity object in `data` as JSONB
- Creation and update timestamps

The scalar columns and the JSONB payload must remain synchronized. Workflow and update code should update both representations.

### `stage_configs`

Stores:

- Stage identifier and display name
- Stage order
- Enabled state
- Allowed roles as JSONB
- Optional configuration as JSONB

The enabled stages affect progression. Disabled stages are skipped by `PipelineResolver`.

### `documents`

Stores uploaded opportunity context and extracted-context metadata. Deleting an opportunity cascades to its document records.

### `integration_configs`

Stores integration provider configuration. The seeded values are mocks and should not be treated as a secure production secret store.

### `audit_trails`

Defines a relational audit-trail table with a cascading opportunity relationship. The opportunity JSON payload also contains audit information used by current workflow behavior.

## 13. Frontend state and API behavior

The Zustand store in `src/state/store.ts` owns:

- Current role
- Stage configuration
- Opportunities
- Selected opportunity
- Sidebar state
- API operations

Only lightweight UI preferences are persisted to browser local storage:

- Role
- Selected opportunity ID
- Sidebar collapsed state

Opportunity data comes from the backend and Azure PostgreSQL. Browser local storage is not the durable source of truth.

The primary API methods are:

- `fetchStages()`
- `fetchOpportunities()`
- `addOpportunity()`
- `updateOpportunity()`
- `runWorkflowAction()`

## 14. Development rules

When adding or changing functionality:

1. Keep frontend requests under the relative `/api` path.
2. Add active API behavior to `backend-dotnet`, not the legacy `server/` directory.
3. Put shared workflow mutations in `WorkflowEngine.cs`.
4. Call workflow mutations through `runWorkflowAction(...)`.
5. Keep scalar opportunity columns synchronized with the JSONB object.
6. Preserve stage-name, route, and status mappings.
7. Add database changes to both EF mappings and the initialization/migration path.
8. Never place database or integration secrets in frontend code.
9. Verify persistence by refreshing the browser after a mutation.
10. Run frontend and backend build checks before handoff.

## 15. Troubleshooting

### `node` or `npm` is not recognized

Node.js is missing from `PATH`.

1. Install Node.js.
2. Close all terminals.
3. Open a new PowerShell window.
4. Run `node --version` and `npm --version`.

### .NET reports that `net8.0` is unavailable

Install the .NET 8 SDK alongside the existing SDK:

```powershell
dotnet --list-sdks
dotnet --list-runtimes
```

Do not solve this by changing the target framework to a preview version.

### Database connection timeout

Check:

- Azure PostgreSQL is running.
- The hostname is correct.
- Port `5432` is reachable.
- The current public IP is allowed in Azure networking.
- A private server is being accessed through the required private network.

### `no pg_hba.conf entry`

This commonly indicates an Azure firewall/network or SSL mismatch. Add the correct client IP and use:

```text
Ssl Mode=Require
```

### Password authentication failed

Verify the username and password from Azure Portal. Use the exact Azure username format shown in the connection instructions.

### `relation "..." does not exist`

The schema was not initialized in the database named by the backend connection string. Run:

```powershell
psql "host=<SERVER>.postgres.database.azure.com port=5432 dbname=enterprise_automation user=<USERNAME> sslmode=require" -f backend-dotnet/Data/init-postgres.sql
```

### Backend starts but frontend API calls fail

Confirm:

- Backend is listening on `http://localhost:3001`.
- Frontend is running through Vite.
- `vite.config.ts` still proxies `/api` to port `3001`.
- Another process is not occupying port `3001`.

### CORS error

The backend currently allows:

```text
http://localhost:5173
http://127.0.0.1:5173
```

If the frontend runs on a different origin, update the CORS configuration in `backend-dotnet/Program.cs`.

### Swagger is unavailable

Swagger is enabled only when:

```text
ASPNETCORE_ENVIRONMENT=Development
```

The `http` launch profile sets this automatically.

### Stages are missing

Run the initialization SQL. Calling `GET /api/stages` also inserts missing default stages when the table already exists.

### Changes disappear after refreshing

Confirm that the frontend action calls the backend and that the backend successfully saves to Azure PostgreSQL. Page-local React state is not durable.

## 16. Production deployment considerations

The current project is development-ready but requires additional work for a hardened production deployment.

Before production:

- Replace mock LLM, SharePoint, and other connector endpoints.
- Store secrets in Azure App Service configuration or Azure Key Vault.
- Add authentication and authorization.
- Restrict CORS to the deployed frontend origin.
- Add request validation and consistent error responses.
- Add structured logging and monitoring.
- Add database backups and retention policies.
- Use controlled EF Core migrations or versioned SQL migrations.
- Review uploaded-file handling, size limits, malware scanning, and supported formats.
- Serve the frontend and API through appropriate HTTPS endpoints.
- Configure health probes.
- Review audit behavior and personally identifiable information.
- Remove or protect Swagger in production.

### Suggested Azure deployment

```text
Azure Static Web Apps or App Service
                |
                v
       Azure App Service (.NET API)
                |
                v
 Azure Database for PostgreSQL Flexible Server
```

If frontend and API are deployed to different origins:

1. Configure the production API base URL or reverse proxy.
2. Add the frontend origin to backend CORS.
3. Use HTTPS for both services.

If they are served under one origin, preserve `/api` as the backend route prefix so existing frontend requests continue to work.

## 17. Quick setup checklist

```text
[ ] Clone or copy the repository
[ ] Install Node.js and npm
[ ] Install .NET 8 SDK
[ ] Confirm access to Azure PostgreSQL
[ ] Allow the client IP or connect to the private network
[ ] Create enterprise_automation database if needed
[ ] Run backend-dotnet/Data/init-postgres.sql
[ ] Set ConnectionStrings__DefaultConnection
[ ] Run npm install
[ ] Run dotnet restore
[ ] Run npm run dev
[ ] Verify /api/health
[ ] Verify /swagger
[ ] Verify the frontend
[ ] Create and refresh an opportunity to confirm persistence
```

## 18. Quick command reference

```powershell
# Install dependencies
npm install
dotnet restore backend-dotnet/EnterpriseAutomation.Api.csproj

# Configure Azure PostgreSQL for the current terminal
$env:ConnectionStrings__DefaultConnection="Host=<SERVER>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<USERNAME>;Password=<PASSWORD>;Ssl Mode=Require"

# Initialize database
psql "host=<SERVER>.postgres.database.azure.com port=5432 dbname=enterprise_automation user=<USERNAME> sslmode=require" -f backend-dotnet/Data/init-postgres.sql

# Run complete application
npm run dev

# Build and validate
npm run build
npm run lint
dotnet build backend-dotnet/EnterpriseAutomation.Api.csproj
```

## 19. Key local URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend health | `http://localhost:3001/api/health` |
| Swagger | `http://localhost:3001/swagger` |
| Stages API | `http://localhost:3001/api/stages` |
| Opportunities API | `http://localhost:3001/api/opportunities` |

