import { createTheme } from '@mantine/core';

export const theme = createTheme({
  /** Primary color - used for primary buttons, links, etc */
  primaryColor: 'blue',
  
  /** Font family */
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  /** Font sizes */
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },

  /** Spacing values */
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  /** Border radius */
  radius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '2rem',
  },

  /** Breakpoints for responsive design */
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },

  /** Component-specific overrides */
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        padding: 'lg',
        radius: 'md',
        withBorder: true,
      },
    },
    Input: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});
