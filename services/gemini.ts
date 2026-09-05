import { AIWeatherInsight, EMPTY_INSIGHT } from '../types/aiSummary';
import { ForecastData, WeatherData } from '../types/weather';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Build weather data context string for prompts
 */
const buildWeatherContext = (weatherData: WeatherData, forecastData: ForecastData): string => {
  return `
Current Weather:
- Location: ${weatherData.location.name}, ${weatherData.location.country}
- Temperature: ${weatherData.current.temp}°C (Feels like: ${weatherData.current.feels_like}°C)
- Condition: ${weatherData.current.description}
- Humidity: ${weatherData.current.humidity}%
- Pressure: ${weatherData.current.pressure} hPa
- Visibility: ${weatherData.current.visibility ? weatherData.current.visibility / 1000 : 'N/A'} km
- Wind: ${weatherData.current.wind_speed} m/s, ${weatherData.current.wind_deg}°
- UV Index: ${weatherData.current.uvi ?? 'N/A'}
- Sunrise: ${weatherData.current.sunrise ? new Date(weatherData.current.sunrise * 1000).toLocaleTimeString() : 'N/A'}
- Sunset: ${weatherData.current.sunset ? new Date(weatherData.current.sunset * 1000).toLocaleTimeString() : 'N/A'}

5-Day Forecast:
${forecastData.forecast.slice(0, 8).map(item => `
  ${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()}
  Temp: ${item.temp}°C, Condition: ${item.description}, Rain chance: ${item.pop ? Math.round(item.pop * 100) : 0}%
`).join('')}
  `;
};

/**
 * Make a request to the Gemini API
 */
const callGeminiAPI = async (prompt: string): Promise<string | null> => {
  const response = await fetch(`${API_BASE_URL}/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error.message}`);
  }

  const data = await response.json();

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  return null;
};

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
const parseJSONFromResponse = <T>(text: string): T | null => {
  try {
    // Try to extract JSON from markdown code blocks first
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try parsing the whole response as JSON
    return JSON.parse(text.trim());
  } catch {
    console.log('Failed to parse JSON from response:', text.substring(0, 200));
    return null;
  }
};

/**
 * Get structured weather insights with activity recommendations, clothing suggestions, and alerts
 */
export const getStructuredWeatherInsights = async (
  weatherData: WeatherData,
  forecastData: ForecastData,
  context: string = ''
): Promise<AIWeatherInsight> => {
  try {
    const weatherContext = buildWeatherContext(weatherData, forecastData);

    const prompt = `You are a friendly weather advisor. Based on the weather data below, provide structured recommendations.

${weatherContext}

Additional context from user: ${context || 'None'}

Respond ONLY with a valid JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "A brief 2-3 sentence weather overview. Write naturally like talking to a friend. Include relevant emojis.",
  "activityRecommendations": [
    {
      "activity": "Activity name",
      "suitability": "excellent|good|fair|poor",
      "reason": "Brief explanation",
      "emoji": "Single relevant emoji"
    }
  ],
  "clothingSuggestions": [
    {
      "item": "Clothing item",
      "priority": "essential|recommended|optional",
      "reason": "Why this is needed",
      "emoji": "Single relevant emoji"
    }
  ],
  "alerts": [
    {
      "type": "rain|storm|heat|cold|wind|uv|general",
      "message": "Natural language alert like 'Rain expected at 5PM - bring an umbrella'",
      "timing": "When this applies (optional)",
      "severity": "info|warning|urgent",
      "emoji": "Single relevant emoji"
    }
  ],
  "safetyTips": ["Optional array of safety tips if conditions warrant"]
}

Guidelines:
- Provide 3-4 activity recommendations covering indoor and outdoor options
- Provide 2-4 clothing suggestions based on current conditions
- Include alerts ONLY if there are noteworthy weather events (rain, extreme temps, high UV, storms)
- Be conversational and helpful, not robotic
- Consider the time of day and forecast trends`;

    const responseText = await callGeminiAPI(prompt);

    if (!responseText) {
      console.log('No response from Gemini API');
      return { ...EMPTY_INSIGHT, summary: 'Unable to generate weather insights. Please try again.' };
    }

    const parsed = parseJSONFromResponse<AIWeatherInsight>(responseText);

    if (parsed) {
      return {
        summary: parsed.summary || '',
        activityRecommendations: parsed.activityRecommendations || [],
        clothingSuggestions: parsed.clothingSuggestions || [],
        alerts: parsed.alerts || [],
        safetyTips: parsed.safetyTips || [],
      };
    }

    // Fallback: use response as plain text summary
    return {
      ...EMPTY_INSIGHT,
      summary: responseText.substring(0, 500),
    };

  } catch (error) {
    console.error('Error fetching structured weather insights:', error);
    return { ...EMPTY_INSIGHT, summary: 'Weather insights temporarily unavailable.' };
  }
};

/**
 * Legacy function - Get AI weather summary as plain text
 * Kept for backward compatibility
 */
export const getGeminiWeatherSummary = async (
  weatherData: WeatherData,
  forecastData: ForecastData,
  context: string
): Promise<string | null> => {
  try {
    const prompt = `
      You are an AI weather assistant. Provide a concise and insightful summary of the weather, along with recommendations for outdoor activities, clothing suggestions, health and comfort advisories, and travel impact assessments.
      write like a human. Keeep it professional but conversational. Don't use em dashes. Also don't use hastages, stars for a points. Avoid sounding like a press release. Be clear, direct and natural, like you are writing to a smart friend.
      Add emojis to the text.

      Here is the current weather data:
      Location: ${weatherData.location.name}, ${weatherData.location.country}
      Temperature: ${weatherData.current.temp}°C (Feels like: ${weatherData.current.feels_like}°C)
      Condition: ${weatherData.current.description}
      Humidity: ${weatherData.current.humidity}%
      Pressure: ${weatherData.current.pressure} hPa
      Visibility: ${weatherData.current.visibility ? weatherData.current.visibility / 1000 : 'N/A'} km
      Wind: ${weatherData.current.wind_speed} m/s, ${weatherData.current.wind_deg}°
      Sunrise: ${weatherData.current.sunrise ? new Date(weatherData.current.sunrise * 1000).toLocaleTimeString() : 'N/A'}
      Sunset: ${weatherData.current.sunset ? new Date(weatherData.current.sunset * 1000).toLocaleTimeString() : 'N/A'}

      Here is the 5-day forecast data:
      ${forecastData.forecast.map(item => `
        Date: ${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()}
        Temp: ${item.temp}°C (Feels like: ${item.feels_like}°C)
        Condition: ${item.description}
      `).join('')}

      Additional context: ${context}

      Please provide a summary in a clear, readable format.
    `;

    const text = await callGeminiAPI(prompt);

    if (text) {
      if (text.endsWith('...') || text.length > 4000) {
        return text + "\n\n(Note: The weather summary may be incomplete due to response limitations.)";
      }
      return text;
    }

    return 'Weather summary unavailable at this time. Please try again later.';

  } catch (error) {
    console.error('Error fetching Gemini weather summary:', error);
    return null;
  }
};