# Company Evidence Human Test Results Template v0.1

## 1. Status and use

- Human Test executed: **NO**
- Results populated: **NO**
- Ready for Freeze: **NO**
- Planned participants: 5
- Planned company tasks: 25
- Personal data: do not collect; use Study ID only
- Detailed recording surface: `docs/company-evidence-human-test-results-template-v01.csv`

This document is a study plan and blank recording template. Assigned Study IDs, company order, session IDs, and planned device class are logistics, not test results. Do not prefill answers, scores, times, observations, comments, pass/fail decisions, or participant/browser details.

Use the moderator script and acceptance thresholds in `docs/company-evidence-human-test-protocol-v01.md`. Score Q1–Q4 only with `docs/company-evidence-human-test-answer-key-v01.md` after the human response has been recorded without prompting.

## 2. Counterbalanced company order

The five cyclic orders form a simple Latin-square-style rotation. Every company appears once in each ordinal position and no participant other than P01 starts with NVIDIA.

| Study ID | 1 | 2 | 3 | 4 | 5 | Full order |
|---|---|---|---|---|---|---|
| P01 | NVIDIA | TSMC | Applied Materials | Fujikura | Vertiv | NVIDIA → TSMC → Applied Materials → Fujikura → Vertiv |
| P02 | TSMC | Applied Materials | Fujikura | Vertiv | NVIDIA | TSMC → Applied Materials → Fujikura → Vertiv → NVIDIA |
| P03 | Applied Materials | Fujikura | Vertiv | NVIDIA | TSMC | Applied Materials → Fujikura → Vertiv → NVIDIA → TSMC |
| P04 | Fujikura | Vertiv | NVIDIA | TSMC | Applied Materials | Fujikura → Vertiv → NVIDIA → TSMC → Applied Materials |
| P05 | Vertiv | NVIDIA | TSMC | Applied Materials | Fujikura | Vertiv → NVIDIA → TSMC → Applied Materials → Fujikura |

Do not reorder companies after observing participant performance. A necessary deviation must be recorded in the moderator note without rewriting the planned order.

## 3. Device allocation

Recruit for the participant's normal device/browser where practical; do not prescribe a browser brand. Keep one device class for all five company tasks of the participant unless an accessibility or technical need requires a change.

| Study ID | Planned device class | Browser rule | Planned company sessions | Protocol contribution |
|---|---|---|---:|---|
| P01 | Desktop, approximately 1280px or normal desktop width | Participant's usual desktop browser | 5 | Desktop |
| P02 | Mobile, native device width or 360px emulation if unavoidable | Participant's usual mobile browser preferred | 5 | Mobile |
| P03 | Desktop, approximately 1280px or normal desktop width | Participant's usual desktop browser | 5 | Desktop |
| P04 | Mobile, native device width or 360px emulation if unavoidable | Participant's usual mobile browser preferred | 5 | Mobile |
| P05 | Participant's primary device | Participant's usual browser | 5 | Additional natural-device coverage |

This guarantees at least two desktop participants and two mobile participants before P05. Actual device/browser and viewport remain blank until a real session occurs. If emulation is used, record both host device/browser and emulated viewport.

## 4. Twenty-five-session registry

| Session ID | Study ID | Position | Company | Planned device | Result row |
|---|---|---:|---|---|---|
| P01-01 | P01 | 1 | NVIDIA | Desktop | CSV row 1 |
| P01-02 | P01 | 2 | TSMC | Desktop | CSV row 2 |
| P01-03 | P01 | 3 | Applied Materials | Desktop | CSV row 3 |
| P01-04 | P01 | 4 | Fujikura | Desktop | CSV row 4 |
| P01-05 | P01 | 5 | Vertiv | Desktop | CSV row 5 |
| P02-01 | P02 | 1 | TSMC | Mobile | CSV row 6 |
| P02-02 | P02 | 2 | Applied Materials | Mobile | CSV row 7 |
| P02-03 | P02 | 3 | Fujikura | Mobile | CSV row 8 |
| P02-04 | P02 | 4 | Vertiv | Mobile | CSV row 9 |
| P02-05 | P02 | 5 | NVIDIA | Mobile | CSV row 10 |
| P03-01 | P03 | 1 | Applied Materials | Desktop | CSV row 11 |
| P03-02 | P03 | 2 | Fujikura | Desktop | CSV row 12 |
| P03-03 | P03 | 3 | Vertiv | Desktop | CSV row 13 |
| P03-04 | P03 | 4 | NVIDIA | Desktop | CSV row 14 |
| P03-05 | P03 | 5 | TSMC | Desktop | CSV row 15 |
| P04-01 | P04 | 1 | Fujikura | Mobile | CSV row 16 |
| P04-02 | P04 | 2 | Vertiv | Mobile | CSV row 17 |
| P04-03 | P04 | 3 | NVIDIA | Mobile | CSV row 18 |
| P04-04 | P04 | 4 | TSMC | Mobile | CSV row 19 |
| P04-05 | P04 | 5 | Applied Materials | Mobile | CSV row 20 |
| P05-01 | P05 | 1 | Vertiv | Primary device | CSV row 21 |
| P05-02 | P05 | 2 | NVIDIA | Primary device | CSV row 22 |
| P05-03 | P05 | 3 | TSMC | Primary device | CSV row 23 |
| P05-04 | P05 | 4 | Applied Materials | Primary device | CSV row 24 |
| P05-05 | P05 | 5 | Fujikura | Primary device | CSV row 25 |

## 5. Record fields

The CSV contains one preallocated row for every Session ID above and these blank result fields:

### Session context

- `session_date`
- `device_browser`
- `viewport`
- `assistive_technology`
- `actual_company_order`
- `order_deviation`

### Q1–Q4

For each question:

- participant answer;
- score: `correct`, `partial`, or `incorrect`;
- response time in seconds;
- whether the answer was within 30 seconds.

Do not paraphrase in a way that repairs the answer. Prefer verbatim capture; otherwise use a neutral summary.

### Q5 Source reach

- Source selected;
- click count;
- time in seconds.

Opening the Evidence drawer is click 1 and opening the Source is click 2. Scrolling is not a click.

### Q6 taxonomy distinction

- participant's Fact / Company View / Atlas Analysis distinction;
- score: `correct`, `partial`, or `incorrect`;
- misinterpretation, including company-view-as-fact or Atlas-analysis-as-fact.

### Q7 missingness

- participant's missingness result;
- score: `correct`, `partial`, or `incorrect`.

### Observation and accessibility

- hesitation: `none`, `brief`, or `material`, plus note;
- density acceptable: `yes` or `no`;
- keyboard badge result;
- Source action result;
- Escape result;
- focus-return result;
- participant comment;
- moderator note.

Use `not tested` rather than a pass when a keyboard action was not attempted.

## 6. Blank session form

The CSV is the authoritative 25-row recording surface. This form is available for a moderator who needs a vertical paper or note-taking view; identify it with one of the 25 Session IDs and transfer without interpretation.

| Field | Blank result |
|---|---|
| Session ID |  |
| Study ID |  |
| Company |  |
| Session date |  |
| Device/browser |  |
| Viewport |  |
| Assistive technology |  |
| Company order |  |
| Order deviation |  |
| Q1 answer |  |
| Q1 score |  |
| Q1 time seconds |  |
| Q1 within 30s |  |
| Q2 answer |  |
| Q2 score |  |
| Q2 time seconds |  |
| Q2 within 30s |  |
| Q3 answer |  |
| Q3 score |  |
| Q3 time seconds |  |
| Q3 within 30s |  |
| Q4 answer |  |
| Q4 score |  |
| Q4 time seconds |  |
| Q4 within 30s |  |
| Q5 Source selected |  |
| Source reach click count |  |
| Source reach time seconds |  |
| Q6 Fact/Company View/Atlas distinction |  |
| Q6 score |  |
| Misinterpretation |  |
| Q7 missingness result |  |
| Q7 score |  |
| Hesitation |  |
| Hesitation note |  |
| Density acceptable yes/no |  |
| Keyboard badge result |  |
| Source action result |  |
| Escape result |  |
| Focus-return result |  |
| Participant comment |  |
| Moderator note |  |

## 7. Empty aggregate table

Do not populate until all applicable real sessions are complete.

| Company | Sessions completed | Q1–Q4 all correct within 30s | P1 Source ≤2 clicks | Taxonomy correct | Missingness correct | Density acceptable | Threshold result |
|---|---:|---:|---:|---:|---:|---:|---|
| NVIDIA |  |  |  |  |  |  |  |
| TSMC |  |  |  |  |  |  |  |
| Applied Materials |  |  |  |  |  |  |  |
| Fujikura |  |  |  |  |  |  |  |
| Vertiv |  |  |  |  |  |  |  |

No blank or `not tested` field is a pass. This template does not make a Freeze decision.
