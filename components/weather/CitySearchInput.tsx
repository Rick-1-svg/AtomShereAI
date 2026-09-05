import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

import { searchCities } from '../../services/api';
import { City } from '../../types/weather';

interface CitySearchInputProps {
  onCitySelect: (city: City) => void;
}

export default function CitySearchInput({ onCitySelect }: CitySearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setError(null);

        try {
          const result = await searchCities(query);

          if (result.error) {
            setError(result.error);
          } else {
            setResults(result.cities);
          }
        } catch (err) {
          setError('Failed to search cities');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleCitySelect = (city: City) => {
    onCitySelect(city);
    setQuery('');
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.label}>Search for a city</ThemedText>

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={isFocused ? '#a5b4fc' : 'rgba(255, 255, 255, 0.5)'}
          style={[styles.searchIcon, { pointerEvents: 'none' }]}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter city name..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          autoCapitalize="words"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="search"
          editable={true}
          selectTextOnFocus={false}
          selectionColor="#a5b4fc"
          underlineColorAndroid="transparent"
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically={true}
        />
        {loading && (
          <ActivityIndicator
            style={[styles.loadingIndicator, { pointerEvents: 'none' }]}
            color="#a5b4fc"
          />
        )}
      </View>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}

      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPress={() => handleCitySelect(item)}
            >
              <View style={styles.resultContent}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={18}
                  color="#a5b4fc"
                  style={styles.resultIcon}
                />
                <View style={styles.resultTextContainer}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.resultCityName}
                  >
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.resultRegion}>
                    {item.state ? `${item.state}, ${item.country}` : item.country}
                  </ThemedText>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="rgba(255, 255, 255, 0.3)"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    marginBottom: 8,
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#a5b4fc',
    backgroundColor: 'rgba(165, 180, 252, 0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsList: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultCityName: {
    color: '#ffffff',
    fontSize: 16,
  },
  resultRegion: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    color: '#f87171',
    marginTop: 8,
    fontSize: 14,
  }
});