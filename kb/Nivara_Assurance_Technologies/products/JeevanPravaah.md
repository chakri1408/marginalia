# JeevanPravaah

> **Product family:** Life insurance onboarding  
> **Platform owner:** [Kritika Sethi](../employees/Kritika Sethi.md)  
> **Delivery lead:** [Divya Nair](../employees/Divya Nair.md)

## Purpose

JeevanPravaah is Nivara's workspace for life-insurance discovery, proposal capture, underwriting referral, and long-horizon policy servicing. It is designed for life insurers, advisor networks, and employer-benefits teams. The product respects the fact that a polished screen is only one part of an insurance outcome: operators need explainable rules, customers need understandable next steps, and partner systems need reliable hand-offs.

## India-specific operating context

The product uses insurer-approved rules and workflows that can take account of nominee relationships, income evidence, occupation categories, regional language preference, and insurer-approved medical or financial referral rules. It supports configurable Hindi and regional-language communications, document-led exceptions, and assisted channels for customers who begin a journey with an advisor, branch colleague, call-centre agent, or field partner.

No production customer data, government identifier, or real insurer content appears in this reference corpus.

## Core capabilities

1. **Advisor-assisted fact finding that can resume across branch, phone, and digital channels.**
2. **Rule-driven document requests with a visible explanation for every referral.**
3. **Nominee and beneficiary capture with structured relationship checks.**
4. **Medical appointment coordination and status tracking without exposing clinical conclusions to unauthorised users.**
5. **Persistency dashboards that identify service nudges before a policy lapses.**

## Connected client portfolio

1. [Sampoorna Life Trust agreement](../contracts/01-JeevanPravaah-Sampoorna-Life-Trust.md)
2. [Astitva Life Company agreement](../contracts/02-JeevanPravaah-Astitva-Life-Company.md)
3. [Navajeevan Benefit Society agreement](../contracts/03-JeevanPravaah-Navajeevan-Benefit-Society.md)
4. [Udaya Life Assurance agreement](../contracts/04-JeevanPravaah-Udaya-Life-Assurance.md)

The linked agreements vary in implementation scope, commercial tier, and operating model. Their account and delivery contacts appear in the respective contract pages; this lets the product roadmap stay connected to the actual operational questions clients bring to Nivara.

## Controls and service design

- Role permissions separate customer support, underwriting or assessment, finance, client administration, and Nivara support duties.
- Rule changes require an accountable client approver, test evidence, an effective date, and a rollback path.
- Operational dashboards surface ageing, incomplete evidence, queue volume, interface failure, and manual override themes.
- Data exports are client-controlled and logged. Training and demonstration environments use fictional or de-identified material.
- Monthly service reviews connect product telemetry with user feedback and exception patterns; quarterly reviews prioritise roadmap changes.

## Commercial model

A typical enterprise deployment begins at **₹5.1 lakh per month**, plus one-time implementation services determined by integrations, migration scope, and training needs. Pricing in individual agreements can differ by number of users, product lines, managed operations support, and transaction volumes. All figures are fictional and shown in Indian rupees.

## 2026–27 direction

The next planned focus for JeevanPravaah is a vernacular advisor companion and consent-based premium-reminder journeys. Nivara will validate each capability with client operators before general release, especially where it affects evidence requirements, customer communications, or a regulated decision path.

For the overall platform map, see [Nivara's company overview](../company/overview.md).
