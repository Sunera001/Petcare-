export const Colors = {
  // Primary
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#4DA1FF',

  // Secondary
  secondary: '#5856D6',
  secondaryDark: '#3634A3',
  secondaryLight: '#7D7BE8',

  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Status
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  card: '#FFFFFF',

  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  borderDark: '#BDBDBD',

  // Shadows
  shadow: '#000000',
};

export const DarkColors = {
  ...Colors,
  // Override for dark mode
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  card: '#2C2C2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
};
