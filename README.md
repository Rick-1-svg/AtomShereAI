# AtomSphere AI ☁️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Powered by AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)

> **A next-generation mobile weather application that combines real-time weather data with artificial intelligence to provide intelligent weather insights and personalized recommendations.**

<div align="center">
  <img src="./assets/images/icon.png" alt="AtomSphere AI Logo" width="200" />
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Performance Optimization](#-performance-optimization)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🌟 Overview

**AtomSphere AI** is a premium weather application built with React Native and Expo that revolutionizes weather forecasting by providing AI-powered insights that go beyond basic temperature readings. The app delivers a seamless, visually stunning experience with no authentication required, making weather information more actionable and understandable for users worldwide.

### Vision
Create a visually stunning weather application that delivers intelligent insights through AI, with no authentication required.

### Mission
Revolutionize weather forecasting by providing actionable, understandable AI-powered weather insights beyond basic temperature readings.

---

## ✨ Key Features

### 🌤️ Core Weather Features
- **Real-time Weather Data**: Accurate current weather conditions for any location worldwide
- **5-Day Forecast**: Detailed hourly and daily weather forecasts
- **Air Quality Index (AQI)**: Real-time air quality monitoring with health recommendations
- **Weather Metrics**: 
  - Temperature (with feels-like)
  - Humidity and atmospheric pressure
  - Wind speed and direction with compass visualization
  - UV index
  - Visibility
  - Sunrise/sunset times
  - Precipitation probability

### 🤖 AI-Powered Insights
- **Intelligent Weather Summaries**: Natural language weather analysis powered by Google Gemini AI
- **Activity Recommendations**: AI suggests suitable indoor/outdoor activities based on weather
- **Clothing Suggestions**: Smart recommendations based on current conditions
- **Weather Alerts**: Proactive notifications for significant weather events
- **Safety Tips**: Contextual health and safety advisories

### 📍 Location & Search
- **City Search**: Autocomplete search with support for cities worldwide
- **Location-based Weather**: Automatic weather detection for current location
- **Favorites System**: Save and quickly access your favorite locations
- **Nearby Cities**: Discover weather in nearby locations
- **Recent Searches**: Quick access to recently searched cities

### 🔔 Smart Notifications
- **Custom Weather Alerts**: Configure personalized notification rules
- **Temperature Thresholds**: Alerts when temperature exceeds/drops below set values
- **Rain Alerts**: Advance warning for upcoming precipitation
- **Air Quality Alerts**: Notifications for poor air quality
- **Golden Hour Notifications**: Perfect timing for photography
- **Storm Warnings**: Severe weather alerts
- **Morning/Evening Summaries**: Daily weather briefings
- **Smart Cooldown**: Prevents notification spam with intelligent throttling

### 🎨 User Experience
- **Beautiful UI/UX**: Premium glassmorphic design with smooth animations
- **Dynamic Weather Themes**: Background gradients that match current weather conditions
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Onboarding Flow**: Guided first-time user experience (one-time only)
- **Offline Support**: Cache weather data for offline access
- **Pull-to-Refresh**: Easy data updates with gesture
- **Responsive Design**: Optimized for all screen sizes

### 📊 Data Visualization
- **Animated Weather Icons**: Dynamic Meteocons weather iconography
- **Wind Compass**: Visual wind direction indicator
- **Forecast Charts**: Interactive hourly and daily forecasts
- **Metrics Grid**: Clean, organized weather parameter display
- **Progress Indicators**: Loading states and skeletons for better UX

### ⚡ Performance & Reliability
- **Smart Caching**: Stale-while-revalidate strategy for instant UI
- **Request Deduplication**: Prevents redundant API calls
- **Retry Logic**: Automatic retry for failed network requests
- **Offline Detection**: Network status monitoring with automatic sync
- **Optimized Animations**: 60fps smooth transitions
- **Memory Management**: Efficient resource usage (<100MB RAM)

---

## 📱 Screenshots

> *Add screenshots here to showcase the app's interface*

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React Native](https://reactnative.dev/) 0.81.5 with [React](https://reactjs.org/) 19.1.0
- **Platform**: [Expo](https://expo.dev/) ~54.0 with Expo Router (file-based routing)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.9.2
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) 5.0.8 with AsyncStorage persistence
- **Styling**: 
  - [Styled Components](https://styled-components.com/) 6.1.19
  - [TailwindCSS](https://tailwindcss.com/) 3.4.17 with custom utilities
  - [Class Variance Authority](https://cva.style/) for component variants
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) 4.1.1
- **UI Components**:
  - Custom component library
  - [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur-view/) for glassmorphism
  - [React Native SVG](https://github.com/software-mansion/react-native-svg) 15.12.1
  - [React Native Iconify](https://www.npmjs.com/package/react-native-iconify) for icons

### Backend & APIs
- **Weather Data**: [OpenWeatherMap API](https://openweathermap.org/api)
  - Current Weather API
  - 5-Day Forecast API
  - Geocoding API (city search)
  - Air Pollution API
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (gemini-2.5-flash-lite-preview)
- **Data Fetching**: [@tanstack/react-query](https://tanstack.com/query/latest) 5.90.2 for server state management

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9.25.0 with Expo configuration
- **Code Formatting**: Prettier with Tailwind plugin
- **Version Control**: Git
- **Module Bundler**: Metro (Expo default)

### Platform Support
- ✅ **iOS**: iPhone 12+ with iOS 14+
- ✅ **Android**: Android 8.0+ (API 26+)
- ✅ **Web**: Progressive Web App support via Expo Web

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Expo CLI**: Installed globally or via npx
- **Git**: For version control ([Download](https://git-scm.com/))

### For iOS Development (macOS only)
- Xcode 14+ with Command Line Tools
- iOS Simulator
- CocoaPods: `sudo gem install cocoapods`

### For Android Development
- Android Studio with SDK Platform 26+
- Android Emulator or physical device
- Java Development Kit (JDK) 11+

### API Keys Required
- **OpenWeatherMap API Key**: [Sign up here](https://openweathermap.org/api)
- **Google Gemini API Key**: [Get started here](https://ai.google.dev/)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/AtomShereAI.git
cd AtomShereAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Keys

#### Option A: Direct Configuration (Quick Start)
Edit the API keys directly in the source files:

**OpenWeatherMap API Key**:
```bash
# Edit services/api.ts
# Line 7: Replace with your API key
const API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';
```

**Google Gemini API Key**:
```bash
# Edit services/gemini.ts
# Line 4: Replace with your API key
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

#### Option B: Environment Variables (Recommended)
Create a `.env` file in the root directory:
```env
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Then update the service files to use environment variables.

### 4. Start the Development Server
```bash
npm start
# or
npx expo start
```

### 5. Run on Your Device/Emulator

#### iOS
```bash
# Press 'i' in the terminal, or:
npm run ios
```

#### Android
```bash
# Press 'a' in the terminal, or:
npm run android
```

#### Web
```bash
# Press 'w' in the terminal, or:
npm run web
```

---

## ⚙️ Configuration

### App Configuration
The main app configuration is in `app.json`:

```json
{
  "expo": {
    "name": "AtomSphere AI",
    "slug": "AtomShereAI",
    "version": "1.0.0",
    "scheme": "atomshereai",
    "orientation": "portrait"
  }
}
```

### TypeScript Configuration
TypeScript is configured via `tsconfig.json` with strict mode enabled:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Navigation
The app uses **Expo Router** with file-based routing:
- `app/(tabs)/index.tsx` - Home screen with city search
- `app/(tabs)/explore.tsx` - Weather details and AI insights
- `app/onboarding/` - First-time user onboarding (5 screens)
- `app/modal.tsx` - About screen
- `app/notifications.tsx` - Notification settings

---

## 💻 Usage

### Basic Usage

1. **First Launch**: Complete the onboarding flow (shown only once)
2. **Search for a City**: Use the search bar on the home screen
3. **View Weather**: Tap on a city to see detailed weather information
4. **Access AI Insights**: Scroll down to view AI-powered recommendations
5. **Save Favorites**: Tap the star icon to save favorite locations
6. **Manage Notifications**: Navigate to the notifications screen to configure alerts

### Advanced Features

#### Setting Up Weather Alerts
1. Navigate to the notifications screen
2. Grant notification permissions when prompted
3. Create custom rules based on:
   - Temperature thresholds
   - Rain probability
   - Air quality index
   - UV index
   - And more...

#### Using Location Services
1. Grant location permissions when prompted on the home screen
2. The app will automatically display weather for your current location
3. You can still search for other cities manually

#### Offline Mode
- The app automatically caches weather data
- When offline, previously viewed data remains accessible
- A banner indicates offline status and last update time

---

## 📂 Project Structure

```
AtomShereAI/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home screen
│   │   ├── explore.tsx          # Weather details screen
│   │   └── _layout.tsx          # Tab layout configuration
│   ├── onboarding/              # Onboarding flow (5 screens)
│   ├── modal.tsx                # About modal
│   ├── notifications.tsx        # Notification settings
│   └── _layout.tsx              # Root layout
│
├── assets/                       # Static assets
│   ├── images/                  # App images and icons
│   └── fonts/                   # Custom fonts
│
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── ScreenLayout.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── ...
│   ├── weather/                 # Weather-specific components
│   │   ├── AISummary.tsx        # AI insights display
│   │   ├── CityBottomSheet.tsx  # City selection
│   │   ├── CitySearchInput.tsx  # Search functionality
│   │   ├── ForecastContainer.tsx
│   │   ├── LocationWeather.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── WeatherIcon.tsx
│   │   ├── WindCompass.tsx
│   │   ├── charts/              # Weather charts
│   │   ├── forecast/            # Forecast components
│   │   └── skeletons/           # Loading skeletons
│   ├── notifications/           # Notification components
│   ├── onboarding/              # Onboarding components
│   └── home/                    # Home screen components
│
├── constants/                    # App constants
│   ├── theme.ts                 # Theme configuration
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── stores/                  # Zustand stores
│   │   ├── use-weather-store.ts
│   │   ├── use-onboarding-store.ts
│   │   └── use-notifications-store.ts
│   ├── use-location.ts          # Location services
│   ├── use-network-status.ts    # Network monitoring
│   ├── use-weather-theme.ts     # Dynamic theming
│   └── ...
│
├── services/                     # Service layer
│   ├── api.ts                   # Weather API client
│   ├── gemini.ts                # Google Gemini AI client
│   ├── cacheService.ts          # Data caching
│   ├── notificationService.ts   # Push notifications
│   │   - Note: Remote push (device push tokens) is not supported in Expo Go (SDK >=53). Use a development build (expo-dev-client) or EAS-built APK/IPA to test remote notifications.
│   ├── nearbyService.ts         # Nearby cities
│   ├── requestDedup.ts          # Request deduplication
│   ├── retryUtils.ts            # Retry logic
│   └── searchQueue.ts           # Search optimization
│
├── types/                        # TypeScript type definitions
│   ├── weather.ts               # Weather data types
│   ├── aiSummary.ts             # AI insights types
│   └── notifications.ts         # Notification types
│
├── utils/                        # Utility functions
│   └── transformWeatherData.ts  # Data transformations
│
├── docs/                         # Documentation
│   ├── CONTEXT.md               # Project context
│   ├── atomsphere_ai_prd.md     # Product requirements
│   ├── ONBOARDING.md            # Onboarding documentation
│   └── ...
│
├── scripts/                      # Utility scripts
│   ├── reset-project.js
│   ├── clearStorage.js
│   └── start-server-for-tests.js
│
├── dist/                         # Web build output
├── __tests__/                    # Test files
├── android/                      # Android native code
├── .expo/                        # Expo cache
├── node_modules/                 # Dependencies
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── metro.config.js               # Metro bundler config
└── README.md                     # This file
```

---

## 🔌 API Integration

### OpenWeatherMap API

The app integrates with multiple OpenWeatherMap endpoints:

#### Current Weather
```typescript
GET https://api.openweathermap.org/data/2.5/weather
Parameters:
  - lat: Latitude
  - lon: Longitude
  - units: metric
  - appid: API_KEY
```

#### 5-Day Forecast
```typescript
GET https://api.openweathermap.org/data/2.5/forecast
Parameters:
  - lat: Latitude
  - lon: Longitude
  - units: metric
  - appid: API_KEY
```

#### Geocoding (City Search)
```typescript
GET https://api.openweathermap.org/geo/1.0/direct
Parameters:
  - q: City name
  - limit: 5
  - appid: API_KEY
```

#### Air Pollution
```typescript
GET https://api.openweathermap.org/data/2.5/air_pollution
Parameters:
  - lat: Latitude
  - lon: Longitude
  - appid: API_KEY
```

**Rate Limits**: Free tier allows 1,000 calls/day

### Google Gemini AI

The app uses Google Gemini for AI-powered weather insights:

```typescript
Model: gemini-2.5-flash-lite-preview-09-2025
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/
```

**Features**:
- Natural language weather summaries
- Activity recommendations
- Clothing suggestions
- Weather alerts
- Safety tips

---

## 🔧 Development Workflow

### Available Scripts

```bash
# Start development server
npm start
npm run web:port      # Start web on specific port (8081)

# Platform-specific development
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run web version

# Testing
npm run test:server   # Start test server

# Utilities
npm run reset-project # Reset project to template
npm run lint          # Run ESLint
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Expo configuration with custom rules
- **Prettier**: Automatic formatting with Tailwind plugin
- **Naming Conventions**:
  - Components: PascalCase (`WeatherCard.tsx`)
  - Hooks: camelCase with `use` prefix (`useWeatherData.ts`)
  - Types: PascalCase (`WeatherData`)
  - Constants: UPPER_SNAKE_CASE (`API_KEY`)

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create Pull Request

**Commit Convention**: 
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build/tooling changes

---

## 🧪 Testing

### Test Structure
```
__tests__/
├── components/      # Component tests
└── services/        # Service tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Core business logic
- **Integration Tests**: API integrations
- **Component Tests**: UI components
- **E2E Tests**: Complete user workflows

---

## 🚢 Deployment

### Building for Production

#### iOS (App Store)
```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

Requirements:
- Apple Developer Account
- App Store Connect setup
- Provisioning profiles configured

#### Android (Google Play)
```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

Requirements:
- Google Play Developer Account
- App signing key
- Google Play Console setup

#### Web Deployment
```bash
# Build for web
npx expo export:web

# Output in dist/ folder
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

### Environment Configuration

Create separate configurations for development and production:

**Development**:
- Use test API keys
- Enable debugging
- Disable analytics

**Production**:
- Use production API keys
- Disable debugging
- Enable analytics
- Enable error tracking

---

## ⚡ Performance Optimization

### Implemented Optimizations

1. **Smart Caching**:
   - Stale-while-revalidate strategy
   - Background data refresh
   - Offline support

2. **Request Optimization**:
   - Request deduplication
   - Automatic retry with exponential backoff
   - Batch API calls

3. **Rendering Performance**:
   - React memo for expensive components
   - useMemo/useCallback for computations
   - Lazy loading for heavy components
   - Optimized animations (60fps)

4. **Memory Management**:
   - Proper cleanup in useEffect
   - Image optimization
   - Component unmounting

5. **Bundle Size**:
   - Code splitting
   - Tree shaking
   - Metro bundler optimization

### Performance Targets

- ✅ Launch time: < 3 seconds
- ✅ API response: < 2 seconds
- ✅ AI processing: < 5 seconds
- ✅ Memory usage: < 100MB RAM
- ✅ Animations: 60fps
- ✅ Offline support: Full functionality

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Keep PRs focused on a single feature/fix

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on the code, not the person

---

## 🐛 Troubleshooting

### Common Issues

#### API Key Issues
**Problem**: 404 errors or "Invalid API key"
**Solution**: 
- Verify your OpenWeatherMap API key is valid
- Check if the API key is correctly added to `services/api.ts`
- Ensure you're not exceeding rate limits

#### Location Permission Denied
**Problem**: Can't access current location
**Solution**:
- Grant location permissions in device settings
- Use manual city search as alternative
- Check `Info.plist` (iOS) or `AndroidManifest.xml` (Android) for permission declarations

#### Onboarding Appears Every Launch
**Problem**: Onboarding screens show repeatedly
**Solution**:
- Check AsyncStorage permissions
- Verify `_hasHydrated` is becoming `true` in store
- Clear app data and try again
- See `docs/ONBOARDING.md` for details

#### Build Errors
**Problem**: Build fails with dependency errors
**Solution**:
```bash
# Clear caches
rm -rf node_modules
npm cache clean --force

# Reinstall dependencies
npm install

# Clear Expo cache
npx expo start --clear
```

#### Notifications Not Working
**Problem**: Weather alerts don't appear
**Solution**:
- Grant notification permissions
- Check notification settings in app
- Verify notification rules are enabled
- Note: Some features limited in Expo Go

### Getting Help

- 📖 Check the [documentation](./docs/)
- 🐛 Open an [issue](https://github.com/yourusername/AtomShereAI/issues)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 AtomSphere AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgements

### Technologies & Services
- **[OpenWeatherMap](https://openweathermap.org/)** - Weather data API
- **[Google Gemini](https://ai.google.dev/)** - AI-powered insights
- **[Expo](https://expo.dev/)** - React Native framework
- **[React Native](https://reactnative.dev/)** - Mobile development
- **[Meteocons](https://bas.dev/work/meteocons)** - Animated weather icons

### Open Source Libraries
- All the amazing open-source contributors whose libraries power this app
- See [package.json](./package.json) for complete list of dependencies

### Inspiration
- Modern weather apps for UI/UX inspiration
- Weather enthusiasts and beta testers

---


## 🗺️ Roadmap

### Current Version: 1.0.0
- ✅ Real-time weather data
- ✅ AI-powered insights
- ✅ Custom notifications
- ✅ Location services
- ✅ Offline support

### Upcoming Features
- 🔜 **v1.1.0**: Home screen widgets
- 🔜 **v1.2.0**: Apple Watch / Wear OS support
- 🔜 **v1.3.0**: Weather radar maps
- 🔜 **v2.0.0**: Premium features & themes
- 🔜 **Future**: Social sharing, historical data, multi-language support

---

<div align="center">

**Made with ❤️ by weather enthusiasts for weather enthusiasts**

⭐ Star this repo if you find it helpful!

</div>
