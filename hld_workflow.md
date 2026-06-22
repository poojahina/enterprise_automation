# Automation Opportunity Intake Hub — End-to-End Workflow Design

This document details the complete end-to-end pipeline for the Automation Opportunity Intake Hub. It is intended to serve as the foundational reference for generating High-Level Design (HLD) diagrams and process flowcharts.

---

## Architecture Overview

The system is designed as a **React/TypeScript Single Page Application (SPA)** utilizing **Zustand** for global state management and persistent local storage. The architecture follows a pipeline-driven state machine where an `AutomationOpportunity` object progresses through defined sequential stages.

### Key Roles
1. **Business User**: Submits ideas and provides domain context.
2. **Automation COE Analyst**: Reviews qualifications, scoring, and pipeline health.
3. **Solution Architect**: Designs the architecture, technical stack, and PRD.
4. **Product Owner**: Manages prioritization, ROI, and pod allocation.

---

## Pipeline Workflow Stages

Below are the sequential steps an automation opportunity takes from inception to sprint execution.

### 1. Idea Submission (Intake Wizard)
* **Actor:** Business User
* **Input:** Process Name, Business Unit, Pain Points, manual metrics (Time/Cost savings), Process Characteristics (e.g., Rule-Based, GenAI needed).
* **Process:** The user navigates a 4-step wizard to capture comprehensive process data.
* **Output:** A draft `AutomationOpportunity` object is constructed.

### 2. Auto-Classification Engine
* **Actor:** System (Automated)
* **Engine utilized:** `classifyAutomationType()`
* **Process:** Analyzes the boolean characteristics and process complexity provided in Step 1. It utilizes rule-based logic to calculate match scores against four paradigms.
* **Output:** Assigns one of four Automation Types:
  - `Hyperautomation/Agentic Automation` (High autonomy, multi-system, GenAI)
  - `RPA` (Rule-based, structured data, low reasoning)
  - `Intelligent Automation` (Unstructured data, Document AI, moderate reasoning)
  - `Power Automate/Power Platform` (Workflow-centric, API availability)

### 3. L1 Qualification (Triage)
* **Actor:** System / Automation COE Analyst
* **Engine utilized:** `qualifyOpportunity()`
* **Process:** Evaluates the opportunity against baseline enterprise thresholds (e.g., Minimum volume threshold > 50/month, manual effort justification).
* **Output:** Assigns a status (`Qualified`, `Rejected`, or `Needs More Information`) and a baseline Qualification Score.

### 4. Priority Scoring
* **Actor:** System (Automated)
* **Engine utilized:** `calculatePriorityScore()` and `calculateComplexity()`
* **Process:** Applies a weighted algorithm across four dimensions:
  1. Business Impact (35%)
  2. Strategic Alignment (25%)
  3. Feasibility (20%)
  4. ROI Potential (20%)
* **Output:** Generates a `totalScore` out of 100, assigns a Priority Band (`Critical`, `High`, `Medium`, `Low`), and calculates a T-shirt complexity size (`XS` to `XL`).

### 5. L2 Discovery Workspace
* **Actor:** Business User / Solution Architect
* **Process:** Deep-dive analysis of the "As-Is" process. Captures granular steps, process variants, exceptions, business rules, SLA, inputs/outputs, and peak periods.
* **Output:** Generates a structured `DiscoveryAssessment` object appended to the opportunity.

### 6. Product Requirements Document (PRD) Creation
* **Actor:** Product Owner / Solution Architect
* **Process:** Definition of the specific business requirements based on Discovery. Captures Executive Summary, User Personas, Functional Requirements, Non-Functional Requirements, Acceptance Criteria, and Dependencies.
* **Output:** Generates a structured `ProductRequirementsDocument` object.

### 7. Solution Design
* **Actor:** Solution Architect
* **Process:** Technical blueprinting of the "To-Be" state. Recommends the specific technology stack, architecture design, Human-in-the-Loop interventions, and security/monitoring strategies.
* **Output:** Generates a `SolutionRecommendation` object.

### 8. ROI & Business Case Approval
* **Actor:** Product Owner / Finance
* **Engine utilized:** `calculateROI()`
* **Process:** Interactive financial modeling. Inputs implementation costs vs. annual support costs and savings.
* **Output:** Calculates KPI metrics including **ROI Percentage**, **Net Present Value (NPV)**, **Payback Period**, and **Break-Even Point**.

### 9. Portfolio Prioritization
* **Actor:** Automation COE Analyst / Product Owner
* **Process:** Comparative analysis of all approved opportunities in the pipeline using sortable data tables and Multi-dimensional bubble charts (Risk vs. Reward).
* **Output:** Final pipeline ranking and sequencing.

### 10. Pod Allocation
* **Actor:** Product Owner
* **Engine utilized:** `recommendPod()`
* **Process:** Matches the opportunity's classified automation type and complexity against the available delivery pods (e.g., RPA Center of Excellence, Agentic AI Squad). Checks current pod capacity limits.
* **Output:** Assigns the opportunity to a specific delivery team and deducts capacity.

### 11. Sprint Readiness Certification
* **Actor:** Scrum Master / Pod Lead
* **Engine utilized:** `determineSprintReadiness()`
* **Process:** A rigorous 9-gate checklist ensuring compliance, architecture approval, and backlog completion before development begins. Generates simulated Jira Epic/Story tickets.
* **Output:** Opportunity is marked `Sprint Ready` or `Blocked` pending missing gates.

### 12. Document Generation (Export)
* **Actor:** All Users
* **Process:** Aggregates data from all pipeline stages to auto-generate exportable artifacts.
* **Output:** Generates PDF-ready views for the **Business Case**, **PRD**, **Solution Design Document**, and **Sprint Backlog**.

---

## Suggested High-Level Design (HLD) Diagram Structure

For your HLD diagram, consider organizing the flow into **Three Main Tiers (Swimlanes)**:

1. **User Interaction Layer (Frontend)**:
   - Dashboard, Intake Wizard, Workspace Views, ROI Sliders, Document Exports.
2. **Orchestration & State Layer (Zustand)**:
   - Global Store, State Persistence, Opportunity Pipeline Management.
3. **Logic & Utility Engines Layer (Core Processing)**:
   - Classification Engine → Scoring Engine → ROI Calculator → Pod Recommender → Sprint Readiness Validator.

*Note: As this is a mock-service architecture, there is no physical external backend/database layer. All data is persisted in browser local storage via Zustand.*
