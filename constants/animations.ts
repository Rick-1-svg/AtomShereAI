export const SCALE_HIERARCHY = {
  hero: 1.0,
  primary: 0.95,
  secondary: 0.9,
  chips: 0.85
};

export const TIMING = {
  shimmer: 1200,        // Shimmer loop duration (reduced from 1500ms)
  cardScale: 400,       // Card scale spring duration (reduced from 600ms)
  stagger: 50,          // Sequential loading delay (reduced from 100ms)
  blurTransition: 200,  // Blur in/out timing (reduced from 300ms)
  segmentedControl: 200, // Segmented control transition
  forecastView: 300,    // Forecast view transitions
  modalSlide: 300       // Modal slide animations
} as const;

export const SHIMMER_COLORS = {
  light: {
    start: 'rgba(240, 240, 240, 0.8)',
    middle: 'rgba(255, 255, 255, 1)',
    end: 'rgba(240, 240, 240, 0.8)'
  },
  dark: {
    start: 'rgba(60, 60, 60, 0.8)',
    middle: 'rgba(120, 120, 120, 1)',
    end: 'rgba(60, 60, 60, 0.8)'
  }
} as const;
