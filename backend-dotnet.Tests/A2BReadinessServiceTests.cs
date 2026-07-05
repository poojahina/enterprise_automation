using EnterpriseAutomation.Api.Services;
using EnterpriseAutomation.Api.Data;
using EnterpriseAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EnterpriseAutomation.Api.Tests;

public sealed class A2BReadinessServiceTests
{
    [Fact]
    public void MandatoryFailureMakesRunNotReady()
    {
        var result = A2BReadinessService.CalculateDecision(
            [("mandatory", "failed"), ("recommended", "passed")]);
        Assert.Equal("NOT_READY", result);
    }

    [Fact]
    public void RecommendedFailureMakesRunReadyWithRisks()
    {
        var result = A2BReadinessService.CalculateDecision(
            [("mandatory", "passed"), ("recommended", "partial")]);
        Assert.Equal("READY_WITH_RISKS", result);
    }

    [Fact]
    public void OptionalFailureDoesNotBlockReadiness()
    {
        var result = A2BReadinessService.CalculateDecision(
            [("mandatory", "passed"), ("recommended", "passed"), ("optional", "failed")]);
        Assert.Equal("READY", result);
    }

    [Fact]
    public async Task EmptyDocumentSetPersistsNotReadyAndKeepsSddLocked()
    {
        await using var db = CreateDatabase();
        db.Opportunities.Add(new OpportunityEntity { Id = "empty", ProcessName = "Empty", Data = """{"id":"empty","processName":"Empty"}""" });
        db.A2BReadinessCriteria.Add(Criterion("mandatory-empty", "mandatory", """["PDD"]"""));
        await db.SaveChangesAsync();

        var run = await new A2BReadinessService(db, NullLogger<A2BReadinessService>.Instance).RunAsync("empty", "Tester");
        var result = await db.A2BReadinessResults.SingleAsync();
        var project = await db.Opportunities.FindAsync("empty");

        Assert.Equal("NOT_READY", run.Status);
        Assert.Equal("failed", result.Status);
        Assert.Contains("No applicable document", result.MissingInformation);
        Assert.False(project!.SddEnabled);
        Assert.Equal(run.Id, project.A2BLastRunId);
    }

    [Fact]
    public async Task InactiveCriteriaAreIgnored()
    {
        await using var db = CreateDatabase();
        db.Opportunities.Add(new OpportunityEntity { Id = "inactive", ProcessName = "Inactive", Data = "{}" });
        db.A2BReadinessCriteria.Add(Criterion("inactive-rule", "mandatory", """["PDD"]""", false));
        await db.SaveChangesAsync();

        var service = new A2BReadinessService(db, NullLogger<A2BReadinessService>.Instance);
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.RunAsync("inactive", "Tester"));

        Assert.Contains("not configured", error.Message);
        Assert.Empty(db.A2BReadinessRuns);
    }

    [Fact]
    public async Task CriterionOnlyUsesConfiguredDocumentTypes()
    {
        await using var db = CreateDatabase();
        db.Opportunities.Add(new OpportunityEntity { Id = "typed", ProcessName = "Typed", Data = "{}" });
        db.Documents.Add(new DocumentEntity
        {
            OpportunityId = "typed",
            FileName = "supporting-attachment.txt",
            FileType = "text/plain",
            Content = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("process overview steps"))
        });
        db.A2BReadinessCriteria.Add(Criterion("pdd-only", "mandatory", """["PDD"]"""));
        await db.SaveChangesAsync();

        var run = await new A2BReadinessService(db, NullLogger<A2BReadinessService>.Instance).RunAsync("typed", "Tester");
        var result = await db.A2BReadinessResults.SingleAsync();

        Assert.Equal("NOT_READY", run.Status);
        Assert.Equal("failed", result.Status);
        Assert.Null(result.SourceDocumentId);
    }

    [Fact]
    public async Task SddGateUsesPersistedOpportunityFlag()
    {
        await using var db = CreateDatabase();
        db.Opportunities.AddRange(
            new OpportunityEntity { Id = "locked", ProcessName = "Locked", Data = "{}", SddEnabled = false },
            new OpportunityEntity { Id = "open", ProcessName = "Open", Data = "{}", SddEnabled = true });
        await db.SaveChangesAsync();
        var service = new A2BReadinessService(db, NullLogger<A2BReadinessService>.Instance);

        Assert.False(await service.CanGenerateSddAsync("locked"));
        Assert.True(await service.CanGenerateSddAsync("open"));
    }

    private static AppDbContext CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static A2BReadinessCriterionEntity Criterion(string id, string severity, string types, bool active = true) =>
        new()
        {
            Id = id,
            Name = id,
            Description = "Test criterion",
            Category = "Test",
            Severity = severity,
            ExpectedEvidence = "process overview steps",
            ApplicableDocumentTypes = types,
            IsActive = active
        };
}
