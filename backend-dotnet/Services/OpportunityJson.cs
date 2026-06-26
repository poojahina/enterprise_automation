using System.Text.Json;
using System.Text.Json.Nodes;
using EnterpriseAutomation.Api.Models;

namespace EnterpriseAutomation.Api.Services;

public static class OpportunityJson
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public static JsonObject Parse(OpportunityEntity entity)
    {
        var data = JsonNode.Parse(entity.Data)?.AsObject() ?? [];
        data["id"] = entity.Id;
        data["processName"] = entity.ProcessName;
        data["currentStage"] = entity.CurrentStage;
        data["status"] = entity.Status;
        data["pipelineStatus"] = entity.Status;
        return data;
    }

    public static JsonObject Normalize(JsonObject payload)
    {
        payload["currentStage"] ??= "Submitted";
        payload["status"] ??= payload["pipelineStatus"]?.DeepClone() ?? "Active";
        payload["pipelineStatus"] ??= payload["status"]?.DeepClone() ?? "Active";
        payload["submittedDate"] ??= DateTime.UtcNow.ToString("yyyy-MM-dd");
        payload["backlogItems"] ??= new JsonArray();
        payload["complianceChecks"] ??= new JsonArray();
        payload["auditTrail"] ??= new JsonArray();
        return payload;
    }

    public static JsonObject FromBody(JsonElement body)
    {
        return JsonNode.Parse(body.GetRawText())?.AsObject() ?? [];
    }

    public static string StringValue(JsonObject data, string key, string fallback = "")
    {
        return data[key]?.GetValue<string>() ?? fallback;
    }

    public static decimal NumberValue(JsonObject data, string path, decimal fallback = 0)
    {
        var node = ResolvePath(data, path);
        if (node is null) return fallback;
        if (node is JsonValue value)
        {
            if (value.TryGetValue<decimal>(out var decimalValue)) return decimalValue;
            if (value.TryGetValue<double>(out var doubleValue)) return Convert.ToDecimal(doubleValue);
            if (value.TryGetValue<int>(out var intValue)) return intValue;
        }
        return fallback;
    }

    public static string StringPath(JsonObject data, string path, string fallback = "")
    {
        var node = ResolvePath(data, path);
        if (node is not JsonValue value) return fallback;
        if (value.TryGetValue<string>(out var stringValue)) return stringValue;
        return fallback;
    }

    public static bool BoolPath(JsonObject data, string path, bool fallback = false)
    {
        var node = ResolvePath(data, path);
        if (node is not JsonValue value) return fallback;
        return value.TryGetValue<bool>(out var boolValue) ? boolValue : fallback;
    }

    public static JsonArray ArrayPath(JsonObject data, string path)
    {
        return ResolvePath(data, path) as JsonArray ?? [];
    }

    public static JsonObject ObjectPath(JsonObject data, string path)
    {
        return ResolvePath(data, path) as JsonObject ?? [];
    }

    public static void AppendAudit(JsonObject data, string action, string details, string performedBy = "System", string role = "System")
    {
        var audit = data["auditTrail"] as JsonArray ?? [];
        audit.Add(new JsonObject
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["timestamp"] = DateTime.UtcNow.ToString("O"),
            ["action"] = action,
            ["performedBy"] = performedBy,
            ["role"] = role,
            ["details"] = details,
            ["stage"] = data["currentStage"]?.GetValue<string>() ?? "Submitted"
        });
        data["auditTrail"] = audit;
    }

    private static JsonNode? ResolvePath(JsonObject data, string path)
    {
        JsonNode? current = data;
        foreach (var part in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            current = current?[part];
        }
        return current;
    }
}
