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
  'optical transceiver': '光トランシーバー',
  'coherent optics': 'コヒーレント光',
  'silicon photonics': 'シリコンフォトニクス',
  'laser': 'レーザー',
  'photonics': 'フォトニクス',
  'optical transport': '光伝送',
  'data center interconnect': 'データセンター間接続',
  'network silicon': 'ネットワーク半導体',
  'AEC': 'AEC',
  'optical DSP': '光DSP',
  'retimer': 'リタイマー',
  'power cable': '電力ケーブル',
  'fiber connectivity': '光接続',
  'materials science': '材料科学',
  'high-speed connector': '高速コネクタ',
  'cable assembly': 'ケーブルアセンブリ',
  'power connector': '電力コネクタ',
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
  'Datacenter optical transceivers': { label: 'データセンター向け光トランシーバー', description: 'サーバーやスイッチ間で高速データを光信号として送受信するモジュール。' },
  'Optoelectronic devices and lasers': { label: '光半導体デバイス・レーザー', description: '光通信の送受信を担うレーザー、受光素子などの基幹部品。' },
  'Optical circuit switches': { label: '光回路スイッチ', description: '光信号を電気変換せず経路切替し、AIクラスタの通信効率を高める装置。' },
  'Datacenter optical modules': { label: 'データセンター向け光モジュール', description: 'AI・クラウド基盤の高速光接続に用いる光モジュール。' },
  'High-performance lasers': { label: '高性能レーザー', description: '高速光通信や産業用途の光源となる半導体レーザー。' },
  'Optical subsystems': { label: '光サブシステム', description: '複数の光部品を統合した通信・ネットワーク向け機能ユニット。' },
  'Coherent optical transport systems': { label: 'コヒーレント光伝送システム', description: '大容量データを長距離伝送する通信・データセンター間接続装置。' },
  'WaveLogic coherent optics': { label: 'WaveLogicコヒーレント光技術', description: '高速・大容量の光伝送を実現するCienaのコヒーレント光技術。' },
  'Network control software': { label: 'ネットワーク制御ソフトウェア', description: '光・IPネットワークの構成、監視、最適化を行うソフトウェア。' },
  'AI datacenter switching': { label: 'AIデータセンター向けスイッチ', description: '多数のAIサーバー間を高速Ethernetで接続するネットワーク装置。' },
  'Silicon One network silicon': { label: 'Silicon Oneネットワーク半導体', description: 'ルーターやスイッチの高速パケット処理を担うCiscoのネットワーク半導体。' },
  'Routing and network platforms': { label: 'ルーティング・ネットワーク基盤', description: '企業・通信事業者・データセンターの通信経路を制御するシステム。' },
  'Active Electrical Cables (AEC)': { label: 'アクティブ電気ケーブル（AEC）', description: '信号補償回路を組み込んだ低消費電力の高速銅線接続。' },
  'Optical DSP and transceivers': { label: '光DSP・光トランシーバー', description: '高速光通信の信号処理と送受信を担う半導体・モジュール。' },
  'High-speed retimers and SerDes': { label: '高速リタイマー・SerDes', description: '高速電気信号の品質を補正しチップ・ボード間接続を安定化する。' },
  'Optical fiber and cable': { label: '光ファイバ・光ケーブル', description: 'データセンターや通信網で大容量通信を伝送する光配線。' },
  'Datacenter optical connectivity': { label: 'データセンター向け光接続', description: '高密度なAIサーバー設備内外を接続する光配線・接続製品。' },
  'Power cables and systems': { label: '電力ケーブル・電力システム', description: '大容量電力を発電・送配電設備から需要地へ運ぶケーブル・関連システム。' },
  'Optical communication devices': { label: '光通信デバイス', description: '光通信の送受信・変換に用いるレーザー、受光、モジュール等。' },
  'Optical fiber': { label: '光ファイバ', description: '高速・大容量通信を低損失で伝送するガラス光導波路。' },
  'Datacenter optical cable': { label: 'データセンター向け光ケーブル', description: 'AIサーバーやスイッチの高密度接続に用いる光ケーブル。' },
  'Fiber connectivity solutions': { label: '光接続ソリューション', description: '光ファイバ、コネクタ、配線部材を組み合わせた接続製品群。' },
  'High-speed connectors': { label: '高速コネクタ', description: 'サーバー・スイッチ・基板間で高速データ信号を接続するコネクタ。' },
  'Cable assemblies': { label: 'ケーブルアセンブリ', description: 'コネクタとケーブルを組み合わせた高速信号・電力接続部品。' },
  'Fiber-optic interconnects': { label: '光ファイバ接続部品', description: 'データセンターや通信機器の光配線を接続するコネクタ・アセンブリ。' },
  'High-speed data connectors': { label: '高速データコネクタ', description: 'AIサーバー・スイッチ間の高速信号接続を担うコネクタ。' },
  'Power connectors': { label: '電力コネクタ', description: 'サーバー・ラック・設備へ大電力を安全に供給する接続部品。' },
  'Fiber and cable connectivity': { label: '光・ケーブル接続製品', description: '光ファイバや銅線ケーブルを機器へ接続するコネクタ・配線製品群。' },
};

export const layerLabel = (value: string) => extraLayerLabels[value] ?? baseLayerLabel(value);
export const countryLabel = (value: string) => extraCountryLabels[value] ?? baseCountryLabel(value);
export const tagLabel = (value: string) => extraTagLabels[value] ?? baseTagLabel(value);
export const facilityTypeLabel = (value: string) => baseFacilityTypeLabel(value);
export const productInfo = (value: string): ProductInfo => extraProductInfo[value] ?? baseProductInfo(value);
export { joinJapanese };
