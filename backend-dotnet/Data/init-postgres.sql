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

CREATE TABLE IF NOT EXISTS a2b_readiness_criteria (
  id text PRIMARY KEY, name text NOT NULL, description text NOT NULL, category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('mandatory','recommended','optional')),
  expected_evidence text NOT NULL, applicable_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS a2b_readiness_runs (
  id text PRIMARY KEY, project_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  pdd_id text NULL, status text NOT NULL, overall_score numeric(5,2) NOT NULL DEFAULT 0,
  executed_by text NOT NULL, executed_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS a2b_readiness_results (
  id text PRIMARY KEY, readiness_run_id text NOT NULL REFERENCES a2b_readiness_runs(id) ON DELETE CASCADE,
  criteria_id text NOT NULL REFERENCES a2b_readiness_criteria(id), status text NOT NULL,
  confidence_score numeric(5,2) NOT NULL DEFAULT 0, evidence_found text NOT NULL DEFAULT '',
  missing_information text NOT NULL DEFAULT '', recommendation text NOT NULL DEFAULT '',
  source_document_id text NULL, source_location text NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS a2b_overrides (
  id text PRIMARY KEY, project_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  authorized_by text NOT NULL, role text NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_opportunities_updated_at ON opportunities(updated_at DESC);
CREATE INDEX IF NOT EXISTS ix_opportunities_current_stage ON opportunities(current_stage);
CREATE INDEX IF NOT EXISTS ix_documents_opportunity_id ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_audit_trails_opportunity_id ON audit_trails(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_a2b_runs_project_id ON a2b_readiness_runs(project_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS ix_a2b_results_run_id ON a2b_readiness_results(readiness_run_id);

INSERT INTO stage_configs (id, name, stage_order, is_enabled, roles_allowed)
VALUES
  ('stage-1', 'Submitted', 1, true, '["Business User"]'::jsonb),
  ('stage-2', 'Classified', 2, true, '["System"]'::jsonb),
  ('stage-3', 'Qualified', 3, true, '["System","Automation COE Analyst"]'::jsonb),
  ('stage-4', 'Scored', 4, true, '["System"]'::jsonb),
  ('stage-5', 'Discovery', 5, true, '["Business User","Solution Architect"]'::jsonb),
  ('stage-6', 'PDD Creation', 6, true, '["Product Owner","Solution Architect"]'::jsonb),
  ('stage-7', 'A2B Readiness Check', 7, true, '["Product Owner","Solution Architect","Automation COE Analyst"]'::jsonb),
  ('stage-8', 'SDD Creation', 8, true, '["Solution Architect"]'::jsonb),
  ('stage-9', 'ROI Approved', 9, true, '["Product Owner","Finance"]'::jsonb),
  ('stage-10', 'Prioritized', 10, true, '["Automation COE Analyst","Product Owner"]'::jsonb),
  ('stage-11', 'Pod Allocated', 11, true, '["Product Owner"]'::jsonb),
  ('stage-12', 'Sprint Ready', 12, true, '["Scrum Master","Pod Lead"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stage_order = EXCLUDED.stage_order,
  roles_allowed = EXCLUDED.roles_allowed;

INSERT INTO a2b_readiness_criteria (id,name,description,category,severity,expected_evidence,applicable_document_types)
VALUES
('a2b-1','Business process clearly documented','Verify the business process is documented.','Process','mandatory','process overview steps','["PDD","process"]'),
('a2b-2','Functional requirements complete','Verify functional requirements.','Requirements','mandatory','functional requirements business rules','["PDD","BRD","requirements"]'),
('a2b-3','In-scope and out-of-scope items defined','Verify scope boundaries.','Scope','mandatory','scope out of scope','["PDD","BRD"]'),
('a2b-4','Assumptions documented','Verify assumptions.','Governance','recommended','assumptions','["PDD","BRD"]'),
('a2b-5','Dependencies documented','Verify dependencies.','Governance','recommended','dependencies','["PDD","BRD"]'),
('a2b-6','Integration points identified','Verify integrations.','Technical','mandatory','systems integrations','["PDD","requirements"]'),
('a2b-7','Data requirements documented','Verify data requirements.','Technical','recommended','inputs outputs data','["PDD","requirements"]'),
('a2b-8','Exception scenarios documented','Verify exceptions.','Process','mandatory','exceptions','["PDD","process"]'),
('a2b-9','Acceptance criteria available','Verify acceptance criteria.','Quality','recommended','acceptance criteria','["requirements","BRD"]'),
('a2b-10','Open questions captured','Verify open questions.','Governance','recommended','open items questions','["PDD","attachment"]'),
('a2b-11','Risks and constraints documented','Verify risks.','Risk','recommended','risks constraints controls','["PDD","BRD"]'),
('a2b-12','Stakeholders/sign-off identified','Verify sign-off.','Governance','optional','stakeholders approvals sign-off','["PDD","BRD"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO integration_configs (id, provider, is_active, credentials)
VALUES
  ('int-1', 'AzureOpenAI', true, '{"apiKey":"MOCK_AZURE_KEY"}'::jsonb),
  ('int-2', 'AWSBedrock', false, '{"apiKey":"MOCK_AWS_KEY"}'::jsonb),
  ('int-3', 'GoogleVertex', false, '{"apiKey":"MOCK_GCP_KEY"}'::jsonb),
  ('int-4', 'SharePoint', false, '{"token":"MOCK_SP_TOKEN"}'::jsonb),
  ('int-5', 'AzureDevOps', false, '{"pat":"MOCK_ADO_PAT"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
