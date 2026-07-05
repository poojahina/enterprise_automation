# Enterprise Automation .NET Backend

ASP.NET Core 8 Web API replacement for the original Express/Prisma backend.

## Local Run

```powershell
cd backend-dotnet
$env:ConnectionStrings__DefaultConnection="Host=<server>;Port=5432;Database=enterprise_automation;Username=<user>;Password=<password>;Ssl Mode=Require"
dotnet restore
dotnet run --launch-profile http
```

The API listens on `http://localhost:3001`, matching the existing Vite proxy.

## Azure PostgreSQL

Set this connection string in Azure App Service configuration as:

`ConnectionStrings__DefaultConnection`

Example value:

```text
Host=<server>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true
```

Initialize the database by running:

```sql
\i backend-dotnet/Data/init-postgres.sql
```

or copy the contents of `Data/init-postgres.sql` into Azure Data Studio, pgAdmin, or the Azure Portal query editor.

For a database created before A2B was added, run `Data/migrations/20260705_add_a2b_readiness.sql` instead.

## EF Migrations

This project is EF Core-ready. If you install the EF tool:

```powershell
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate --project backend-dotnet/EnterpriseAutomation.Api.csproj --output-dir Data/Migrations
dotnet ef database update --project backend-dotnet/EnterpriseAutomation.Api.csproj
```

## API Parity

Implemented endpoints:

- `GET /api/health`
- `GET /api/stages`
- `PUT /api/stages/{id}`
- `GET /api/opportunities`
- `GET /api/opportunities/{id}`
- `POST /api/opportunities`
- `PUT /api/opportunities/{id}`
- `GET|POST /api/a2b/criteria`
- `PUT|DELETE /api/a2b/criteria/{id}`
- `POST /api/projects/{projectId}/a2b/run`
- `GET /api/projects/{projectId}/a2b/status`
- `GET /api/projects/{projectId}/a2b/results`
- `POST /api/projects/{projectId}/a2b/override`
- `POST /api/opportunities/{id}/advance`
- `DELETE /api/opportunities/{id}`
- `POST /api/workflow/opportunities/{id}/actions/{action}`
- `GET /api/documents/{opportunityId}/{docType}/export`
- `POST /api/context/upload`
- `GET /api/context/{opportunityId}`
- `POST /api/llm/generate`
- `POST /api/integrations/sharepoint/sync`
