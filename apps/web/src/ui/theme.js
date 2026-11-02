import { createTheme } from '@mantine/core';

// BehaviorLens palette. "brand" is the action blue the dashboard was designed
// around (#0075e3 at index 6), "navy" carries text, borders and secondary controls.
export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: 'sm',
  colors: {
    brand: [
      '#e6f4ff', '#cce7ff', '#99cfff', '#66b5ff', '#339cf5',
      '#1a89ec', '#0075e3', '#0062c0', '#004f9c', '#003c78'
    ],
    navy: [
      '#f3f3fe', '#e3e5f5', '#c7c9dc', '#979dc6', '#6f76a7',
      '#4f568a', '#343c6a', '#252d5b', '#0a1551', '#050b2e'
    ]
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }
});
