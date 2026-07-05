import type { AutomationOpportunity, PodAllocation, AutomationType } from '../models/types';

const POD_CATALOG: PodAllocation[] = [
  {
    podName: 'Azure AI Engineering Squad',
    podLead: 'Priya Sharma',
    teamSize: 6,
    skills: ['Microsoft Foundry', 'Azure OpenAI', 'Document Intelligence', 'Azure AI Search', 'Python'],
    currentCapacity: 40,
    assignedOpportunities: 2,
    specialization: 'Azure AI',
    deliveryRisk: 'Medium',
    notes: 'Specializes in governed Azure AI, document intelligence, retrieval, and agent solutions.',
  },
  {
    podName: 'Automation Anywhere Center of Excellence',
    podLead: 'Michael Chen',
    teamSize: 8,
    skills: ['Automation Anywhere', 'Control Room', 'Bot Creator', 'Bot Runner', 'Document Automation'],
    currentCapacity: 60,
    assignedOpportunities: 3,
    specialization: 'Automation Anywhere',
    deliveryRisk: 'Low',
    notes: 'Specializes in governed attended and unattended Automation Anywhere bot delivery.',
  },
  {
    podName: 'Power Platform Guild',
    podLead: 'James Wilson',
    teamSize: 4,
    skills: ['Power Automate', 'Power Apps', 'Power BI', 'SharePoint', 'Dataverse'],
    currentCapacity: 70,
    assignedOpportunities: 4,
    specialization: 'Power Platform',
    deliveryRisk: 'Low',
    notes: 'Citizen developer enablement team. Rapid delivery of workflow automation.',
  },
];

/**
 * Recommend a delivery pod based on automation type and complexity match.
 * Considers pod specialization, current capacity, and skills alignment.
 */
export function recommendPod(opp: AutomationOpportunity): PodAllocation {
  const automationType = opp.classification?.recommendedType ?? 'Power Platform';

  // Primary match: specialization
  const primaryMatch = POD_CATALOG.find(p => p.specialization === automationType);
  if (primaryMatch && primaryMatch.currentCapacity > 20) {
    return primaryMatch;
  }

  // Fallback: best capacity
  const sorted = [...POD_CATALOG].sort((a, b) => b.currentCapacity - a.currentCapacity);
  return sorted[0];
}

export function getAllPods(): PodAllocation[] {
  return [...POD_CATALOG];
}
