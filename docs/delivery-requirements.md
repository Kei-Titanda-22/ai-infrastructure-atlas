# Delivery Requirements

## DR-1 — Web-first delivery

GitHub is used for source control, review history, CI/CD, and deployment automation. It is **not** the final user-facing deliverable.

The final deliverable is a browser-accessible, interactive Web site deployed to a stable URL.

## DR-2 — v0.1 Definition of Done

v0.1 is complete only when all of the following are true:

1. source code is stored in a GitHub repository;
2. the repository has an automated deployment workflow;
3. the site is deployed to GitHub Pages or another approved static host;
4. a real HTTPS URL is reachable from a normal browser;
5. Home, Atlas, Companies, Company detail, Compare, Search, Methodology, and Glossary can be opened from that deployed URL;
6. client-side filtering and comparison interactions work on the deployed site;
7. constitutional validation and secret checks pass before deployment;
8. no API key or private credential is required by the browser;
9. the deployed site displays source/provenance metadata according to the Project Constitution;
10. a deployment failure means v0.1 remains incomplete even if the local source bundle is correct.

## DR-3 — Source repository is an implementation artifact

ZIP archives, local folders, README files, screenshots, and repository source are intermediate implementation artifacts. They are useful for review and recovery but do not satisfy delivery by themselves.

## DR-4 — Deployment target

The default v0.1 target is GitHub Pages because the application is static and does not require a backend. A future host migration is allowed if required by authentication, server-side data access, licensed data, or other product constraints.

## DR-5 — Release record

Each public release should record at minimum:

- release/version identifier;
- Git commit SHA;
- deployment URL;
- deployment timestamp;
- data snapshot/as-of date where applicable;
- validation status.
