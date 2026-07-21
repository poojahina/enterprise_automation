# Azure Deployment Guide

Deploy this project as two separate Azure Web Apps:

- Frontend: React/Vite static UI
- Backend: ASP.NET Core API from `backend-dotnet`

## 1. Backend Web App

Create an Azure App Service for the API:

- Runtime stack: `.NET 8`
- OS: Windows or Linux
- App name example: `enterprise-automation-api`

Add these App Settings / Configuration values:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=<postgres-server>.postgres.database.azure.com;Port=5432;Database=enterprise_automation;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true
Cors__AllowedOrigins__0=https://<frontend-app-name>.azurewebsites.net
```

Publish backend:

```powershell
dotnet publish backend-dotnet\EnterpriseAutomation.Api.csproj -c Release -o .tmp\api-publish
```

Deploy `.tmp\api-publish` to the backend Azure Web App.

Backend health check:

```text
https://<backend-app-name>.azurewebsites.net/api/health
```

## 2. Frontend Web App

Create another Azure App Service for the UI:

- Runtime stack: Node.js
- App name example: `enterprise-automation-ui`

Set this App Setting before building:

```text
VITE_API_BASE_URL=https://<backend-app-name>.azurewebsites.net
```

Build frontend:

```powershell
npm install
npm run build
```

Deploy the generated `dist` folder to the frontend Azure Web App.

If the frontend Web App is Linux/Node, use this startup command:

```text
pm2 serve /home/site/wwwroot --spa --no-daemon
```

If the frontend Web App is Windows/IIS, `public/web.config` is copied into `dist` during build and handles React Router refresh/deep-link fallback.

## 3. PostgreSQL

Use Azure Database for PostgreSQL and confirm:

- Database `enterprise_automation` exists.
- Backend Web App outbound access is allowed in PostgreSQL firewall/networking.
- SSL is enabled.
- Tables are created by the backend on startup.

## 4. Required Cross-App Settings

Frontend app:

```text
VITE_API_BASE_URL=https://<backend-app-name>.azurewebsites.net
```

Backend app:

```text
Cors__AllowedOrigins__0=https://<frontend-app-name>.azurewebsites.net
ConnectionStrings__DefaultConnection=<azure-postgres-connection-string>
```

## 5. Quick Smoke Test

After deployment:

1. Open backend health URL.
2. Open frontend URL.
3. Confirm dashboard loads opportunities.
4. Submit one idea.
5. Move it through Classification, Discovery, PDD, A2B, and SDD.
