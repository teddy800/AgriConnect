/**
 * Advanced Search API with Elasticsearch
 */

import { Router } from 'express';
import { searchListings, getSuggestions, getSearchAggregations } from '../utils/elasticsearch.js';
import { cacheMiddleware, CACHE_TTL } from '../utils/cache.js';
import logger from '../utils/logger.js';

const r = Router();

/**
 * GET /api/search
 * Advanced search with Elasticsearch
 */
r.get('/', cacheMiddleware(CACHE_TTL.SHORT, 'search'), async (req, res) => {
  try {
    const {
      q: query,
      crop_id,
      region_id,
      min_price,
      max_price,
      verified_only,
      sort_by,
      page = 1,
      per_page = 20
    } = req.query;

    const result = await searchListings({
      query,
      crop_id: crop_id ? parseInt(crop_id) : undefined,
      region_id: region_id ? parseInt(region_id) : undefined,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      verified_only: verified_only === 'true',
      sort_by,
      page: parseInt(page),
      per_page: parseInt(per_page)
    });

    if (!result) {
      // Fallback to database search if Elasticsearch unavailable
      logger.warn('Elasticsearch unavailable, using fallback');
      return res.json({
        fallback: true,
        message: 'Using basic search',
        results: []
      });
    }

    res.json(result);
  } catch (error) {
    logger.error('Search error', { error: error.message });
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/search/suggestions
 * Autocomplete suggestions
 */
r.get('/suggestions', async (req, res) => {
  try {
    const { q: query, field = 'title' } = req.query;

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await getSuggestions(query, field);
    res.json({ suggestions });
  } catch (error) {
    logger.error('Suggestions error', { error: error.message });
    res.json({ suggestions: [] });
  }
});

/**
 * GET /api/search/analytics
 * Search analytics and aggregations
 */
r.get('/analytics', cacheMiddleware(CACHE_TTL.MEDIUM, 'search:analytics'), async (req, res) => {
  try {
    const aggregations = await getSearchAggregations();

    if (!aggregations) {
      return res.json({ message: 'Analytics unavailable' });
    }

    res.json({
      crops: aggregations.by_crop.buckets.map(b => ({
        name: b.key,
        count: b.doc_count
      })),
      regions: aggregations.by_region.buckets.map(b => ({
        name: b.key,
        count: b.doc_count
      })),
      priceStats: {
        min: aggregations.price_stats.min,
        max: aggregations.price_stats.max,
        avg: Math.round(aggregations.price_stats.avg)
      },
      priceRanges: aggregations.price_ranges.buckets.map(b => ({
        range: b.key,
        count: b.doc_count
      }))
    });
  } catch (error) {
    logger.error('Analytics error', { error: error.message });
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default r;
