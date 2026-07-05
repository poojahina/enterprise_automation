using EnterpriseAutomation.Api.Models;

namespace EnterpriseAutomation.Api.Services;

public static class DefaultData
{
    public static readonly StageConfigEntity[] Stages =
    [
        new() { Id = "stage-1", Name = "Submitted", Order = 1, IsEnabled = true, RolesAllowed = """["Business User"]""" },
        new() { Id = "stage-2", Name = "Classified", Order = 2, IsEnabled = true, RolesAllowed = """["System"]""" },
        new() { Id = "stage-3", Name = "Qualified", Order = 3, IsEnabled = true, RolesAllowed = """["System","Automation COE Analyst"]""" },
        new() { Id = "stage-4", Name = "Scored", Order = 4, IsEnabled = true, RolesAllowed = """["System"]""" },
        new() { Id = "stage-5", Name = "Discovery", Order = 5, IsEnabled = true, RolesAllowed = """["Business User","Solution Architect"]""" },
        new() { Id = "stage-6", Name = "PDD Creation", Order = 6, IsEnabled = true, RolesAllowed = """["Product Owner","Solution Architect"]""" },
        new() { Id = "stage-7", Name = "A2B Readiness Check", Order = 7, IsEnabled = true, RolesAllowed = """["Product Owner","Solution Architect","Automation COE Analyst"]""" },
        new() { Id = "stage-8", Name = "SDD Creation", Order = 8, IsEnabled = true, RolesAllowed = """["Solution Architect"]""" },
        new() { Id = "stage-9", Name = "ROI Approved", Order = 9, IsEnabled = true, RolesAllowed = """["Product Owner","Finance"]""" },
        new() { Id = "stage-10", Name = "Prioritized", Order = 10, IsEnabled = true, RolesAllowed = """["Automation COE Analyst","Product Owner"]""" },
        new() { Id = "stage-11", Name = "Pod Allocated", Order = 11, IsEnabled = true, RolesAllowed = """["Product Owner"]""" },
        new() { Id = "stage-12", Name = "Sprint Ready", Order = 12, IsEnabled = true, RolesAllowed = """["Scrum Master","Pod Lead"]""" },
    ];

    public static readonly IntegrationConfigEntity[] Integrations =
    [
        new() { Id = "int-1", Provider = "AzureOpenAI", IsActive = true, Credentials = """{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/azure-openai-key"}""" },
        new() { Id = "int-4", Provider = "SharePoint", IsActive = false, Credentials = """{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/sharepoint-token"}""" },
        new() { Id = "int-5", Provider = "AzureDevOps", IsActive = false, Credentials = """{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/azure-devops-pat"}""" },
    ];

    public static readonly A2BReadinessCriterionEntity[] A2BCriteria =
    [
        Criterion("a2b-1", "Business process clearly documented", "Process", "mandatory", "process overview steps"),
        Criterion("a2b-2", "Functional requirements complete", "Requirements", "mandatory", "functional requirements business rules"),
        Criterion("a2b-3", "In-scope and out-of-scope items defined", "Scope", "mandatory", "scope out of scope"),
        Criterion("a2b-4", "Assumptions documented", "Governance", "recommended", "assumptions"),
        Criterion("a2b-5", "Dependencies documented", "Governance", "recommended", "dependencies"),
        Criterion("a2b-6", "Integration points identified", "Technical", "mandatory", "systems integrations"),
        Criterion("a2b-7", "Data requirements documented", "Technical", "recommended", "inputs outputs data"),
        Criterion("a2b-8", "Exception scenarios documented", "Process", "mandatory", "exceptions"),
        Criterion("a2b-9", "Acceptance criteria available", "Quality", "recommended", "acceptance criteria"),
        Criterion("a2b-10", "Open questions captured", "Governance", "recommended", "open items questions"),
        Criterion("a2b-11", "Risks and constraints documented", "Risk", "recommended", "risks constraints controls"),
        Criterion("a2b-12", "Stakeholders/sign-off identified", "Governance", "optional", "stakeholders approvals sign-off"),
    ];

    private static A2BReadinessCriterionEntity Criterion(string id, string name, string category, string severity, string evidence) =>
        new() { Id = id, Name = name, Description = $"Verify that {name.ToLowerInvariant()}.", Category = category, Severity = severity, ExpectedEvidence = evidence, ApplicableDocumentTypes = """["PDD","BRD","requirements","process","attachment"]""" };
}
