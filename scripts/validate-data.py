#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data'
companies = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((DATA / 'companies').glob('*.json'))]
layers = json.loads((DATA / 'layers.json').read_text(encoding='utf-8'))
sources = json.loads((DATA / 'sources.json').read_text(encoding='utf-8'))
v02_sources_path = DATA / 'sources-v02.json'
v02_sources = json.loads(v02_sources_path.read_text(encoding='utf-8')) if v02_sources_path.exists() else []
document_sources = json.loads((DATA / 'document-sources.json').read_text(encoding='utf-8'))
source_policies = json.loads((DATA / 'source-policies.json').read_text(encoding='utf-8'))
v02_policies_path = DATA / 'source-policies-v02.json'
v02_source_policies = json.loads(v02_policies_path.read_text(encoding='utf-8')) if v02_policies_path.exists() else []
document_source_policies = json.loads((DATA / 'document-source-policies.json').read_text(encoding='utf-8'))
all_sources = sources + v02_sources + document_sources
all_source_policies = source_policies + v02_source_policies + document_source_policies
metric_definitions = json.loads((DATA / 'metric-definitions.json').read_text(encoding='utf-8'))
sector_kpi_definitions = json.loads((DATA / 'sector-kpi-definitions.json').read_text(encoding='utf-8'))
sector_kpis = json.loads((DATA / 'sector-kpis.json').read_text(encoding='utf-8'))
roic_component_definitions = json.loads((DATA / 'roic-component-definitions.json').read_text(encoding='utf-8'))
roic_calculations = json.loads((DATA / 'roic-calculations.json').read_text(encoding='utf-8'))
score_definitions = json.loads((DATA / 'score-definitions.json').read_text(encoding='utf-8'))
governance = json.loads((DATA / 'governance.json').read_text(encoding='utf-8'))
valuation_policy = json.loads((DATA / 'valuation-policy.json').read_text(encoding='utf-8'))
value_chain = json.loads((DATA / 'value-chain.json').read_text(encoding='utf-8'))
filter_contract = json.loads((DATA / 'company-filter-contract.json').read_text(encoding='utf-8'))

errors = []
ids = [c['id'] for c in companies]
id_set = set(ids)
company_by_id = {c['id']: c for c in companies}
layer_set = {l['name'] for l in layers}
canonical_countries = filter_contract.get('canonicalCountries', [])
canonical_country_set = set(canonical_countries)
stage_layers = filter_contract.get('stageLayers', {})
technology_filters = filter_contract.get('technologyFilters', {})
source_ids_list = [s['id'] for s in all_sources]
source_ids = set(source_ids_list)
policy_ids = [p['sourceId'] for p in all_source_policies]
metric_definition_ids = {m['id'] for m in metric_definitions}
sector_kpi_definition_ids = {m['id'] for m in sector_kpi_definitions}
roic_component_definition_ids = {m['id'] for m in roic_component_definitions}
score_definition_ids = {s['id'] for s in score_definitions}
roic_calculation_ids = [r['id'] for r in roic_calculations]
roic_calculation_by_id = {r['id']: r for r in roic_calculations}

if len(companies) < 20:
    errors.append(f'Company registry regressed below v0.1 baseline: {len(companies)}')
if len(id_set) != len(ids):
    errors.append('Duplicate company id detected')
if len(source_ids_list) != len(source_ids):
    errors.append('Duplicate source id detected across source registries')
if len(roic_calculation_ids) != len(set(roic_calculation_ids)):
    errors.append('Duplicate ROIC calculation id detected')
if len(governance) != 9 or [r.get('id') for r in governance] != list(range(1, 10)):
    errors.append('Project constitution mirror must contain exactly Articles 1-9')
if len(policy_ids) != len(set(policy_ids)):
    errors.append('Duplicate source policy record detected')
if set(policy_ids) != source_ids:
    missing = sorted(source_ids - set(policy_ids))
    orphan = sorted(set(policy_ids) - source_ids)
    if missing:
        errors.append(f'Sources missing policy records: {missing}')
    if orphan:
        errors.append(f'Orphan source policy records: {orphan}')

if canonical_countries != sorted(canonical_countries):
    errors.append('Canonical country names must be sorted')
if len(canonical_country_set) != len(canonical_countries):
    errors.append('Duplicate canonical country name detected')
country_values = [company['country'] for company in companies]
if set(country_values) != canonical_country_set:
    missing = sorted(canonical_country_set - set(country_values))
    unknown = sorted(set(country_values) - canonical_country_set)
    if missing:
        errors.append(f'Canonical countries without companies: {missing}')
    if unknown:
        errors.append(f'Non-canonical company country values: {unknown}')
casefolded_countries = {}
for country in canonical_countries:
    casefolded_countries.setdefault(country.casefold(), []).append(country)
for variants in casefolded_countries.values():
    if len(variants) > 1:
        errors.append(f'Case-insensitive duplicate canonical countries: {variants}')

stage_ids = [stage['id'] for stage in value_chain]
if len(stage_ids) != len(set(stage_ids)):
    errors.append('Duplicate value-chain stage id detected')
filter_stage_ids = set(stage_ids) - {'demand'}
if set(stage_layers) != filter_stage_ids:
    errors.append(
        f'Company stage filter contract mismatch: expected={sorted(filter_stage_ids)} '
        f'actual={sorted(stage_layers)}'
    )
for stage_id, mapped_layers in stage_layers.items():
    unknown_layers = sorted(set(mapped_layers) - layer_set)
    if unknown_layers:
        errors.append(f'{stage_id}: stage filter references unknown layers {unknown_layers}')
    if not any(set(company['layers']) & set(mapped_layers) for company in companies):
        errors.append(f'{stage_id}: stage filter matches no companies')

company_tags = {tag for company in companies for tag in company['tags']}
for technology_id, technology_filter in technology_filters.items():
    filter_tags = technology_filter.get('tags', [])
    if not technology_filter.get('label') or not filter_tags:
        errors.append(f'{technology_id}: incomplete technology filter contract')
    unknown_tags = sorted(set(filter_tags) - company_tags)
    if unknown_tags:
        errors.append(f'{technology_id}: technology filter references unknown tags {unknown_tags}')
    if not any(set(company['tags']) & set(filter_tags) for company in companies):
        errors.append(f'{technology_id}: technology filter matches no companies')
for stage in value_chain:
    for link in stage.get('links', []):
        has_tag = bool(link.get('tag'))
        has_query = bool(link.get('query'))
        has_technology = bool(link.get('technology'))
        if sum((has_tag, has_query, has_technology)) != 1:
            errors.append(f"{stage['id']}/{link.get('label')}: value-chain link must define exactly one of tag/query/technology")
        elif has_tag and link['tag'] not in company_tags:
            errors.append(
                f"{stage['id']}/{link.get('label')}: value-chain tag filter matches no company tag: {link['tag']}"
            )
        elif has_technology and link['technology'] not in technology_filters:
            errors.append(
                f"{stage['id']}/{link.get('label')}: unknown technology filter: {link['technology']}"
            )

for gate in ('marketPrice', 'forwardConsensus', 'roic'):
    if gate not in valuation_policy:
        errors.append(f'valuation-policy missing gate: {gate}')
    elif 'allowedPublication' not in valuation_policy[gate] or 'rule' not in valuation_policy[gate]:
        errors.append(f'valuation-policy incomplete gate: {gate}')

allowed_policy_states = {'pending', 'reviewed', 'blocked'}
allowed_terms_states = {'unknown', 'allowed', 'restricted', 'prohibited', 'not-applicable'}
for p in all_source_policies:
    if p.get('reviewStatus') not in allowed_policy_states:
        errors.append(f"{p.get('sourceId')}: invalid policy reviewStatus")
    for key in ('automatedRetrieval', 'redistribution', 'commercialUse', 'attributionRequirement'):
        if p.get(key) not in allowed_terms_states:
            errors.append(f"{p.get('sourceId')}: invalid {key} state")
    if p.get('reviewStatus') != 'reviewed' and p.get('internalPolicy') != 'manual-reference-only-until-reviewed':
        errors.append(f"{p.get('sourceId')}: unreviewed source must remain manual-reference-only")

for company in companies:
    cid = company['id']
    if company['country'] not in canonical_country_set:
        errors.append(f"{cid}: non-canonical country {company['country']}")
    if company['primaryLayer'] not in layer_set:
        errors.append(f'{cid}: unknown primary layer')
    for layer in company['layers']:
        if layer not in layer_set:
            errors.append(f'{cid}: unknown layer {layer}')
    for source_id in company.get('sourceIds', []):
        if source_id not in source_ids:
            errors.append(f'{cid}: missing source reference {source_id}')
    for competitor in company['competitors']:
        if competitor not in id_set:
            errors.append(f'{cid}: missing competitor reference {competitor}')
    for score_name, score in company.get('scores', {}).items():
        required = {'value', 'direction', 'confidence', 'status', 'rationale', 'definitionId', 'asOf', 'assessmentSource', 'evidenceSourceIds'}
        if set(score) != required:
            errors.append(f'{cid}: {score_name} score keys differ from constitution policy')
            continue
        if not 0 <= score['value'] <= 5:
            errors.append(f'{cid}: {score_name} out of 0-5 range')
        if score['definitionId'] != score_name or score['definitionId'] not in score_definition_ids:
            errors.append(f'{cid}: {score_name} missing/incorrect score definition')
        if not score['asOf'] or not score['assessmentSource']:
            errors.append(f'{cid}: {score_name} lacks assessment source/asOf')
        for source_id in score.get('evidenceSourceIds', []):
            if source_id not in source_ids:
                errors.append(f'{cid}: {score_name} missing evidence source {source_id}')
    for metric_name, metric in company['metrics'].items():
        required = {'value', 'unit', 'basis', 'definitionId', 'asOf', 'period', 'sourceId'}
        allowed = required | {'calculationId'}
        if not required.issubset(metric) or set(metric) - allowed:
            errors.append(f'{cid}: {metric_name} metric keys differ from constitution policy')
            continue
        if metric['definitionId'] != metric_name or metric['definitionId'] not in metric_definition_ids:
            errors.append(f'{cid}: {metric_name} missing/incorrect metric definition')
        if metric['value'] is not None:
            source_id = metric.get('sourceId')
            calculation_id = metric.get('calculationId')
            if source_id:
                if source_id not in source_ids:
                    errors.append(f'{cid}: {metric_name} references unknown sourceId {source_id}')
            elif calculation_id:
                calculation = roic_calculation_by_id.get(calculation_id)
                if not calculation:
                    errors.append(f'{cid}: {metric_name} references unknown calculationId {calculation_id}')
                elif calculation.get('companyId') != cid:
                    errors.append(f'{cid}: {metric_name} calculation belongs to another company')
            else:
                errors.append(f'{cid}: {metric_name} has value but no sourceId or calculationId')
            if not metric['asOf']:
                errors.append(f'{cid}: {metric_name} has value but no asOf')
            if not metric['definitionId']:
                errors.append(f'{cid}: {metric_name} has value but no definitionId')

    if not valuation_policy.get('marketPrice', {}).get('allowedPublication', False):
        for locked_metric in ('peTTM', 'pb'):
            if company['metrics'][locked_metric]['value'] is not None:
                errors.append(f'{cid}: {locked_metric} published while market-price gate is closed')
    if not valuation_policy.get('forwardConsensus', {}).get('allowedPublication', False):
        if company['metrics']['peFY1']['value'] is not None:
            errors.append(f'{cid}: peFY1 published while forward-consensus gate is closed')

kpi_ids = [k['id'] for k in sector_kpis]
if len(kpi_ids) != len(set(kpi_ids)):
    errors.append('Duplicate sector KPI id detected')
for kpi in sector_kpis:
    kid = kpi.get('id', '<missing>')
    required = {'id', 'companyId', 'definitionId', 'value', 'unit', 'basis', 'asOf', 'period', 'sourceId', 'status'}
    if set(kpi) != required:
        errors.append(f'{kid}: sector KPI keys differ from constitution policy')
        continue
    if kpi['companyId'] not in id_set:
        errors.append(f'{kid}: unknown companyId {kpi["companyId"]}')
    if kpi['definitionId'] not in sector_kpi_definition_ids:
        errors.append(f'{kid}: unknown sector KPI definition {kpi["definitionId"]}')
    if kpi['sourceId'] not in source_ids:
        errors.append(f'{kid}: unknown sourceId {kpi["sourceId"]}')
    if not kpi['asOf'] or not kpi['period'] or not kpi['basis']:
        errors.append(f'{kid}: missing provenance metadata')
    if kpi['status'] != 'verified':
        errors.append(f'{kid}: published sector KPI must be verified')

roic_value_required = {'value', 'unit', 'definitionId', 'asOf', 'period', 'basis', 'sourceIds'}
for calc in roic_calculations:
    calc_id = calc.get('id', '<missing>')
    cid = calc.get('companyId')
    if cid not in id_set:
        errors.append(f'{calc_id}: unknown companyId {cid}')
    if calc.get('status') != 'verified':
        errors.append(f'{calc_id}: ROIC calculation must be verified before publication')
    for group_name in ('inputs', 'outputs'):
        group = calc.get(group_name, {})
        if not group:
            errors.append(f'{calc_id}: missing {group_name}')
            continue
        for component_name, component in group.items():
            if set(component) != roic_value_required:
                errors.append(f'{calc_id}: {group_name}.{component_name} provenance keys invalid')
                continue
            if component.get('definitionId') not in roic_component_definition_ids:
                errors.append(f'{calc_id}: {group_name}.{component_name} has unknown definitionId')
            if not isinstance(component.get('value'), (int, float)):
                errors.append(f'{calc_id}: {group_name}.{component_name} value is not numeric')
            if not component.get('asOf') or not component.get('period') or not component.get('basis'):
                errors.append(f'{calc_id}: {group_name}.{component_name} missing provenance metadata')
            if not component.get('sourceIds'):
                errors.append(f'{calc_id}: {group_name}.{component_name} has no sourceIds')
            for source_id in component.get('sourceIds', []):
                if source_id not in source_ids:
                    errors.append(f'{calc_id}: {group_name}.{component_name} unknown sourceId {source_id}')

    try:
        i = calc['inputs']
        o = calc['outputs']
        tax_rate = i['incomeTaxExpense']['value'] / i['pretaxIncome']['value']
        nopat = i['operatingProfit']['value'] * (1 - tax_rate)
        begin_ic = (
            i['beginningShareholdersEquity']['value']
            + i['beginningInterestBearingDebt']['value']
            + i['beginningOperatingLeaseLiability']['value']
            - i['beginningCashAndMarketableSecurities']['value']
        )
        end_ic = (
            i['endingShareholdersEquity']['value']
            + i['endingInterestBearingDebt']['value']
            + i['endingOperatingLeaseLiability']['value']
            - i['endingCashAndMarketableSecurities']['value']
        )
        avg_ic = (begin_ic + end_ic) / 2
        roic = nopat / avg_ic * 100
        checks = [
            ('effectiveTaxRate', tax_rate * 100, 0.02),
            ('nopat', nopat, 0.2),
            ('beginningInvestedCapital', begin_ic, 0.1),
            ('endingInvestedCapital', end_ic, 0.1),
            ('averageInvestedCapital', avg_ic, 0.1),
            ('roic', roic, 0.02),
        ]
        for output_name, expected, tolerance in checks:
            actual = o[output_name]['value']
            if abs(actual - expected) > tolerance:
                errors.append(f'{calc_id}: {output_name} stored={actual} recomputed={expected:.4f}')
        company_metric = company_by_id[cid]['metrics']['roic']
        if company_metric.get('calculationId') == calc_id:
            if company_metric['value'] is None or abs(company_metric['value'] - o['roic']['value']) > 0.01:
                errors.append(f'{calc_id}: company ROIC metric does not match calculation output')
    except (KeyError, TypeError, ZeroDivisionError) as exc:
        errors.append(f'{calc_id}: ROIC recomputation failed: {exc}')

if errors:
    print('Validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

pending = sum(1 for p in all_source_policies if p['reviewStatus'] == 'pending')
verified_metrics = sum(1 for c in companies for m in c['metrics'].values() if m['value'] is not None)
print(
    f'Validation OK: {len(companies)} companies / {len(layers)} layers / '
    f'{len(canonical_countries)} canonical countries / {len(stage_layers)} stage filters / '
    f'{len(technology_filters)} technology filters / '
    f'{len(all_sources)} sources / {len(all_source_policies)} source policies ({pending} pending) / '
    f'{verified_metrics} populated common metrics / {len(sector_kpis)} verified sector KPIs / '
    f'{len(roic_calculations)} verified ROIC calculations / '
    f'{len(metric_definitions)} common metric definitions / {len(sector_kpi_definitions)} sector KPI definitions / '
    f'valuation gates enforced / 9 constitutional articles'
)
