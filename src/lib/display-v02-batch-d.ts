import {
  layerLabel as baseLayerLabel,
  countryLabel as baseCountryLabel,
  tagLabel as baseTagLabel,
  facilityTypeLabel,
  productInfo as baseProductInfo,
  joinJapanese,
} from './display-v02';

const extraCountryLabels: Record<string, string> = {
  France: 'フランス',
  Switzerland: 'スイス',
  Germany: 'ドイツ',
};

const extraTagLabels: Record<string, string> = {
  UPS: 'UPS',
  switchgear: '開閉装置',
  transformer: '変圧器',
  'grid infrastructure': '電力系統インフラ',
  'high voltage': '高電圧設備',
  'power generation': '発電設備',
  HVAC: '空調設備',
  chiller: 'チラー',
  'building automation': '建物自動制御',
  'building controls': '建物制御',
  'heat pump': 'ヒートポンプ',
  'liquid cooling': '液冷',
  PDU: 'PDU',
  rack: 'ラック',
  'electrical protection': '電気保護',
  busway: 'バスウェイ',
  'structured cabling': '構内配線',
  hyperscale: 'ハイパースケール',
};

type ProductInfo = { label: string; description: string };

const extraProductInfo: Record<string, ProductInfo> = {
  'Data center power distribution': { label: 'データセンター向け受配電設備', description: '受電した大容量電力をデータセンター内のUPS・ラックへ安全に分配する設備。' },
  'UPS and secure power': { label: 'UPS・無停電電源', description: '停電や電源品質の変動からAIサーバーやネットワーク機器を保護する。' },
  'Cooling and data center management': { label: '冷却・データセンター管理', description: '高密度IT設備の熱管理と電力・設備運用を統合的に支える。' },
  'Colocation data centers': { label: 'コロケーション・データセンター', description: '顧客のサーバーやネットワーク機器を設置する電力・空調・接続設備付き施設。' },
  'Hyperscale data center capacity': { label: 'ハイパースケール向けデータセンター容量', description: 'クラウド・AI事業者向けに大規模な電力・床面積を提供する。' },
  'Interconnection platform': { label: '相互接続プラットフォーム', description: '企業、クラウド、ネットワークをデータセンター内外で接続する基盤。' },
  'Medium- and low-voltage switchgear': { label: '中低圧開閉装置', description: 'データセンターや産業設備の受配電回路を保護・開閉する設備。' },
  'Transformers and power distribution': { label: '変圧器・配電設備', description: '系統から受電した電圧を変換し、設備内へ電力を分配する。' },
  'Data center electrification systems': { label: 'データセンター電化システム', description: '受電、配電、保護、制御を組み合わせたデータセンター向け電力設備。' },
  'Grid transformers': { label: '系統用変圧器', description: '送電・変電網で電圧を変換し、大規模需要地への電力供給を支える。' },
  'High-voltage grid equipment': { label: '高電圧系統設備', description: '送電・変電所で大容量電力を安全に制御・遮断する設備。' },
  'Power generation systems': { label: '発電システム', description: '電力需要を支える発電設備・関連サービス。' },
  'Grid solutions': { label: '送配電・系統ソリューション', description: '送電網、変電所、電力制御など電力系統を構成する設備群。' },
  'Power transformers and switchgear': { label: '電力用変圧器・開閉装置', description: '大容量電力の電圧変換と回路保護・開閉を担う。' },
  'Gas power generation': { label: 'ガス火力発電設備', description: 'ガスタービン等により大規模な電力供給能力を提供する。' },
  'Data center thermal management': { label: 'データセンター熱管理', description: '高密度IT設備の排熱を管理し、安定稼働を支える冷却・制御設備。' },
  'Building automation and controls': { label: '建物自動制御・管理システム', description: '空調、電力、設備状態を監視・制御して施設運用を最適化する。' },
  'Mission-critical building systems': { label: 'ミッションクリティカル建物設備', description: 'データセンター等で高い可用性を要求される熱管理・建物設備。' },
  'Commercial chillers': { label: '大型チラー', description: '冷水を生成し、大規模施設やデータセンターの熱を除去する冷却設備。' },
  'Data center cooling systems': { label: 'データセンター冷却システム', description: 'AI・HPC設備の高発熱に対応する空調・冷却システム。' },
  'Building HVAC controls': { label: '空調・HVAC制御', description: '建物の空調設備を監視・制御し、効率と温度環境を管理する。' },
  'Commercial HVAC and chillers': { label: '業務用空調・チラー', description: '大型施設の温度管理に用いる空調機器・冷凍機。' },
  'Data center cooling solutions': { label: 'データセンター向け冷却', description: '高密度サーバー設備の熱を除去する冷却機器・システム。' },
  'Building controls': { label: '建物制御システム', description: '空調・設備を監視・制御して施設の運用効率を高める。' },
  'Data center liquid cooling': { label: 'データセンター向け液冷', description: 'CDU等を用いてAI・HPCラックを液体で直接・間接冷却する。' },
  'High-density power distribution': { label: '高密度電力分配', description: '高出力AIラックへ大容量電力を安全かつ効率的に供給する。' },
  'Racks and electrical enclosures': { label: 'ラック・電気筐体', description: 'サーバー、電力機器、配線を収容・保護する物理インフラ。' },
  'Data center busway and PDU': { label: 'データセンター向けバスウェイ・PDU', description: '高密度ラックへ柔軟に電力を配る母線・ラック配電設備。' },
  'UPS and transformers': { label: 'UPS・変圧器', description: 'データセンターの電源品質確保と電圧変換を担う設備。' },
  'Racks cooling and structured cabling': { label: 'ラック・冷却・構内配線', description: 'ラック、冷却、銅・光配線を組み合わせてIT設備の物理基盤を構成する。' },
};

export const layerLabel = (value: string) => baseLayerLabel(value);
export const countryLabel = (value: string) => extraCountryLabels[value] ?? baseCountryLabel(value);
export const tagLabel = (value: string) => extraTagLabels[value] ?? baseTagLabel(value);
export const productInfo = (value: string): ProductInfo => extraProductInfo[value] ?? baseProductInfo(value);
export { facilityTypeLabel, joinJapanese };
