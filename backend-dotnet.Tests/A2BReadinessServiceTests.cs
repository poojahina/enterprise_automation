using EnterpriseAutomation.Api.Services;
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
}
