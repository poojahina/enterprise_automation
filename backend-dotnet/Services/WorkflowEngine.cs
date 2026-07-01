using System.Text.Json;
using System.Text.Json.Nodes;

namespace EnterpriseAutomation.Api.Services;

public sealed class WorkflowEngine
{
    public JsonObject Run(JsonObject opportunity, string action, JsonObject input)
    {
        var updated = opportunity.DeepClone().AsObject();

        switch (action)
        {
            case "accept-classification":
            case "override-classification":
                if (action == "override-classification")
                {
                    updated["classification"] = new JsonObject
                    {
                        ["recommendedType"] = input["recommendedType"]?.DeepClone() ?? "RPA",
                        ["confidenceScore"] = input["confidenceScore"]?.DeepClone() ?? 75,
                        ["reasoning"] = input["reasoning"]?.DeepClone() ?? "Classification manually overridden by an analyst."
                    };
                }
                updated["qualification"] = BuildQualification(updated);
                updated["currentStage"] = "Classified";
                OpportunityJson.AppendAudit(updated, action == "accept-classification" ? "Classification Accepted" : "Classification Overridden", "Classification confirmed and qualification generated.");
                return updated;

            case "approve-qualification":
                updated["qualification"] = BuildQualification(updated, "Qualified", "Opportunity approved for scoring and discovery.");
                updated["score"] = BuildScore(updated);
                updated["currentStage"] = "Scored";
                OpportunityJson.AppendAudit(updated, "Qualification Approved", "Opportunity qualified and priority score generated.");
                return updated;

            case "request-more-info":
                updated["qualification"] = BuildQualification(updated, "Needs More Information", OpportunityJson.StringValue(input, "reason", "Additional process, application, and data source details are required."));
                updated["currentStage"] = "Classified";
                OpportunityJson.AppendAudit(updated, "More Information Requested", OpportunityJson.StringPath(updated, "qualification.recommendation"));
                return updated;

            case "reject-qualification":
                updated["qualification"] = BuildQualification(updated, "Rejected", OpportunityJson.StringValue(input, "reason", "Opportunity rejected during L1 qualification."));
                updated["status"] = "Rejected";
                OpportunityJson.AppendAudit(updated, "Qualification Rejected", OpportunityJson.StringPath(updated, "qualification.recommendation"));
                return updated;

            case "generate-score":
                updated["score"] = BuildScore(updated);
                updated["currentStage"] = "Scored";
                OpportunityJson.AppendAudit(updated, "Scoring Completed", $"Score generated: {OpportunityJson.NumberValue(updated, "score.totalScore")}.");
                return updated;

            case "apply-discovery":
                updated["discovery"] = input["discovery"]?.DeepClone() ?? BuildDiscovery(updated, OpportunityJson.StringValue(input, "aiOutput"));
                updated["currentStage"] = "Discovery";
                OpportunityJson.AppendAudit(updated, "Discovery Applied", "Discovery workspace was generated from context.");
                return updated;

            case "apply-prd":
                updated["prd"] = input["prd"]?.DeepClone() ?? BuildPrd(updated, OpportunityJson.StringValue(input, "aiOutput"));
                updated["currentStage"] = "PRD Creation";
                OpportunityJson.AppendAudit(updated, "PRD Created", "Product requirements document was generated.");
                return updated;

            case "apply-pdd":
                updated["pdd"] = input["pdd"]?.DeepClone() ?? BuildPdd(updated);
                updated["currentStage"] = "PRD Creation";
                OpportunityJson.AppendAudit(updated, "PDD Created", "Process definition document was generated from discovery context.");
                return updated;

            case "generate-solution":
                updated["solution"] = input["solution"]?.DeepClone() ?? BuildSolution(updated);
                updated["currentStage"] = "Solution Designed";
                OpportunityJson.AppendAudit(updated, "Solution Designed", "Solution architecture recommendation was generated.");
                return updated;

            case "approve-roi":
                updated["businessCase"] = BuildRoi(updated, input);
                updated["currentStage"] = "ROI Approved";
                OpportunityJson.AppendAudit(updated, "ROI Approved", $"Business case approved with ROI {OpportunityJson.NumberValue(updated, "businessCase.roiPercentage")}%."); 
                return updated;

            case "prioritize":
                updated["currentStage"] = "Prioritized";
                OpportunityJson.AppendAudit(updated, "Opportunity Prioritized", "Opportunity was added to the prioritized delivery board.");
                return updated;

            case "allocate-pod":
                updated["podAllocation"] = BuildPod(updated);
                updated["currentStage"] = "Pod Allocated";
                OpportunityJson.AppendAudit(updated, "Pod Allocated", $"{OpportunityJson.StringPath(updated, "podAllocation.podName")} assigned.");
                return updated;

            case "generate-backlog":
                updated["backlogItems"] = BuildBacklog(updated);
                OpportunityJson.AppendAudit(updated, "Backlog Generated", "Backlog items generated.");
                return updated;

            case "assess-sprint-readiness":
                if (OpportunityJson.ArrayPath(updated, "backlogItems").Count == 0) updated["backlogItems"] = BuildBacklog(updated);
                updated["sprintReadiness"] = BuildSprintReadiness(updated);
                updated["currentStage"] = "Sprint Ready";
                OpportunityJson.AppendAudit(updated, "Sprint Readiness Assessed", $"Readiness score: {OpportunityJson.NumberValue(updated, "sprintReadiness.readinessScore")}.");
                return updated;

            default:
                throw new InvalidOperationException($"Unsupported workflow action: {action}");
        }
    }

    public string GenerateDocument(JsonObject opportunity, string docType)
    {
        var title = docType switch
        {
            "prd" => "Product Requirements Document",
            "pdd" => "Process Definition Document",
            "business-case" => "Business Case",
            "solution-design" => "Solution Design",
            "sprint-backlog" => "Sprint Backlog",
            _ => "Document"
        };
        var sections = docType switch
        {
            "prd" => BuildDocumentSections(title, opportunity, BuildPrd(opportunity)),
            "pdd" => BuildDocumentSections(title, opportunity, opportunity["pdd"] as JsonObject ?? BuildPdd(opportunity)),
            "business-case" => BuildDocumentSections(title, opportunity, BuildRoi(opportunity, [])),
            "solution-design" => BuildDocumentSections(title, opportunity, BuildSolution(opportunity)),
            "sprint-backlog" => BuildDocumentSections(title, opportunity, new JsonObject { ["backlogItems"] = BuildBacklog(opportunity) }),
            _ => [new JsonObject { ["title"] = title, ["lines"] = new JsonArray("Unsupported document type.") }]
        };

        return string.Join("\n\n", sections.Select(section =>
        {
            var sectionTitle = OpportunityJson.StringValue(section, "title", title);
            var lines = OpportunityJson.ArrayPath(section, "lines").Select(line => line?.ToString() ?? "");
            return string.Join("\n", new[] { sectionTitle, new string('-', sectionTitle.Length) }.Concat(lines));
        }));
    }

    private static JsonObject BuildQualification(JsonObject opp, string? status = null, string? recommendation = null)
    {
        var volume = OpportunityJson.NumberValue(opp, "metrics.volumePerMonth");
        var effort = OpportunityJson.NumberValue(opp, "metrics.manualEffortHours");
        var savings = OpportunityJson.NumberValue(opp, "impact.costSavingsPerMonth");
        var applications = OpportunityJson.ArrayPath(opp, "technical.applications");
        var dataSources = OpportunityJson.ArrayPath(opp, "technical.dataSources");
        var score = 40 + (volume >= 50 ? 15 : 0) + (effort >= 10 ? 15 : 0) + (savings >= 500 ? 15 : 0) + (applications.Count > 0 ? 10 : 0) + (dataSources.Count > 0 ? 5 : 0);
        var finalStatus = status ?? (score >= 70 ? "Qualified" : "Needs More Information");
        return new JsonObject
        {
            ["status"] = finalStatus,
            ["overallScore"] = score,
            ["checks"] = new JsonArray(
                Check("Minimum Volume Threshold", volume >= 50, $"Volume: {volume}/month", 20),
                Check("Manual Effort Justification", effort >= 10, $"Manual effort: {effort} hours/month", 20),
                Check("Business Impact Assessment", savings >= 500, $"Savings: ${savings}/month", 20),
                Check("Application Landscape Defined", applications.Count > 0, $"{applications.Count} application(s) in scope", 20),
                Check("Data Source Availability", dataSources.Count > 0, $"{dataSources.Count} data source(s) identified", 20)
            ),
            ["missingInfo"] = new JsonArray(),
            ["recommendation"] = recommendation ?? (finalStatus == "Qualified" ? "Opportunity meets qualification criteria. Proceed to scoring and discovery." : "Additional process details are required.")
        };
    }

    private static JsonObject Check(string name, bool passed, string details, int weight) => new()
    {
        ["name"] = name,
        ["passed"] = passed,
        ["details"] = details,
        ["weight"] = weight
    };

    private static JsonObject BuildScore(JsonObject opp)
    {
        var savings = OpportunityJson.NumberValue(opp, "impact.costSavingsPerMonth");
        var effort = OpportunityJson.NumberValue(opp, "metrics.manualEffortHours");
        var volume = OpportunityJson.NumberValue(opp, "metrics.volumePerMonth");
        var complexity = OpportunityJson.StringPath(opp, "processCharacteristics.processComplexity", "Medium");
        var businessImpact = Math.Min(100, Math.Round((savings / 10000 * 45) + (effort / 100 * 30) + (volume / 5000 * 25)));
        var feasibility = complexity == "High" ? 55 : complexity == "Medium" ? 75 : 90;
        var roiPotential = Math.Min(100, Math.Round(((EstimateAnnualSavings(opp) - EstimateImplementationCost(opp)) / EstimateImplementationCost(opp)) * 30));
        var strategic = OpportunityJson.StringPath(opp, "priority.businessPriority") switch { "Critical" => 95, "High" => 85, "Medium" => 65, _ => 45 };
        var total = Math.Round(businessImpact * 0.30m + strategic * 0.20m + feasibility * 0.25m + roiPotential * 0.25m);
        return new JsonObject
        {
            ["totalScore"] = total,
            ["priorityBand"] = total >= 75 ? "High" : total >= 45 ? "Medium" : "Low",
            ["complexity"] = complexity == "High" ? "L" : complexity == "Medium" ? "M" : "S",
            ["dimensions"] = new JsonObject { ["businessImpact"] = businessImpact, ["strategicAlignment"] = strategic, ["feasibility"] = feasibility, ["roiPotential"] = roiPotential },
            ["recommendedAutomationType"] = OpportunityJson.StringPath(opp, "classification.recommendedType", "RPA"),
            ["ranking"] = 0
        };
    }

    private static JsonObject BuildDiscovery(JsonObject opp, string? aiOutput = null)
    {
        var steps = string.IsNullOrWhiteSpace(aiOutput)
            ? new JsonArray("Capture request", "Validate inputs", "Process transaction", "Review exceptions", "Update downstream systems")
            : new JsonArray(aiOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(line => (JsonNode?)JsonValue.Create(line)).ToArray());
        return new JsonObject
        {
            ["asIsSteps"] = steps,
            ["processVariants"] = new JsonArray("Standard path", "Exception path"),
            ["exceptions"] = new JsonArray("Missing data", "System validation failure", "Approval delay"),
            ["businessRules"] = new JsonArray("Mandatory fields must be validated before submission", "High-value items require approval"),
            ["inputs"] = CloneArrayOrFallback(OpportunityJson.ArrayPath(opp, "technical.dataSources"), "Business request", "Source records"),
            ["outputs"] = new JsonArray("Validated transaction", "Audit record", "Status notification"),
            ["systems"] = CloneArrayOrFallback(OpportunityJson.ArrayPath(opp, "technical.applications"), "Source application", "Target application"),
            ["integrations"] = CloneArrayOrFallback(OpportunityJson.ArrayPath(opp, "technical.applications"), "API / file integration"),
            ["sla"] = "1 business day",
            ["complianceRequirements"] = OpportunityJson.StringPath(opp, "priority.complianceImpact") == "High" ? "Regulatory review required" : "Standard audit logging",
            ["humanApprovals"] = OpportunityJson.BoolPath(opp, "processCharacteristics.requiresHumanInTheLoop") ? new JsonArray("Process owner approval") : new JsonArray(),
            ["dataVolume"] = $"{OpportunityJson.NumberValue(opp, "metrics.volumePerMonth")} transactions/month",
            ["peakPeriods"] = OpportunityJson.StringPath(opp, "priority.targetTimeline", "Month-end and quarter-end")
        };
    }

    private static JsonObject BuildPrd(JsonObject opp, string? aiOutput = null)
    {
        var process = OpportunityJson.StringValue(opp, "processName", "automation process");
        var reqs = !string.IsNullOrWhiteSpace(aiOutput)
            ? new JsonArray(aiOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(line => (JsonNode?)JsonValue.Create(line)).ToArray())
            : new JsonArray(
                $"Capture and validate {process} requests with mandatory business metadata.",
                "Ingest source data and normalize it into a single auditable work item.",
                "Apply business rules, route exceptions, and record decisions.",
                "Integrate with source and target enterprise systems.",
                "Expose operational reporting and audit history."
            );
        return new JsonObject
        {
            ["executiveSummary"] = $"{process} will be automated to reduce manual effort, improve control, and generate measurable operational savings.",
            ["userPersonas"] = new JsonArray("Business User", "Process Owner", "Automation COE Analyst", "Solution Architect"),
            ["functionalRequirements"] = reqs,
            ["nonFunctionalRequirements"] = new JsonArray("Role-based access", "Auditability", "Operational monitoring", "Scalable monthly throughput", "Configurable business rules"),
            ["acceptanceCriteria"] = new JsonArray("Happy path completes without manual re-entry", "Exceptions are visible to process owners", "Audit trail captures all key status changes", "Operational dashboard shows throughput and failures"),
            ["outOfScope"] = new JsonArray("Replacing source systems", "Changing upstream business policy", "Historical data cleanup outside launch scope"),
            ["dependencies"] = new JsonArray("Application access", "Process owner availability", "Business rule sign-off", "Security review")
        };
    }

    private static JsonObject BuildPdd(JsonObject opp)
    {
        var discovery = opp["discovery"] as JsonObject ?? BuildDiscovery(opp);
        var technical = opp["technical"] as JsonObject ?? [];
        var metrics = opp["metrics"] as JsonObject ?? [];
        var impact = opp["impact"] as JsonObject ?? [];
        return new JsonObject
        {
            ["processOverview"] = new JsonArray(
                $"Process: {OpportunityJson.StringValue(opp, "processName", "To be confirmed")}",
                $"Purpose: {OpportunityJson.StringValue(opp, "description", "To be confirmed")}",
                $"Process owner: {OpportunityJson.StringValue(opp, "processOwner", "To be confirmed")}",
                $"Business unit: {OpportunityJson.StringValue(opp, "businessUnit", "To be confirmed")}",
                $"Monthly volume: {OpportunityJson.NumberValue(metrics, "volumePerMonth")} transactions"
            ),
            ["currentStateSteps"] = discovery["asIsSteps"]?.DeepClone() ?? new JsonArray("Complete Discovery to capture current-state steps."),
            ["systems"] = discovery["systems"]?.DeepClone() ?? technical["applications"]?.DeepClone() ?? new JsonArray("Systems to be confirmed."),
            ["inputsAndOutputs"] = new JsonArray(
                $"Data sources: {JsonSerializer.Serialize(technical["dataSources"], OpportunityJson.JsonOptions)}",
                $"Data type: {OpportunityJson.StringValue(technical, "dataType", "To be confirmed")}",
                $"Data volume: {OpportunityJson.StringValue(discovery, "dataVolume", "To be confirmed")}",
                $"Peak periods: {OpportunityJson.StringValue(discovery, "peakPeriods", "To be confirmed")}"
            ),
            ["businessRules"] = discovery["businessRules"]?.DeepClone() ?? new JsonArray("Business rules to be confirmed."),
            ["exceptions"] = discovery["exceptions"]?.DeepClone() ?? new JsonArray("Exception scenarios to be confirmed."),
            ["humanApprovals"] = discovery["humanApprovals"]?.DeepClone() ?? new JsonArray("Human approvals to be confirmed."),
            ["painPointsAndBaseline"] = new JsonArray(
                $"Pain points: {OpportunityJson.StringValue(impact, "painPoints", "To be confirmed")}",
                $"Manual effort: {OpportunityJson.NumberValue(metrics, "manualEffortHours")} hours/month",
                $"Error rate: {OpportunityJson.NumberValue(metrics, "errorRatePercent")}%",
                $"Average handling time: {OpportunityJson.NumberValue(metrics, "avgProcessingTimeMinutes")} minutes"
            ),
            ["targetProcess"] = new JsonArray(
                "Validate incoming data before processing.",
                "Automate standard transactions using the recommended technology.",
                "Route exceptions and approvals to the designated human owner.",
                "Record an auditable result for every transaction."
            ),
            ["controls"] = new JsonArray(
                $"SLA: {OpportunityJson.StringValue(discovery, "sla", "To be agreed")}",
                $"Compliance requirements: {OpportunityJson.StringValue(discovery, "complianceRequirements", "To be confirmed")}",
                "Apply role-based access, audit logging, exception evidence, and operational monitoring."
            ),
            ["openItems"] = new JsonArray(
                "Validate volumes and exception rates.",
                "Confirm system access, credentials, retention, and business rule ownership."
            )
        };
    }

    private static JsonObject BuildSolution(JsonObject opp)
    {
        var process = OpportunityJson.StringValue(opp, "processName", "automation process");
        var type = OpportunityJson.StringPath(opp, "score.recommendedAutomationType", OpportunityJson.StringPath(opp, "classification.recommendedType", "RPA"));
        return new JsonObject
        {
            ["toBeSummary"] = $"Enterprise {type} solution for {process}, covering intake, validation, orchestration, exception handling, audit, and reporting.",
            ["recommendedTechnology"] = type.Contains("Power") ? "Power Automate, Dataverse, Power Apps, SharePoint, Power BI" : type.Contains("Intelligent") ? "Document AI, workflow queue, API/RPA worker, monitoring" : type.Contains("Agentic") ? "LLM-assisted orchestrator, enterprise APIs, workflow queue, human review console" : "UiPath Orchestrator, unattended bot workers, SQL audit store, API/file adapters",
            ["architectureSummary"] = "Intake layer -> validation/rules -> workflow orchestration -> automation workers -> integration adapters -> exception workbench -> audit and reporting.",
            ["components"] = new JsonArray("Intake console", "Canonical workflow data model", "Validation service", "Rules engine", "Workflow orchestrator", "Automation worker layer", "Integration adapters", "Exception and approval workbench", "Audit store", "Monitoring dashboard"),
            ["integrations"] = CloneArrayOrFallback(OpportunityJson.ArrayPath(opp, "technical.applications"), "Identity provider", "Secrets vault", "Enterprise logging/SIEM", "Reporting layer"),
            ["humanInLoopDesign"] = "Straight-through processing for standard transactions, with controlled human review for exceptions and high-risk decisions.",
            ["securityConsiderations"] = "Use least-privilege RBAC, vault-managed credentials, encrypted data, immutable audit logs, and compliance-ready evidence retention.",
            ["monitoringStrategy"] = "Track throughput, cycle time, SLA breaches, exception aging, retry count, failed integrations, realized savings, and audit failures.",
            ["scalabilityNotes"] = $"Queue-based orchestration scales workers for at least {OpportunityJson.NumberValue(opp, "metrics.volumePerMonth")} transactions/month and supports peak processing windows.",
            ["estimatedEffort"] = "Enterprise delivery: 10-16 weeks including design, build, integration, security review, UAT, release, and hypercare."
        };
    }

    private static JsonObject BuildRoi(JsonObject opp, JsonObject input)
    {
        var implementationCost = OpportunityJson.NumberValue(input, "implementationCost", EstimateImplementationCost(opp));
        var annualSavings = OpportunityJson.NumberValue(input, "annualSavings", EstimateAnnualSavings(opp));
        var annualSupportCost = OpportunityJson.NumberValue(input, "annualSupportCost", 20000);
        var netAnnualBenefit = annualSavings - annualSupportCost;
        var roi = implementationCost > 0 ? Math.Round(((netAnnualBenefit - implementationCost) / implementationCost) * 100) : 0;
        var payback = netAnnualBenefit > 0 ? Math.Round((implementationCost / (netAnnualBenefit / 12)) * 10) / 10 : 0;
        var npv = -implementationCost + netAnnualBenefit / 1.1m + netAnnualBenefit / 1.21m + netAnnualBenefit / 1.331m;
        return new JsonObject
        {
            ["implementationCost"] = implementationCost,
            ["annualSavings"] = annualSavings,
            ["annualSupportCost"] = annualSupportCost,
            ["timelineWeeks"] = OpportunityJson.NumberValue(input, "timelineWeeks", 12),
            ["effortStoryPoints"] = OpportunityJson.NumberValue(input, "effortStoryPoints", 80),
            ["fteReduction"] = OpportunityJson.NumberValue(input, "fteReduction", 2),
            ["roiPercentage"] = roi,
            ["paybackPeriodMonths"] = payback,
            ["npv"] = Math.Round(npv),
            ["breakEvenMonths"] = Math.Ceiling(payback)
        };
    }

    private static JsonObject BuildPod(JsonObject opp) => new()
    {
        ["podName"] = "Automation Delivery Pod",
        ["podLead"] = "Solution Architect",
        ["teamSize"] = 6,
        ["skills"] = new JsonArray("API Integration", "Workflow Automation", "RPA", "Monitoring"),
        ["currentCapacity"] = 55,
        ["assignedOpportunities"] = 2,
        ["specialization"] = OpportunityJson.StringPath(opp, "score.recommendedAutomationType", "RPA"),
        ["deliveryRisk"] = "Medium",
        ["notes"] = "Recommended based on automation type, complexity, and current capacity."
    };

    private static JsonArray BuildBacklog(JsonObject opp)
    {
        var id = OpportunityJson.StringValue(opp, "id", "AUTO").Replace("-", "");
        var prefix = id.Length > 4 ? id[^4..].ToUpperInvariant() : id.ToUpperInvariant();
        var process = OpportunityJson.StringValue(opp, "processName", "automation");
        return new JsonArray(
            Backlog(prefix, "001", $"Create {process} automation epic", "Define delivery scope, success metrics, controls, and acceptance criteria.", "Epic", "High", 8, "Product Owner", "Sprint 1"),
            Backlog(prefix, "002", "Build intake and validation workflow", "Implement request capture, data validation, duplicate checks, and audit event creation.", "Story", "High", 13, "Automation Engineer", "Sprint 1"),
            Backlog(prefix, "003", "Configure integrations and exception handling", "Connect source/target systems, retries, dead-letter handling, and exception routing.", "Story", "High", 13, "Solution Architect", "Sprint 2"),
            Backlog(prefix, "004", "Create monitoring and readiness controls", "Build operational dashboard, UAT evidence, support runbook, and release checklist.", "Story", "Medium", 8, "Scrum Master", "Sprint 2")
        );
    }

    private static JsonObject Backlog(string prefix, string number, string title, string description, string type, string priority, int storyPoints, string assignee, string sprint) => new()
    {
        ["jiraKey"] = $"{prefix}-{number}",
        ["title"] = title,
        ["description"] = description,
        ["acceptanceCriteria"] = new JsonArray(
            "Given valid inputs, when the story flow runs, then the expected result is saved with an audit record.",
            "Given invalid or exceptional data, when processing cannot continue, then the case is routed with a clear reason and owner.",
            "Given an authorized user, when they review the result, then all relevant status, timestamps, and evidence are visible."
        ),
        ["type"] = type,
        ["priority"] = priority,
        ["status"] = "To Do",
        ["storyPoints"] = storyPoints,
        ["assignee"] = assignee,
        ["sprint"] = sprint
    };

    private static JsonObject BuildSprintReadiness(JsonObject opp)
    {
        var gates = new JsonArray(
            Gate("Classification Complete", opp["classification"] is not null, "Automation type has been classified"),
            Gate("Opportunity Scored", opp["score"] is not null, "Priority scoring has been completed"),
            Gate("PRD Complete", opp["prd"] is not null, "Product requirements are documented"),
            Gate("Solution Designed", opp["solution"] is not null, "Solution architecture is defined"),
            Gate("ROI Approved", opp["businessCase"] is not null, "Business case is approved"),
            Gate("Backlog Items Created", OpportunityJson.ArrayPath(opp, "backlogItems").Count > 0, "Backlog items are ready")
        );
        var passed = gates.Count(g => g?["passed"]?.GetValue<bool>() == true);
        var score = Math.Round((decimal)passed / gates.Count * 100);
        return new JsonObject
        {
            ["status"] = score >= 100 ? "Sprint Ready" : score >= 70 ? "Blocked" : "Not Ready",
            ["readinessScore"] = score,
            ["gates"] = gates,
            ["blockers"] = new JsonArray(gates.Where(g => g?["passed"]?.GetValue<bool>() != true).Select(g => (JsonNode?)$"{g?["name"]}: {g?["description"]}").ToArray()),
            ["targetSprintDate"] = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd")
        };
    }

    private static JsonObject Gate(string name, bool passed, string description) => new() { ["name"] = name, ["passed"] = passed, ["description"] = description };

    private static JsonArray CloneArrayOrFallback(JsonArray source, params string[] fallback)
    {
        if (source.Count == 0) return new JsonArray(fallback.Select(item => (JsonNode?)JsonValue.Create(item)).ToArray());
        return new JsonArray(source.Select(item => item?.DeepClone()).ToArray());
    }

    private static decimal EstimateAnnualSavings(JsonObject opp) => ((OpportunityJson.NumberValue(opp, "impact.costSavingsPerMonth") + OpportunityJson.NumberValue(opp, "impact.timeSavingsHoursPerMonth") * 50) * 12) is var value && value > 0 ? value : 150000;

    private static decimal EstimateImplementationCost(JsonObject opp)
    {
        return OpportunityJson.StringPath(opp, "processCharacteristics.processComplexity", "Medium") switch
        {
            "High" => 150000,
            "Low" => 50000,
            _ => 100000
        };
    }

    private static JsonObject[] BuildDocumentSections(string title, JsonObject opportunity, JsonObject artifact)
    {
        var lines = artifact.Select(kvp => JsonValue.Create($"{kvp.Key}: {JsonSerializer.Serialize(kvp.Value, OpportunityJson.JsonOptions)}")).Cast<JsonNode?>().ToArray();
        return
        [
            new JsonObject
            {
                ["title"] = $"{title} - {OpportunityJson.StringValue(opportunity, "processName", "Opportunity")}",
                ["lines"] = new JsonArray(
                    $"Opportunity ID: {OpportunityJson.StringValue(opportunity, "id")}",
                    $"Stage: {OpportunityJson.StringValue(opportunity, "currentStage")}",
                    $"Business Unit: {OpportunityJson.StringValue(opportunity, "businessUnit", "N/A")}"
                )
            },
            new JsonObject { ["title"] = "Detailed Content", ["lines"] = new JsonArray(lines) }
        ];
    }
}
