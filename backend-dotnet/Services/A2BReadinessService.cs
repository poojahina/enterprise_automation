using System.Text;
using System.Text.Json;
using EnterpriseAutomation.Api.Data;
using EnterpriseAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAutomation.Api.Services;

public sealed class A2BReadinessService(AppDbContext db, ILogger<A2BReadinessService> logger)
{
    private sealed record DocumentSource(string Id, string Name, string Type, string Text);

    public async Task<A2BReadinessRunEntity> RunAsync(string projectId, string executedBy)
    {
        var project = await db.Opportunities.FindAsync(projectId) ?? throw new KeyNotFoundException("Project not found");
        var criteria = await db.A2BReadinessCriteria.Where(c => c.IsActive).OrderBy(c => c.CreatedAt).ToListAsync();
        if (criteria.Count == 0) throw new InvalidOperationException("A2B readiness criteria are not configured.");

        var documents = await db.Documents.Where(d => d.OpportunityId == projectId).ToListAsync();
        var projectData = OpportunityJson.Parse(project);
        var sources = documents
            .Select(document => new DocumentSource(document.Id, document.FileName, InferDocumentType(document), Decode(document)))
            .ToList();
        if (projectData["pdd"] is not null)
            sources.Add(new DocumentSource("pdd-artifact", $"{projectId}-pdd", "PDD", projectData["pdd"]!.ToJsonString()));

        var run = new A2BReadinessRunEntity
        {
            ProjectId = projectId,
            PddId = sources.FirstOrDefault(source => source.Id == "pdd-artifact")?.Id,
            ExecutedBy = string.IsNullOrWhiteSpace(executedBy) ? "System" : executedBy
        };
        db.A2BReadinessRuns.Add(run);

        foreach (var criterion in criteria)
        {
            var applicableTypes = ParseDocumentTypes(criterion.ApplicableDocumentTypes);
            var applicableSources = applicableTypes.Count == 0
                ? sources
                : sources.Where(source => applicableTypes.Contains(source.Type)).ToList();
            var terms = criterion.ExpectedEvidence
                .Split(new[] { ' ', ',', ';', '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(term => term.Length > 3)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
            var best = applicableSources
                .Select(source => new
                {
                    Source = source,
                    Matches = terms.Count(term => source.Text.Contains(term, StringComparison.OrdinalIgnoreCase))
                })
                .OrderByDescending(candidate => candidate.Matches)
                .FirstOrDefault();
            var ratio = terms.Length == 0 ? 0m : (decimal)(best?.Matches ?? 0) / terms.Length;
            var status = applicableSources.Count == 0 ? "failed" : ratio >= .6m ? "passed" : ratio > 0 ? "partial" : "failed";
            var missing = applicableSources.Count == 0
                ? $"No applicable document was found. Expected one of: {string.Join(", ", applicableTypes)}."
                : criterion.ExpectedEvidence;

            db.A2BReadinessResults.Add(new A2BReadinessResultEntity
            {
                ReadinessRunId = run.Id,
                CriteriaId = criterion.Id,
                Status = status,
                ConfidenceScore = Math.Round(ratio * 100, 2),
                EvidenceFound = status == "failed" ? "" : $"Matched {best!.Matches} of {terms.Length} expected evidence terms in {best.Source.Name}.",
                MissingInformation = status == "passed" ? "" : missing,
                Recommendation = status == "passed"
                    ? "Evidence is sufficient."
                    : applicableSources.Count == 0
                        ? "Upload an applicable document and run A2B again."
                        : $"Add clear evidence for: {criterion.ExpectedEvidence}.",
                SourceDocumentId = best?.Matches > 0 ? best.Source.Id : null,
                SourceLocation = best?.Matches > 0 ? best.Source.Name : null
            });
        }

        await db.SaveChangesAsync();
        var results = await db.A2BReadinessResults.Where(result => result.ReadinessRunId == run.Id).ToListAsync();
        run.OverallScore = results.Count == 0
            ? 0
            : Math.Round(results.Average(result => result.Status == "passed" ? 100m : result.Status == "partial" ? 50m : 0m), 2);
        var criteriaById = criteria.ToDictionary(criterion => criterion.Id);
        run.Status = CalculateDecision(results.Select(result => (criteriaById[result.CriteriaId].Severity, result.Status)));

        project.CurrentStage = "A2B Readiness Check";
        project.A2BStatus = run.Status;
        project.A2BLastRunId = run.Id;
        project.SddEnabled = run.Status == "READY" || await db.A2BOverrides.AnyAsync(item => item.ProjectId == projectId && item.IsActive);
        var data = OpportunityJson.Parse(project);
        data["currentStage"] = project.CurrentStage;
        data["a2bStatus"] = project.A2BStatus;
        data["a2bLastRunId"] = project.A2BLastRunId;
        data["sddEnabled"] = project.SddEnabled;
        OpportunityJson.AppendAudit(data, "A2B Readiness Executed", $"Result: {run.Status}; score: {run.OverallScore}", run.ExecutedBy, "System");
        project.Data = data.ToJsonString(OpportunityJson.JsonOptions);
        project.UpdatedAt = DateTime.UtcNow;
        db.AuditTrails.Add(new AuditTrailEntity
        {
            OpportunityId = projectId,
            Action = "A2B Readiness Executed",
            PerformedBy = run.ExecutedBy,
            Role = "System",
            Details = $"Result: {run.Status}; score: {run.OverallScore}",
            Stage = "A2B Readiness Check"
        });
        await db.SaveChangesAsync();

        logger.LogInformation("A2B run {RunId} for project {ProjectId} completed with {Status}", run.Id, projectId, run.Status);
        return run;
    }

    public async Task<bool> CanGenerateSddAsync(string projectId) =>
        await db.Opportunities.AnyAsync(opportunity => opportunity.Id == projectId && opportunity.SddEnabled);

    public static string CalculateDecision(IEnumerable<(string Severity, string Status)> results)
    {
        var evaluated = results.ToList();
        if (evaluated.Any(result => result.Severity == "mandatory" && result.Status != "passed")) return "NOT_READY";
        if (evaluated.Any(result => result.Severity == "recommended" && result.Status != "passed")) return "READY_WITH_RISKS";
        return "READY";
    }

    private static HashSet<string> ParseDocumentTypes(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<string[]>(json, OpportunityJson.JsonOptions)?
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string InferDocumentType(DocumentEntity document)
    {
        var name = document.FileName.ToLowerInvariant();
        if (name.Contains("pdd")) return "PDD";
        if (name.Contains("brd") || name.Contains("business-requirement")) return "BRD";
        if (name.Contains("requirement") || name.Contains("user-stor")) return "requirements";
        if (name.Contains("process") || name.Contains("sop")) return "process";
        return "attachment";
    }

    private static string Decode(DocumentEntity document)
    {
        try
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(document.Content)) + " " + document.ExtractedContext;
        }
        catch (FormatException)
        {
            return document.Content + " " + document.ExtractedContext;
        }
    }
}
