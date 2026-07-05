namespace EnterpriseAutomation.Api.Models;

public sealed class OpportunityEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProcessName { get; set; } = "";
    public string CurrentStage { get; set; } = "Submitted";
    public string Status { get; set; } = "Active";
    public string A2BStatus { get; set; } = "NOT_RUN";
    public string? A2BLastRunId { get; set; }
    public bool SddEnabled { get; set; }
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

public sealed class A2BReadinessCriterionEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Severity { get; set; } = "recommended";
    public string ExpectedEvidence { get; set; } = "";
    public string ApplicableDocumentTypes { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class A2BReadinessRunEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = "";
    public string? PddId { get; set; }
    public string Status { get; set; } = "NOT_READY";
    public decimal OverallScore { get; set; }
    public string ExecutedBy { get; set; } = "System";
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class A2BReadinessResultEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ReadinessRunId { get; set; } = "";
    public string CriteriaId { get; set; } = "";
    public string Status { get; set; } = "failed";
    public decimal ConfidenceScore { get; set; }
    public string EvidenceFound { get; set; } = "";
    public string MissingInformation { get; set; } = "";
    public string Recommendation { get; set; } = "";
    public string? SourceDocumentId { get; set; }
    public string? SourceLocation { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class A2BOverrideEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = "";
    public string AuthorizedBy { get; set; } = "";
    public string Role { get; set; } = "";
    public string Reason { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime? InvalidatedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
