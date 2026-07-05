export const defaultStages = [
  { id: 'stage-1', name: 'Submitted', order: 1, isEnabled: true, rolesAllowed: JSON.stringify(['Business User']) },
  { id: 'stage-2', name: 'Classified', order: 2, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-3', name: 'Qualified', order: 3, isEnabled: true, rolesAllowed: JSON.stringify(['System', 'Automation COE Analyst']) },
  { id: 'stage-4', name: 'Scored', order: 4, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-5', name: 'Discovery', order: 5, isEnabled: true, rolesAllowed: JSON.stringify(['Business User', 'Solution Architect']) },
  { id: 'stage-6', name: 'PDD Creation', order: 6, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Solution Architect']) },
  { id: 'stage-7', name: 'A2B Readiness Check', order: 7, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Solution Architect', 'Automation COE Analyst']) },
  { id: 'stage-8', name: 'SDD Creation', order: 8, isEnabled: true, rolesAllowed: JSON.stringify(['Solution Architect']) },
  { id: 'stage-9', name: 'ROI Approved', order: 9, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Finance']) },
  { id: 'stage-10', name: 'Prioritized', order: 10, isEnabled: true, rolesAllowed: JSON.stringify(['Automation COE Analyst', 'Product Owner']) },
  { id: 'stage-11', name: 'Pod Allocated', order: 11, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner']) },
  { id: 'stage-12', name: 'Sprint Ready', order: 12, isEnabled: true, rolesAllowed: JSON.stringify(['Scrum Master', 'Pod Lead']) },
];

export const defaultIntegrations = [
  { id: 'int-1', provider: 'AzureOpenAI', isActive: true, credentials: '{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/azure-openai-key"}' },
  { id: 'int-4', provider: 'SharePoint', isActive: false, credentials: '{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/sharepoint-token"}' },
  { id: 'int-5', provider: 'AzureDevOps', isActive: false, credentials: '{"keyVaultSecretUri":"https://<vault>.vault.azure.net/secrets/azure-devops-pat"}' },
];
