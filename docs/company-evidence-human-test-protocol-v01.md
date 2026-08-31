# Company Evidence five-person Human Test Protocol v0.1

## 1. Status

This is an empty protocol/template for an actual five-person usability test. It contains no fabricated participants, observations, answers, or results. Codex output must not be counted as a human response.

Test only the five v0.2 Pilot pages: NVIDIA, TSMC, Applied Materials, Fujikura, and Vertiv.

## 2. Participants and environment

- Recruit five independent participants who did not create the Pilot content.
- Record only a study ID; do not store unnecessary personal information.
- Use the deployed production Pages URL after the v0.2 merge.
- Use the participant's normal browser. Record viewport/device and assistive technology.
- At least two sessions should use a mobile-width device or 360px emulation; at least two should use a desktop-width device around 1280px.
- Counterbalance the company order so all participants do not start with NVIDIA.
- Do not explain the page taxonomy before the first 30-second task.

## 3. Moderator script

For each company:

1. Open the company page at the top.
2. Say: “Please look at this page for up to 30 seconds. Do not open detailed disclosures yet.”
3. Start the timer when the page is visible.
4. At 30 seconds, stop initial reading and ask Q1–Q4 without leading the participant.
5. Record the participant's own answer verbatim or as a neutral summary.
6. Continue with Q5–Q7. The participant may now interact with the page.

Questions:

- Q1. What kind of company is this?
- Q2. Where is it in AI infrastructure?
- Q3. What are its main products or technologies?
- Q4. Why is it competitively important?
- Q5. Please find the primary Source for one of these statements.
- Q6. Can you distinguish a Fact, a Company View, and an Atlas Analysis on this page?
- Q7. Can you identify where information is incomplete, uncollected, undisclosed, or not applicable?

Do not teach the answer until the task and observation are complete.

## 4. Measurement definitions

For every company and participant, record:

- Q1–Q4 accuracy: correct / partial / incorrect;
- time to each answer and whether it was within 30 seconds;
- Source-reach click count from the claim button to the primary Source;
- hesitation: none / brief / material, with observed behavior;
- misinterpretation: especially Fact versus Company View versus Atlas Analysis;
- whether missingness meaning was found and correctly described;
- keyboard/Escape/focus-return result when included in the session;
- qualitative comment in the participant's words.

Scrolling is not counted as a click. Opening the Evidence drawer is click 1; opening the Source is click 2.

## 5. Answer key preparation

Before sessions, the study owner must create a concise answer key directly from the five deployed P1 summaries. The key must distinguish:

- accepted semantic equivalents;
- required company-positioning attribution for Q4;
- unacceptable inference beyond the displayed claim;
- partial credit boundaries.

The answer key is reviewed before results are scored and is not changed to improve outcomes after seeing participant responses.

## 6. Proposed acceptance thresholds

The v0.2 Pilot is ready for Freeze review only when all of the following pass:

1. For every Pilot page, at least four of five participants answer Q1–Q4 correctly within 30 seconds without opening P2/P3.
2. At least 95% of tested public claims reach a primary Source in no more than two clicks; all P1 claims do.
3. All five participants correctly distinguish Fact from Atlas Analysis; Company View must not be reported as an Atlas fact.
4. At least four of five participants correctly identify at least one incomplete category and its reason on every page tested for missingness.
5. At least four of five rate the P1 summary and Basic drawer as not overcrowded.
6. Keyboard-only badge, Source action, Escape, close, and focus return pass on desktop and mobile-width sessions.
7. No blocker-level mobile overflow, unreadable close control, or inaccessible Source CTA is observed.

A failed threshold produces a documented revision/re-test. It must not be converted into Freeze approval by interpretation.

## 7. Empty participant template

| Study ID | Date | Device/browser | Viewport | Assistive technology | Company order | Moderator |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 8. Empty company task template

| Field | Observation/result |
|---|---|
| Study ID |  |
| Company |  |
| Q1 answer / accuracy / time |  |
| Q2 answer / accuracy / time |  |
| Q3 answer / accuracy / time |  |
| Q4 answer / accuracy / time |  |
| Q5 Source selected |  |
| Q5 click count / time |  |
| Q6 Fact/Company View/Atlas answer |  |
| Q6 misinterpretation |  |
| Q7 missingness answer |  |
| Hesitation observed |  |
| Keyboard/Escape/focus result |  |
| Qualitative comment |  |
| Moderator notes |  |

Create one blank copy of this table for each participant/company combination during study setup. Do not pre-populate results.

## 9. Empty aggregate template

| Company | Participants completing | Q1–Q4 all correct within 30s | P1 Source ≤2 clicks | Fact/Analysis correct | Missingness correct | Density acceptable | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| NVIDIA |  |  |  |  |  |  |  |
| TSMC |  |  |  |  |  |  |  |
| Applied Materials |  |  |  |  |  |  |  |
| Fujikura |  |  |  |  |  |  |  |
| Vertiv |  |  |  |  |  |  |  |

## 10. Decision record

- Human test executed: **NO — blank template**
- Ready for Human Test: to be filled after deployed-page QA
- Ready for Freeze: **NO until actual results pass**
- Approved by / date:
