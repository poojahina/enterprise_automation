using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using EnterpriseAutomation.Api.Data;
using EnterpriseAutomation.Api.Models;
using EnterpriseAutomation.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAutomation.Api.Endpoints;

public static class ApiEndpoints
{
    public static void MapEnterpriseAutomationApi(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

        api.MapGet("/stages", async (AppDbContext db) =>
        {
            await EnsureDefaultsAsync(db);
            var stages = await db.StageConfigs.OrderBy(s => s.Order).ToListAsync();
            return Results.Ok(stages.Select(ToStageDto));
        });

        api.MapPut("/stages/{id}", async (string id, JsonElement body, AppDbContext db) =>
        {
            var stage = await db.StageConfigs.FindAsync(id);
            if (stage is null) return Results.NotFound(new { error = "Stage not found" });

            var data = OpportunityJson.FromBody(body);
            if (data["name"] is not null) stage.Name = data["name"]!.GetValue<string>();
            if (data["isEnabled"] is not null)
            {
                var enabled = data["isEnabled"]!.GetValue<bool>();
                if (stage.Name == "A2B Readiness Check" && !enabled)
                    return Results.BadRequest(new { error = "A2B Readiness Check is mandatory and cannot be disabled." });
                stage.IsEnabled = enabled;
            }
            if (data["order"] is not null) stage.Order = data["order"]!.GetValue<int>();
            if (data["rolesAllowed"] is not null) stage.RolesAllowed = data["rolesAllowed"]!.ToJsonString(OpportunityJson.JsonOptions);
            if (data["configOptions"] is not null) stage.ConfigOptions = data["configOptions"]!.ToJsonString(OpportunityJson.JsonOptions);

            await db.SaveChangesAsync();
            return Results.Ok(ToStageDto(stage));
        });

        api.MapPut("/stages", async (JsonElement body, AppDbContext db) =>
        {
            var data = OpportunityJson.FromBody(body);
            if (data["stages"] is not JsonArray requestedStages || requestedStages.Count == 0)
                return Results.BadRequest(new { error = "At least one stage is required" });

            var stages = await db.StageConfigs.OrderBy(s => s.Order).ToListAsync();
            var byId = stages.ToDictionary(s => s.Id);
            var requestedIds = new HashSet<string>();

            foreach (var node in requestedStages)
            {
                if (node is not JsonObject requested) return Results.BadRequest(new { error = "Each stage must be an object" });
                var id = OpportunityJson.StringValue(requested, "id");
                if (string.IsNullOrWhiteSpace(id) || !requestedIds.Add(id))
                    return Results.BadRequest(new { error = "Every stage must have a unique id" });
                if (!byId.TryGetValue(id, out var stage))
                    return Results.BadRequest(new { error = $"Unknown stage: {id}" });
                if (requested["isEnabled"] is not JsonValue enabledValue ||
                    !enabledValue.TryGetValue<bool>(out var isEnabled))
                    return Results.BadRequest(new { error = $"isEnabled must be true or false for {stage.Name}" });
                if (stage.Name == "A2B Readiness Check" && !isEnabled)
                    return Results.BadRequest(new { error = "A2B Readiness Check is mandatory and cannot be disabled." });

                stage.IsEnabled = isEnabled;
            }

            await db.SaveChangesAsync();
            return Results.Ok(stages.Select(ToStageDto));
        });

        api.MapGet("/opportunities", async (AppDbContext db) =>
        {
            var opportunities = await db.Opportunities.OrderByDescending(o => o.UpdatedAt).ToListAsync();
            return Results.Json(opportunities.Select(OpportunityJson.Parse), OpportunityJson.JsonOptions);
        });

        api.MapGet("/opportunities/{id}", async (string id, AppDbContext db) =>
        {
            var opportunity = await db.Opportunities.FindAsync(id);
            return opportunity is null
                ? Results.NotFound(new { error = "Opportunity not found" })
                : Results.Json(OpportunityJson.Parse(opportunity), OpportunityJson.JsonOptions);
        });

        api.MapPost("/opportunities", async (JsonElement body, AppDbContext db) =>
        {
            var payload = OpportunityJson.Normalize(OpportunityJson.FromBody(body));
            var id = OpportunityJson.StringValue(payload, "id", Guid.NewGuid().ToString());
            var processName = OpportunityJson.StringValue(payload, "processName", "Untitled automation opportunity");
            var currentStage = OpportunityJson.StringValue(payload, "currentStage", "Submitted");
            var status = OpportunityJson.StringValue(payload, "status", "Active");
            payload["id"] = id;
            payload["processName"] = processName;
            payload["currentStage"] = currentStage;
            payload["status"] = status;
            payload["pipelineStatus"] = status;
            OpportunityJson.AppendAudit(payload, "Opportunity Created", $"Created opportunity \"{processName}\"", OpportunityJson.StringValue(payload, "submittedBy", "System"), "Business User");

            var entity = new OpportunityEntity
            {
                Id = id,
                ProcessName = processName,
                CurrentStage = currentStage,
                Status = status,
                A2BStatus = OpportunityJson.StringValue(payload, "a2bStatus", "NOT_RUN"),
                A2BLastRunId = OpportunityJson.StringValue(payload, "a2bLastRunId", "") is { Length: > 0 } lastRunId ? lastRunId : null,
                SddEnabled = OpportunityJson.BoolPath(payload, "sddEnabled"),
                Data = payload.ToJsonString(OpportunityJson.JsonOptions),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Opportunities.Add(entity);
            await db.SaveChangesAsync();
            return Results.Json(OpportunityJson.Parse(entity), OpportunityJson.JsonOptions, statusCode: StatusCodes.Status201Created);
        });

        api.MapPut("/opportunities/{id}", async (string id, JsonElement body, AppDbContext db) =>
        {
            var entity = await db.Opportunities.FindAsync(id);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });

            var current = OpportunityJson.Parse(entity);
            var updates = OpportunityJson.FromBody(body);
            var requestsSdd = OpportunityJson.StringValue(updates, "currentStage") == "SDD Creation" ||
                              updates["solution"] is not null;
            if (requestsSdd && !entity.SddEnabled)
                return Results.Conflict(new { error = "SDD changes are blocked until A2B is READY or overridden.", code = "A2B_NOT_READY" });
            foreach (var kvp in updates) current[kvp.Key] = kvp.Value?.DeepClone();
            if (updates["pdd"] is not null || updates["discovery"] is not null)
                await InvalidateA2BAsync(db, entity, current);
            current["id"] = id;
            current = OpportunityJson.Normalize(current);
            OpportunityJson.AppendAudit(current, "Opportunity Updated", "Updated opportunity details", OpportunityJson.StringValue(updates, "performedBy", "System"), OpportunityJson.StringValue(updates, "role", "System"));

            entity.ProcessName = OpportunityJson.StringValue(current, "processName", entity.ProcessName);
            entity.CurrentStage = OpportunityJson.StringValue(current, "currentStage", entity.CurrentStage);
            entity.Status = OpportunityJson.StringValue(current, "status", entity.Status);
            entity.Data = current.ToJsonString(OpportunityJson.JsonOptions);
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Json(OpportunityJson.Parse(entity), OpportunityJson.JsonOptions);
        });

        api.MapPost("/opportunities/{id}/advance", async (string id, JsonElement body, AppDbContext db, PipelineResolver resolver) =>
        {
            var entity = await db.Opportunities.FindAsync(id);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });
            var nextStage = await resolver.ResolveNextStageAsync(entity.CurrentStage);
            if (nextStage is null) return Results.BadRequest(new { error = "No next enabled stage is available" });
            if (PipelineResolver.Normalize(nextStage) == "SDD Creation" && !entity.SddEnabled)
                return Results.Conflict(new { error = "Cannot advance to SDD until A2B is READY or overridden.", code = "A2B_NOT_READY" });

            var data = OpportunityJson.Parse(entity);
            data["currentStage"] = nextStage;
            OpportunityJson.AppendAudit(data, "Stage Advanced", $"Moved from {entity.CurrentStage} to {nextStage}");
            entity.CurrentStage = nextStage;
            entity.Data = data.ToJsonString(OpportunityJson.JsonOptions);
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Json(OpportunityJson.Parse(entity), OpportunityJson.JsonOptions);
        });

        api.MapDelete("/opportunities/{id}", async (string id, AppDbContext db) =>
        {
            var entity = await db.Opportunities.FindAsync(id);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });
            db.Opportunities.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        api.MapPost("/workflow/opportunities/{id}/actions/{action}", async (string id, string action, JsonElement body, AppDbContext db, WorkflowEngine workflow, A2BReadinessService a2b) =>
        {
            var entity = await db.Opportunities.FindAsync(id);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });

            try
            {
                if (action == "generate-solution")
                {
                    if (!await a2b.CanGenerateSddAsync(id))
                        return Results.Conflict(new { error = "SDD generation is blocked until A2B is READY or an authorized override is recorded.", code = "A2B_NOT_READY" });
                }
                var current = OpportunityJson.Parse(entity);
                var input = body.ValueKind == JsonValueKind.Undefined ? [] : OpportunityJson.FromBody(body);
                var updated = workflow.Run(current, action, input);
                if (action == "apply-pdd") await InvalidateA2BAsync(db, entity, updated);
                entity.ProcessName = OpportunityJson.StringValue(updated, "processName", entity.ProcessName);
                entity.CurrentStage = OpportunityJson.StringValue(updated, "currentStage", entity.CurrentStage);
                entity.Status = OpportunityJson.StringValue(updated, "status", entity.Status);
                entity.Data = updated.ToJsonString(OpportunityJson.JsonOptions);
                entity.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                return Results.Json(OpportunityJson.Parse(entity), OpportunityJson.JsonOptions);
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        });

        api.MapGet("/documents/{opportunityId}/{docType}/export", async (string opportunityId, string docType, AppDbContext db, WorkflowEngine workflow) =>
        {
            var entity = await db.Opportunities.FindAsync(opportunityId);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });
            var text = workflow.GenerateDocument(OpportunityJson.Parse(entity), docType);
            return Results.File(Encoding.UTF8.GetBytes(text), "text/plain; charset=utf-8", $"{opportunityId}-{docType}.txt");
        });

        api.MapPost("/artifacts/{opportunityId}/pdd/generate",
            (string opportunityId, AppDbContext db, WorkflowEngine workflow) =>
                GenerateArtifactAsync(opportunityId, "apply-pdd", db, workflow));
        api.MapPost("/artifacts/{opportunityId}/sdd/generate",
            async (string opportunityId, AppDbContext db, WorkflowEngine workflow, A2BReadinessService a2b) =>
                await a2b.CanGenerateSddAsync(opportunityId)
                    ? await GenerateArtifactAsync(opportunityId, "generate-solution", db, workflow)
                    : Results.Conflict(new { error = "SDD generation is blocked until A2B is READY or overridden.", code = "A2B_NOT_READY" }));
        api.MapPost("/artifacts/{opportunityId}/user-stories/generate",
            (string opportunityId, AppDbContext db, WorkflowEngine workflow) =>
                GenerateArtifactAsync(opportunityId, "generate-backlog", db, workflow));

        api.MapGet("/artifacts/{opportunityId}/pdd",
            (string opportunityId, AppDbContext db) => GetArtifactAsync(opportunityId, "pdd", db));
        api.MapGet("/artifacts/{opportunityId}/sdd",
            (string opportunityId, AppDbContext db) => GetArtifactAsync(opportunityId, "solution", db));
        api.MapGet("/artifacts/{opportunityId}/user-stories",
            (string opportunityId, AppDbContext db) => GetArtifactAsync(opportunityId, "backlogItems", db));

        api.MapPost("/context/upload", async (HttpRequest request, AppDbContext db) =>
        {
            var form = await request.ReadFormAsync();
            var opportunityId = form["opportunityId"].ToString();
            var file = form.Files.GetFile("file");
            if (file is null) return Results.BadRequest(new { error = "No file uploaded" });
            if (string.IsNullOrWhiteSpace(opportunityId)) return Results.BadRequest(new { error = "Missing opportunityId" });
            var opportunity = await db.Opportunities.FindAsync(opportunityId);
            if (opportunity is null)
                return Results.NotFound(new { error = "Opportunity not found" });

            await using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            var content = await reader.ReadToEndAsync();
            var document = new DocumentEntity
            {
                OpportunityId = opportunityId,
                FileName = file.FileName,
                FileType = file.ContentType,
                Content = Convert.ToBase64String(Encoding.UTF8.GetBytes(content)),
                ExtractedContext = $"Parsed {file.FileName}. Content length: {content.Length} characters.",
                UploadedAt = DateTime.UtcNow
            };
            db.Documents.Add(document);
            var opportunityData = OpportunityJson.Parse(opportunity);
            await InvalidateA2BAsync(db, opportunity, opportunityData);
            opportunity.Data = opportunityData.ToJsonString(OpportunityJson.JsonOptions);
            opportunity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(new { success = true, document });
        });

        api.MapGet("/context/{opportunityId}", async (string opportunityId, AppDbContext db) =>
        {
            var docs = await db.Documents
                .Where(d => d.OpportunityId == opportunityId)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new { d.Id, d.FileName, d.FileType, d.UploadedAt, d.ExtractedContext })
                .ToListAsync();
            return Results.Ok(docs);
        });

        api.MapGet("/a2b/criteria", async (AppDbContext db) =>
        {
            await EnsureDefaultsAsync(db);
            var criteria = await db.A2BReadinessCriteria.OrderBy(c => c.CreatedAt).ToListAsync();
            return Results.Ok(criteria.Select(ToA2BCriterionDto));
        });

        api.MapPost("/a2b/criteria", async (JsonElement body, AppDbContext db) =>
        {
            var data = OpportunityJson.FromBody(body);
            var severity = OpportunityJson.StringValue(data, "severity", "recommended").ToLowerInvariant();
            if (!new[] { "mandatory", "recommended", "optional" }.Contains(severity))
                return Results.BadRequest(new { error = "Severity must be mandatory, recommended, or optional." });
            if (data["applicableDocumentTypes"] is not null && data["applicableDocumentTypes"] is not JsonArray)
                return Results.BadRequest(new { error = "applicableDocumentTypes must be an array." });
            var criterion = new A2BReadinessCriterionEntity
            {
                Name = OpportunityJson.StringValue(data, "name"),
                Description = OpportunityJson.StringValue(data, "description"),
                Category = OpportunityJson.StringValue(data, "category"),
                Severity = severity,
                ExpectedEvidence = OpportunityJson.StringValue(data, "expectedEvidence"),
                ApplicableDocumentTypes = data["applicableDocumentTypes"]?.ToJsonString(OpportunityJson.JsonOptions) ?? "[]",
                IsActive = data["isActive"]?.GetValue<bool>() ?? true
            };
            if (string.IsNullOrWhiteSpace(criterion.Name) || string.IsNullOrWhiteSpace(criterion.ExpectedEvidence))
                return Results.BadRequest(new { error = "Name and expectedEvidence are required." });
            db.A2BReadinessCriteria.Add(criterion);
            await db.SaveChangesAsync();
            return Results.Created($"/api/a2b/criteria/{criterion.Id}", ToA2BCriterionDto(criterion));
        });

        api.MapPut("/a2b/criteria/{id}", async (string id, JsonElement body, AppDbContext db) =>
        {
            var criterion = await db.A2BReadinessCriteria.FindAsync(id);
            if (criterion is null) return Results.NotFound(new { error = "Criterion not found." });
            var data = OpportunityJson.FromBody(body);
            if (data["name"] is not null) criterion.Name = OpportunityJson.StringValue(data, "name");
            if (data["description"] is not null) criterion.Description = OpportunityJson.StringValue(data, "description");
            if (data["category"] is not null) criterion.Category = OpportunityJson.StringValue(data, "category");
            if (data["severity"] is not null)
            {
                var severity = OpportunityJson.StringValue(data, "severity").ToLowerInvariant();
                if (!new[] { "mandatory", "recommended", "optional" }.Contains(severity))
                    return Results.BadRequest(new { error = "Severity must be mandatory, recommended, or optional." });
                criterion.Severity = severity;
            }
            if (data["expectedEvidence"] is not null) criterion.ExpectedEvidence = OpportunityJson.StringValue(data, "expectedEvidence");
            if (data["applicableDocumentTypes"] is not null)
            {
                if (data["applicableDocumentTypes"] is not JsonArray)
                    return Results.BadRequest(new { error = "applicableDocumentTypes must be an array." });
                criterion.ApplicableDocumentTypes = data["applicableDocumentTypes"]!.ToJsonString(OpportunityJson.JsonOptions);
            }
            if (data["isActive"] is not null) criterion.IsActive = data["isActive"]!.GetValue<bool>();
            criterion.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(ToA2BCriterionDto(criterion));
        });

        api.MapDelete("/a2b/criteria/{id}", async (string id, AppDbContext db) =>
        {
            var criterion = await db.A2BReadinessCriteria.FindAsync(id);
            if (criterion is null) return Results.NotFound(new { error = "Criterion not found." });
            // Preserve historical readiness results while removing the criterion from future runs.
            criterion.IsActive = false;
            criterion.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        api.MapPost("/projects/{projectId}/a2b/run", async (string projectId, JsonElement body, A2BReadinessService service) =>
        {
            try
            {
                var data = OpportunityJson.FromBody(body);
                var run = await service.RunAsync(projectId, OpportunityJson.StringValue(data, "executedBy", "System"));
                return Results.Ok(run);
            }
            catch (KeyNotFoundException ex) { return Results.NotFound(new { error = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.Problem(ex.Message, statusCode: StatusCodes.Status409Conflict); }
        });

        api.MapGet("/projects/{projectId}/a2b/status", async (string projectId, AppDbContext db) =>
        {
            var project = await db.Opportunities.FindAsync(projectId);
            if (project is null) return Results.NotFound(new { error = "Project not found." });
            var run = await db.A2BReadinessRuns.Where(r => r.ProjectId == projectId).OrderByDescending(r => r.ExecutedAt).FirstOrDefaultAsync();
            var activeOverride = await db.A2BOverrides.Where(o => o.ProjectId == projectId && o.IsActive).OrderByDescending(o => o.CreatedAt).FirstOrDefaultAsync();
            return Results.Ok(new { status = project.A2BStatus, overallScore = run?.OverallScore ?? 0, lastRunId = project.A2BLastRunId, sddEnabled = project.SddEnabled, overridden = activeOverride is not null });
        });

        api.MapGet("/projects/{projectId}/a2b/results", async (string projectId, AppDbContext db) =>
        {
            var run = await db.A2BReadinessRuns.Where(r => r.ProjectId == projectId).OrderByDescending(r => r.ExecutedAt).FirstOrDefaultAsync();
            if (run is null) return Results.Ok(new { run = (object?)null, results = Array.Empty<object>() });
            var results = await (from result in db.A2BReadinessResults
                                 join criterion in db.A2BReadinessCriteria on result.CriteriaId equals criterion.Id
                                 where result.ReadinessRunId == run.Id
                                 select new { result.Id, result.Status, result.ConfidenceScore, result.EvidenceFound, result.MissingInformation, result.Recommendation, result.SourceDocumentId, sourceDocumentName = result.SourceLocation, result.SourceLocation, criterionId = criterion.Id, criterionName = criterion.Name, criterion.Category, criterion.Severity }).ToListAsync();
            return Results.Ok(new { run, results });
        });

        api.MapPost("/projects/{projectId}/a2b/override", async (string projectId, JsonElement body, AppDbContext db) =>
        {
            var project = await db.Opportunities.FindAsync(projectId);
            if (project is null) return Results.NotFound(new { error = "Project not found." });
            var data = OpportunityJson.FromBody(body);
            var role = OpportunityJson.StringValue(data, "role");
            if (!new[] { "Product Owner", "Solution Architect", "Automation COE Analyst" }.Contains(role))
                return Results.Json(new { error = "This role is not authorized to override A2B." }, statusCode: StatusCodes.Status403Forbidden);
            var reason = OpportunityJson.StringValue(data, "reason");
            if (string.IsNullOrWhiteSpace(reason)) return Results.BadRequest(new { error = "Override reason is required." });
            var entry = new A2BOverrideEntity { ProjectId = projectId, AuthorizedBy = OpportunityJson.StringValue(data, "authorizedBy", "Authorized User"), Role = role, Reason = reason };
            db.A2BOverrides.Add(entry);
            db.AuditTrails.Add(new AuditTrailEntity { OpportunityId = projectId, Action = "A2B Override", PerformedBy = entry.AuthorizedBy, Role = role, Details = reason, Stage = "A2B Readiness Check" });
            project.SddEnabled = true;
            var projectData = OpportunityJson.Parse(project);
            projectData["sddEnabled"] = true;
            OpportunityJson.AppendAudit(projectData, "A2B Override", reason, entry.AuthorizedBy, role);
            project.Data = projectData.ToJsonString(OpportunityJson.JsonOptions);
            project.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(entry);
        });

        api.MapPost("/llm/generate", (JsonElement body) =>
        {
            var data = OpportunityJson.FromBody(body);
            var prompt = OpportunityJson.StringValue(data, "prompt", "Generate automation content");
            return Results.Ok(new { result = $"Generated draft for: {prompt}\n1. Capture request\n2. Validate inputs\n3. Apply business rules\n4. Route exceptions\n5. Update downstream systems" });
        });

        api.MapPost("/integrations/sharepoint/sync", () => Results.Ok(new { success = true, message = "Document synced to SharePoint mock connector." }));
    }

    private static async Task EnsureDefaultsAsync(AppDbContext db)
    {
        foreach (var stage in DefaultData.Stages)
        {
            var existingStage = await db.StageConfigs.FindAsync(stage.Id);
            if (existingStage is null)
            {
                db.StageConfigs.Add(new StageConfigEntity
                {
                    Id = stage.Id,
                    Name = stage.Name,
                    Order = stage.Order,
                    IsEnabled = stage.IsEnabled,
                    RolesAllowed = stage.RolesAllowed,
                    ConfigOptions = stage.ConfigOptions,
                });
            }
            else
            {
                existingStage.Name = stage.Name;
                existingStage.Order = stage.Order;
                existingStage.RolesAllowed = stage.RolesAllowed;
                if (stage.Name == "A2B Readiness Check") existingStage.IsEnabled = true;
            }
        }

        foreach (var integration in DefaultData.Integrations)
        {
            if (!await db.IntegrationConfigs.AnyAsync(i => i.Id == integration.Id))
            {
                db.IntegrationConfigs.Add(integration);
            }
        }

        foreach (var criterion in DefaultData.A2BCriteria)
        {
            if (!await db.A2BReadinessCriteria.AnyAsync(existing => existing.Id == criterion.Id))
            {
                db.A2BReadinessCriteria.Add(criterion);
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task<IResult> GenerateArtifactAsync(string opportunityId, string action, AppDbContext db, WorkflowEngine workflow)
    {
        var entity = await db.Opportunities.FindAsync(opportunityId);
        if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });

        try
        {
            var updated = workflow.Run(OpportunityJson.Parse(entity), action, []);
            if (action == "apply-pdd") await InvalidateA2BAsync(db, entity, updated);
            entity.ProcessName = OpportunityJson.StringValue(updated, "processName", entity.ProcessName);
            entity.CurrentStage = OpportunityJson.StringValue(updated, "currentStage", entity.CurrentStage);
            entity.Status = OpportunityJson.StringValue(updated, "status", entity.Status);
            entity.Data = updated.ToJsonString(OpportunityJson.JsonOptions);
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Json(OpportunityJson.Parse(entity), OpportunityJson.JsonOptions);
        }
        catch (Exception ex)
        {
            return Results.Problem(ex.Message, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<IResult> GetArtifactAsync(string opportunityId, string artifactName, AppDbContext db)
    {
        var entity = await db.Opportunities.FindAsync(opportunityId);
        if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });
        var artifact = OpportunityJson.Parse(entity)[artifactName];
        return artifact is null
            ? Results.NotFound(new { error = $"{artifactName} has not been generated" })
            : Results.Json(artifact, OpportunityJson.JsonOptions);
    }

    private static object ToStageDto(StageConfigEntity stage) => new
    {
        id = stage.Id,
        name = stage.Name,
        order = stage.Order,
        isEnabled = stage.IsEnabled,
        rolesAllowed = JsonNode.Parse(stage.RolesAllowed),
        configOptions = string.IsNullOrWhiteSpace(stage.ConfigOptions) ? null : JsonNode.Parse(stage.ConfigOptions)
    };

    private static object ToA2BCriterionDto(A2BReadinessCriterionEntity criterion) => new
    {
        id = criterion.Id,
        name = criterion.Name,
        description = criterion.Description,
        category = criterion.Category,
        severity = criterion.Severity,
        expectedEvidence = criterion.ExpectedEvidence,
        applicableDocumentTypes = JsonNode.Parse(criterion.ApplicableDocumentTypes) ?? new JsonArray(),
        isActive = criterion.IsActive,
        createdAt = criterion.CreatedAt,
        updatedAt = criterion.UpdatedAt
    };

    private static async Task InvalidateA2BAsync(AppDbContext db, OpportunityEntity entity, JsonObject data)
    {
        entity.A2BStatus = "NOT_RUN";
        entity.A2BLastRunId = null;
        entity.SddEnabled = false;
        data["a2bStatus"] = entity.A2BStatus;
        data["a2bLastRunId"] = null;
        data["sddEnabled"] = false;
        var activeOverrides = await db.A2BOverrides
            .Where(item => item.ProjectId == entity.Id && item.IsActive)
            .ToListAsync();
        foreach (var item in activeOverrides)
        {
            item.IsActive = false;
            item.InvalidatedAt = DateTime.UtcNow;
        }
    }
}
