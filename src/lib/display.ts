export const layerLabels: Record<string, string> = {
  'Compute & Silicon': '計算半導体',
  'Foundry & Logic Manufacturing': 'ファウンドリ・ロジック製造',
  'Memory': 'メモリ',
  'Wafer Fab Equipment': '半導体前工程装置',
  'Test & Back-end': 'テスト・後工程',
  'Network & Optical': 'ネットワーク・光通信',
  'Data Center & Facilities': 'データセンター・電力・冷却',
  'Physical AI': 'Physical AI',
};

export const countryLabels: Record<string, string> = {
  'United States': '米国',
  'Japan': '日本',
  'Taiwan': '台湾',
  'South Korea': '韓国',
  'Netherlands': 'オランダ',
  'Ireland': 'アイルランド',
};

export const tagLabels: Record<string, string> = {
  'AI accelerator': 'AIアクセラレータ',
  'data center': 'データセンター',
  'foundry': 'ファウンドリ',
  'advanced node': '先端プロセス',
  'advanced packaging': '先端パッケージ',
  'flash memory': 'フラッシュメモリ',
  'lithography': '露光',
  'coater developer': '塗布現像',
  'deposition': '成膜',
  'cleaning': '洗浄',
  'etch': 'エッチング',
  'semiconductor test': '半導体テスト',
  'data center switching': 'データセンタースイッチ',
  'AI networking': 'AIネットワーク',
  'optical fiber': '光ファイバ',
  'data center cable': 'データセンター配線',
  'wiring': '配線',
  'power distribution': '配電',
  'cooling': '冷却',
  'robotics': 'ロボット',
};

export const facilityTypeLabels: Record<string, string> = {
  fab: '半導体工場',
  plant: '工場',
  'rd-production': '開発・製造',
  rd: '研究開発',
  works: '事業所',
};

export const layerLabel = (value: string) => layerLabels[value] ?? value;
export const countryLabel = (value: string) => countryLabels[value] ?? value;
export const tagLabel = (value: string) => tagLabels[value] ?? value;
export const facilityTypeLabel = (value: string) => facilityTypeLabels[value] ?? value;
