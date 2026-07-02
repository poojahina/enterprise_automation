CREATE TABLE IF NOT EXISTS opportunities (
  id text PRIMARY KEY,
  process_name text NOT NULL,
  current_stage text NOT NULL,
  status text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stage_configs (
  id text PRIMARY KEY,
  name text NOT NULL,
  stage_order integer NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  roles_allowed jsonb NOT NULL DEFAULT '[]'::jsonb,
  config_options jsonb NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  content text NOT NULL,
  extracted_context text NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_configs (
  id text PRIMARY KEY,
  provider text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS audit_trails (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  performed_by text NOT NULL,
  role text NOT NULL,
  details text NOT NULL,
  stage text NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_opportunities_updated_at ON opportunities(updated_at DESC);
CREATE INDEX IF NOT EXISTS ix_opportunities_current_stage ON opportunities(current_stage);
CREATE INDEX IF NOT EXISTS ix_documents_opportunity_id ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_audit_trails_opportunity_id ON audit_trails(opportunity_id);

INSERT INTO stage_configs (id, name, stage_order, is_enabled, roles_allowed)
VALUES
  ('stage-1', 'Submitted', 1, true, '["Business User"]'::jsonb),
  ('stage-2', 'Classified', 2, true, '["System"]'::jsonb),
  ('stage-3', 'Qualified', 3, true, '["System","Automation COE Analyst"]'::jsonb),
  ('stage-4', 'Scored', 4, true, '["System"]'::jsonb),
  ('stage-5', 'Discovery', 5, true, '["Business User","Solution Architect"]'::jsonb),
  ('stage-6', 'PDD Creation', 6, true, '["Product Owner","Solution Architect"]'::jsonb),
  ('stage-7', 'SDD Creation', 7, true, '["Solution Architect"]'::jsonb),
  ('stage-8', 'ROI Approved', 8, true, '["Product Owner","Finance"]'::jsonb),
  ('stage-9', 'Prioritized', 9, true, '["Automation COE Analyst","Product Owner"]'::jsonb),
  ('stage-10', 'Pod Allocated', 10, true, '["Product Owner"]'::jsonb),
  ('stage-11', 'Sprint Ready', 11, true, '["Scrum Master","Pod Lead"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stage_order = EXCLUDED.stage_order,
  roles_allowed = EXCLUDED.roles_allowed;

INSERT INTO integration_configs (id, provider, is_active, credentials)
VALUES
  ('int-1', 'AzureOpenAI', true, '{"apiKey":"MOCK_AZURE_KEY"}'::jsonb),
  ('int-2', 'AWSBedrock', false, '{"apiKey":"MOCK_AWS_KEY"}'::jsonb),
  ('int-3', 'GoogleVertex', false, '{"apiKey":"MOCK_GCP_KEY"}'::jsonb),
  ('int-4', 'SharePoint', false, '{"token":"MOCK_SP_TOKEN"}'::jsonb),
  ('int-5', 'AzureDevOps', false, '{"pat":"MOCK_ADO_PAT"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
