# v0.1 Wireframes

The v0.1 UX is organized around three primary actions:

1. understand the value chain in **Atlas**,
2. inspect one company in **Company**,
3. compare 2–4 companies in **Compare**.

The shell stays intentionally restrained: compact global navigation, dense research content, no decorative dashboard widgets that do not support a decision.

## Global shell

```text
┌─────────────────────────────────────────────────────────────────────┐
│ AI Infrastructure Atlas   Atlas  Companies  Compare  Search        │
├─────────────────────────────────────────────────────────────────────┤
│ page content                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

Desktop uses the horizontal navigation. Narrow screens wrap naturally rather than introducing a separate interaction model in v0.1.

## Home

```text
┌─────────────────────────────────────────────────────────────────────┐
│ AI INFRASTRUCTURE ATLAS                                             │
│ Semiconductor → Power → Physical AI                                 │
│ [ Search companies, products, technologies ... ]                   │
│                                                                     │
│ 20 companies       8 layers       4 comparison slots               │
├─────────────────────────────────────────────────────────────────────┤
│ VALUE CHAIN                                                         │
│ [Compute] → [Foundry] → [Memory] → [WFE] → [Test/Back-end]         │
│                     → [Network/Optical] → [DC/Facilities] → [PAI]  │
├─────────────────────────────────────────────────────────────────────┤
│ Selected company cards                                              │
└─────────────────────────────────────────────────────────────────────┘
```

Primary action: start from a layer or search.

## Atlas

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Atlas                                                               │
│ AI capex propagation from upstream silicon to physical systems      │
├─────────────────────────────────────────────────────────────────────┤
│ Compute & Silicon        [NVIDIA] [Broadcom]                        │
│ Foundry                  [TSMC] [...]                               │
│ Memory                   [SK hynix] [Micron] [Kioxia] [...]         │
│ Wafer Fab Equipment      [ASML] [TEL] [AMAT] [Lam] [KLA]           │
│ Test & Back-end          [Advantest] [DISCO]                        │
│ Network & Optical        [Arista] [Fujikura]                        │
│ Data Center & Facilities [Vertiv] [Eaton] [Equinix]                 │
│ Physical AI              [FANUC]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

v0.1 intentionally uses stable lanes. Evidence-backed relationship edges are deferred until relationship claims have document-level sources.

## Companies

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Companies                                                           │
│ [Search...................] [Layer ▼] [Country ▼]                   │
│ 12 / 20 matches                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ NVIDIA              Compute & Silicon             US                │
│ GPU / networking / AI accelerator ...                               │
│ [GPU] [CUDA] [AI accelerator]                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

Filtering is immediate and local; Pagefind is reserved for full-site search.

## Company detail

```text
┌─────────────────────────────────────────────────────────────────────┐
│ NVIDIA                                                NVDA          │
│ エヌビディア · reading                                               │
│ summary                                                             │
│ [tags ...]                                   Exchange / Country ... │
├──────────────────────────────────┬──────────────────────────────────┤
│ AI position                      │ Sensitivity map                  │
│ Products / Technologies          │ AI exposure        5/5 Positive │
│ Strengths                        │ Rate sensitivity   2/5 Mixed    │
│ Risks / Watchpoints              │ Cyclicality        ...          │
│ Universal metrics                │ Moat               ...          │
│   PER TTM        N/A             │                                  │
│   PER FY1        N/A             │ Layers                           │
│   PBR            N/A             │ Competitors / peers              │
│   ROIC           N/A             │ Official sources                 │
└──────────────────────────────────┴──────────────────────────────────┘
```

Missing finance values are always `N/A`, never `0`.

## Compare

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Compare                                                             │
│ [NVIDIA ▼] [TSMC ▼] [ASML ▼] [Vertiv ▼]                            │
├─────────────────────────────────────────────────────────────────────┤
│ Metric              NVIDIA        TSMC          ASML       Vertiv   │
│ Primary layer       ...           ...           ...        ...      │
│ AI exposure         5/5 Positive  ...           ...        ...      │
│ Rate sensitivity    2/5 Mixed     ...           ...        ...      │
│ Cyclicality         ...           ...           ...        ...      │
│ Moat                ...           ...           ...        ...      │
│ PER TTM             N/A           N/A           N/A        N/A      │
│ PER FY1             N/A           N/A           N/A        N/A      │
│ PBR                  N/A           N/A           N/A        N/A      │
│ ROIC                 N/A           N/A           N/A        N/A      │
└─────────────────────────────────────────────────────────────────────┘
```

Universal metrics share rows. Sector-specific KPIs will render in a separate block so that unlike metrics are not implicitly treated as comparable.

## Search

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Search                                                              │
│ [ HBM...................................................... ]       │
├─────────────────────────────────────────────────────────────────────┤
│ result title                                                        │
│ excerpt with matched context                                        │
│ metadata / destination                                              │
│ ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

Pagefind builds the search index after Astro has emitted static HTML.

## Methodology and Glossary

These are intentionally text-first. Methodology defines comparability, null handling, score ownership, and future data normalization. Glossary keeps technical terms such as HBM, WFE, EUV, ASIC, ROIC and CPO discoverable from full-text search.
