# Nivara operating model

## From client question to production service

Nivara uses a four-stage delivery model for all 36 client agreements. The detail changes by product, but accountability does not.

1. **Discover:** an account lead and domain specialist map the insurer's existing journey, evidence requirements, integrations, language needs, and exception paths.
2. **Configure:** the delivery team configures workflows, roles, product rules, document templates, dashboards, and data mappings in a non-production environment.
3. **Prove:** client users complete scenario-based testing, including failure cases such as missing documents, duplicate records, payment mismatches, and manual referral.
4. **Operate and improve:** a service owner monitors availability and adoption; the account lead convenes quarterly reviews; product teams use approved themes rather than identifiable customer data to guide roadmap decisions.

## Accountability map

| Moment | Accountable role | Supporting roles |
| --- | --- | --- |
| Commercial scope and renewal | Account Director | Finance partner, product manager |
| Regulatory and product-rule interpretation | Insurance Domain Lead | Client compliance contact, legal counsel |
| Solution configuration | Implementation Lead | Solutions architect, QA analyst |
| Production reliability | Site Reliability Engineer | Security engineer, client IT contact |
| Service-quality review | Client Success Manager | Support analyst, product operations |

## Service governance

Each agreement has a monthly operational review and a quarterly business review. Monthly reviews cover service levels, support backlog, interface health, data-quality exceptions, and release planning. Quarterly reviews add adoption outcomes, roadmap priorities, financial reconciliation, risk themes, and renewal readiness.

Changes are classified as standard configuration, controlled product change, emergency remediation, or client-specific extension. A change is never released because it is merely technically possible: it needs an owner, test evidence, rollback plan, and communication plan appropriate to its risk.

## Data and continuity

Production data is separated from training material. Access is role-bound and periodically reviewed. Client administrators retain authority over their user roster and exports. Nivara tests recovery procedures quarterly and supports alternate intake paths for high-volume events such as monsoon flooding, cyclone impact, or regional network disruption.

The product pages and contracts in this corpus use fictional examples, but follow this same operating logic.
