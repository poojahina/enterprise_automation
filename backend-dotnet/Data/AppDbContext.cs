using EnterpriseAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAutomation.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<OpportunityEntity> Opportunities => Set<OpportunityEntity>();
    public DbSet<StageConfigEntity> StageConfigs => Set<StageConfigEntity>();
    public DbSet<DocumentEntity> Documents => Set<DocumentEntity>();
    public DbSet<IntegrationConfigEntity> IntegrationConfigs => Set<IntegrationConfigEntity>();
    public DbSet<AuditTrailEntity> AuditTrails => Set<AuditTrailEntity>();
    public DbSet<A2BReadinessCriterionEntity> A2BReadinessCriteria => Set<A2BReadinessCriterionEntity>();
    public DbSet<A2BReadinessRunEntity> A2BReadinessRuns => Set<A2BReadinessRunEntity>();
    public DbSet<A2BReadinessResultEntity> A2BReadinessResults => Set<A2BReadinessResultEntity>();
    public DbSet<A2BOverrideEntity> A2BOverrides => Set<A2BOverrideEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OpportunityEntity>(entity =>
        {
            entity.ToTable("opportunities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProcessName).HasColumnName("process_name").IsRequired();
            entity.Property(e => e.CurrentStage).HasColumnName("current_stage").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").IsRequired();
            entity.Property(e => e.Data).HasColumnName("data").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<StageConfigEntity>(entity =>
        {
            entity.ToTable("stage_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.Order).HasColumnName("stage_order");
            entity.Property(e => e.IsEnabled).HasColumnName("is_enabled");
            entity.Property(e => e.RolesAllowed).HasColumnName("roles_allowed").HasColumnType("jsonb");
            entity.Property(e => e.ConfigOptions).HasColumnName("config_options").HasColumnType("jsonb");
        });

        modelBuilder.Entity<DocumentEntity>(entity =>
        {
            entity.ToTable("documents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.FileName).HasColumnName("file_name").IsRequired();
            entity.Property(e => e.FileType).HasColumnName("file_type").IsRequired();
            entity.Property(e => e.Content).HasColumnName("content").IsRequired();
            entity.Property(e => e.ExtractedContext).HasColumnName("extracted_context");
            entity.Property(e => e.UploadedAt).HasColumnName("uploaded_at");
            entity.HasOne<OpportunityEntity>()
                .WithMany()
                .HasForeignKey(e => e.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IntegrationConfigEntity>(entity =>
        {
            entity.ToTable("integration_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Provider).HasColumnName("provider").IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.Credentials).HasColumnName("credentials").HasColumnType("jsonb").IsRequired();
        });

        modelBuilder.Entity<AuditTrailEntity>(entity =>
        {
            entity.ToTable("audit_trails");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.Timestamp).HasColumnName("timestamp");
            entity.Property(e => e.Action).HasColumnName("action").IsRequired();
            entity.Property(e => e.PerformedBy).HasColumnName("performed_by").IsRequired();
            entity.Property(e => e.Role).HasColumnName("role").IsRequired();
            entity.Property(e => e.Details).HasColumnName("details").IsRequired();
            entity.Property(e => e.Stage).HasColumnName("stage").IsRequired();
            entity.HasOne<OpportunityEntity>()
                .WithMany()
                .HasForeignKey(e => e.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<A2BReadinessCriterionEntity>(entity =>
        {
            entity.ToTable("a2b_readiness_criteria");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Category).HasColumnName("category");
            entity.Property(e => e.Severity).HasColumnName("severity");
            entity.Property(e => e.ExpectedEvidence).HasColumnName("expected_evidence");
            entity.Property(e => e.ApplicableDocumentTypes).HasColumnName("applicable_document_types").HasColumnType("jsonb");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<A2BReadinessRunEntity>(entity =>
        {
            entity.ToTable("a2b_readiness_runs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.PddId).HasColumnName("pdd_id");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.OverallScore).HasColumnName("overall_score");
            entity.Property(e => e.ExecutedBy).HasColumnName("executed_by");
            entity.Property(e => e.ExecutedAt).HasColumnName("executed_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne<OpportunityEntity>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<A2BReadinessResultEntity>(entity =>
        {
            entity.ToTable("a2b_readiness_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ReadinessRunId).HasColumnName("readiness_run_id");
            entity.Property(e => e.CriteriaId).HasColumnName("criteria_id");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.ConfidenceScore).HasColumnName("confidence_score");
            entity.Property(e => e.EvidenceFound).HasColumnName("evidence_found");
            entity.Property(e => e.MissingInformation).HasColumnName("missing_information");
            entity.Property(e => e.Recommendation).HasColumnName("recommendation");
            entity.Property(e => e.SourceDocumentId).HasColumnName("source_document_id");
            entity.Property(e => e.SourceLocation).HasColumnName("source_location");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne<A2BReadinessRunEntity>().WithMany().HasForeignKey(e => e.ReadinessRunId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<A2BReadinessCriterionEntity>().WithMany().HasForeignKey(e => e.CriteriaId);
        });

        modelBuilder.Entity<A2BOverrideEntity>(entity =>
        {
            entity.ToTable("a2b_overrides");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.AuthorizedBy).HasColumnName("authorized_by");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne<OpportunityEntity>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
