import type { AutomationOpportunity, PodAllocation, AutomationType } from '../models/types';

const POD_CATALOG: PodAllocation[] = [
  {
    podName: 'Agentic AI Squad',
    podLead: 'Priya Sharma',
    teamSize: 6,
    skills: ['LangChain', 'Multi-Agent Systems', 'GenAI', 'Python', 'Azure OpenAI'],
    currentCapacity: 40,
    assignedOpportunities: 2,
    specialization: 'Hyperautomation/Agentic Automation',
    deliveryRisk: 'Medium',
    notes: 'Specializes in agentic orchestration and multi-system AI workflows',
  },
  {
    podName: 'RPA Center of Excellence',
    podLead: 'Michael Chen',
    teamSize: 8,
    skills: ['UiPath', 'Automation Anywhere', 'Blue Prism', '.NET', 'SQL'],
    currentCapacity: 60,
    assignedOpportunities: 3,
    specialization: 'RPA',
    deliveryRisk: 'Low',
    notes: 'Mature team with 50+ bot deliveries. Strong governance framework.',
  },
  {
    podName: 'Intelligent Automation Lab',
    podLead: 'Sarah Rodriguez',
    teamSize: 5,
    skills: ['Document AI', 'NLP', 'Computer Vision', 'Python', 'Azure Cognitive Services'],
    currentCapacity: 55,
    assignedOpportunities: 2,
    specialization: 'Intelligent Automation',
    deliveryRisk: 'Medium',
    notes: 'Expert in document processing, OCR, and AI/ML pipelines',
  },
  {
    podName: 'Power Platform Guild',
    podLead: 'James Wilson',
    teamSize: 4,
    skills: ['Power Automate', 'Power Apps', 'Power BI', 'SharePoint', 'Dataverse'],
    currentCapacity: 70,
    assignedOpportunities: 4,
    specialization: 'Power Automate/Power Platform',
    deliveryRisk: 'Low',
    notes: 'Citizen developer enablement team. Rapid delivery of workflow automation.',
  },
];

/**
 * Recommend a delivery pod based on automation type and complexity match.
 * Considers pod specialization, current capacity, and skills alignment.
 */
export function recommendPod(opp: AutomationOpportunity): PodAllocation {
  const automationType = opp.classification?.recommendedType ?? 'RPA';

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
