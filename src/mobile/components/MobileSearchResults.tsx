import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { JobPosting, MapPin, Product } from '../../core/types';
import type { SearchQuery } from '../../core/search/contracts';
import { presentSearchFilters } from '../../features/ai-assistant/utils/searchPresentation';
import { filterMobileJobs, filterMobilePlaces, filterMobileProducts } from '../utils/mobileSearch';

interface Props {
  jobs: JobPosting[];
  onBack: () => void;
  onOpenPlace: (place: MapPin) => void;
  places: MapPin[];
  products: Product[];
  query: SearchQuery;
  theme: { background: string; card: string; text: string; subText: string; accent: string };
}

export function MobileSearchResults({ jobs, onBack, onOpenPlace, places, products, query, theme }: Props) {
  const results = useMemo(() => {
    if (query.intent === 'products') return filterMobileProducts(products, query);
    if (query.intent === 'jobs') return filterMobileJobs(jobs, query);
    if (query.intent === 'places') return filterMobilePlaces(places, query);
    return [];
  }, [jobs, places, products, query]);
  const filters = presentSearchFilters(query);
  const countMessage = results.length === 0
    ? 'No matching results. Change the search and try again.'
    : `${results.length} ${results.length === 1 ? 'result' : 'results'} found.`;

  return (
    <View accessibilityLabel="Voice search results">
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back from search results" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Search results</Text>
      </View>

      <Text style={[styles.caption, { color: theme.subText }]}>Interpreted from your voice or typed request</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Interpreted search filters">
        {filters.map((filter) => (
          <View key={filter.id} style={[styles.chip, { borderColor: theme.accent }]}>
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>{filter.label}</Text>
          </View>
        ))}
      </ScrollView>

      <Text accessibilityLiveRegion="polite" style={[styles.status, { color: results.length ? theme.text : '#fbbf24' }]}>{countMessage}</Text>

      {results.map((item) => {
        if (query.intent === 'products') {
          const product = item as Product;
          return (
            <View key={product.id} style={[styles.card, { backgroundColor: theme.card }]} accessible accessibilityLabel={`${product.title}, LKR ${product.price.toLocaleString()}`}>
              <Image source={{ uri: product.image }} style={styles.image} accessibilityIgnoresInvertColors />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{product.title}</Text>
                <Text style={{ color: theme.accent, fontWeight: '800' }}>LKR {product.price.toLocaleString()}</Text>
                <Text style={{ color: theme.subText }}>{product.category}</Text>
              </View>
            </View>
          );
        }
        if (query.intent === 'jobs') {
          const job = item as JobPosting;
          return (
            <View key={job.id} style={[styles.card, { backgroundColor: theme.card }]} accessible accessibilityLabel={`${job.title} at ${job.company}, ${job.location}`}>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{job.title}</Text>
                <Text style={{ color: theme.accent }}>{job.company}</Text>
                <Text style={{ color: theme.subText }}>{job.location}</Text>
              </View>
            </View>
          );
        }
        const place = item as MapPin;
        return (
          <View key={place.id} style={[styles.card, { backgroundColor: theme.card }]}>
            <Image source={{ uri: place.image }} style={styles.image} accessibilityIgnoresInvertColors />
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{place.title}</Text>
              <Text style={{ color: theme.subText }}>{place.address}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View details for ${place.title}`} onPress={() => onOpenPlace(place)} style={[styles.detailsButton, { backgroundColor: theme.accent }]}>
                <Text style={styles.detailsText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  backButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  backText: { color: '#38bdf8', fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '900' },
  caption: { fontSize: 12, marginBottom: 10 },
  chips: { gap: 8, paddingBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  status: { fontSize: 14, fontWeight: '800', marginVertical: 10 },
  card: { borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', flexDirection: 'row' },
  image: { width: 92, minHeight: 112 },
  cardBody: { flex: 1, padding: 12, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  detailsButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', borderRadius: 10, paddingHorizontal: 14, marginTop: 6 },
  detailsText: { color: '#0f172a', fontWeight: '900' },
});
