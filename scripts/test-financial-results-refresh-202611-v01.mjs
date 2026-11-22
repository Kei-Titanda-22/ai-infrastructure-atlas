import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate, loadFinancialModule, recordDigest} from './generate-financial-results-refresh-202611-v01.mjs';
import {resolveCompareFinancialTablePresentation} from '../src/lib/company-compare-display.ts';
import {latestNormalizedFinancialRecord} from '../src/lib/financial-comparison-contract.ts';

const read = async path => JSON.parse(await readFile(new URL('../'+path, import.meta.url), 'utf8'));
const batch=await read('src/data/financial-history-v05-batch23.json');
const sources=await read('src/data/document-sources-v05-batch23.json');
const policies=await read('src/data/document-source-policies-v05-batch23.json');
const audit=await read('src/data/financial-results-refresh-202611-v01.json');
const loader=await loadFinancialModule();
// Adopted primary-table values, independently reviewable without generated HTML.
const adopted = [
  [
    "advantest",
    "FY2026 Q2",
    477727,
    266819
  ],
  [
    "amd",
    "Q3 2026",
    13377,
    2832
  ],
  [
    "amkor",
    "Q3 2026",
    1991,
    225
  ],
  [
    "amphenol",
    "Q3 2026",
    10229.7,
    3020.8
  ],
  [
    "applied-materials",
    "FY2026",
    34446,
    11087
  ],
  [
    "applied-materials",
    "Q4 FY2026",
    10409,
    3658
  ],
  [
    "arista",
    "Q3 2026",
    3657.6,
    1642.4
  ],
  [
    "arm",
    "FY2027 Q2",
    1443,
    201
  ],
  [
    "ase-technology",
    "Q3 2026",
    244161,
    33142
  ],
  [
    "asm-international",
    "Q3 2026",
    1159.4,
    378.9
  ],
  [
    "asmpt",
    "Q3 2026",
    5247.045,
    798.571
  ],
  [
    "besi",
    "Q3 2026",
    283.4,
    129.679
  ],
  [
    "cadence",
    "Q3 2026",
    1633.311,
    428.716
  ],
  [
    "canon",
    "Q3 2026",
    1158815,
    97089
  ],
  [
    "carrier",
    "Q3 2026",
    6263,
    -2273
  ],
  [
    "cisco",
    "Q1 FY2027",
    18517,
    5598
  ],
  [
    "coherent",
    "Q1 FY2027",
    2370.3,
    377.9
  ],
  [
    "corning",
    "Q3 2026",
    4855,
    911
  ],
  [
    "denso",
    "FY2027 Q2",
    1929600,
    85900
  ],
  [
    "digital-realty",
    "Q3 2026",
    1902.418,
    302.131
  ],
  [
    "disco",
    "FY2026 Q2",
    142750,
    67606
  ],
  [
    "eaton",
    "Q3 2026",
    8947,
    1589
  ],
  [
    "entegris",
    "Q3 2026",
    1005.7,
    230.6
  ],
  [
    "equinix",
    "Q3 2026",
    2571,
    600
  ],
  [
    "fanuc",
    "FY2026 Q2",
    242673,
    63170
  ],
  [
    "fujikura",
    "FY2026 Q2",
    465424,
    130185
  ],
  [
    "furukawa-electric",
    "FY2026 Q2",
    372470,
    32161
  ],
  [
    "ge-vernova",
    "Q3 2026",
    12642,
    1394
  ],
  [
    "globalfoundries",
    "Q3 2026",
    1899,
    230
  ],
  [
    "globalwafers",
    "Q3 2026",
    14871,
    1454
  ],
  [
    "ibiden",
    "FY2026 Q2",
    139327,
    33236
  ],
  [
    "infineon",
    "FY2026",
    16353,
    2214
  ],
  [
    "infineon",
    "FY2026 Q4",
    4706,
    775
  ],
  [
    "intel",
    "Q3 2026",
    16513,
    2522
  ],
  [
    "johnson-controls",
    "FY2026",
    25666,
    3694
  ],
  [
    "johnson-controls",
    "FY2026 Q4",
    7113,
    1137
  ],
  [
    "keyence",
    "FY2026 Q2",
    388778,
    221187
  ],
  [
    "kla",
    "Q1 FY2027",
    4136.015,
    1861.67
  ],
  [
    "kokusai-electric",
    "FY2027 Q2",
    88629,
    20888
  ],
  [
    "lam-research",
    "September 2026 quarter",
    8219.418,
    3283.727
  ],
  [
    "lasertec",
    "FY2027 Q1",
    40369,
    15769
  ],
  [
    "legrand",
    "Q3 2026",
    2929.1,
    564.5
  ],
  [
    "linde",
    "Q3 2026",
    9404,
    2150
  ],
  [
    "lumentum",
    "Q1 FY2027",
    1262.6,
    359.8
  ],
  [
    "mediatek",
    "Q3 2026",
    168057.788,
    27102.213
  ],
  [
    "mitsubishi-electric",
    "FY2027 Q2",
    1628038,
    218611
  ],
  [
    "mobileye",
    "Q3 2026",
    492,
    -82
  ],
  [
    "monolithic-power",
    "Q3 2026",
    1202.409,
    357.687
  ],
  [
    "nan-ya-pcb",
    "Q3 2026",
    16378.267,
    4322.646
  ],
  [
    "nikon",
    "FY2027 Q2",
    170476,
    9901
  ],
  [
    "nvent",
    "Q3 2026",
    1515,
    282
  ],
  [
    "nvidia",
    "Q3 FY2027",
    115844,
    77520
  ],
  [
    "nxp",
    "Q3 2026",
    3786,
    1228
  ],
  [
    "omron",
    "FY2025 Q2",
    179321,
    10450
  ],
  [
    "onsemi",
    "Q3 2026",
    1722.3,
    378.3
  ],
  [
    "qualcomm",
    "FY2026",
    43120,
    8658
  ],
  [
    "qualcomm",
    "Q4 FY2026",
    10322,
    1356
  ],
  [
    "renesas",
    "Q3 2026",
    435900,
    565300
  ],
  [
    "rohm",
    "FY2027 Q2",
    143744,
    7852
  ],
  [
    "samsung-electronics",
    "Q3 2026",
    195.3,
    107.4
  ],
  [
    "sandisk",
    "Q1 FY2027",
    11031,
    8780
  ],
  [
    "screen-holdings",
    "FY2027 Q2",
    186678,
    40155
  ],
  [
    "seagate",
    "Q1 FY2027",
    4233,
    2064
  ],
  [
    "shin-etsu-chemical",
    "FY2026 Q2",
    758260,
    212120
  ],
  [
    "siemens-energy",
    "FY2026",
    44243,
    5211
  ],
  [
    "siemens-energy",
    "FY2026 Q4",
    12826,
    1671
  ],
  [
    "sk-hynix",
    "Q3 2026",
    104.6155,
    83.3338
  ],
  [
    "smc",
    "FY2026 Q2",
    282649,
    83959
  ],
  [
    "smic",
    "Q3 2026",
    3190.038,
    710.063
  ],
  [
    "stmicroelectronics",
    "Q3 2026",
    3757,
    367
  ],
  [
    "sumco",
    "Q3 2026",
    117508,
    1966
  ],
  [
    "sumitomo-electric",
    "FY2026 Q2",
    1434.321,
    122.508
  ],
  [
    "te-connectivity",
    "FY2026",
    19885,
    3991
  ],
  [
    "te-connectivity",
    "Q4 FY2026",
    5312,
    1093
  ],
  [
    "tesla",
    "Q3 2026",
    28046,
    718
  ],
  [
    "texas-instruments",
    "Q3 2026",
    6055,
    2874
  ],
  [
    "tokyo-electron",
    "FY2027 Q2",
    935067,
    295369
  ],
  [
    "tower-semiconductor",
    "Q3 2026",
    526.161,
    127.135
  ],
  [
    "trane-technologies",
    "Q3 2026",
    6759.7,
    1343.1
  ],
  [
    "umc",
    "Q3 2026",
    74239,
    18643
  ],
  [
    "vertiv",
    "Q3 2026",
    4312.8,
    983.8
  ],
  [
    "western-digital",
    "Q1 FY2027",
    4381,
    2046
  ]
];
assert.deepEqual(batch.map(r=>[r.companyId,r.periodLabel,r.metrics.revenue.value,r.metrics.operatingProfit.value]),adopted);
assert.deepEqual(loader.financialCoverage(),{companies:100,periods:797,quarterly:661,annual:136,verifiedMetrics:2748});
assert.equal(new Set(loader.financialHistory.map(r=>r.id)).size,797);
const addedIds=new Set(batch.map(r=>r.id));
assert.equal(recordDigest(loader.financialHistory.filter(r=>!addedIds.has(r.id))),audit.baselineLoadedRecordDigest,'all original 715 records are byte-field equivalent after loading');
assert.equal(sources.length,76); assert.equal(policies.length,76);
assert.deepEqual(new Set(sources.map(s=>s.id)),new Set(policies.map(p=>p.sourceId)));
for(const record of batch){
 const source=sources.find(s=>s.id===record.sourceId);
 assert.equal(source.companyId,record.companyId);
 assert.ok(source.publishedAt && source.publishedAt<='2026-11-23');
 assert.equal(record.verifiedAt,'2026-11-23');
 assert.ok(record.startDate<record.endDate);
 assert.equal(record.metrics.operatingMargin.value,Math.round(record.metrics.operatingProfit.value/record.metrics.revenue.value*1000)/10);
 for(const id of ['freeCashFlow','capex']) {assert.equal(record.metrics[id].value,null);assert.equal(record.metrics[id].status,'not-collected');}
}
for(const policy of policies){assert.equal(policy.reviewStatus,'pending');assert.equal(policy.automatedRetrieval,'unknown');assert.equal(policy.internalPolicy,'manual-reference-only-until-reviewed');}
for(const row of audit.companies){
 const history=loader.getFinancialHistory(row.companyId);
 resolveCompareFinancialTablePresentation(history);
 const quarters=history.filter(r=>r.periodType==='quarterly');
 const six=quarters.slice(-6);
 assert.ok(six.length<=6);
 assert.ok(six.every(r=>r.periodType==='quarterly'));
 for(let i=1;i<six.length;i++)assert.ok((Date.parse(six[i].endDate)-Date.parse(six[i-1].endDate))/86400000<=100 && six[i].endDate>six[i-1].endDate,row.companyId+': continuous latest quarter window');
 if(row.latestPublishedPeriodCaptured && row.latestDisclosure?.endDate)assert.equal(loader.getLatestFinancialRecord(row.companyId).endDate,row.latestDisclosure.endDate);
 if(!row.candidates.length)assert.equal(history.filter(r=>addedIds.has(r.id)).length,0);
}
const current = id=>batch.find(r=>r.companyId===id&&r.periodType==='quarterly');
for(const [id,rev,op] of [
 ['advantest',845200-367473,456809-189990],['disco',257058-114308,116639-49033],
 ['rohm',279483-135739,17487-9635],['screen-holdings',308453-121775,54523-14368],
 ['tokyo-electron',1667455-732388,506776-211407],['furukawa-electric',737691-365221,57618-25457],
 ['ibiden',262546-123219,60116-26880],['nikon',334658-164182,8904-(-997)],
 ['smc',553636-270987,157945-73986],['fujikura',867433-402009,235013-104828],
 ['kokusai-electric',164043-75414,36814-15926],['sumitomo-electric',(2764912-1330591)/1000,(219567-97059)/1000],
 ['shin-etsu-chemical',1420684-662424,385918-173798],['keyence',735400-346622,408263-187076],
 ['fanuc',473708-231035,116662-53492],['mitsubishi-electric',3125147-1497109,358112-139501],
 ['sumco',332524-215016,-4397-(-6363)],['denso',Math.round((3843.5-1913.9)*1000),Math.round((170.1-84.2)*1000)],
 ['omron',345847-166526,16265-5815],['legrand',Math.round((8329.4-5400.3)*10)/10,1595-1030.5],
 ['kla',4136.015,Math.round((4136015-1577791-395096-301458))/1000],
 ['eaton',8947,8947-5842-1278-238],['johnson-controls',7113,2705-1481-87],
]){assert.equal(current(id).metrics.revenue.value,rev,id+': reproduced revenue');assert.equal(current(id).metrics.operatingProfit.value,op,id+': reproduced operating income');}
const omron=loader.getFinancialHistory('omron');
assert.equal(omron.length,4);assert.equal(omron.filter(r=>r.periodType==='quarterly').length,2);
assert.equal(loader.getLatestFinancialRecord('omron').periodType,'annual','older historical quarter never forces latest selection away from annual');
assert.ok(omron.every(r=>r.accountingBasis==='US GAAP'));
assert.equal(current('carrier').metrics.operatingProfit.value,-2273);
assert.equal(current('mobileye').metrics.operatingProfit.value,-82);
const annualRoundingResiduals={
 'applied-materials':[0,0], 'te-connectivity':[0,0], 'johnson-controls':[0,0],
 qualcomm:[0,1], infineon:[1,-1], 'siemens-energy':[1,1],
};
for(const annual of batch.filter(record=>record.periodType==='annual')){
 const quarters=loader.getFinancialHistory(annual.companyId,'quarterly').filter(record=>record.endDate>=annual.startDate && record.endDate<=annual.endDate);
 assert.equal(quarters.length,4,annual.companyId+': four same fiscal-year quarters');
 assert.ok(quarters.every(record=>record.currency===annual.currency && record.unit===annual.unit));
 const residuals=['revenue','operatingProfit'].map(metric=>Math.round((annual.metrics[metric].value-quarters.reduce((sum,record)=>sum+record.metrics[metric].value,0))*1000)/1000);
 assert.deepEqual(residuals,annualRoundingResiduals[annual.companyId],annual.companyId+': exact annual reconciliation or explicitly documented original rounding residual');
}
assert.equal(audit.companies.find(row=>row.companyId==='kinsus').latestDisclosure.publishedAt,null,'board approval is not silently labeled the publication date');
assert.equal(audit.companies.find(row=>row.companyId==='kinsus').latestDisclosure.boardApprovedAt,'2026-10-14');
assert.ok(audit.companies.find(row=>row.companyId==='nan-ya-pcb').source.publishedAtBasis.includes('not independently verified'));
assert.equal(loader.getFinancialHistory('aptiv').find(r=>r.periodLabel==='Q3 2025').metrics.operatingProfit.value,-175);
assert.equal(loader.getFinancialHistory('hexagon').find(r=>r.periodLabel==='Q3 2025').metrics.operatingProfit.value,-12.9);
const generated=await generate();
for(const [path,text] of generated.outputs)assert.equal(await readFile(new URL('../'+path,import.meta.url),'utf8'),text,path+': official generator freshness');
assert.deepEqual([generated.result.counts.completeSixQuarters,generated.result.counts.partialQuarterly,generated.result.counts.awaiting,generated.result.counts.needsReview],[95,1,0,4]);
if(process.argv.includes('--dist')){
 const html=await readFile(new URL('../dist/financials/index.html',import.meta.url),'utf8');
 const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
 for(const row of audit.companies){
  const history=loader.getFinancialHistory(row.companyId);
  const quarters=history.filter(r=>r.periodType==='quarterly');
  const current=quarters.length?quarters.slice(-6):history.filter(r=>r.periodType==='annual');
  const section=html.match(new RegExp(`<section class="financial-company" data-financial-company="${row.companyId}"[\\s\\S]*?<\\/section>`))?.[0];
  assert.ok(section,row.companyId+': financials section');
  const detail=await readFile(new URL(`../dist/companies/${row.companyId}/index.html`,import.meta.url),'utf8');
  const detailSection=detail.match(/<section class="company-section" id="financials">[\s\S]*?<\/section>/)?.[0];
  assert.ok(detailSection,row.companyId+': detail financial section');
  if(history.length){
   const latest=latestNormalizedFinancialRecord(row.companyId,loader.financialHistory);
   const currentSummary=decode(detailSection.match(/<p class="section-intro" data-current-financial-result>[\s\S]*?<\/p>/)?.[0]??'');
   assert.ok(currentSummary.includes(latest.periodLabel),row.companyId+': detail latest selection matches Compare contract');
   for(const metric of ['revenue','operatingProfit','operatingMargin'])assert.ok(currentSummary.includes(loader.formatFinancialMetric(latest,metric)),row.companyId+': detail current '+metric);
  }
  for(const [context,rendered] of [['financials',section],['detail',detailSection]]){
   const trends=[...rendered.matchAll(/data-financial-trend data-series="([^"]+)" data-metric-id="([^"]+)"/g)];
   for(const [metricIndex,metric] of ['revenue','operatingMargin'].entries()){
    if(!quarters.length){
     assert.equal(trends.length,0,row.companyId+': no quarterly trend for annual-only history');
     const annualFigures=[...rendered.matchAll(/<figure class="financial-chart financial-chart--annual">[\s\S]*?<\/figure>/g)];
     const figure=annualFigures[metricIndex]?.[0]??'';
     assert.deepEqual([...figure.matchAll(/<span class="financial-annual-period">([^<]+)<\/span>/g)].map(m=>decode(m[1])),current.map(r=>r.periodLabel),row.companyId+': annual periods');
     assert.deepEqual([...figure.matchAll(/class="financial-annual-value" title="([^"]+)"/g)].map(m=>decode(m[1])),current.map(record=>loader.formatFinancialMetric(record,metric)+(metric==='operatingMargin'?'':`（${loader.unitLabel(record)}）`)),row.companyId+': annual values');
     continue;
    }
    const points=JSON.parse(decode(trends.find(m=>m[2]===metric)?.[1]??'null'));
    assert.ok(points,row.companyId+': '+metric);
    assert.deepEqual(points.map(p=>[p.period,p.endDate,p.value]),current.map(r=>[r.periodLabel,r.endDate,r.metrics[metric].value]),row.companyId+': '+context+' latest series, count and values');
   }
   if(context==='detail') continue; // Detail has latest graphs and dated KPI snapshots; full history tables belong to Financials and Compare.
   const tbody=rendered.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0]??'';
   assert.equal((tbody.match(/<tr>/g)??[]).length,history.length,row.companyId+': '+context+' all history retained');
   const rows=[...tbody.matchAll(/<tr>[\s\S]*?<\/tr>/g)].map(m=>decode(m[0]));
   for(const record of history){
    const link=record.sourceId.startsWith(row.companyId+'-financial-results-refresh')?sources.find(s=>s.id===record.sourceId):null;
    const found=rows.find(r=>r.includes(record.periodLabel));
    assert.ok(found,row.companyId+': retained '+record.periodLabel);
    if(link)assert.ok(found.includes(link.url),record.id+': matching row official URL');
   }
  }
 }
 console.log('Generated HTML: all 100 companies, both graph series, all 797 table rows and new source links PASS (machine check, not browser QA)');
}
console.log('Results refresh: 100 loader histories, 82 primary-table values, derivations, old records, partial/recency separation PASS');
