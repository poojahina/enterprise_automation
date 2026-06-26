using EnterpriseAutomation.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAutomation.Api.Services;

public sealed class PipelineResolver(AppDbContext db)
{
    private static readonly Dictionary<string, string> StageAliases = new()
    {
        ["Intake"] = "Submitted",
        ["Submitted"] = "Submitted",
        ["Classification"] = "Classified",
        ["Classified"] = "Classified",
        ["Qualification"] = "Qualified",
        ["Qualified"] = "Qualified",
        ["Scoring"] = "Scored",
        ["Scored"] = "Scored",
        ["Discovery"] = "Discovery",
        ["PRD Creation"] = "PRD Creation",
        ["Solution Design"] = "Solution Designed",
        ["Solution Designed"] = "Solution Designed",
        ["ROI"] = "ROI Approved",
        ["ROI Approved"] = "ROI Approved",
        ["Prioritization"] = "Prioritized",
        ["Prioritized"] = "Prioritized",
        ["Pod Allocation"] = "Pod Allocated",
        ["Pod Allocated"] = "Pod Allocated",
        ["Sprint Readiness"] = "Sprint Ready",
        ["Sprint Ready"] = "Sprint Ready",
    };

    public static string Normalize(string stage) => StageAliases.GetValueOrDefault(stage, stage);

    public async Task<string?> ResolveNextStageAsync(string currentStage)
    {
        var stages = await db.StageConfigs.OrderBy(s => s.Order).ToListAsync();
        var normalized = Normalize(currentStage);
        var currentIndex = stages.FindIndex(s => Normalize(s.Name) == normalized);
        if (currentIndex == -1) return stages.FirstOrDefault(s => s.IsEnabled)?.Name;
        return stages.Skip(currentIndex + 1).FirstOrDefault(s => s.IsEnabled)?.Name;
    }
}
