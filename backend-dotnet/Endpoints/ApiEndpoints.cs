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
            if (data["isEnabled"] is not null) stage.IsEnabled = data["isEnabled"]!.GetValue<bool>();
            if (data["order"] is not null) stage.Order = data["order"]!.GetValue<int>();
            if (data["rolesAllowed"] is not null) stage.RolesAllowed = data["rolesAllowed"]!.ToJsonString(OpportunityJson.JsonOptions);
            if (data["configOptions"] is not null) stage.ConfigOptions = data["configOptions"]!.ToJsonString(OpportunityJson.JsonOptions);

            await db.SaveChangesAsync();
            return Results.Ok(ToStageDto(stage));
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
            foreach (var kvp in updates) current[kvp.Key] = kvp.Value?.DeepClone();
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

        api.MapPost("/workflow/opportunities/{id}/actions/{action}", async (string id, string action, JsonElement body, AppDbContext db, WorkflowEngine workflow) =>
        {
            var entity = await db.Opportunities.FindAsync(id);
            if (entity is null) return Results.NotFound(new { error = "Opportunity not found" });

            try
            {
                var current = OpportunityJson.Parse(entity);
                var input = body.ValueKind == JsonValueKind.Undefined ? [] : OpportunityJson.FromBody(body);
                var updated = workflow.Run(current, action, input);
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

        api.MapPost("/context/upload", async (HttpRequest request, AppDbContext db) =>
        {
            var form = await request.ReadFormAsync();
            var opportunityId = form["opportunityId"].ToString();
            var file = form.Files.GetFile("file");
            if (file is null) return Results.BadRequest(new { error = "No file uploaded" });
            if (string.IsNullOrWhiteSpace(opportunityId)) return Results.BadRequest(new { error = "Missing opportunityId" });

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
            if (!await db.StageConfigs.AnyAsync(s => s.Id == stage.Id))
            {
                db.StageConfigs.Add(stage);
            }
        }

        foreach (var integration in DefaultData.Integrations)
        {
            if (!await db.IntegrationConfigs.AnyAsync(i => i.Id == integration.Id))
            {
                db.IntegrationConfigs.Add(integration);
            }
        }

        await db.SaveChangesAsync();
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
}
