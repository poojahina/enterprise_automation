export const defaultStages = [
  { id: 'stage-1', name: 'Submitted', order: 1, isEnabled: true, rolesAllowed: JSON.stringify(['Business User']) },
  { id: 'stage-2', name: 'Classified', order: 2, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-3', name: 'Qualified', order: 3, isEnabled: true, rolesAllowed: JSON.stringify(['System', 'Automation COE Analyst']) },
  { id: 'stage-4', name: 'Scored', order: 4, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-5', name: 'Discovery', order: 5, isEnabled: true, rolesAllowed: JSON.stringify(['Business User', 'Solution Architect']) },
  { id: 'stage-6', name: 'PRD Creation', order: 6, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Solution Architect']) },
  { id: 'stage-7', name: 'Solution Designed', order: 7, isEnabled: true, rolesAllowed: JSON.stringify(['Solution Architect']) },
  { id: 'stage-8', name: 'ROI Approved', order: 8, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Finance']) },
  { id: 'stage-9', name: 'Prioritized', order: 9, isEnabled: true, rolesAllowed: JSON.stringify(['Automation COE Analyst', 'Product Owner']) },
  { id: 'stage-10', name: 'Pod Allocated', order: 10, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner']) },
  { id: 'stage-11', name: 'Sprint Ready', order: 11, isEnabled: true, rolesAllowed: JSON.stringify(['Scrum Master', 'Pod Lead']) },
];

export const defaultIntegrations = [
  { id: 'int-1', provider: 'AzureOpenAI', isActive: true, credentials: '{"apiKey":"MOCK_AZURE_KEY"}' },
  { id: 'int-2', provider: 'AWSBedrock', isActive: false, credentials: '{"apiKey":"MOCK_AWS_KEY"}' },
  { id: 'int-3', provider: 'GoogleVertex', isActive: false, credentials: '{"apiKey":"MOCK_GCP_KEY"}' },
  { id: 'int-4', provider: 'SharePoint', isActive: false, credentials: '{"token":"MOCK_SP_TOKEN"}' },
  { id: 'int-5', provider: 'AzureDevOps', isActive: false, credentials: '{"pat":"MOCK_ADO_PAT"}' },
];
