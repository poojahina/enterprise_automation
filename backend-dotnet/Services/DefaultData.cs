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
        new() { Id = "stage-7", Name = "SDD Creation", Order = 7, IsEnabled = true, RolesAllowed = """["Solution Architect"]""" },
        new() { Id = "stage-8", Name = "ROI Approved", Order = 8, IsEnabled = true, RolesAllowed = """["Product Owner","Finance"]""" },
        new() { Id = "stage-9", Name = "Prioritized", Order = 9, IsEnabled = true, RolesAllowed = """["Automation COE Analyst","Product Owner"]""" },
        new() { Id = "stage-10", Name = "Pod Allocated", Order = 10, IsEnabled = true, RolesAllowed = """["Product Owner"]""" },
        new() { Id = "stage-11", Name = "Sprint Ready", Order = 11, IsEnabled = true, RolesAllowed = """["Scrum Master","Pod Lead"]""" },
    ];

    public static readonly IntegrationConfigEntity[] Integrations =
    [
        new() { Id = "int-1", Provider = "AzureOpenAI", IsActive = true, Credentials = """{"apiKey":"MOCK_AZURE_KEY"}""" },
        new() { Id = "int-2", Provider = "AWSBedrock", IsActive = false, Credentials = """{"apiKey":"MOCK_AWS_KEY"}""" },
        new() { Id = "int-3", Provider = "GoogleVertex", IsActive = false, Credentials = """{"apiKey":"MOCK_GCP_KEY"}""" },
        new() { Id = "int-4", Provider = "SharePoint", IsActive = false, Credentials = """{"token":"MOCK_SP_TOKEN"}""" },
        new() { Id = "int-5", Provider = "AzureDevOps", IsActive = false, Credentials = """{"pat":"MOCK_ADO_PAT"}""" },
    ];
}
