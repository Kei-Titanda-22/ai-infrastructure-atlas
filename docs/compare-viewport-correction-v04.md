# Compare viewport correction v0.4

## Scope

- Baseline: `origin/main` at `7ec1a759632303404a1e0f1c57ec24620864c128` (PR #117)
- Page: `/compare/`
- Change class: presentation and clear-all interaction only
- Out of scope: comparison values, compatibility judgement, financial data, company data, sources, metric definitions, URL semantics, and full-site rollout

## Acceptance measurement

The clipping acceptance is based on the visible content box of the comparison scroller, not on document overflow. The fifth header percentage is calculated from the intersection of the fifth company header and the scroller's initial content viewport.

Default template: ASML / Applied Materials / Lam Research / Tokyo Electron / KLA.

| Viewport | State | Comparison container | Metric column | Company columns | 5th header visible | Fully visible headers | Horizontal table scroll | Document overflow |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1280px | Before | 1225px (content 1208px) | 220px | 197.6px each | 100% | 5/5 | NO | 0 |
| 1280px | After | 1225px (content 1223px) | 170px | 210.6px each | 100% | 5/5 | NO | 0 |
| 1024px | Before | 969px (content 952px) | 220px | 164px each | 46% | 4/5 | YES | 0 |
| 1024px | After | 969px (content 967px) | 170px | 159.4px each | 100% | 5/5 | NO | 0 |
| 960px (content about 900px) | Before | 905px (content 888px) | 220px | 164px each | 7% | 4/5 | YES | 0 |
| 960px (content about 900px) | After | 905px (content 903px) | 170px | 146.6px each | 100% | 5/5 | NO | 0 |
| 768px | After | 729px (content 727px) | 170px | 146px each | 0% initially | 3/5 | YES | 0 |
| 360px | After | 321px (content 319px) | 170px | 146px each | 0% initially | scroll region | YES | 0 |

At 900px or more of comparison-container width the table uses the available width. Below that content width the 900px table minimum activates horizontal scrolling. Font sizes were not reduced for fitting.

## Header representation

The primary matrix now uses a compact visible representation: company name followed by ticker and country. Japanese companies use the Japanese display name in the matrix. The selected-company list above the matrix continues to show the full company/local-name representation. Accessible names on the matrix links retain the full company name.

## Clear-all interaction

| Check | Before | After |
| --- | --- | --- |
| Text | `全5社を解除` at five selected | `すべて解除` |
| Visibility | Present but 20.6px-high and visually weak | Visible at two or more selected |
| Target height | 20.6px | 44px |
| Position | Separate from status grouping | Same row as `5/5社を選択中` |
| One-click clear | YES | YES |
| URL after clear | `?ids=` | `?ids=` |
| Focus return | Search field | Search field |
| Native keyboard control | Button | Button |

The action is hidden and disabled at zero or one selected company. Individual `外す` actions remain available.

## All-missing presentation

For the default five-company template, the primary matrix changed from four all-selected-missing rows to zero. The omitted rows are summarized below the matrix as:

`未収録・比較対象外：PER、予想PER、PBR、ROIC`

The source metric records are retained. Compatibility state calculation also still runs for every metric, including omitted rows. The quality summary is unchanged (`5社 / 比較可 0 / 条件注意 2 / 比較不能 4`). A partial-missing check with the AI-compute template confirmed that ROIC remains in the primary matrix when NVIDIA has a value and the other four companies do not; only fully missing metrics are omitted.

## Intro width spot check at 1024px

| Page | Effective intro width | Page shell width | Document overflow |
| --- | ---: | ---: | --- |
| Companies | 905.6px | 969px | 0 |
| Compare | 966px | 969px | 0 |
| Financials | 905.6px | 969px | 0 |
| Search | 905.6px | 984px | 0 |
| Data Standard | 966px | 969px | 0 |

The Compare intro uses the available shell width. The matrix help sentence now states that horizontal scrolling is conditional on insufficient display width rather than inherent to five-company comparison.

## Browser interaction QA

- Applied the five-company equipment template and confirmed compact 5/5 headers at 1024px.
- Cleared all companies in one click; URL became `?ids=` and focus returned to the company search field.
- Reloaded the empty URL and confirmed the empty state persisted.
- Re-added ASML and Applied Materials; the clear action appeared at two selected companies and the URL contained both IDs.
- Removed one company individually; the URL updated and the clear action hid at one selected company.
- Re-applied the five-company template and confirmed the all-missing summary.
- Checked all eight five-company templates at 1024px: each showed 5/5 headers without table scrolling or document overflow.
- Confirmed horizontal table scrolling and zero document overflow at 768px and 360px.
- Compared rendered rows against the public baseline: the 19 retained rows have identical labels, cells, comparison states, and notes; the only primary rows removed are the four fully missing metrics.

## Semantic protection

- `src/data/**` diff: 0
- Comparison values: unchanged
- Compatibility judgement and quality counts: unchanged
- URL parameter name, ID order, and empty-state semantics: unchanged
- Full-site visual rollout: not performed
