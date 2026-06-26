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
    }
}
