# Location Weather Troubleshooting Guide

## Issues Fixed

### 1. ✅ Expo Networking Issues
**Problem**: "Networking has been disabled" error when running `npx expo start`

**Root Cause**: 
- Internet connectivity issues preventing Expo from reaching version endpoints
- Port conflicts on 8081

**Solution Applied**:
- Used `--clear` flag to clear cache
- Started Expo on port 8082 to avoid conflicts
- The networking warning doesn't prevent the app from functioning

**Command**: `npx expo start --port 8082 --clear`

### 2. ✅ Location Weather Component Debugging
**Problem**: "Your Location Weather" section not displaying location requests or live weather data

**Comprehensive Debugging Added**:

#### A. Enhanced Logging
- ✅ Added detailed console logs throughout the entire flow
- ✅ LocationWeather component lifecycle tracking
- ✅ useLocation hook state tracking
- ✅ API call debugging with response status
- ✅ Permission status logging

#### B. API Connectivity Testing
- ✅ Created `utils/test-api.ts` for API testing
- ✅ Added automatic API test on component mount
- ✅ API key validation and error response logging

#### C. Manual Testing Tools (Development Only)
- ✅ Added debug buttons for manual testing:
  - 📏 Force Location Request button
  - 🎆 Test API with NYC coordinates button
  - 🧪 Test with NYC button (in permission screen)

## How to Debug Location Weather Issues

### Step 1: Check Console Logs
Look for these log patterns when the app loads:

```
🎆 LocationWeather: Component mounted/rendered
🔍 LocationWeather: Current state: { hasPermission: false, locationLoading: false, ... }
🔐 useLocation: Checking initial permission status...
🔐 useLocation: Current permission status: [status]
🧪 Testing API connectivity...
🧪 Test URL: https://api.openweathermap.org/data/2.5/weather?lat=51.5074&lon=-0.1278&units=metric&appid=[API_KEY]
```

### Step 2: Test API Connectivity
The component automatically tests API connectivity on mount. Look for:
- ✅ `API Test SUCCESS` = API is working
- ❌ `API Test FAILED` = Check internet connection or API key

### Step 3: Test Location Services
1. **Check Permission Status**: Look for permission logs
2. **Manual Test**: Use debug buttons (development only)
3. **Force Request**: Try the "📏 Force Location Request" button

### Step 4: Common Issues & Solutions

#### Issue: API Key Invalid
**Symptoms**: 
- API test fails with 401 status
- Weather fetch fails with authentication error

**Solution**:
- Verify API key in `services/api.ts` (line 4)
- Get new key from https://openweathermap.org/api

#### Issue: Location Permission Denied
**Symptoms**:
- Permission status shows "denied"
- Location request fails immediately

**Solution**:
- Check device location settings
- Restart app and try again
- Use manual test with NYC coordinates

#### Issue: Network/Internet Problems
**Symptoms**:
- API test fails with network error
- Fetch requests timeout

**Solution**:
- Check internet connection
- Try using mobile data vs WiFi
- Check firewall/proxy settings

#### Issue: GPS/Location Services Disabled
**Symptoms**:
- Permission granted but location fetch fails
- "Failed to get current location" error

**Solution**:
- Enable location services in device settings
- Ensure GPS is enabled
- Try outdoors for better signal

## Testing Flow

### 1. Automatic Tests (On Component Mount)
- API connectivity test with London coordinates
- Permission status check
- Component state logging

### 2. Manual Tests (Debug Buttons)
- Force location request
- Test with fixed NYC coordinates (40.7128, -74.0060)

### 3. Expected Behavior
1. Component mounts → Shows permission request UI
2. User taps "Enable Location" → Permission dialog appears
3. Permission granted → GPS fetches location
4. Location obtained → Weather API called
5. Weather received → Display weather card

## Log Examples

### Successful Flow:
```
🎆 LocationWeather: Component mounted/rendered
🔐 useLocation: Current permission status: granted
📍 useLocation: Getting current location...
📍 useLocation: Location obtained: { lat: 40.7128, lon: -74.006, accuracy: 15 }
🌦️ LocationWeather: Starting weather fetch for coordinates: 40.7128 -74.006
🌐 API: Response status: 200 OK
✅ LocationWeather: Weather data set successfully
```

### Failed API Flow:
```
🧪 API Test FAILED: { status: 401, statusText: "Unauthorized", body: "Invalid API key" }
❌ LocationWeather: Error fetching weather: API error: 401 Unauthorized
```

### Failed Permission Flow:
```
🔐 useLocation: Permission request result: denied
⚠️ useLocation: Permission denied: Location permission was denied
```

## File Changes Made

1. **`components/weather/LocationWeather.tsx`**
   - Added comprehensive logging
   - Added debug buttons
   - Added API connectivity test

2. **`hooks/use-location.ts`** 
   - Added detailed permission and location logging
   - Enhanced error messages

3. **`services/api.ts`**
   - Added API request/response logging
   - Better error handling with response body

4. **`utils/test-api.ts`** (New)
   - API connectivity testing utility

## Next Steps

1. **Run the App**: `npx expo start --port 8082 --clear`
2. **Open Console**: Check Metro bundler console for logs
3. **Test Location**: Navigate to home page and check "Your Location Weather"
4. **Use Debug Tools**: Try the debug buttons if location doesn't work
5. **Check Logs**: Follow the log patterns above to identify issues

## Production Considerations

- All debug buttons are wrapped in `__DEV__` checks
- Console logs can be removed/reduced for production
- Consider adding user-friendly error messages
- Add retry mechanisms for failed requests