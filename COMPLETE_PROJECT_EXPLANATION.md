# Factory HUB — Complete Project Explanation

## 1. Purpose

Factory HUB manages automation opportunities from initial idea submission through analysis, solution design, prioritization, and delivery readiness.

The application provides one governed workflow:

```text
Intake
→ Classification
→ Qualification
→ Scoring
→ Discovery
→ PDD Creation
→ A2B Readiness Check
→ SDD Creation
→ ROI Approval
→ Prioritization
→ Pod Allocation
→ Sprint Readiness
```

The platform preserves the opportunity, generated documents, readiness evidence, decisions, overrides, and audit history in the database.

## 2. Supported Technology Tracks

Factory HUB recommends exactly one of three solution tracks.

### Power Platform

Used for low-code applications, approval workflows, Microsoft 365 processes, connector-driven integrations, and operational reporting.

Primary components:

- Power Apps
- Power Automate cloud flows
- Power Automate desktop flows when required
- Microsoft Dataverse
- Approved connectors
- Power BI
- Managed solutions and environment variables

### Automation Anywhere

Used for deterministic automation involving legacy applications, repetitive user-interface work, attended automation, and unattended processing.

Primary components:

- Automation Anywhere Control Room
- Bot Creator
- Attended Bot Runners
- Unattended Bot Runners
- Workload queues
- Credential vault
- Document Automation
- Bot Insight

### Azure AI

Used when the process requires document understanding, language processing, enterprise knowledge retrieval, reasoning, generative AI, or governed agents.

Primary components:

- Microsoft Foundry
- Azure OpenAI
- Azure Document Intelligence
- Azure AI Search
- Azure Content Safety
- Azure Functions
- Application Insights

Legacy classifications are normalized:

| Legacy value | Current value |
|---|---|
| `Power Automate/Power Platform` | `Power Platform` |
| `RPA` | `Automation Anywhere` |
| `Intelligent Automation` | `Azure AI` |
| `Hyperautomation/Agentic Automation` | `Azure AI` |

## 3. Main Architecture

```text
React + TypeScript frontend
           |
           | /api through Vite proxy
           v
ASP.NET Core 8 minimal API
           |
           | Entity Framework Core + Npgsql
           v
Azure Database for PostgreSQL
```

The active runtime uses:

- React and Vite frontend from `src/`
- ASP.NET Core backend from `backend-dotnet/`
- Azure PostgreSQL

The Express, Prisma, and SQLite implementation under `server/` is a legacy compatibility backend.

## 4. Frontend Structure

### Application entry points

- `src/main.tsx` starts React.
- `src/App.tsx` defines routes.
- `src/components/layout/AppLayout.tsx` provides the shared layout.
- `src/components/layout/Sidebar.tsx` provides navigation.
- `src/components/layout/Header.tsx` provides the application header.

### Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Portfolio summary and KPIs |
| `/intake` | Submit an automation opportunity |
| `/classification` | Select the solution technology |
| `/qualification` | Check basic feasibility |
| `/scoring` | Calculate value, feasibility, and priority |
| `/discovery` | Capture detailed process information |
| `/pdd` | Generate the Process Definition Document |
| `/a2b` | Execute Analysis-to-Build readiness |
| `/projects/:projectId/a2b` | Project-specific A2B route |
| `/sdd` | Generate the Solution Design Document |
| `/user-stories` | Generate delivery backlog items |
| `/roi` | Calculate financial return |
| `/prioritization` | Rank opportunities |
| `/pods` | Allocate a delivery pod |
| `/sprint-readiness` | Validate sprint readiness |
| `/documents` | View and export documents |
| `/settings` | Configure workflow stages |

### State management

`src/state/store.ts` is the main Zustand store.

It controls:

- Current user role
- Opportunities
- Selected opportunity
- Stage configuration
- API loading
- Workflow actions
- Legacy stage normalization
- Legacy technology normalization
- Sidebar state

The frontend calls `runWorkflowAction(id, action, payload)` for durable workflow operations.

### Pipeline mapping

`src/utils/pipeline.ts` keeps stage names, opportunity statuses, frontend routes, and legacy aliases separate.

This layer decides:

- Which page belongs to a stage
- Which enabled stage comes next
- Which stages appear in the progress stepper
- How legacy names are normalized

## 5. Workflow Stages

### Intake

The intake wizard captures:

- Process name and description
- Business unit and owner
- Process characteristics
- Business impact
- Technical applications and data
- Process volumes
- Priority and compliance information

It then invokes the classification logic.

### Classification

`src/utils/classifyAutomationType.ts` scores the opportunity against:

- Power Platform
- Automation Anywhere
- Azure AI

The classification returns:

- Recommended platform
- Confidence score
- Reasoning
- Assumptions
- Alternative scores

An analyst can accept or override the result.

### Qualification

Qualification determines whether enough information and feasibility exist to continue.

Possible results:

- Qualified
- Rejected
- Needs More Information

### Scoring

Scoring calculates:

- Business impact
- Strategic alignment
- Technical feasibility
- ROI potential
- Overall score
- Priority band
- Delivery complexity

### Discovery

Discovery captures:

- Current process steps
- Variants
- Exceptions
- Business rules
- Inputs and outputs
- Systems and integrations
- Human approvals
- SLAs
- Compliance requirements
- Data volume and peak periods

### PDD Creation

The PDD describes the business process before technical solution design.

It contains:

- Process overview
- Current-state process
- Systems
- Inputs and outputs
- Business rules
- Exceptions
- Human approvals
- Pain points and baseline
- Target process
- Controls and compliance
- Open items

Generating or changing a PDD invalidates any previous A2B approval.

### A2B Readiness

A2B means Analysis-to-Build Readiness.

It is mandatory between PDD and SDD.

A2B evaluates:

- Generated PDD content
- Uploaded PDD files
- BRDs
- Requirements documents
- Process documents
- Supporting attachments

The criteria are stored in the database and are not hardcoded in the evaluation algorithm.

Each criterion contains:

- Name
- Description
- Category
- Severity
- Expected evidence
- Applicable document types
- Active status
- Creation and modification timestamps

Each result contains:

- `passed`
- `failed`
- `partial`
- `not_applicable`
- Confidence score
- Evidence found
- Missing information
- Recommendation
- Source document
- Source location

Overall decisions:

- `READY`
- `NOT_READY`
- `READY_WITH_RISKS`

Decision rules:

- A failed mandatory criterion produces `NOT_READY`.
- A failed recommended criterion produces `READY_WITH_RISKS`.
- A failed optional criterion does not block readiness.

SDD generation is enabled only when:

- A2B is `READY`, or
- An authorized override is active.

Authorized override roles:

- Product Owner
- Solution Architect
- Automation COE Analyst

Changing Discovery, PDD, or uploaded documents invalidates stale readiness and override decisions.

### SDD Creation

The SDD contains the technical solution.

It includes:

- To-be solution summary
- Recommended technology
- Architecture
- Components
- Integrations
- Human-in-the-loop design
- Security
- Monitoring
- Scalability
- Estimated effort

The generated design changes according to the selected technology track.

### ROI

The ROI stage calculates:

- Implementation cost
- Annual savings
- Annual support cost
- ROI percentage
- Payback period
- NPV
- Break-even point
- Story points
- Timeline
- FTE reduction

### Prioritization

Opportunities are ranked using value, feasibility, complexity, risk, and strategic importance.

### Pod Allocation

The application recommends a team aligned to the technology:

- Power Platform Guild
- Automation Anywhere Center of Excellence
- Azure AI Engineering Squad

### Sprint Readiness

Sprint readiness checks whether the opportunity has the analysis, design, ownership, controls, and delivery information required to enter implementation.

## 6. Active Backend

The active API is under `backend-dotnet/`.

### `Program.cs`

Configures:

- PostgreSQL connection
- Entity Framework Core
- Npgsql
- Dependency injection
- `PipelineResolver`
- `A2BReadinessService`
- `WorkflowEngine`
- CORS
- Swagger
- API routing

The backend normally runs at:

```text
http://localhost:3001
```

### `Endpoints/ApiEndpoints.cs`

Defines endpoints for:

- Health
- Stage configuration
- Opportunities
- Workflow actions
- Documents
- Context uploads
- PDD, SDD, and user-story artifacts
- A2B criteria
- A2B runs
- A2B results
- A2B overrides
- Mock LLM generation
- Integration actions

It also protects SDD through multiple paths:

- Direct SDD artifact generation
- Shared workflow action
- Opportunity updates
- Stage advancement

### `Services/WorkflowEngine.cs`

Contains workflow business operations and generated content.

It handles:

- Classification acceptance and override
- Qualification
- Scoring
- Discovery generation
- PDD generation
- SDD generation
- ROI
- Pod allocation
- User-story generation
- Sprint readiness

### `Services/A2BReadinessService.cs`

Loads:

- Active database criteria
- Project documents
- PDD content

It filters documents using each criterion's applicable document types, evaluates expected evidence, stores results, calculates the overall decision, updates the opportunity gate, and creates audit events.

### `Services/PipelineResolver.cs`

Loads enabled stages from the database and resolves the next stage while supporting legacy stage aliases.

### `Services/OpportunityJson.cs`

Converts between:

- PostgreSQL entity columns
- The opportunity `jsonb` payload
- API response objects

It also maintains the JSON audit trail.

## 7. Database Design

The active database is Azure Database for PostgreSQL.

### `opportunities`

Stores:

- Opportunity ID
- Process name
- Current stage
- Status
- A2B status
- Last A2B run ID
- SDD enabled flag
- Full opportunity JSON
- Creation and update timestamps

### `stage_configs`

Stores:

- Stage ID
- Stage name
- Order
- Enabled status
- Allowed roles
- Configuration options

A2B is mandatory and cannot be disabled.

### `documents`

Stores uploaded project documents:

- File name
- MIME type
- Encoded content
- Extracted context
- Upload timestamp

### `audit_trails`

Stores durable audit records:

- Action
- User
- Role
- Details
- Stage
- Timestamp

### `integration_configs`

Stores integration configuration and secret references.

### `a2b_readiness_criteria`

Stores configurable readiness rules.

### `a2b_readiness_runs`

Stores every A2B execution and its overall score and decision.

### `a2b_readiness_results`

Stores the result of every criterion in a run.

### `a2b_overrides`

Stores authorized override decisions.

Overrides can be invalidated when the analysis changes.

## 8. Database Setup

For a new PostgreSQL database, execute:

```text
backend-dotnet/Data/init-postgres.sql
```

For an existing database created before A2B, execute:

```text
backend-dotnet/Data/migrations/20260705_add_a2b_readiness.sql
```

The backend reads:

```text
ConnectionStrings:DefaultConnection
```

The corresponding environment variable is:

```text
ConnectionStrings__DefaultConnection
```

## 9. Main API Routes

### Opportunities

```text
GET    /api/opportunities
GET    /api/opportunities/{id}
POST   /api/opportunities
PUT    /api/opportunities/{id}
DELETE /api/opportunities/{id}
POST   /api/opportunities/{id}/advance
```

### Workflow

```text
POST /api/workflow/opportunities/{id}/actions/{action}
```

### Artifacts

```text
POST /api/artifacts/{id}/pdd/generate
POST /api/artifacts/{id}/sdd/generate
POST /api/artifacts/{id}/user-stories/generate

GET /api/artifacts/{id}/pdd
GET /api/artifacts/{id}/sdd
GET /api/artifacts/{id}/user-stories
```

### A2B

```text
GET    /api/a2b/criteria
POST   /api/a2b/criteria
PUT    /api/a2b/criteria/{id}
DELETE /api/a2b/criteria/{id}

POST /api/projects/{projectId}/a2b/run
GET  /api/projects/{projectId}/a2b/status
GET  /api/projects/{projectId}/a2b/results
POST /api/projects/{projectId}/a2b/override
```

### Documents

```text
POST /api/context/upload
GET  /api/context/{opportunityId}
GET  /api/documents/{opportunityId}/{documentType}/export
```

## 10. Legacy Backend

The `server/` directory contains the older implementation:

- Express
- TypeScript
- Prisma
- SQLite

It has parity routes for workflow, documents, artifacts, stages, and A2B.

The normal application does not need this backend.

To use it intentionally:

```powershell
npm run prisma:generate
npm run prisma:push
npm run dev:backend:node
```

## 11. Running the Application

Install frontend dependencies:

```powershell
npm install
```

Run the frontend and .NET backend:

```powershell
npm run dev
```

Run separately:

```powershell
npm run dev:backend
npm run dev:frontend
```

Main URLs:

```text
Frontend: http://localhost:5173
API:      http://localhost:3001
Swagger:  http://localhost:3001/swagger
Health:   http://localhost:3001/api/health
```

## 12. Testing

Backend tests are in `backend-dotnet.Tests/`.

They cover:

- A2B decision calculation
- Empty-document handling
- Inactive criteria
- Applicable document types
- Persisted A2B gate state
- Database mappings
- Technology-specific SDD output
- Legacy technology normalization

Run:

```powershell
dotnet test backend-dotnet.Tests/EnterpriseAutomation.Api.Tests.csproj
```

Build the backend:

```powershell
dotnet build backend-dotnet/EnterpriseAutomation.Api.csproj
```

Build the frontend:

```powershell
npm run build
```

## 13. Important Development Rules

- Use the .NET backend as the active backend.
- Keep stage names, statuses, and routes separate.
- Route workflow changes through the shared workflow engine.
- Do not bypass A2B when generating SDD.
- Invalidate A2B when analysis evidence changes.
- Keep readiness criteria database-driven.
- Preserve audit events for automated and manual decisions.
- Keep Power Platform, Automation Anywhere, and Azure AI as the only new classification outputs.
- Use PostgreSQL migrations for existing databases.
- Never place production credentials in frontend code.

## 14. Related Files

- `PROJECT_GUIDE.md` — detailed installation, operation, and troubleshooting guide
- `backend-dotnet/README.md` — backend setup and API summary
- `backend-dotnet/Data/init-postgres.sql` — new database initialization
- `backend-dotnet/Data/migrations/20260705_add_a2b_readiness.sql` — existing database upgrade
- `src/models/types.ts` — frontend domain types
- `src/state/store.ts` — frontend API and state management
- `src/utils/pipeline.ts` — pipeline mapping
- `src/utils/classifyAutomationType.ts` — solution classification
- `backend-dotnet/Endpoints/ApiEndpoints.cs` — active API surface
- `backend-dotnet/Services/WorkflowEngine.cs` — workflow behavior
- `backend-dotnet/Services/A2BReadinessService.cs` — A2B evaluation
- `backend-dotnet/Data/AppDbContext.cs` — EF Core database mapping
