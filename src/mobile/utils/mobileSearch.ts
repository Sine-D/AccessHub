import type { JobPosting, MapPin, Product } from '../../core/types/index.ts';
import type { SearchQuery } from '../../core/search/contracts.ts';
import { matchesFeatures } from '../../core/search/parser.ts';

const includesText = (parts: Array<string | undefined>, query: string) =>
  !query || parts.join(' ').toLowerCase().includes(query.toLowerCase());

export function filterMobileProducts(products: Product[], query: SearchQuery): Product[] {
  return products.filter((product) => {
    const categoryMatches = !query.category || product.category === query.category;
    const textMatches = includesText(
      [product.title, product.description, product.category, ...product.accessibilityFeatures],
      query.keywords,
    );
    const minimumMatches = query.minPrice === null || product.price >= query.minPrice;
    const maximumMatches = query.maxPrice === null || product.price <= query.maxPrice;
    return categoryMatches && textMatches && minimumMatches && maximumMatches;
  });
}

export function filterMobileJobs(jobs: JobPosting[], query: SearchQuery): JobPosting[] {
  return jobs.filter((job) =>
    includesText(
      [job.title, job.company, job.location, job.description, job.category, ...job.accessibilityBadges],
      query.keywords,
    ),
  );
}

export function filterMobilePlaces(places: MapPin[], query: SearchQuery): MapPin[] {
  return places.filter((place) => {
    const locationMatches = includesText([place.address], query.location ?? '');
    const textMatches = includesText(
      [place.title, place.address, place.type, place.badge, ...place.accessibilityFeatures],
      query.keywords,
    );
    return locationMatches && textMatches && matchesFeatures(place.accessibilityFeatures, query.features);
  });
}
