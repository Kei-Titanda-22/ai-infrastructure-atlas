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

export const layerLabel = (value: string) => layerLabels[value] ?? value;
export const countryLabel = (value: string) => countryLabels[value] ?? value;
