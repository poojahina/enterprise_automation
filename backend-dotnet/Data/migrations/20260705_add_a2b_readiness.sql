BEGIN;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS a2b_status text NOT NULL DEFAULT 'NOT_RUN';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS a2b_last_run_id text NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS sdd_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS a2b_readiness_criteria (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('mandatory','recommended','optional')),
  expected_evidence text NOT NULL,
  applicable_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2b_readiness_runs (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  pdd_id text NULL,
  status text NOT NULL CHECK (status IN ('READY','NOT_READY','READY_WITH_RISKS')),
  overall_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  executed_by text NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2b_readiness_results (
  id text PRIMARY KEY,
  readiness_run_id text NOT NULL REFERENCES a2b_readiness_runs(id) ON DELETE CASCADE,
  criteria_id text NOT NULL REFERENCES a2b_readiness_criteria(id),
  status text NOT NULL CHECK (status IN ('passed','failed','partial','not_applicable')),
  confidence_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  evidence_found text NOT NULL DEFAULT '',
  missing_information text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  source_document_id text NULL,
  source_location text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2b_overrides (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  authorized_by text NOT NULL,
  role text NOT NULL,
  reason text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  invalidated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE a2b_overrides ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE a2b_overrides ADD COLUMN IF NOT EXISTS invalidated_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_opportunities_a2b_last_run') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT fk_opportunities_a2b_last_run
      FOREIGN KEY (a2b_last_run_id) REFERENCES a2b_readiness_runs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_a2b_runs_project_id ON a2b_readiness_runs(project_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS ix_a2b_results_run_id ON a2b_readiness_results(readiness_run_id);
CREATE INDEX IF NOT EXISTS ix_a2b_criteria_active ON a2b_readiness_criteria(is_active);
CREATE INDEX IF NOT EXISTS ix_a2b_overrides_active ON a2b_overrides(project_id, is_active);

INSERT INTO stage_configs (id, name, stage_order, is_enabled, roles_allowed)
VALUES
  ('stage-7', 'A2B Readiness Check', 7, true, '["Product Owner","Solution Architect","Automation COE Analyst"]'::jsonb),
  ('stage-8', 'SDD Creation', 8, true, '["Solution Architect"]'::jsonb),
  ('stage-9', 'ROI Approved', 9, true, '["Product Owner","Finance"]'::jsonb),
  ('stage-10', 'Prioritized', 10, true, '["Automation COE Analyst","Product Owner"]'::jsonb),
  ('stage-11', 'Pod Allocated', 11, true, '["Product Owner"]'::jsonb),
  ('stage-12', 'Sprint Ready', 12, true, '["Scrum Master","Pod Lead"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stage_order = EXCLUDED.stage_order,
  roles_allowed = EXCLUDED.roles_allowed,
  is_enabled = CASE WHEN EXCLUDED.name = 'A2B Readiness Check' THEN true ELSE stage_configs.is_enabled END;

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

UPDATE opportunities
SET
  a2b_status = COALESCE(NULLIF(data->>'a2bStatus', ''), a2b_status),
  a2b_last_run_id = CASE
    WHEN EXISTS (
      SELECT 1 FROM a2b_readiness_runs run
      WHERE run.id = NULLIF(opportunities.data->>'a2bLastRunId', '')
    )
    THEN NULLIF(data->>'a2bLastRunId', '')
    ELSE a2b_last_run_id
  END,
  sdd_enabled = CASE
    WHEN lower(COALESCE(data->>'sddEnabled', 'false')) = 'true' THEN true
    ELSE sdd_enabled
  END;

UPDATE opportunities opportunity
SET
  a2b_status = COALESCE(
    (SELECT run.status FROM a2b_readiness_runs run WHERE run.project_id = opportunity.id ORDER BY run.executed_at DESC LIMIT 1),
    opportunity.a2b_status
  ),
  a2b_last_run_id = COALESCE(
    (SELECT run.id FROM a2b_readiness_runs run WHERE run.project_id = opportunity.id ORDER BY run.executed_at DESC LIMIT 1),
    opportunity.a2b_last_run_id
  ),
  sdd_enabled = opportunity.sdd_enabled
    OR EXISTS (SELECT 1 FROM a2b_overrides item WHERE item.project_id = opportunity.id AND item.is_active)
    OR COALESCE(
      (SELECT run.status = 'READY' FROM a2b_readiness_runs run WHERE run.project_id = opportunity.id ORDER BY run.executed_at DESC LIMIT 1),
      false
    );

COMMIT;
