// constants/Colors.ts
export const light = {
    primary: '#E60040',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    surface: '#EFEFEF',
    text: '#151515',
    secondaryText: '#5A5A5A',
    border: '#DDDDDD',
    subText: '#777777',
    overlay: 'rgba(0, 0, 0, 0.6)',
    modalBackground: '#fff',
  } as const;
  
  export const dark = {
    primary: '#E60040',
    onPrimary: '#FFFFFF',
    onSecondary: '#191919',
    // background: '#0A0A0A',
    background: '#000',
    cardBackground: '#161616',
    surface: '#222222',
    text: '#FFFFFF',
    secondaryText: '#B3B3B3',
    border: '#444444',
    subText: '#999999',
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1e1e1e',
  } as const;
  
  export const themes = { light, dark };
  export type ThemeType = typeof light | typeof dark;
  