# Sticky Mini-Header and City Bottom Sheet Feature

## Overview

This feature adds a sticky mini-header that appears after scrolling past the hero panel, along with a bottom sheet for city switching and favorites management.

## Components Added

### 1. StickyMiniHeader (`components/weather/StickyMiniHeader.tsx`)
- **Visibility**: Hidden at top, animates in when scrolling past hero panel (~200px)
- **Contents**: City name, current temperature, action buttons
- **Actions**: 
  - Refresh button (triggers weather data fetch with loading state)
  - Favorite toggle (persists to AsyncStorage)
  - City switcher button (opens bottom sheet)
- **Animations**: Fade+slide in/out with press feedback
- **Accessibility**: Full ARIA support with roles and labels

### 2. CityBottomSheet (`components/weather/CityBottomSheet.tsx`)
- **Snap Points**: 60% (work height) with drag-to-dismiss
- **Tabs**: 
  - **Favorites**: Shows user-saved cities with star toggle
  - **Nearby**: Placeholder for location-based cities
  - **Search**: Real-time debounced city search (250ms)
- **Features**:
  - Pan gesture drag-to-close
  - Backdrop tap to close
  - Search with debounced API calls
  - Loading shimmer states
  - Empty state illustrations

### 3. WeatherStore (`hooks/stores/use-weather-store.ts`)
- **Persistence**: AsyncStorage with versioning
- **Features**:
  - Favorite cities management
  - Filter state (country, temperature, precipitation, AQI)
  - Selected city tracking
- **Methods**: `addFavorite()`, `removeFavorite()`, `isFavorite()`, filter management

### 4. DebounceSearch Hook (`hooks/use-debounced-search.ts`)
- **Debounce**: 250ms delay for API efficiency
- **States**: `isSearching`, `searchResults`, `searchError`
- **Auto-clear**: Clears results when query is empty

## Manual QA Steps

### Scroll Behavior
1. ✅ Open explore screen with weather data
2. ✅ Scroll down slowly - sticky header should appear smoothly after ~200px
3. ✅ Scroll back up - header should hide when reaching top
4. ✅ Verify smooth animations without jank

### City Switcher (Bottom Sheet)
1. ✅ Tap city name in sticky header OR map-search icon → opens bottom sheet
2. ✅ Verify sheet opens at 60% height
3. ✅ Drag handle down → sheet should close
4. ✅ Tap backdrop → sheet should close
5. ✅ Sheet should handle device rotation

### Search Functionality
1. ✅ Open bottom sheet → Search tab
2. ✅ Type in search box → should show loading after 250ms
3. ✅ Verify results appear with city names and countries
4. ✅ Tap city result → should close sheet and navigate to new city
5. ✅ Clear search → results should disappear

### Favorites Management
1. ✅ Search for a city → tap heart icon → should toggle favorite
2. ✅ Go to Favorites tab → city should appear in list
3. ✅ Tap heart again → should remove from favorites
4. ✅ Close app and reopen → favorites should persist
5. ✅ Tap favorite city → should navigate to that city's weather

### Refresh Functionality
1. ✅ Tap refresh in sticky header → should show loading spinner
2. ✅ Weather data should update after API call
3. ✅ Loading state should clear when complete
4. ✅ Works both in sticky header and main refresh button

### Accessibility Testing
1. ✅ Enable screen reader
2. ✅ All buttons should have proper labels
3. ✅ Sticky header should announce as "header" role
4. ✅ Search input should have clear description
5. ✅ Tab navigation should work properly
6. ✅ Focus should trap within bottom sheet when open

## Performance Testing

### Scroll Performance
- ✅ No frame drops during scroll animations
- ✅ Smooth header appearance/disappearance
- ✅ No layout thrashing

### Search Performance  
- ✅ Debounced search prevents excessive API calls
- ✅ Results appear within reasonable time (<1s)
- ✅ Typing rapidly doesn't cause UI freeze

### Memory Usage
- ✅ Bottom sheet properly cleans up when closed
- ✅ Search results are properly garbage collected
- ✅ No memory leaks after multiple open/close cycles

## Error Handling

### Network Errors
- ✅ Search API failures show error message
- ✅ Refresh failures show error state
- ✅ Graceful fallback for missing data

### Edge Cases
- ✅ Empty search results show helpful message
- ✅ No favorites shows onboarding message
- ✅ Long city names truncate properly
- ✅ Handles rapid tab switching

## Integration Points

### With Existing Code
- ✅ Uses existing `searchCities()`, `getCurrentWeather()`, `getForecast()` API functions
- ✅ Maintains current theme and typography
- ✅ Works with existing navigation (useRouter)
- ✅ Integrates with existing weather state

### Storage Integration
- ✅ Uses same AsyncStorage pattern as onboarding store
- ✅ Proper versioning for future migrations
- ✅ Hydration waits before rendering

## Known Limitations

1. **Nearby Cities**: Currently shows placeholder - would need location permissions
2. **Advanced Filters**: Temperature/AQI filtering requires fetching weather for each city
3. **Offline Support**: No cached city data for offline search
4. **Infinite Scroll**: Search results limited to API response size

## Future Enhancements

1. **Location Services**: Add geolocation for nearby cities
2. **Weather Filters**: Implement server-side filtering by weather conditions
3. **Favorites Sync**: Cloud sync across devices
4. **Search History**: Store recent searches locally
5. **City Images**: Add city photos to search results
6. **Push Notifications**: Weather alerts for favorite cities