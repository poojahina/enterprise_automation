namespace EnterpriseAutomation.Api.Models;

public sealed class OpportunityEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProcessName { get; set; } = "";
    public string CurrentStage { get; set; } = "Submitted";
    public string Status { get; set; } = "Active";
    public string Data { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class StageConfigEntity
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Order { get; set; }
    public bool IsEnabled { get; set; } = true;
    public string RolesAllowed { get; set; } = "[]";
    public string? ConfigOptions { get; set; }
}

public sealed class DocumentEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OpportunityId { get; set; } = "";
    public string FileName { get; set; } = "";
    public string FileType { get; set; } = "";
    public string Content { get; set; } = "";
    public string? ExtractedContext { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public sealed class IntegrationConfigEntity
{
    public string Id { get; set; } = "";
    public string Provider { get; set; } = "";
    public bool IsActive { get; set; }
    public string Credentials { get; set; } = "{}";
}

public sealed class AuditTrailEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OpportunityId { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = "";
    public string PerformedBy { get; set; } = "System";
    public string Role { get; set; } = "System";
    public string Details { get; set; } = "";
    public string Stage { get; set; } = "Submitted";
}
