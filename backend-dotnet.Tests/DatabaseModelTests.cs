using EnterpriseAutomation.Api.Data;
using EnterpriseAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EnterpriseAutomation.Api.Tests;

public sealed class DatabaseModelTests
{
    [Fact]
    public void A2BTablesAndOpportunityGateColumnsAreMapped()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var db = new AppDbContext(options);

        Assert.Equal("a2b_readiness_criteria", db.Model.FindEntityType(typeof(A2BReadinessCriterionEntity))!.GetTableName());
        Assert.Equal("a2b_readiness_runs", db.Model.FindEntityType(typeof(A2BReadinessRunEntity))!.GetTableName());
        Assert.Equal("a2b_readiness_results", db.Model.FindEntityType(typeof(A2BReadinessResultEntity))!.GetTableName());
        Assert.Equal("a2b_overrides", db.Model.FindEntityType(typeof(A2BOverrideEntity))!.GetTableName());

        var opportunity = db.Model.FindEntityType(typeof(OpportunityEntity))!;
        Assert.Equal("a2b_status", opportunity.FindProperty(nameof(OpportunityEntity.A2BStatus))!.GetColumnName());
        Assert.Equal("a2b_last_run_id", opportunity.FindProperty(nameof(OpportunityEntity.A2BLastRunId))!.GetColumnName());
        Assert.Equal("sdd_enabled", opportunity.FindProperty(nameof(OpportunityEntity.SddEnabled))!.GetColumnName());
    }
}
