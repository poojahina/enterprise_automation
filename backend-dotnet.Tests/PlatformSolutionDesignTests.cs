using System.Text.Json.Nodes;
using EnterpriseAutomation.Api.Services;
using Xunit;

namespace EnterpriseAutomation.Api.Tests;

public sealed class PlatformSolutionDesignTests
{
    [Theory]
    [InlineData("Power Platform", "Power Apps")]
    [InlineData("Automation Anywhere", "Control Room")]
    [InlineData("Azure AI", "Microsoft Foundry")]
    [InlineData("RPA", "Control Room")]
    [InlineData("Intelligent Automation", "Microsoft Foundry")]
    public void SddUsesApprovedPlatformStackAndNormalizesLegacyValues(string classification, string expectedTechnology)
    {
        var opportunity = new JsonObject
        {
            ["id"] = "test-platform",
            ["processName"] = "Test process",
            ["classification"] = new JsonObject { ["recommendedType"] = classification },
            ["metrics"] = new JsonObject { ["volumePerMonth"] = 100 }
        };

        var result = new WorkflowEngine().Run(opportunity, "generate-solution", new JsonObject());

        Assert.Contains(expectedTechnology, result["solution"]!["recommendedTechnology"]!.GetValue<string>());
    }
}
