Intake Hub — Platform Enhancement Brief for Claude Code
 
Context
 
You are working on the existing Intake Hub application (Automation CoE intake platform), currently live at enterprise-automation.azurewebsites.net, with the following stages in the flow:
 
Submit Idea → Classification → Qualification → Scoring → Discovery → PRD Creation → Solution Design → ROI Calculator → Prioritization → Pod Allocation → Sprint Readiness → Documents, surfaced via a Dashboard.
 
This is an enhancement to an existing codebase, not a greenfield build. Before writing any code, investigate the current repository structure, frameworks, data models, and routing so that everything below is implemented consistently with existing patterns rather than introducing a parallel architecture.
 
 
Step 0 — Repository Discovery (do this first, report back before building)
 
Identify the frontend framework, backend framework/language, database/ORM, auth mechanism, and hosting/deploy setup (this is on Azure App Service per the URL — confirm via config/pipeline files).

Map each of the 12 stages above to its actual route/controller/component/model in the codebase.

Identify how stage-to-stage flow/state transitions are currently enforced (e.g., is there a workflow state machine, a status enum on a record, hardcoded route guards, etc.).

Identify whether any settings/admin/config area already exists, and whether any secrets/integration management pattern already exists (e.g., env vars, a settings table, Azure Key Vault).

Identify existing file upload handling (if any) and existing LLM/AI integration points (if any).

Summarize findings in a short report before proceeding to implementation, including any architectural constraints that affect feasibility of the items below.
 
 
Feature 1 — Configurable Stage Toggling
 
Goal: Any stage in the intake-to-delivery flow can be enabled/disabled by an admin via configuration/settings, without code changes or redeployment.
 
Requirements:
 
Add a StageConfiguration concept (DB-backed, not hardcoded) covering all 12 stages, each with at minimum: stageKey, displayName, isEnabled, order/sequence, and behaviorWhenDisabled.

Build an admin Settings UI section ("Pipeline Configuration" or similar) listing all stages with a toggle per stage, drag-or-numeric control for order, and a save action that takes effect immediately (no redeploy).

Disabled-stage behavior = auto-skip: when a stage is disabled, the flow proceeds automatically to the next enabled stage, and the disabled stage is recorded on the record as status: "N/A — disabled by configuration" (visible in audit trail/history, not silently dropped).

The Dashboard, navigation/sidebar, and any stage-progress indicators must dynamically reflect enabled stages only — disabled stages should not appear as actionable nav items but may appear grayed out with an "N/A" badge for transparency (your call based on existing UX patterns — flag this as a design decision in your report).

Changing configuration must not break records that are mid-flow with data already in a now-disabled stage — that historical data should be preserved and viewable, just not re-editable as an active step.

Add validation: warn (don't silently allow) if an admin tries to disable a stage that a currently in-progress record is actively sitting in — the in-flight record should gracefully skip forward.

Build this with a clean abstraction (e.g., a StageRegistry service / pipeline-resolver) rather than scattering if (stage.enabled) checks across controllers — this is the seam most likely to need extension later (e.g., conditional rules beyond simple on/off).
 
Acceptance criteria:
 
Toggling a stage off in Settings immediately changes the live flow for new and in-progress submissions.

No code deploy required to change pipeline shape.

Full audit log of who changed what stage config and when.
 
 
Feature 2 — Enterprise Readiness & System Integrations
 
Goal: The platform is enterprise-deployable and can connect outward to SharePoint and APM/project-management tools.
 
Requirements:
 
SharePoint integration: ability to push/pull documents (PRDs, solution design docs, sprint plans) to/from a configured SharePoint site/library. Use Microsoft Graph API. Connection details (tenant, site URL, library, auth — prefer app registration / client credentials or on-behalf-of flow) live in Settings, not hardcoded.

APM / project management tool integration: build this as a pluggable connector interface (e.g., IProjectManagementConnector) with at least one concrete implementation (Jira and/or Azure DevOps and/or generic APM — check what the org likely uses; default to Azure DevOps given this is already an Azure-hosted app, but design the interface so Jira/other APM tools can be added without touching core flow logic). Used to push out generated project/sprint plans and sync status back.

Settings-driven, not config-file-driven: all integration credentials/endpoints should be manageable via an admin UI, stored securely (Azure Key Vault reference, encrypted-at-rest field, or existing secrets pattern in the repo — follow Step 0 findings), never in plaintext in source or appsettings checked into source control.

Enterprise non-functional baseline — confirm/add as needed:
 
Role-based access control (admin vs. submitter vs. reviewer, at minimum) gating Settings and stage-config changes to admins only.

Audit logging on all configuration changes and stage transitions.

SSO-compatible auth if not already present (flag in Step 0 report if missing — don't silently skip this, it's a hard enterprise requirement, but scope/sequencing is a discussion point if it's a large lift).

Externalized configuration (no hardcoded URLs/secrets) — audit the existing codebase for any hardcoded values as part of Step 0 and flag them.

Connection test buttons in Settings ("Test SharePoint Connection", "Test APM Connection") that give immediate pass/fail feedback rather than failing silently at runtime.
 
Acceptance criteria:
 
Documents generated by the platform (PRD, Solution Design, Sprint Plan) can be pushed to a configured SharePoint location.

A generated project/sprint plan can be created/synced in at least one PM tool via the connector interface.

All integration config lives in Settings, is testable, and is not exposed in source control or client-side code.
 
 
Feature 3 — Core Capability: Discovery → PRD → Solution Design → Pod Allocation, with Project/Sprint Planning, Enterprise LLM, and Context Upload
 
This is the primary feature set of the platform. Treat Discovery, PRD Creation, Solution Design, and Pod Allocation as the critical path; everything below should be built so these four stages are first-class and robust.
 
3a. Enterprise LLM connector (Settings-driven)
 
Build a provider-agnostic LLM gateway/service layer sitting behind every AI/cognitive feature in the app — no feature should call a specific LLM SDK directly.

In Settings, allow selection and configuration of the active enterprise LLM provider, with named connectors for:
 
Azure OpenAI (endpoint, deployment name, API key or managed identity)

AWS Bedrock (region, model ID, IAM/credentials)

Google Vertex AI (project, region, model, service account credentials)

Allow admin to set the active provider + model, with per-stage override if useful (e.g., a cheaper/faster model for Classification, a stronger model for PRD generation) — but default to one global setting if that's a more sensible v1 scope; flag this as a scoping decision rather than assuming.

All credentials follow the same secure-storage pattern as Feature 2.

Include a "Test LLM Connection" action in Settings.
 
3b. Context upload (transcript / video / documents) — shared across cognitive decisions
 
Wherever a stage involves an AI/cognitive decision (Classification, Qualification, Scoring if enabled, Discovery, PRD Creation, Solution Design — and Sprint Readiness if AI-assisted), allow the user to upload supporting context: meeting transcripts, video files, and documents (PDF/DOCX/PPTX at minimum).

Build a shared context store per submission/idea record — not per-stage-isolated uploads. Context uploaded at any stage should be retrievable and usable by AI calls in later stages of the same record (e.g., a discovery-call transcript uploaded during Discovery should inform PRD generation and Solution Design later), unless the user explicitly scopes it otherwise.

Video files: extract audio → transcribe (via the configured LLM provider's transcription capability, or a separate transcription service if the provider doesn't support it — flag this dependency) → store transcript text alongside the raw file.

Documents: extract text content for use as LLM context (reuse existing document-parsing if the repo already has any, per Step 0 findings).

All extracted context should be chunked/summarized as needed to fit context windows, and the system should show the user what context was used for a given AI-generated output (transparency/traceability — e.g., "This PRD draft used: discovery_call_transcript.mp4, requirements_doc.docx").

Respect file size/type limits sensibly; surface clear errors for unsupported formats.
 
3c. Discovery, PRD Creation, Solution Design — AI-assisted, context-aware
 
Each of these stages should call the LLM gateway (3a) with the accumulated shared context (3b) plus stage-specific structured inputs, to generate/assist drafting.

Output should be editable by the user, not a one-shot uneditable generation — these are drafts the user refines, not final artifacts the system dictates.

Version history on generated drafts is strongly recommended (so a user can see/revert prior AI-generated versions) — flag as a recommended-but-negotiable scope item if time-constrained.
 
3d. Pod Allocation
 
Confirm/extend existing Pod Allocation logic to consume outputs from Solution Design (e.g., required skills, estimated effort/complexity) to suggest pod composition. If this mapping doesn't exist yet in the current codebase, build a simple rules-based or LLM-assisted suggestion (not necessarily a complex optimizer) — assistive, not auto-committing.
 
3e. Project plan + sprint plan generation
 
Add the ability to generate a project plan and sprint plan alongside/after Pod Allocation, using:
 
Solution Design output (scope, components, complexity)

Pod Allocation output (team/skills/capacity)

The enterprise LLM (3a) for drafting structure, with the shared context (3b) available

Use a "robust skill"-style approach: if the existing codebase already has any skill/prompt-template/workflow-definition pattern (check Step 0), extend it; otherwise, build this as a well-structured, reusable prompt-and-output-schema definition (not a single giant unstructured prompt) so it can be maintained and improved independently of the surrounding app code.

Output should map cleanly onto whatever PM/APM connector exists (Feature 2) — e.g., sprint plan → work items/epics/stories pushed to Azure DevOps/Jira — and also be exportable/viewable in the Documents stage and pushable to SharePoint.
 
Acceptance criteria:
 
A user can upload a transcript/video/document at Discovery, and that context measurably and visibly informs PRD Creation and Solution Design outputs later in the same record.

Admin can switch the active LLM provider between Azure OpenAI, Bedrock, and Vertex in Settings without code changes, and a connection test confirms it's working.

A project plan and sprint plan can be generated from Solution Design + Pod Allocation outputs and pushed to the configured PM tool / SharePoint.
 
 
Feature 4 — Client-Owned Stages (Classification, Qualification, Scoring, ROI) Must Be Independently Disable-able, With Auto-Skip
 
Goal: Classification, Qualification, Scoring, and ROI Calculator are sometimes performed by the client organization outside this platform. Each must be independently toggle-able off via Feature 1's stage configuration, and — per the agreed behavior — disabling one of these auto-skips it rather than blocking the flow.
 
Requirements:
 
These four stages use the exact same StageConfiguration / StageRegistry mechanism built in Feature 1 — do not build a separate, special-cased toggle system for these. They are simply stages that are commonly disabled, not architecturally different.

When one of these is disabled:
 
The record's status moves directly to the next enabled stage.

The record/history shows the stage as N/A — performed externally by client organization (slightly more specific status label than the generic disabled-stage label in Feature 1, for clarity to internal users — small enough difference to be a behaviorWhenDisabled config value per stage rather than new code).

If downstream stages (e.g., Prioritization) normally consume output from one of these (e.g., a numeric score, an ROI figure), and that stage is disabled, downstream logic must degrade gracefully: either accept a manually-entered/externally-sourced value as an optional field, or simply omit that input from its calculation/display without erroring. Audit the codebase in Step 0 for exactly which downstream stages read from Classification/Qualification/Scoring/ROI output, and list them in your report before building the degrade-gracefully handling.

Confirm Prioritization, Discovery, and Pod Allocation (the stages most likely to consume Scoring/ROI output) are explicitly tested with each of these four stages individually disabled, and with all four disabled simultaneously, to confirm the flow still completes end-to-end.
 
Acceptance criteria:
 
Each of Classification, Qualification, Scoring, ROI Calculator can be disabled independently with no errors anywhere downstream.

A record can flow all the way from Submit Idea to Documents with all four of these disabled.

Disabled stages are visibly and correctly labeled as externally-performed/N/A in the record history.
 
 
Working Agreement
 
Don't refactor unrelated parts of the codebase. Extend existing patterns (naming conventions, folder structure, state management approach) rather than introducing new ones unless something genuinely has no existing pattern to follow.

Where a requirement above has a scoping judgment call (flagged inline as "flag this" / "your call" / "negotiable"), surface it explicitly rather than silently picking an interpretation, especially anywhere touching auth, secrets storage, or breaking changes to in-flight records.

After Step 0's discovery report, propose a build order across Features 1–4 (Feature 1 likely first, since 2–4 all depend on the stage-configuration abstraction it introduces) before writing code, so sequencing can be confirmed.

Write tests for: stage toggle behavior (on/off/skip), graceful degradation when Scoring/ROI are disabled, and the LLM provider switch in Settings.
 
 
