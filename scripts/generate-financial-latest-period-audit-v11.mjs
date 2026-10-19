import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = join(root, 'src', 'data');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const auditAsOfJst = '2026-10-18T02:22:42+09:00';
const checkedAt = '2026-10-18';

// Only entries with a directly inspected primary publication are called current.
// A pre-existing source URL or coverage checkedAt is not proof of the latest release.
const reviewed = new Map([
  ['nvidia', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 FY2027', latestOfficialEndDate: '2026-07-26', publishedAt: '2026-08-26',
    sourceUrl: 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/',
    supportingUrl: 'https://investor.nvidia.com/files/content_files/TRANSCRIPT_-NVIDIA-Corp-NVDA-US-Q2-2027-Earnings-Call-26-August-2026-5_00-PM-ET.pdf',
    reason: '公式Q2実績とIR決算説明会のQ3発表予定11月17日を照合。Q3は基準日時に未公表。',
  }],
  ['amd', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-08-04',
    sourceUrl: 'https://ir.amd.com/financial-information/sec-filings/content/0000002488-26-000121/q22026991.htm',
    supportingUrl: 'https://ir.amd.com/news-events/press-releases/detail/1300/amd-to-report-fiscal-third-quarter-2026-financial-results',
    reason: '公式Q2連結実績とQ3発表予定11月3日を照合。Q3予想は実績として収録しない。',
  }],
  ['applied-materials', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-07-26', publishedAt: '2026-08-13',
    sourceUrl: 'https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-third-quarter-2026-results',
    supportingUrl: 'https://ir.appliedmaterials.com/events/',
    reason: '公式Q3連結実績とIR暦上のQ4公表見込み11月12日を照合。Q4は基準日時に未公表。',
  }],
  ['intel', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-07-23',
    sourceUrl: 'https://www.intc.com/news-events/press-releases/detail/1776/intel-reports-second-quarter-2026-financial-results',
    supportingUrl: 'https://www.intc.com/news-events/press-releases/detail/1782/intel-to-report-third-quarter-2026-financial-results',
    reason: '公式Q2連結実績とQ3発表予定10月29日を照合。Q3は基準日時に未公表。',
  }],
  ['broadcom', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-08-02', publishedAt: '2026-09-02',
    sourceUrl: 'https://investors.broadcom.com/news-releases/news-release-details/broadcom-inc-announces-third-quarter-fiscal-year-2026-financial',
    reason: '公式Q3連結GAAP実績を照合。次期Q4の資料は見通しのみ。',
  }],
  ['marvell', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 FY2027', latestOfficialEndDate: '2026-08-01', publishedAt: '2026-08-27',
    sourceUrl: 'https://investor.marvell.com/sec-filings/all-sec-filings/content/0001835632-26-000022/q227_8kx812026ex-991.htm',
    reason: '公式8-K添付のQ2連結GAAP実績を照合。Q3は見通しのみ。',
  }],
  ['qualcomm', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-06-28', publishedAt: '2026-07-29',
    sourceUrl: 'https://investor.qualcomm.com/financial-info-sec-filings/historical-financial-results/default.aspx',
    reason: '公式IRの2026年度履歴にQ3実績まで掲載。Q4実績は基準日時に未掲載。',
  }],
  ['advantest', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.advantest.com/en/investors/ir-library/result/',
    supportingUrl: 'https://www.advantest.com/en/investors/ir-calendar/',
    reason: '公式IRのQ1連結実績とQ2発表予定10月28日を照合。期末の速報・予想値を実績として扱わない。',
  }],
  ['disco', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-23',
    sourceUrl: 'https://www.disco.co.jp/eg/ir/library/doc/fr/fr20260723.pdf',
    supportingUrl: 'https://www-hq.disco.co.jp/js/oss/pdfjs-6.2.108-dist/web/viewer.html?file=%2Feg%2Fir%2Flibrary%2Fdoc%2Fnews%2F202610061_Preliminary_Report_on_Non-Consolidated_Sales_Figures_and_Shipment_Figures_%28Second_Quarter_of_Fiscal_Year_2026%29.pdf',
    reason: '公式Q1連結実績を照合。10月6日のQ2速報は非連結売上・出荷だけで、連結営業利益を含む正式Q2決算は10月22日予定。',
  }],
  ['screen-holdings', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.screen.co.jp/en/ir/library',
    supportingUrl: 'https://www.screen.co.jp/en/ir',
    reason: '公式IR libraryのQ1財務報告とQ2発表予定10月30日を照合。Q2は基準日時に未公表。',
  }],
  ['air-liquide', {
    status: 'non-quarterly-disclosure', latestOfficialPeriod: 'H1 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-28',
    sourceUrl: 'https://www.airliquide.com/investors/first-half-2026-results',
    supportingUrl: 'https://www.airliquide.com/investors/events-calendar',
    reason: '公式の営業利益を含む実績は半期報告。次のQ3公表予定10月29日はRevenueで、四半期ごとの営業利益6件を構成できない。',
  }],
  ['bosch', {
    status: 'non-quarterly-disclosure', latestOfficialPeriod: 'H1 2026', latestOfficialEndDate: '2026-06-30',
    sourceUrl: 'https://www.bosch.com/company/investor-relations/',
    reason: '公式IRには2026上期財務報告と年次報告が掲載。今回確認した資料系列に単独四半期の連結売上・営業利益はないため年次値を分割しない。',
  }],
  ['micron', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-09-03', publishedAt: '2026-09-30',
    sourceUrl: 'https://investors.micron.com/news/press-release/2026/Micron-Technology-Inc--Reports-Record-Fiscal-Fourth-Quarter-and-Full-Year-2026-Results/default.aspx',
    reason: '会社公表の連結GAAP単独四半期売上・営業利益を収録。FY2027 Q1は予想であり未収録。',
  }],
  ['credo', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q1 FY2027', latestOfficialEndDate: '2026-08-01', publishedAt: '2026-09-01',
    sourceUrl: 'https://investors.credosemi.com/news-events/news/news-details/2026/Credo-Technology-Group-Holding-Ltd-Reports-First-Quarter-of-Fiscal-Year-2027-Financial-Results/default.aspx',
    reason: '公式連結GAAP損益計算書の単独四半期を収録。次期は見通しのみ。',
  }],
  ['tsmc', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 2026', latestOfficialEndDate: '2026-09-30', publishedAt: '2026-10-15',
    sourceUrl: 'https://investor.tsmc.com/english/encrypt/files/encrypt_file/qr/phase4_reports/2026-10/f53a64fd40fc0b453f94e077e5aba8cad506f27b/3Q26%20ManagementReport.pdf',
    reason: 'TIFRS連結の単独Q3売上・営業利益を収録。Q4は会社見通しのみ。',
  }],
  ['asml', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 2026', latestOfficialEndDate: '2026-09-27', publishedAt: '2026-10-14',
    sourceUrl: 'https://www.investor.asml.com/static-files/d310262b-d037-485d-83b5-92c93cc462f0',
    reason: '公式US GAAP財務諸表の単独Q3売上・営業利益を収録。Q4は会社見通しのみ。',
  }],
  ['sandisk', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-07-03', publishedAt: '2026-08-05',
    sourceUrl: 'https://investor.sandisk.com/news-releases/news-release-details/sandisk-reports-fiscal-fourth-quarter-2026-financial-results',
    supportingUrl: 'https://investor.sandisk.com/news-releases/news-release-details/sandisk-report-first-quarter-fiscal-year-2027-results-october-29',
    reason: 'FY2026 Q4が最新公表実績。FY2027 Q1は2026-10-29公表予定であり実績未公表。スピンオフを含むFY2025 Q3の比較注記を保持。',
  }],
  ['abb', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-16',
    sourceUrl: 'https://new.abb.com/news/detail/137496/q2-2026-results',
    supportingUrl: 'https://global.abb/group/en/investors/financial-calendar',
    reason: 'Q3 2026公表予定は2026-10-20。既存Q1/Q2以外の比較可能な過去4期は事業構成変更の系列確認が未了。',
  }],
  ['kioxia', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.kioxia-holdings.com/ja-jp/ir/news.html',
    reason: '公式IRニュースでFY2027 Q2決算の発表予定は2026-10-30。基準日時時点で未公表のため5期を保持。',
  }],
  ['resonac-holdings', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-06',
    sourceUrl: 'https://www2.jpx.co.jp/disc/40040/140120260806511574.pdf',
    reason: '公式中間決算は2026 H1累計を開示。Q1との差分候補はあるが、過去の改訂系列と事業再編を通した連続6期の比較可能性をまだ固定できず保留。',
  }],
  ['amkor', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-27',
    sourceUrl: 'https://ir.amkor.com/news-releases/news-release-details/amkor-technology-reports-financial-results-second-quarter-2026',
    supportingUrl: 'https://ir.amkor.com/news-releases/news-release-details/amkor-technology-announce-third-quarter-2026-financial-results',
    reason: '公式Q2連結実績とQ3決算の10月26日公表予定を照合。基準日時にQ3は未公表。',
  }],
  ['amphenol', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://investors.amphenol.com/news-and-events/news-details/2026/Amphenol-Reports-Record-Second-Quarter-2026-Results/default.aspx',
    supportingUrl: 'https://investors.amphenol.com/home/default.aspx',
    reason: '公式Q2実績とIRのQ3決算10月28日予定を照合。',
  }],
  ['analog-devices', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-08-01', publishedAt: '2026-08-19',
    sourceUrl: 'https://investor.analog.com/news-releases/news-release-details/analog-devices-reports-record-fiscal-third-quarter-2026',
    supportingUrl: 'https://investor.analog.com/',
    reason: '公式Q3連結実績とIR最新掲載を照合。Q4は公式発表中の見通しのみで、基準日時の実績ではない。',
  }],
  ['arista', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-04',
    sourceUrl: 'https://investors.arista.com/Communications/Press-Releases-and-Events/Press-Release-Detail/2026/Arista-Networks-Inc--Reports-Second-Quarter-2026-Financial-Results/default.aspx',
    supportingUrl: 'https://investors.arista.com/Communications/Press-Releases-and-Events/Press-Release-Detail/2026/Arista-Networks-to-Announce-Q3-2026-Financial-Results-on-Tuesday-November-3-2026/default.aspx',
    reason: '公式Q2実績とQ3決算の11月3日公表予定を照合。Q3ガイダンスは実績として収録しない。',
  }],
  ['arm', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://investors.arm.com/financials/quarterly-annual-results',
    supportingUrl: 'https://investors.arm.com/news-events/investor-events-presentations',
    reason: '公式四半期結果一覧はFY2027 Q1実績まで。FY2027 Q2決算は11月4日予定で基準日時には未公表。',
  }],
  ['ase-technology', {
    status: 'unverified', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1122411/000095010326011351/dp250868_6k.htm',
    reason: 'SEC提出のQ2単独連結損益には営業利益を開示。基準日時までのQ3連結利益開示の有無を公式IR／提出一覧で確定できておらず、最新確認済みには計上しない。',
  }],
  ['asm-international', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-28',
    sourceUrl: 'https://www.asm.com/investors/results-center',
    supportingUrl: 'https://www.asm.com/newsroom.html',
    reason: '公式results centerの最新実績はQ2。Q3は10月6日に決算説明会を告知した段階で、基準日時の実績ではない。',
  }],
  ['besi', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-23',
    sourceUrl: 'https://www.besi.com/investor-relations/press-releases/',
    supportingUrl: 'https://www.besi.com/investor-relations/financial-calendar/',
    reason: '公式IRはQ2実績まで掲載。Q3実績の公表予定は10月22日で、基準日時には未公表。',
  }],
  ['cadence', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-27',
    sourceUrl: 'https://investor.cadence.com/financials/quarterly-results/',
    supportingUrl: 'https://investor.cadence.com/news/news-details/2026/Cadence-Announces-Third-Quarter-2026-Financial-Results-Webcast/default.aspx',
    reason: '公式四半期結果一覧はQ2まで。Q3決算説明会は10月26日予定であり、Q3見通しを実績としない。',
  }],
  ['canon', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-27',
    sourceUrl: 'https://global.canon/en/ir/', supportingUrl: 'https://global.canon/en/ir/calendar/',
    reason: '公式IRの最新連結実績はQ2。Q3決算の10月27日公表予定を照合し、未公表期を追加しない。',
  }],
  ['carrier', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-28',
    sourceUrl: 'https://ir.carrier.com/news/news-details/2026/Carrier-Reports-Second-Quarter-2026-Results/default.aspx',
    supportingUrl: 'https://www.carrier.com/us/en/news/corporate/2026/carrierthird-quarter-2026-earnings-advisory/',
    reason: '公式Q2連結実績とQ3決算10月29日公表予定を照合。事業売却後の将来見通しは実績に混ぜない。',
  }],
  ['ciena', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-08-01', publishedAt: '2026-09-03',
    sourceUrl: 'https://investor.ciena.com/news/news-details/2026/Ciena-Reports-Fiscal-Third-Quarter-2026-Financial-Results/default.aspx',
    supportingUrl: 'https://investor.ciena.com/news/',
    reason: '公式Q3連結実績がIRニュースの基準日時最新決算。FY2026 Q4期末は基準日時以降で未到来。',
  }],
  ['cisco', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-07-25', publishedAt: '2026-08-12',
    sourceUrl: 'https://investor.cisco.com/news/news-details/2026/CISCO-REPORTS-FOURTH-QUARTER-AND-FISCAL-YEAR-2026-EARNINGS/default.aspx',
    supportingUrl: 'https://investor.cisco.com/financials/quarterly-results/',
    reason: '公式Q4連結実績まで確認。FY2027 Q1期末は基準日時以降であり未公表。',
  }],
  ['coherent', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-12',
    sourceUrl: 'https://ir.coherent.com/node/17126/pdf', supportingUrl: 'https://ir.coherent.com/',
    reason: '公式Q4連結実績が最新。次のFY2027 Q1決算は11月4日予定で基準日時には未公表。',
  }],
  ['corning', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-28',
    sourceUrl: 'https://investor.corning.com/news-and-events/news/news-details/2026/Cornings-Strong-Second-Quarter-2026-Financial-Results1-Demonstrate-Progress-on-Recently-Upgraded-Springboard-Plan/default.aspx',
    supportingUrl: 'https://investor.corning.com/investor-relations/default.aspx',
    reason: '公式Q2実績とQ3決算説明会10月27日予定を照合。core指標の見通しはGAAP実績に混ぜない。',
  }],
  ['denso', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.denso.com/global/en/newsroom/news/2026/20260731-g01/',
    supportingUrl: 'https://www.denso.com/global/en/investors/',
    reason: '公式Q1連結実績とIR暦のFY2027 Q2決算10月29日公表予定を照合。',
  }],
  ['digital-realty', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-23',
    sourceUrl: 'https://investor.digitalrealty.com/news-releases/news-release-details/digital-realty-reports-second-quarter-2026-results',
    supportingUrl: 'https://investor.digitalrealty.com/news-releases/news-release-details/digital-realty-schedules-third-quarter-2026-earnings-release-and',
    reason: '公式Q2実績とQ3決算10月29日予定を確認。Atlasは四半期未収録。REITのFFO／調整後EBITDAをGAAP営業利益へ代用せず、連続6期の連結営業利益系列を原表で確認するまで追加保留。',
  }],
  ['eaton', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.eaton.com/us/en-us/company/news-insights/news-releases/2026/eaton-reports-record-second-quarter-2026-results.html',
    supportingUrl: 'https://www.eaton.com/us/en-us/company/investor-relations.html',
    reason: '公式IRの最新実績はQ2。Mobility分離は将来予定であり、Q3ガイダンスを実績へ混ぜない。',
  }],
  ['entegris', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-08-04',
    sourceUrl: 'https://investor.entegris.com/news/news-details/2026/Entegris-Reports-Results-for-Second-Quarter-of-2026/default.aspx',
    supportingUrl: 'https://investor.entegris.com/news/news-details/2026/Entegris-to-Report-Results-for-Third-Quarter-of-2026-on-Thursday-October-29-2026/default.aspx',
    reason: '公式Q2連結GAAP実績とQ3決算10月29日予定を照合。',
  }],
  ['equinix', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://investor.equinix.com/news-events/press-releases/detail/1114/equinix-reports-second-quarter-results-raises-2026',
    supportingUrl: 'https://investor.equinix.com/',
    reason: '公式Q2実績と既存の連結GAAP四半期履歴を照合。Q3決算は10月28日予定。AFFO／調整後EBITDAを営業利益へ代用しない。',
  }],
  ['fanuc', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.fanuc.co.jp/en/ir/announce/pdf/2026/financialresult202606_e.pdf',
    supportingUrl: 'https://www.fanuc.co.jp/en/ir/announce/',
    reason: '公式IRは4–6月単独連結実績まで掲載。9月中間期の資料は基準日時には未掲載であり、予想値を採用しない。',
  }],
  ['fujikura', {
    status: 'unverified', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-07',
    sourceUrl: 'https://ssl4.eir-parts.net/doc/5803/tdnet/2866589/00.pdf',
    supportingUrl: 'https://www.fujikura.co.jp/ir/',
    reason: '既存Q1の公式開示と会社IR入口を確認。基準日時までのQ2正式連結決算の有無をIR一覧で確定できず、最新確認済みには計上しない。',
  }],
  ['furukawa-electric', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-06',
    sourceUrl: 'https://www.furukawaelectric.com/en/ir/library/',
    supportingUrl: 'https://www.furukawaelectric.com/en/ir/',
    reason: '公式IRには2027年3月期Q1の連結売上・営業利益を掲載。Q2決算の公表予定は11月9日で基準日時には未公表。',
  }],
  ['ge-vernova', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-22',
    sourceUrl: 'https://www.gevernova.com/news/articles/ge-vernova-releases-second-quarter-2026-financial-results',
    supportingUrl: 'https://www.gevernova.com/investors/events',
    reason: '公式Q2実績・10-QとQ3決算説明会の10月28日予定を照合。Q3予想値や調整後EBITDAを実績営業利益へ代用しない。',
  }],
  ['globalfoundries', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-05',
    sourceUrl: 'https://investors.gf.com/news-releases/news-release-details/globalfoundries-reports-second-quarter-2026-financial-results',
    supportingUrl: 'https://investors.gf.com/investor-relations/news-events/events',
    reason: '公式IFRS Q2連結実績とQ3決算説明会の11月4日予定を照合。Non-IFRS営業利益を混在させない。',
  }],
  ['ajinomoto-fine-techno', {
    status: 'unverified', sourceUrl: 'https://www.ajinomoto.com/media/pressreleases/2026',
    reason: '親会社の公式IRは味の素グループ連結Q1決算と味の素ファインテクノの吸収合併方針を掲載するが、対象子会社単独の四半期売上・営業利益はこの資料で確認できない。対象会社の独立開示の有無は確認未了で、親会社数値を代用しない。',
  }],
  ['aptiv', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-04',
    sourceUrl: 'https://ir.aptiv.com/news/news-details/2026/Aptiv-Reports-Second-Quarter-2026-Financial-Results/default.aspx',
    supportingUrl: 'https://ir.aptiv.com/default.aspx',
    reason: '公式Q2 GAAP実績とQ3決算11月3日予定を確認。Electrical Distribution Systemsスピンオフによる非継続事業の再表示をまたぐ連続6期の同一定義営業利益を未確定のため、既存年次値へ混ぜず追加保留。',
  }],
  ['asmpt', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.asmpt.com/en/investor-relations/financial-information/',
    supportingUrl: 'https://www.asmpt.com/en/investor-relations/announcements-circulars/q3-2026-results-announcement/',
    reason: '公式Q2中間決算と過去のQ1/Q3単独資料を確認。Q3 2026は10月28日予定。Q2・Q4の累計差分を同一HKFRS系列で機械的に構成し、事業売却後の比較可能性を照合するまで追加保留。',
  }],
  ['hexagon', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://hexagon.com/company/newsroom/press-releases/2026/hexagon-interim-report-1-january---30-june-2026',
    supportingUrl: 'https://hexagon.com/company/newsroom/press-releases/2026/invitation-to-presentation-of-hexagons-interim-report-on-23-october',
    reason: '公式Q2単独売上・EBITAC・EBIT1を開示しQ3は10月23日予定。EBITAC／EBIT1が連結IFRS営業利益と同義か原表で未確定のため、調整後利益を代用せず追加保留。',
  }],
  ['ibiden', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-04',
    sourceUrl: 'https://www.ibiden.com/ir/2026/08/consolidated-financial-results-for-the-first-quarter-ended-june-30-2026.html',
    supportingUrl: 'https://www.ibiden.com/ir/news/financial/',
    reason: '公式IRの2027年3月期Q1連結決算までを照合。2026年10月の中間決算は基準日時には未掲載。',
  }],
  ['keyence', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-20', publishedAt: '2026-07-28',
    sourceUrl: 'https://www.keyence.co.jp/investor/calender.jsp',
    supportingUrl: 'https://www.keyence.co.jp/investor/',
    reason: '公式IRの2027年3月期Q1実績は6月20日締めで収録期末日と一致。Q2決算は10月29日公表予定で基準日時に未公表。',
  }],
  ['kla', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-28',
    sourceUrl: 'https://ir.kla.com/news-events/press-releases/detail/518/kla-corporation-reports-fiscal-2026-fourth-quarter-and-full',
    supportingUrl: 'https://ir.kla.com/news-events',
    reason: '公式GAAP Q4実績を照合。FY2027 Q1決算説明会は10月28日予定で、9月期ガイダンスを実績として収録しない。',
  }],
  ['kokusai-electric', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-06',
    sourceUrl: 'https://www.kokusai-electric.com/en/latest_report',
    supportingUrl: 'https://www.kokusai-electric.com/news/document',
    reason: '公式IRに2027年3月期Q1 IFRS連結決算を掲載。Q2は発表日告知だけで基準日時に実績未掲載。',
  }],
  ['lam-research', {
    status: 'latest-confirmed', latestOfficialPeriod: 'June 2026 quarter', latestOfficialEndDate: '2026-06-28', publishedAt: '2026-07-29',
    sourceUrl: 'https://investor.lamresearch.com/2026-07-29-Lam-Research-Corporation-Reports-Financial-Results-for-the-Quarter-Ended-June-28%2C-2026',
    supportingUrl: 'https://investor.lamresearch.com/2026-09-30-Lam-Research-Corporation-Announces-September-Quarter-Financial-Conference-Call',
    reason: '公式US GAAP単独June四半期実績を照合。September四半期決算は10月21日予定。Non-GAAP利益と混在させない。',
  }],
  ['infineon', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q3', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-05',
    sourceUrl: 'https://www.infineon.com/press-release/2026/infpr202608-125',
    supportingUrl: 'https://www.infineon.com/about/investor/reports-presentations/financial-results',
    reason: '公式Q3連結報告を照合。Q4決算は11月10日予定。会社のSegment ResultをIFRS営業利益と混同しない。',
  }],
  ['linde', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.linde.com/news-and-media/2026/linde-reports-second-quarter-2026-results',
    supportingUrl: 'https://www.linde.com/investors/financial-reports',
    reason: '公式Q2連結実績と10月5日のQ3公表日告知を照合。Q3実績は基準日時には未掲載。',
  }],
  ['lumentum', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-08-11',
    sourceUrl: 'https://investor.lumentum.com/quarterly-results/',
    supportingUrl: 'https://investor.lumentum.com/financial-news-releases/',
    reason: '公式Q4連結GAAP実績までを照合。FY2027 Q1の発表日告知は実績でなく、non-GAAP margin予想を追加しない。',
  }],
  ['mediatek', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.mediatek.com/investor-relations/ir-events',
    supportingUrl: 'https://www.mediatek.com/investor-relations',
    reason: '公式Q2連結決算説明会までを照合。Q3実績説明会は10月30日予定。月次売上速報だけで営業利益を推測しない。',
  }],
  ['mitsubishi-electric', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.mitsubishielectric.com/en/pr/2026/0731_co/',
    supportingUrl: 'https://www.mitsubishielectric.com/investors/library/results/',
    reason: '公式FY2027 Q1連結実績と決算一覧を照合。Q2は基準日時に未掲載。',
  }],
  ['monolithic-power', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1280452/000162828026051029/mpwr-20260630xexx991.htm',
    supportingUrl: 'https://www.monolithicpower.com/jp/about-mps/investor-relations/events-presentations.html',
    reason: 'SEC提出のQ2 GAAP実績とQ3決算10月29日予定を照合。過年度2025系列の再表示注記を保持し、既存recordを黙って改訂しない。',
  }],
  ['nxp', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-28', publishedAt: '2026-07-28',
    sourceUrl: 'https://investors.nxp.com/news-releases/news-release-details/nxp-semiconductors-reports-second-quarter-2026-results/',
    supportingUrl: 'https://investors.nxp.com/financial-information/financial-information-0',
    reason: '公式Q2連結GAAP実績とQ3発表予定のIR一覧を照合。Q3 guidanceは実績として扱わない。',
  }],
  ['nvent', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://investors.nvent.com/investor-relations/default.aspx',
    supportingUrl: 'https://investors.nvent.com/events-and-presentations/default.aspx?LanguageId=1',
    reason: '公式IRのQ2連結結果までを照合。Q3決算は10月30日予定で、事業買収の将来見通しを実績へ混ぜない。',
  }],
  ['onsemi', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-07-03', publishedAt: '2026-08-03',
    sourceUrl: 'https://investor.onsemi.com/news-releases/news-release-details/onsemi-reports-second-quarter-2026-results',
    supportingUrl: 'https://investor.onsemi.com/news-releases/news-release-details/onsemi-announce-third-quarter-financial-results-3',
    reason: '公式US GAAP Q2実績と10月15日付のQ3決算11月2日予定を照合。Q3は基準日時に未公表。',
  }],
  ['renesas', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://www.renesas.com/en/about/newsroom/renesas-reports-financial-results-second-quarter-ended-june-30-2026',
    supportingUrl: 'https://www.renesas.com/en/about/investor-relations/events/financial-calendar',
    reason: '公式IFRS Q2連結実績までを照合。Q3公表予定は10月29日。',
  }],
  ['samsung-electronics', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://news.samsung.com/global/samsung-electronics-announces-second-quarter-2026-results',
    supportingUrl: 'https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-2026%EB%85%84-3%EB%B6%84%EA%B8%B0-%EC%9E%A0%EC%A0%95%EC%8B%A4%EC%A0%81-%EB%B0%9C%ED%91%9C',
    reason: 'Q2が最新の確定連結実績。10月8日のQ3数値は会社が未決算の暫定推定値と明記しており、正式実績へ繰り上げない。',
  }],
  ['seagate', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-07-03', publishedAt: '2026-07-28',
    sourceUrl: 'https://investors.seagate.com/news/news-details/2026/Seagate-Technology-Reports-Fiscal-Fourth-Quarter-and-Fiscal-Year-2026-Financial-Results/',
    supportingUrl: 'https://investors.seagate.com/news/news-details/2026/Seagate-Technology-to-Report-Fiscal-First-Quarter-2027-Financial-Results-on-October-27-2026/default.aspx',
    reason: '公式Q4 GAAP実績までを照合。FY2027 Q1は10月27日公表予定で予想を追加しない。',
  }],
  ['shin-etsu-chemical', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-24',
    sourceUrl: 'https://www.shinetsu.co.jp/jp/ir/ir-calendar/',
    reason: '公式IR暦に2027年3月期Q1実績の7月24日公表とQ2実績の10月27日予定を明記。既存6期はそのQ1まで。',
  }],
  ['sumitomo-electric', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-31',
    sourceUrl: 'https://sumitomoelectric.com/ir/library',
    supportingUrl: 'https://sumitomoelectric.com/ir/calendar',
    reason: '公式IRの2027年3月期Q1連結決算・Fact Bookを照合。Q2は基準日時に未発表で百万円の収録単位を維持。',
  }],
  ['tokyo-electron', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://www.tel.com/ir/library/report/', supportingUrl: 'https://www.tel.com/ir/calendar/',
    reason: '公式2027年3月期Q1日本基準連結実績とQ2の10月30日予定を照合。会社予想の改訂を実績に混ぜない。',
  }],
  ['yaskawa', {
    status: 'update-needed', latestOfficialPeriod: 'FY2026 Q2', latestOfficialEndDate: '2026-08-31', publishedAt: '2026-10-09',
    sourceUrl: 'https://www.yaskawa-global.com/ir/materials/br', supportingUrl: 'https://www.yaskawa-global.com/ir',
    reason: '公式IRは2027年2月期上期IFRS連結実績を10月9日に開示。Atlasは年次のみ。累計H1とQ1の差分を含む直近6単独期の同一系列・改訂値をまだ構成できず、未収録とする。',
  }],
  ['te-connectivity', {
    status: 'latest-confirmed', latestOfficialPeriod: 'FY2026 Q3', latestOfficialEndDate: '2026-06-26', publishedAt: '2026-07-22',
    sourceUrl: 'https://investors.te.com/news-releases/press-release-details/2026/TE-Connectivity-delivers-results-above-guidance-with-14-sales-growth-and-19-EPS-growth-in-third-quarter-of-fiscal-2026/',
    supportingUrl: 'https://investors.te.com/news-releases/default.aspx',
    reason: '公式Q3 US GAAP実績とQ4決算10月28日予定を照合。adjusted利益と混在させない。',
  }],
  ['tesla', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-22',
    sourceUrl: 'https://ir.tesla.com/press-release/tesla-releases-second-quarter-2026-financial-results',
    supportingUrl: 'https://ir.tesla.com/',
    reason: '公式Q2決算・10-Qを照合。Q3決算は10月21日予定。納車速報を連結営業利益の実績に代用しない。',
  }],
  ['texas-instruments', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-22',
    sourceUrl: 'https://investor.ti.com/node/38476', supportingUrl: 'https://investor.ti.com/upcoming-events',
    reason: '公式Q2連結実績を照合。Q3決算は10月21日予定で、会社見通しを採用しない。',
  }],
  ['trane-technologies', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://ir.tranetechnologies.com/news-and-events/news-releases/news-release-details/2026/Trane-Technologies-Reports-Strong-Second-Quarter-Results-Raises-Full-Year-Revenue-and-EPS-Guidance/default.aspx',
    supportingUrl: 'https://investors.tranetechnologies.com/news-and-events/news-releases/news-release-details/2026/Trane-Technologies-Schedules-Third-Quarter-2026-Earnings-Conference-Call/default.aspx',
    reason: '公式Q2 GAAP実績とQ3決算10月29日予定を照合。継続事業のadjusted指標を代用しない。',
  }],
  ['tower-semiconductor', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-04',
    sourceUrl: 'https://ir.towersemi.com/news-releases/news-release-details/tower-semiconductor-announces-record-results-revenue-and',
    supportingUrl: 'https://ir.towersemi.com/financial-information/quarterly-results',
    reason: '公式Q2連結実績までを照合。資料上の一時項目除外後operating profitとGAAP表の定義差を保持し、Q3 guidanceを実績に混ぜない。',
  }],
  ['umc', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1033767/000119312526322027/umc-ex99.htm',
    supportingUrl: 'https://www.umc.com/en/IR_Event/ir_events',
    reason: 'SEC提出のTIFRS連結Q2実績と公式IRイベントを照合。月次売上を次期の営業利益に代用しない。',
  }],
  ['vertiv', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://investors.vertiv.com/news/news-details/2026/Vertiv-Reports-Strong-Second-Quarter-2026-with-Diluted-EPS-Growth-of-53-Adjusted-Diluted-EPS-Growth-of-60-Raises-Full-Year-2026-Guidance-Across-All-Key-Metrics/default.aspx',
    supportingUrl: 'https://investors.vertiv.com/news/news-details/2026/Vertiv-Announces-Date-of-Third-Quarter-2026-Earnings-Release-and-Conference-Call/',
    reason: '公式Q2連結GAAP実績とQ3決算10月28日予定を照合。adjusted operating profitと混在させない。',
  }],
  ['western-digital', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q4 FY2026', latestOfficialEndDate: '2026-07-03', publishedAt: '2026-08-05',
    sourceUrl: 'https://investor.wdc.com/news-releases/news-release-details/wd-reports-fiscal-fourth-quarter-and-fiscal-year-2026-financial',
    supportingUrl: 'https://investor.wdc.com/investor-events/presentations',
    reason: '公式Q4連結GAAP実績を照合。FY2027 Q1決算は10月22日予定で、会社見通しを採用しない。',
  }],
  ['globalwafers', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-04',
    sourceUrl: 'https://www.sas-globalwafers.com/en/gwc_news_en_20260804/',
    supportingUrl: 'https://www.sas-globalwafers.com/en/investor/financial-information_en/',
    reason: '会社が8月4日にQ2連結財務諸表の承認と単独Q2売上・営業利益を公表。次期の月次売上を四半期利益の代わりにしない。',
  }],
  ['sk-hynix', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.skhynix.com/ir/UI-FR-IR06/',
    supportingUrl: 'https://news.skhynix.com/en/q2-2026-business-results/',
    reason: '公式IRのK-IFRS Q2連結実績を照合。Q3の実績公表は基準日時に確認できず、速報・見通しを代用しない。',
  }],
  ['nan-ya-pcb', {
    status: 'latest-confirmed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-06',
    sourceUrl: 'https://www.nanyapcb.com.tw/nypcb/english/InvestorRelations/FinancialReports',
    reason: '会社公式IRの2026年第2四半期IFRS連結報告を照合。後続の投資家向けイベントはQ3連結損益の公表根拠としない。',
  }],
  ['johnson-controls', {
    status: 'update-needed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://investors.johnsoncontrols.com/financials/quarterly-results/default.aspx',
    reason: '公式Q3 GAAP連結実績と10-Qが公表済みだがAtlasは年次のみ。継続事業・再表示系列を6期で照合するまでは追加しない。',
  }],
  ['jcet', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-21',
    sourceUrl: 'https://static.cninfo.com.cn/finalpage/2026-08-21/1225487900.PDF',
    reason: '取引所指定の公式開示経路に2026上期連結報告が公表済み。Atlasは2024Q1で止まっており、年度間の同一中国会計基準・改訂系列を未接続。',
  }],
  ['mobileye', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-07-23',
    sourceUrl: 'https://ir.mobileye.com/news-releases/news-release-details/mobileye-releases-second-quarter-2026-results-updates-guidance',
    reason: '会社のQ2 US GAAP売上と営業損失は公表済み。Atlasは年次のみで、Mentee買収後のGAAP連結単独6期をまだ固定できない。',
  }],
  ['nikon', {
    status: 'update-needed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-06',
    sourceUrl: 'https://www.nikon.com/company/ir/ir_library/result/',
    reason: '会社の2027年3月期Q1 IFRS連結決算が公表済み。Atlasは年次のみで、最新6期の累計差分・改訂比較を未実施。',
  }],
  ['omron', {
    status: 'update-needed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-05',
    sourceUrl: 'https://www.omron.com/global/en/ir/',
    supportingUrl: 'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_01e.pdf',
    reason: '会社Q1連結実績が公表済み。ただし2026年度からUS GAAP→IFRSへ移行しており、過去6期の比較可能な改訂系列を未確定。',
  }],
  ['rohm', {
    status: 'update-needed', latestOfficialPeriod: 'FY2027 Q1', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-05',
    sourceUrl: 'https://www.rohm.com/ir/stock/calendar',
    supportingUrl: 'https://www.rohm.com/ir/library/materials-for-financial-results-briefing',
    reason: '公式IR暦とQ1補足資料を照合。Atlasは年次のみで、四半期単独6期の日本基準連結損益を未抽出。',
  }],
  ['siemens-energy', {
    status: 'update-needed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-05',
    sourceUrl: 'https://www.siemens-energy.com/global/en/home/press-releases.html',
    reason: '公式Q3連結実績を8月5日に公表。Atlas年次系列から四半期IFRS営業利益へ接続する6期の同一定義確認が未了。',
  }],
  ['smic', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-08-13',
    sourceUrl: 'https://www1.hkexnews.hk/search/titlesearch.xhtml?category=0&market=SEHK&stockId=7249',
    reason: 'HKEXに会社提出の2026Q2単独IFRS未監査結果が8月13日付で掲載。Atlas年次のみで6期の利益定義と単位を未確定。',
  }],
  ['stmicroelectronics', {
    status: 'update-needed', latestOfficialPeriod: 'Q2 2026', latestOfficialEndDate: '2026-06-27', publishedAt: '2026-07-23',
    sourceUrl: 'https://investors.st.com/static-files/bdacd978-231f-4e8c-bfde-f5cc6c53250d',
    reason: '公式Q2 US GAAP単独実績に売上と営業利益がある。Atlasは年次のみで、non-US-GAAP欄と混在しない6期抽出が未完。',
  }],
  ['synopsys', {
    status: 'update-needed', latestOfficialPeriod: 'Q3 FY2026', latestOfficialEndDate: '2026-07-31', publishedAt: '2026-08-26',
    sourceUrl: 'https://investor.synopsys.com/news/news-details/2026/Synopsys-Posts-Financial-Results-for-Third-Quarter-Fiscal-Year-2026/',
    reason: '公式Q3 US GAAP連結売上・営業利益が公表済み。Ansys買収前後を通す6期の比較注記を未確認でAtlas年次のみ維持。',
  }],
  ['legrand', {
    status: 'unverified', latestOfficialPeriod: 'H1 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-29',
    sourceUrl: 'https://www.legrand.com/en/investors-and-shareholders/financial-key-figures',
    reason: '公式H1 IFRSの売上・営業利益は確認。Q1は売上中心の公表で単独Q1/Q2営業利益系列の有無を未確定。非四半期開示と断定しない。',
  }],
  ['schneider-electric', {
    status: 'unverified', latestOfficialPeriod: 'H1 2026', latestOfficialEndDate: '2026-06-30', publishedAt: '2026-07-30',
    sourceUrl: 'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',
    reason: '公式H1決算とQ1 Revenue資料を確認。単独四半期のIFRS営業利益6件を今回の資料だけで確定できず、非開示断定は保留。',
  }],
  ['hanmi-semiconductor', {
    status: 'unverified', sourceUrl: 'https://www.hanmi.co.kr/about/investor-relations/ir/financial-result/list.hm',
    supportingUrl: 'https://kind.krx.co.kr/external/2026/07/14/000372/20260710000184/99664.htm',
    reason: 'KRX提出の7月28日Q2説明会予定と会社資料室を確認。Q2正式連結損益の期末・改訂系列を今回直接照合できず、銀行のHanmi Financialとは厳格に区別。',
  }],
  ['kinsus', {
    status: 'unverified', sourceUrl: 'https://www.kinsus.com.tw/en/annual/monthly_revenue',
    supportingUrl: 'https://www.kinsus.com.tw/en',
    reason: '会社の2026年月次売上とIRを確認。月次資料に四半期連結営業利益はなく、Q2 IFRS正式報告の内容・公表日を未照合。',
  }],
  ['lasertec', {
    status: 'unverified', sourceUrl: 'https://www.lasertec.co.jp/ir/index.html',
    supportingUrl: 'https://www.lasertec.co.jp/ir/plan/message.html',
    reason: '2026年6月期の公式年次業績・9月業績報告を確認。単独Q4と前5期の同一日本基準連結系列・公表日を未抽出。',
  }],
  ['smc', {
    status: 'unverified', sourceUrl: 'https://www.smcworld.com/ir/en-jp/financial-results.html',
    supportingUrl: 'https://www.smcworld.com/ir/en-jp/calendar.html',
    reason: '公式IRの2027年3月期Q1発表案内・決算報告室を確認。単独損益の資料と公表日を今回直接照合できず最新期確定を保留。',
  }],
  ['sumco', {
    status: 'unverified', sourceUrl: 'https://www.sumcosi.com/english/ir/',
    supportingUrl: 'https://www.sumcosi.com/english/ir/event/calendar.html',
    reason: '公式IRはQ2を8月に公表する年次日程。2026Q2の単独連結営業利益資料・公表日を今回直接照合できず、最新確認済みとしない。',
  }],
  ['unimicron', {
    status: 'unverified', sourceUrl: 'https://www.unimicron.com/',
    reason: '2026Q2連結財報の存在を二次索引で検知したが、会社・規制当局の正式資料URLと公表日を今回取得できず、二次索引を数値根拠にしない。',
  }],
  ['shinko-electric', {
    status: 'unverified', sourceUrl: 'https://www.shinko.co.jp/english/ir/library/financial_results/',
    supportingUrl: 'https://www.shinko.co.jp/english/ir/faq/',
    reason: '公式IRの最新公開四半期は2024年度資料で、2025年6月の上場廃止後の同水準四半期開示を確認できない。直近6期を推定しない。',
  }],
]);

const historyFiles = (await readdir(data)).filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file)).sort();
const history = (await Promise.all(historyFiles.map(file => readJson(join(data, file))))).flat();
const coverage = await readJson(join(data, 'financial-quarterly-coverage-v01.json'));
const companies = await Promise.all((await readdir(join(data, 'companies'))).filter(file => file.endsWith('.json')).sort().map(file => readJson(join(data, 'companies', file))));
assert.equal(companies.length, 100);
assert.equal(history.length, 568);
assert.equal(coverage.length, 100);
assert.deepEqual(new Set(coverage.map(row => row.companyId)), new Set(companies.map(company => company.id)));

const added = await readJson(join(data, 'financial-history-v05-batch14.json'));
const rows = coverage.map(row => {
  const quarterRecords = history.filter(record => record.companyId === row.companyId && record.periodType === 'quarterly').sort((a, b) => a.endDate.localeCompare(b.endDate));
  const evidence = reviewed.get(row.companyId);
  const addedRecords = added.filter(record => record.companyId === row.companyId);
  const decision = evidence?.status ?? 'unverified';
  if (decision === 'latest-confirmed') assert.equal(row.latestEndDate, evidence.latestOfficialEndDate, `${row.companyId}: confirmed current period must be loaded`);
  if (decision === 'update-needed') assert.ok(!row.latestEndDate || row.latestEndDate < evidence.latestOfficialEndDate, `${row.companyId}: official latest exceeds stored period`);
  return {
    companyId: row.companyId,
    existingQuarterlyCountAtBase: quarterRecords.length - addedRecords.length,
    loadedQuarterlyCount: quarterRecords.length,
    loadedLatestPeriod: row.latestPeriodLabel,
    loadedLatestEndDate: row.latestEndDate,
    loadedCoverageStatus: row.coverageStatus,
    latestPeriodAuditStatus: decision,
    officialLatestPeriod: evidence?.latestOfficialPeriod ?? null,
    officialLatestEndDate: evidence?.latestOfficialEndDate ?? null,
    officialLatestPublishedAt: evidence?.publishedAt ?? null,
    officialLatestSourceUrl: evidence?.sourceUrl ?? null,
    supportingOfficialUrl: evidence?.supportingUrl ?? null,
    checkedAt: evidence ? checkedAt : null,
    addedPeriodLabels: addedRecords.map(record => record.periodLabel),
    reason: evidence?.reason ?? '今回の基準日時における公式最新四半期の照合未了。既存coverageの確認日を最新実績の証明には使わない。',
  };
});
assert.equal(rows.length, 100);
assert.deepEqual(new Set(rows.map(row => row.companyId)), new Set(companies.map(company => company.id)));
const counts = Object.fromEntries(['latest-confirmed', 'update-needed', 'non-quarterly-disclosure', 'unverified'].map(status => [status, rows.filter(row => row.latestPeriodAuditStatus === status).length]));
const output = { schemaVersion: 'v11', auditAsOfJst, baselineMainSha: '21ecce0a40b057e990ceddab24e00a2f52d94156', counts, records: rows };
const jsonText = `${JSON.stringify(output, null, 2)}\n`;
const mdText = `# Financial latest-period audit v11\n\n基準日時: ${auditAsOfJst}。公式最新期を直接確認できなかった会社は「確認未了」とし、最新確認済みへ水増ししない。\n\n確認済み最新: ${counts['latest-confirmed']}社／追加必要: ${counts['update-needed']}社／非四半期開示確認済み: ${counts['non-quarterly-disclosure']}社／確認未了: ${counts.unverified}社。\n\n| Company ID | 基準四半期数 | 現在四半期数 | 収録最新期 | 公式最新実績期 | 状態 | 確認日 | 根拠 | 判断理由 |\n|---|---:|---:|---|---|---|---|---|---|\n${rows.map(row => `| ${row.companyId} | ${row.existingQuarterlyCountAtBase} | ${row.loadedQuarterlyCount} | ${row.loadedLatestPeriod ?? '—'} (${row.loadedLatestEndDate ?? '—'}) | ${row.officialLatestPeriod ?? '未確認'} (${row.officialLatestEndDate ?? '—'}) | ${row.latestPeriodAuditStatus} | ${row.checkedAt ?? '—'} | ${row.officialLatestSourceUrl ? `[公式資料](${row.officialLatestSourceUrl})` : '—'} | ${row.reason} |`).join('\n')}\n`;
const jsonPath = join(root, 'docs', 'financial-latest-period-audit-v11.json');
const mdPath = join(root, 'docs', 'financial-latest-period-audit-v11.md');
if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath, 'utf8'), jsonText, 'latest-period JSON is fresh');
  assert.equal(await readFile(mdPath, 'utf8'), mdText, 'latest-period Markdown is fresh');
  console.log(`Financial latest-period audit OK: ${rows.length} companies, ${counts.unverified} explicitly unverified`);
} else if (process.argv.includes('--write')) {
  await writeFile(jsonPath, jsonText);
  await writeFile(mdPath, mdText);
  console.log(`Wrote financial latest-period audit: ${rows.length} companies`);
} else throw new Error('Use --write or --check');
