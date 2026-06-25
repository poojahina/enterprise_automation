Act as a Chief Enterprise AI Architect with 20+ years of experience designing AI platforms for Fortune 500 retail companies.

Your task is to design a highly demanded, production-ready, enterprise-scale Agentic AI workflow for the retail industry.

The workflow should solve a real business problem that delivers measurable ROI and should be architected for organizations processing millions of customer interactions every month.

=====================
OBJECTIVES
=====================

Design an autonomous multi-agent system capable of:

• Understanding customer intent
• Planning tasks
• Selecting the appropriate business agents
• Dynamically selecting enterprise tools
• Coordinating multiple agents
• Validating responses
• Learning from previous executions
• Supporting human approval when required
• Operating at enterprise scale

=====================
BUSINESS USE CASE
=====================

Create a complete AI-powered Retail Operations Platform capable of handling:

Customer Support
Product Discovery
Inventory Management
Supply Chain
Pricing Optimization
Promotion Management
Order Management
Returns
Fraud Detection
Loyalty Program
Personalized Recommendations
Vendor Management
Customer Sentiment Analysis
Executive Reporting

The system should work completely autonomously while allowing human intervention whenever confidence is low.

=====================
AGENT REQUIREMENTS
=====================

Create specialized agents such as:

Customer Intent Agent

Planner Agent

Workflow Orchestrator

Product Search Agent

Recommendation Agent

Inventory Agent

Pricing Agent

Promotion Agent

Order Agent

Fraud Detection Agent

Return Processing Agent

Customer Support Agent

Vendor Agent

Knowledge Retrieval Agent

Compliance Agent

Policy Agent

Finance Agent

Reporting Agent

Notification Agent

Memory Agent

Learning Agent

Aggregator Agent

Human Approval Agent

Governance Agent

=====================
TOOL REGISTRY
=====================

Instead of hardcoding APIs, use a Tool Registry.

Each tool should have:

Tool Name

Description

Capabilities

Authentication

Input Schema

Output Schema

Endpoint

Version

Health Status

Tags

Cost

Latency

Security Level

The system must dynamically discover tools.

If a required tool is missing, generate it automatically using a Tool Factory.

=====================
TOOL FACTORY
=====================

Design a generalized Tool Factory capable of creating tools dynamically for:

REST APIs

SOAP APIs

MCP Servers

Databases

SQL

PostgreSQL

Oracle

SAP

Salesforce

Azure Functions

AWS Lambda

Kafka

RabbitMQ

Azure Service Bus

Webhooks

GraphQL

Filesystem

SharePoint

Snowflake

Databricks

Power BI

Elastic Search

Vector Databases

=====================
AGENT REGISTRY
=====================

Design an Agent Registry storing:

Capabilities

Skills

Business Domains

Supported Tools

Required Permissions

Cost

Average Response Time

Confidence

Dependencies

=====================
ONTOLOGY LAYER
=====================

Design an enterprise ontology that maps:

Business Concepts

Products

Departments

Customers

Policies

Workflows

Agents

Tools

Data Sources

The orchestrator must use ontology reasoning for:

Agent Selection

Tool Selection

Workflow Planning

Context Enrichment

=====================
MEMORY
=====================

Implement

Short-term Memory

Long-term Memory

Semantic Memory

Procedural Memory

Portable Memory

Conversation Memory

Execution Memory

Business Memory

Customer Memory

=====================
RAG
=====================

Integrate enterprise RAG supporting:

Hybrid Search

Semantic Search

Keyword Search

Knowledge Graph Search

Metadata Filtering

Document Intelligence

Vector Database

Re-ranking

=====================
GUARDRAILS
=====================

Implement three-layer guardrails.

Layer 1
Input Validation

PII Detection

Prompt Injection

Jailbreak Detection

Safety Filters

Layer 2
Workflow Validation

Policy Validation

Compliance

Role-based Access

Business Rules

Layer 3
Output Validation

Groundedness

Hallucination Detection

Citation Validation

Confidence Score

Risk Analysis

=====================
WORKFLOW
=====================

Generate a complete step-by-step workflow beginning from:

Customer request

↓

Intent detection

↓

Planning

↓

Ontology reasoning

↓

Agent selection

↓

Tool selection

↓

Dynamic tool creation if needed

↓

Parallel execution

↓

Memory retrieval

↓

RAG retrieval

↓

Business validation

↓

Compliance validation

↓

Fraud detection

↓

Aggregation

↓

Response generation

↓

Learning

↓

Memory update

↓

Monitoring

↓

Audit logging

↓

Analytics

=====================
ARCHITECTURE
=====================

Generate:

1. High-Level Architecture (HLD)

2. Detailed Workflow

3. Sequence Diagram

4. Component Diagram

5. Agent Collaboration Diagram

6. Tool Factory Diagram

7. Ontology Diagram

8. Memory Flow Diagram

9. RAG Flow Diagram

10. Guardrail Flow

11. Monitoring Architecture

12. Deployment Architecture

=====================
AZURE SERVICES
=====================

Use Azure-native services where applicable:

Azure AI Foundry

Azure OpenAI

Azure AI Search

Azure Cosmos DB

Azure SQL

Azure Service Bus

Azure Event Grid

Azure Event Hubs

Azure Functions

Azure Kubernetes Service (AKS)

Azure API Management

Azure Key Vault

Azure Blob Storage

Azure Monitor

Application Insights

Azure Logic Apps

Azure Data Factory

Microsoft Fabric

Azure Redis Cache

Azure Entra ID

=====================
SCALABILITY
=====================

Design for:

10 million requests/month

100,000 concurrent users

100+ AI agents

1,000+ enterprise tools

99.99% availability

Horizontal scaling

Event-driven processing

Fault tolerance

Retry mechanisms

Dead Letter Queues

Circuit Breakers

Distributed tracing

=====================
DELIVERABLES
=====================

Provide:

1. Business Problem

2. Business Workflow

3. End-to-End Agent Workflow

4. Detailed Agent Responsibilities

5. Tool Registry Schema

6. Tool Factory Design

7. Agent Registry Design

8. Ontology Design

9. Memory Design

10. RAG Design

11. Three-Layer Guardrails

12. Event Flow

13. Data Flow

14. Sequence Diagram

15. High-Level Architecture

16. Low-Level Architecture

17. Production Deployment Architecture

18. Azure Services Mapping

19. Monitoring & Observability

20. Security Architecture

21. Cost Optimization Strategy

22. Disaster Recovery

23. Future Enhancements

Ensure every decision is justified from a business and technical perspective, and explain how the architecture scales to millions of requests while remaining secure, observable, and maintainable.
