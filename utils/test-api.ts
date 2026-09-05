/**
 * Test utility to verify API connectivity and key validity
 */

const API_KEY = process.env.OPENWEATHER_API_KEY || '54feda8961a67020c70fb7a54f9f4bf3';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const testAPIConnectivity = async (): Promise<void> => {
  console.log('🧪 Testing API connectivity...');
  
  try {
    // Test with a known location (London)
    const testLat = 51.5074;
    const testLon = -0.1278;
    const url = `${BASE_URL}/weather?lat=${testLat}&lon=${testLon}&units=metric&appid=${API_KEY}`;
    
    console.log('🧪 Test URL:', url.replace(API_KEY, '[API_KEY]'));
    
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