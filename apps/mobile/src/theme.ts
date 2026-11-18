// 「紫微夜色」深色主题，色值来自 docs/design/DESIGN.md
export const color = {
  canvas: '#120D20',
  surface: '#1F1634',
  surface2: '#291E43',
  related: '#3D255A',
  text: '#F8F0FF',
  text2: '#C1B2D4',
  accent: '#C17BFF',
  primary: '#9144EB',
  primaryDeep: '#7430D1',
  onPrimary: '#FFFAFF',
  border: '#A58ABA',
  separator: '#4B326A',
  gold: '#FFD78F',
  danger: '#FF8FA3',
} as const;

/** 四化配色：禄绿、权蓝、科金、忌红，压低饱和度以配深紫底 */
export const hua = {
  禄: '#7EE0A8',
  权: '#8FB8FF',
  科: '#FFD78F',
  忌: '#FF8FA3',
} as const;

export const gradient = {
  primary: [color.primary, color.primaryDeep] as const,
};

export const font = {
  // 品牌字与少量展示标题用宋体风格的思源宋体（iOS 自带字库里没有中文宋体），其余用系统字体
  serif: 'NotoSerifSC_400Regular',
};

export const space = { page: 20, gap: 12, card: 16 } as const;
export const radius = { card: 18, cell: 0, button: 14, chip: 999 } as const;
