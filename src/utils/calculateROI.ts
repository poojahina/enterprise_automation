import type { BusinessCase } from '../models/types';

interface ROIInputs {
  implementationCost: number;
  annualSavings: number;
  annualSupportCost: number;
  timelineWeeks: number;
  effortStoryPoints: number;
  fteReduction: number;
}

/**
 * Calculate ROI metrics including percentage, payback period, NPV, and break-even.
 * Uses a 10% discount rate for NPV calculation over a 3-year horizon.
 */
export function calculateROI(inputs: ROIInputs): BusinessCase {
  const { implementationCost, annualSavings, annualSupportCost, timelineWeeks, effortStoryPoints, fteReduction } = inputs;

  const netAnnualBenefit = annualSavings - annualSupportCost;
  const roiPercentage = implementationCost > 0
    ? Math.round(((netAnnualBenefit - implementationCost) / implementationCost) * 100)
    : 0;

  const paybackPeriodMonths = netAnnualBenefit > 0
    ? Math.round((implementationCost / (netAnnualBenefit / 12)) * 10) / 10
    : 0;

  // NPV over 3 years at 10% discount rate
  const discountRate = 0.10;
  let npv = -implementationCost;
  for (let year = 1; year <= 3; year++) {
    npv += netAnnualBenefit / Math.pow(1 + discountRate, year);
  }
  npv = Math.round(npv);

  // Break-even months
  let cumulative = -implementationCost;
  let breakEvenMonths = 0;
  const monthlyBenefit = netAnnualBenefit / 12;
  while (cumulative < 0 && breakEvenMonths < 60) {
    breakEvenMonths++;
    cumulative += monthlyBenefit;
  }

  return {
    implementationCost,
    annualSavings,
    annualSupportCost,
    roiPercentage,
    paybackPeriodMonths,
    npv,
    breakEvenMonths,
    effortStoryPoints,
    timelineWeeks,
    fteReduction,
  };
}
