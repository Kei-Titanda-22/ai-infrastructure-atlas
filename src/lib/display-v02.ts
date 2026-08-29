import {
  layerLabel as baseLayerLabel,
  countryLabel as baseCountryLabel,
  tagLabel as baseTagLabel,
  facilityTypeLabel,
  productInfo as baseProductInfo,
  joinJapanese,
} from './display';

const extraLayerLabels: Record<string, string> = {
  'Materials & Substrates': '半導体材料・基板',
};

const extraCountryLabels: Record<string, string> = {
  Singapore: 'シンガポール',
};

const extraTagLabels: Record<string, string> = {
  'silicon wafer': 'シリコンウェハ',
  'package substrate': 'パッケージ基板',
  'ABF': 'ABF',
  'photoresist': 'フォトレジスト',
  'packaging materials': '半導体実装材料',
  'hybrid bonding': 'ハイブリッドボンディング',
  'die bonding': 'ダイボンディング',
  'TC bonding': 'TCボンディング',
  'HBM equipment': 'HBM向け装置',
  'leadframe': 'リードフレーム',
  'CMP': 'CMP',
  'semiconductor gas': '半導体用高純度ガス',
  'photomask blank': 'フォトマスクブランク',
  'epitaxial wafer': 'エピタキシャルウェハ',
  'SOI wafer': 'SOIウェハ',
};

type ProductInfo = { label: string; description: string };

const extraProductInfo: Record<string, ProductInfo> = {
  'Hybrid bonding equipment': { label: 'ハイブリッドボンディング装置', description: 'チップ間を微細接続する先端パッケージ向け接合装置。' },
  'Die attach / die bonding systems': { label: 'ダイアタッチ・ダイボンディング装置', description: '半導体チップを基板や他のチップへ高精度に実装する装置。' },
  'Wafer-level packaging equipment': { label: 'ウェハレベルパッケージ装置', description: 'ウェハ段階で実装・接続を行う後工程装置。' },
  'Advanced packaging assembly systems': { label: '先端パッケージ組立装置', description: '高密度パッケージの接合・組立工程を担う装置。' },
  'SMT placement systems': { label: 'SMT実装装置', description: '電子部品を基板へ高速・高精度に実装する装置。' },
  'Wafer deposition systems': { label: 'ウェハ成膜装置', description: 'パッケージ・実装工程を含む薄膜形成に用いる装置。' },
  'HBM TC Bonder': { label: 'HBM向けTCボンダ', description: 'HBMの積層チップを熱圧着で接合する中核装置。' },
  'micro SAW & Vision Placement': { label: 'マイクロソー・ビジョンプレースメント', description: '半導体パッケージの切断、検査、選別、配置を連続処理する装置。' },
  '6-side inspection systems': { label: '6面外観検査装置', description: 'HBMなどのチップ外観を多方向から検査し不良を検出する装置。' },
  'IC package substrates': { label: 'ICパッケージ基板', description: 'CPU・GPUなどの大型半導体と基板を高密度に接続するパッケージ基板。' },
  'High-density printed wiring boards': { label: '高密度プリント配線板', description: '高速・高密度な信号配線を支える基板製品。' },
  'Plastic laminate packages': { label: 'プラスチックラミネートパッケージ', description: '半導体チップを実装・接続する高密度パッケージ基板製品。' },
  'Leadframes': { label: 'リードフレーム', description: '半導体チップと外部端子を接続する金属部材。' },
  'IC assembly': { label: 'ICアセンブリ', description: '半導体チップの組立・実装工程を受託・提供する。' },
  'Ajinomoto Build-up Film (ABF)': { label: '味の素ビルドアップフィルム（ABF）', description: '高性能半導体パッケージ基板の層間絶縁に使われる材料。' },
  'Functional electronic materials': { label: '電子材料・機能性材料', description: '半導体実装や電子部品向けに機能を付与する材料群。' },
  'Semiconductor packaging materials': { label: '半導体実装材料', description: '先端パッケージの接合、封止、絶縁などに用いる材料群。' },
  'High-purity semiconductor gases': { label: '半導体用高純度ガス', description: 'エッチングや成膜など前工程で使用する高純度プロセスガス。' },
  'CMP materials': { label: 'CMP関連材料', description: 'ウェハ表面を平坦化するCMP工程向けの材料。' },
  'Silicon wafers': { label: 'シリコンウェハ', description: '半導体回路を形成する基板となる高純度単結晶シリコンウェハ。' },
  'Photoresists': { label: 'フォトレジスト', description: '露光工程で微細回路パターンを形成する感光材料。' },
  'Photomask blanks': { label: 'フォトマスクブランク', description: '露光用フォトマスクの基材となる高精度材料。' },
  '300 mm silicon wafers': { label: '300mmシリコンウェハ', description: '先端・量産半導体で広く使われる大口径シリコンウェハ。' },
  'Epitaxial wafers': { label: 'エピタキシャルウェハ', description: '表面に高品質な結晶層を成長させた半導体用ウェハ。' },
  'SOI / specialty wafers': { label: 'SOI・特殊ウェハ', description: 'SOIや用途別仕様を持つ高機能シリコンウェハ。' },
  'Polished silicon wafers': { label: '研磨シリコンウェハ', description: '高平坦・高清浄に研磨した標準的な半導体用シリコンウェハ。' },
};

export const layerLabel = (value: string) => extraLayerLabels[value] ?? baseLayerLabel(value);
export const countryLabel = (value: string) => extraCountryLabels[value] ?? baseCountryLabel(value);
export const tagLabel = (value: string) => extraTagLabels[value] ?? baseTagLabel(value);
export const productInfo = (value: string): ProductInfo => extraProductInfo[value] ?? baseProductInfo(value);
export { facilityTypeLabel, joinJapanese };
