/**
 * Test utility to verify API connectivity and key validity
 */

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const testAPIConnectivity = async (): Promise<void> => {
  console.log('🧪 Testing API connectivity...');
  
  try {
    // Test with a known location (London)
    const testLat = 51.5074;
    const testLon = -0.1278;
    const url = `${API_BASE_URL}/weather?lat=${testLat}&lon=${testLon}`;
    
    console.log('🧪 Test URL:', url);
    
    const response = await fetch(url);
    console.log('🧪 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Test SUCCESS - Sample data:', {
        location: data.name,
        country: data.sys.country,
        temp: data.main.temp,
        description: data.weather[0]?.description
      });
      return;
    } else {
      const errorText = await response.text();
      console.error('❌ API Test FAILED:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
    }
  } catch (error) {
    console.error('❌ API Test ERROR:', error);
  }
};