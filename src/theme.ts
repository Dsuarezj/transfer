import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    // Yale Blue - Color primario (azul oscuro #093D77)
    primary: {
      50: '#E6EEF5',
      100: '#C0D3E6',
      200: '#99B8D6',
      300: '#739DC7',
      400: '#4C82B7',
      500: '#2667A8',
      600: '#165196',
      700: '#093D77',
      800: '#072D56',
      900: '#041D38',
    },
    // Cerulean - Color secundario (azul medio #3A7CA5)
    accent: {
      50: '#E9F2F7',
      100: '#C8DEEB',
      200: '#A7CADE',
      300: '#86B6D2',
      400: '#65A2C5',
      500: '#4489B4',
      600: '#3A7CA5',
      700: '#2C5E7D',
      800: '#1E4155',
      900: '#10232D',
    },
    // Goldenrod - Color de acento cálido (dorado #DAA520)
    secondary: {
      50: '#FDF8EB',
      100: '#FAEDC7',
      200: '#F7E1A3',
      300: '#F4D57F',
      400: '#F1C95B',
      500: '#EEBE37',
      600: '#DAA520',
      700: '#B38819',
      800: '#8C6A13',
      900: '#664D0D',
    },
    // Seasalt y Jet - Colores neutros (#F8F9FA y #2B2B2B)
    neutral: {
      50: '#F8F9FA',
      100: '#F1F3F5',
      200: '#E9ECEF',
      300: '#DEE2E6',
      400: '#CED4DA',
      500: '#ADB5BD',
      600: '#6C757D',
      700: '#495057',
      800: '#343A40',
      900: '#2B2B2B',
    },
    // Colores para éxito (verde suave)
    success: {
      50: '#E6F9F0',
      100: '#B8EED5',
      200: '#8AE3BA',
      300: '#5CD89F',
      400: '#2ECD84',
      500: '#00C269',
      600: '#009B54',
      700: '#00743F',
      800: '#004D2A',
      900: '#002715',
    },
    // Colores para peligro/error
    danger: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337',
    },
    // Fondos y gradientes
    background: {
      gradient: {
        start: '#E9F2F7',
        end: '#C8DEEB',
      },
      card: '#FFFFFF',
      overlay: 'rgba(9, 61, 119, 0.4)',
    },
  },
  semanticTokens: {
    colors: {
      'bg-gradient-start': {
        default: 'background.gradient.start',
      },
      'bg-gradient-end': {
        default: 'background.gradient.end',
      },
      'brand-primary': {
        default: 'accent.500',
      },
      'brand-secondary': {
        default: 'secondary.400',
      },
      'card-bg': {
        default: 'background.card',
      },
    },
  },
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  space: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: '12px',
      },
      variants: {
        solid: {
          bg: 'accent.500',
          color: 'white',
          _hover: {
            bg: 'accent.600',
            transform: 'translateY(-2px)',
            boxShadow: 'buttonHover',
          },
          _active: {
            bg: 'accent.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        },
        outline: {
          borderColor: 'accent.500',
          color: 'accent.500',
          _hover: {
            bg: 'accent.50',
          },
        },
      },
      sizes: {
        lg: {
          h: '56px',
          fontSize: 'lg',
          px: 8,
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '16px',
          boxShadow: 'card',
          overflow: 'hidden',
        },
      },
    },
  },
  shadows: {
    card: '0 4px 20px rgba(9, 61, 119, 0.08)',
    cardHover: '0 8px 30px rgba(58, 124, 165, 0.15)',
    buttonHover: '0 4px 12px rgba(58, 124, 165, 0.3)',
    soft: '0 2px 8px rgba(43, 43, 43, 0.1)',
    medium: '0 10px 40px rgba(9, 61, 119, 0.12)',
  },
});

export default theme;
