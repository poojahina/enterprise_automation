import type { AutomationOpportunity } from '../models/types';
import { mockOpportunities } from './mockData';

/**
 * Mock service layer simulating async API calls.
 * Provides typed service functions with configurable artificial delays.
 */
const MOCK_DELAY = 300; // ms

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchOpportunities(): Promise<AutomationOpportunity[]> {
  await delay();
  return [...mockOpportunities];
}

export async function fetchOpportunityById(id: string): Promise<AutomationOpportunity | undefined> {
  await delay(200);
  return mockOpportunities.find(o => o.id === id);
}

export async function createOpportunity(opp: AutomationOpportunity): Promise<AutomationOpportunity> {
  await delay(500);
  mockOpportunities.push(opp);
  return opp;
}

export async function updateOpportunity(id: string, updates: Partial<AutomationOpportunity>): Promise<AutomationOpportunity | undefined> {
  await delay(400);
  const index = mockOpportunities.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  const updated = { ...mockOpportunities[index], ...updates };
  mockOpportunities[index] = updated;
  return updated;
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  await delay(300);
  const index = mockOpportunities.findIndex(o => o.id === id);
  if (index === -1) return false;
  mockOpportunities.splice(index, 1);
  return true;
}
