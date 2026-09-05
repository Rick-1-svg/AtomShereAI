# AtomSphere AI

## Project Context

AtomSphere AI is a next-generation mobile weather application that combines real-time weather data with artificial intelligence to provide users with intelligent weather insights and summaries.

## Vision & Mission

**Vision**: Create a visually stunning weather application that delivers intelligent insights through AI, with no authentication required.

**Mission**: Revolutionize weather forecasting by providing actionable, understandable AI-powered weather insights beyond basic temperature readings.

## Key Success Metrics

| Metric | Target |
|--------|--------|
| User Engagement | DAU > 10K within 6 months |
| User Experience | App store rating > 4.5 stars |
| Performance | App load time < 3 seconds |
| AI Accuracy | User satisfaction with AI summaries > 85% |

## Product Features

### Core Features

1. **City Search**
   - Autocomplete suggestions
   - Partial name matching
   - Country/state information
   - Error handling
   - Recent searches (max 10)

2. **Weather Display**
   - Current temperature (C°/F° toggle)
   - Weather condition with icons
   - Feels-like temperature
   - Humidity, pressure, visibility
   - Wind speed and direction
   - UV index
   - Sunrise/sunset times
   - 5-day forecast

3. **AI Weather Summary**
   - Contextual weather analysis via Gemini API
   - Outdoor activity recommendations
   - Clothing suggestions
   - Health and comfort advisories
   - Travel impact assessments
   - Auto-updating summaries

4. **Theme Switching**
   - Smooth transition animations
   - System theme detection
   - Local preference saving
   - Consistent theming

### Advanced Features

1. **Location Services** (Optional)
   - Permission handling
   - Manual search fallback
   - Default location screen

2. **Weather Widgets**
   - Temperature/condition cards
   - Hourly forecast slider
   - Weekly forecast grid
   - Interactive charts

## Technical Architecture

### Frontend Stack
- React Native with TypeScript
- Expo with Expo Router
- React Native Paper
- ReactBits.dev components
- React Context API / Redux Toolkit

### Backend Stack
- Next.js (API routes)
- Node.js
- Stateless application (no database)

### External APIs
- **OpenWeatherMap API**
  - Current Weather: `https://api.openweathermap.org/data/2.5/weather`
  - 5-day Forecast: `https://api.openweathermap.org/data/2.5/forecast`
  - Geocoding: `https://api.openweathermap.org/geo/1.0/direct`
  - Rate limit: 1000 calls/day (free tier)

- **Google Gemini API**
  - Model: Gemini Pro
  - Input: Weather data + context
  - Output: Formatted insights and recommendations

### Architecture Flow
```
Mobile App (React Native + Expo)
        ↓
Next.js Backend API
        ↓
External APIs (OpenWeatherMap + Google Gemini)
```

## User Experience

### Design Principles
- Minimalism
- Clear visual hierarchy
- Consistent patterns
- WCAG 2.1 AA accessibility
- 60fps animations

### Screen Flow
```
Splash Screen → Search Screen (Default) → Weather Details Screen → AI Summary Modal/Screen
```

### UI Elements
- **Color Palette**
  - Light: Blues, whites, soft grays
  - Dark: Deep blues, charcoals, accent colors
- **Typography**: SF Pro/Roboto
- **Icons**: Animated weather iconography
- **Animations**: Smooth transitions and micro-interactions

### Mobile-First Design
- Responsive for various screen sizes
- 44px minimum touch targets
- Gesture-friendly navigation
- Thumb-friendly layout

## Performance Requirements

### App Performance
- Launch time: < 3 seconds
- API response: < 2 seconds
- AI processing: < 5 seconds
- Memory usage: < 100MB RAM
- Minimal battery impact

### Offline Capabilities
- Cached city weather data
- Graceful offline mode
- Network status detection

## Security & Privacy

- No personal data collection
- Local storage for preferences only
- Secure API key management
- Environment-specific configuration
- Error logging without sensitive data

## Development Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| MVP | 4-6 weeks | Basic search, weather display, AI summary, theme toggle |
| Enhancement | 3-4 weeks | 5-day forecast, enhanced AI, UI refinements |
| Polish | 2-3 weeks | Animations, location services, accessibility, beta testing |

## Testing Strategy

- **Unit Testing**: Core business logic
- **Integration Testing**: API integrations
- **UI Testing**: Interface components
- **E2E Testing**: Complete user workflows
- **Performance Testing**: Load and stress tests

### Device Coverage
- iOS: iPhone 12+ (iOS 14+)
- Android: Devices with Android 8+ (API 26+)
- Various screen sizes and network conditions

## Deployment & Distribution

### App Store Requirements
- iOS App Store Connect submission
- Google Play Console submission
- App store optimization (ASO)
- Screenshots and descriptions

### Backend Deployment
- Serverless deployment
- Environment configuration
- CI/CD pipeline
- Monitoring and logging

## Risk Assessment

### Technical Risks
- API rate limits: Implement caching
- AI response quality: Content validation
- Performance issues: Regular monitoring
- Third-party dependencies: Version management

### Mitigation Strategies
- Comprehensive error handling
- Offline capabilities
- Progressive loading
- API monitoring and alerting

## Future Roadmap

### Potential Features
- Weather alerts and notifications
- Multiple location tracking
- Weather history and trends
- Social sharing
- Home screen widgets
- Wearable device support

### Scaling Considerations
- Premium features/monetization
- Advanced AI capabilities
- Additional weather service integrations
- International localization

## Database Schema Design

Although the application is primarily stateless, we'll implement a lightweight database schema to support offline capabilities, caching, and user preferences:

### Tables

#### 1. User Preferences

```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    temperature_unit TEXT DEFAULT 'celsius',
    theme_mode TEXT DEFAULT 'system',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_device_id (device_id)
);
```

#### 2. Saved Locations

```sql
CREATE TABLE saved_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    city_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    is_current BOOLEAN DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(device_id, city_name, country_code),
    
    -- Indexes
    INDEX idx_device_locations (device_id, last_accessed)
);
```

#### 3. Weather Cache

```sql
CREATE TABLE weather_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    weather_data TEXT NOT NULL, -- JSON blob of weather data
    forecast_data TEXT, -- JSON blob of forecast data
    ai_summary TEXT, -- AI-generated summary
    cache_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_timestamp TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    FOREIGN KEY (location_id) REFERENCES saved_locations(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_location_cache (location_id, cache_timestamp),
    INDEX idx_cache_expiry (expiry_timestamp)
);
```

#### 4. Recent Searches

```sql
CREATE TABLE recent_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    search_query TEXT NOT NULL,
    city_name TEXT,
    country_code TEXT,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_device_searches (device_id, search_timestamp)
);
```

### Relationships

1. One device can have one set of preferences (1:1)
2. One device can have many saved locations (1:N)
3. One saved location can have one weather cache entry (1:1)
4. One device can have many recent searches (1:N)

### Data Flow

1. User preferences are stored locally and synced with the database
2. Weather data is fetched from external APIs and cached
3. Recent searches are tracked for quick access
4. Saved locations allow quick access to frequently checked weather

## Project Folder Structure

```
atomsphere-ai/
├── .github/                      # GitHub workflows and templates
│   └── workflows/                # CI/CD pipeline configurations
│
├── apps/                         # Application code
│   ├── mobile/                   # React Native mobile app
│   │   ├── assets/               # Static assets (images, fonts)
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   │   ├── common/       # Shared components
│   │   │   │   ├── weather/      # Weather-specific components
│   │   │   │   └── ui/           # UI library components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── navigation/       # Navigation configuration
│   │   │   ├── screens/          # Screen components
│   │   │   ├── services/         # API services
│   │   │   ├── store/            # State management
│   │   │   ├── theme/            # Theming configuration
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   └── utils/            # Utility functions
│   │   ├── app.json              # Expo configuration
│   │   ├── App.tsx               # Root component
│   │   └── package.json          # Dependencies
│   │
│   └── api/                      # Next.js API backend
│       ├── src/
│       │   ├── pages/            # Next.js pages and API routes
│       │   │   └── api/          # API endpoints
│       │   ├── lib/              # Shared libraries
│       │   ├── services/         # External service integrations
│       │   │   ├── weather/      # Weather API integration
│       │   │   └── ai/           # Gemini AI integration
│       │   ├── types/            # TypeScript type definitions
│       │   └── utils/            # Utility functions
│       └── package.json          # Dependencies
│
├── packages/                     # Shared packages
│   ├── eslint-config/            # ESLint configuration
│   ├── tsconfig/                 # TypeScript configuration
│   └── ui/                       # Shared UI components
│
├── docs/                         # Documentation
│   ├── CONTEXT.md                # Project context and architecture
│   └── atomsphere_ai_prd.md      # Product requirements document
│
├── scripts/                      # Development and build scripts
├── .eslintrc.js                  # ESLint configuration
├── .gitignore                    # Git ignore file
├── package.json                  # Root package.json for workspaces
├── README.md                     # Project overview
└── turbo.json                    # Turborepo configuration
```

### Key Architectural Decisions

1. **Monorepo Structure**: Using a monorepo with Turborepo for managing the mobile app and API backend
2. **Separation of Concerns**: Clear separation between mobile app and API backend
3. **Shared Packages**: Common configurations and UI components shared across projects
4. **Feature-based Organization**: Components organized by feature for better maintainability
5. **Type Safety**: TypeScript used throughout the codebase for type safety

---

**Document Version**: 1.0  
**Last Updated**: September 24, 2025  
**Next Review**: October 15, 2025