using System.Text;
using EnterpriseAutomation.Api.Data;
using EnterpriseAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAutomation.Api.Services;

public sealed class A2BReadinessService(AppDbContext db, ILogger<A2BReadinessService> logger)
{
    public async Task<A2BReadinessRunEntity> RunAsync(string projectId, string executedBy)
    {
        var project = await db.Opportunities.FindAsync(projectId) ?? throw new KeyNotFoundException("Project not found");
        var criteria = await db.A2BReadinessCriteria.Where(c => c.IsActive).OrderBy(c => c.CreatedAt).ToListAsync();
        if (criteria.Count == 0) throw new InvalidOperationException("A2B readiness criteria are not configured.");

        var documents = await db.Documents.Where(d => d.OpportunityId == projectId).ToListAsync();
        var projectData = OpportunityJson.Parse(project);
        var projectJson = projectData.ToJsonString();
        var sources = documents.Select(d => (d.Id, d.FileName, Text: Decode(d))).ToList();
        if (projectData["pdd"] is not null)
            sources.Add(("pdd-artifact", $"{projectId}-pdd", projectJson));

        var run = new A2BReadinessRunEntity { ProjectId = projectId, PddId = sources.FirstOrDefault(s => s.Id == "pdd-artifact").Id, ExecutedBy = executedBy };
        db.A2BReadinessRuns.Add(run);

        foreach (var criterion in criteria)
        {
            var terms = criterion.ExpectedEvidence.Split(new[] { ' ', ',', ';', '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(t => t.Length > 3).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var best = sources.Select(source => new
            {
                Source = source,
                Matches = terms.Count(term => source.Text.Contains(term, StringComparison.OrdinalIgnoreCase))
            }).OrderByDescending(x => x.Matches).FirstOrDefault();
            var ratio = terms.Length == 0 ? 0m : (decimal)(best?.Matches ?? 0) / terms.Length;
            var status = sources.Count == 0 ? "failed" : ratio >= .6m ? "passed" : ratio > 0 ? "partial" : "failed";
            db.A2BReadinessResults.Add(new A2BReadinessResultEntity
            {
                ReadinessRunId = run.Id, CriteriaId = criterion.Id, Status = status,
                ConfidenceScore = Math.Round(ratio * 100, 2),
                EvidenceFound = status == "failed" ? "" : $"Matched {best!.Matches} of {terms.Length} expected evidence terms in {best.Source.FileName}.",
                MissingInformation = status == "passed" ? "" : criterion.ExpectedEvidence,
                Recommendation = status == "passed" ? "Evidence is sufficient." : $"Add clear evidence for: {criterion.ExpectedEvidence}.",
                SourceDocumentId = best?.Matches > 0 ? best.Source.Id : null,
                SourceLocation = best?.Matches > 0 ? best.Source.FileName : null
            });
        }

        await db.SaveChangesAsync();
        var results = await db.A2BReadinessResults.Where(r => r.ReadinessRunId == run.Id).ToListAsync();
        run.OverallScore = results.Count == 0 ? 0 : Math.Round(results.Average(r => r.Status == "passed" ? 100m : r.Status == "partial" ? 50m : 0m), 2);
        var byId = criteria.ToDictionary(c => c.Id);
        run.Status = CalculateDecision(results.Select(r => (byId[r.CriteriaId].Severity, r.Status)));
        project.CurrentStage = "A2B Readiness Check";
        var data = OpportunityJson.Parse(project);
        data["currentStage"] = project.CurrentStage;
        data["a2bStatus"] = run.Status;
        data["a2bLastRunId"] = run.Id;
        data["sddEnabled"] = run.Status == "READY";
        OpportunityJson.AppendAudit(data, "A2B Readiness Executed", $"Result: {run.Status}; score: {run.OverallScore}", executedBy, "System");
        project.Data = data.ToJsonString(OpportunityJson.JsonOptions);
        project.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        logger.LogInformation("A2B run {RunId} for project {ProjectId} completed with {Status}", run.Id, projectId, run.Status);
        return run;
    }

    public async Task<bool> CanGenerateSddAsync(string projectId) =>
        await db.A2BOverrides.AnyAsync(o => o.ProjectId == projectId) ||
        await db.A2BReadinessRuns.Where(r => r.ProjectId == projectId).OrderByDescending(r => r.ExecutedAt).AnyAsync(r => r.Status == "READY");

    public static string CalculateDecision(IEnumerable<(string Severity, string Status)> results)
    {
        var evaluated = results.ToList();
        if (evaluated.Any(r => r.Severity == "mandatory" && r.Status != "passed")) return "NOT_READY";
        if (evaluated.Any(r => r.Severity == "recommended" && r.Status != "passed")) return "READY_WITH_RISKS";
        return "READY";
    }

    private static string Decode(DocumentEntity document)
    {
        try { return Encoding.UTF8.GetString(Convert.FromBase64String(document.Content)) + " " + document.ExtractedContext; }
        catch { return document.ExtractedContext ?? ""; }
    }
}
