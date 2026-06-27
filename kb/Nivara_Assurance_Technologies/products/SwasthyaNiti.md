# SwasthyaNiti

> **Product family:** Health-plan administration  
> **Platform owner:** [Dr. Meera Iyer](../employees/Dr. Meera Iyer.md)  
> **Delivery lead:** [Tanishq Verma](../employees/Tanishq Verma.md)

## Purpose

SwasthyaNiti is Nivara's workspace for health-policy enrolment, member servicing, pre-authorisation coordination, and employer-plan administration. It is designed for health insurers, TPAs, corporate-benefit administrators, and hospital-network teams. The product respects the fact that a polished screen is only one part of an insurance outcome: operators need explainable rules, customers need understandable next steps, and partner systems need reliable hand-offs.

## India-specific operating context

The product uses insurer-approved rules and workflows that can take account of family composition, waiting-period rules, network availability, city-level hospital preferences, cashless eligibility, and portability evidence. It supports configurable Hindi and regional-language communications, document-led exceptions, and assisted channels for customers who begin a journey with an advisor, branch colleague, call-centre agent, or field partner.

No production customer data, government identifier, or real insurer content appears in this reference corpus.

## Core capabilities

1. **Family floater and individual enrolment flows with dependent validation.**
2. **Portable policy timelines that display waiting periods and continuity notes to authorised operators.**
3. **Hospital-network directory services with city, speciality, and availability filters.**
4. **Pre-authorisation case routing with complete-document and missing-evidence queues.**
5. **Employer census uploads, payroll-aligned reconciliation, and member communication templates.**

## Connected client portfolio

1. [Arogya Kiran Health Plan agreement](../contracts/01-SwasthyaNiti-Arogya-Kiran-Health-Plan.md)
2. [Maitri Wellness Insurance agreement](../contracts/02-SwasthyaNiti-Maitri-Wellness-Insurance.md)
3. [Sanjeevani Care Network agreement](../contracts/03-SwasthyaNiti-Sanjeevani-Care-Network.md)
4. [Nila Health Cooperative agreement](../contracts/04-SwasthyaNiti-Nila-Health-Cooperative.md)
5. [Prerna Employee Health agreement](../contracts/05-SwasthyaNiti-Prerna-Employee-Health.md)

The linked agreements vary in implementation scope, commercial tier, and operating model. Their account and delivery contacts appear in the respective contract pages; this lets the product roadmap stay connected to the actual operational questions clients bring to Nivara.

## Controls and service design

- Role permissions separate customer support, underwriting or assessment, finance, client administration, and Nivara support duties.
- Rule changes require an accountable client approver, test evidence, an effective date, and a rollback path.
- Operational dashboards surface ageing, incomplete evidence, queue volume, interface failure, and manual override themes.
- Data exports are client-controlled and logged. Training and demonstration environments use fictional or de-identified material.
- Monthly service reviews connect product telemetry with user feedback and exception patterns; quarterly reviews prioritise roadmap changes.

## Commercial model

A typical enterprise deployment begins at **₹5.6 lakh per month**, plus one-time implementation services determined by integrations, migration scope, and training needs. Pricing in individual agreements can differ by number of users, product lines, managed operations support, and transaction volumes. All figures are fictional and shown in Indian rupees.

## 2026–27 direction

The next planned focus for SwasthyaNiti is member-language preference management and a discharge-to-claim-status service journey. Nivara will validate each capability with client operators before general release, especially where it affects evidence requirements, customer communications, or a regulated decision path.

For the overall platform map, see [Nivara's company overview](../company/overview.md).
