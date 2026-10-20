/**
 * Elasticsearch Integration
 * Provides advanced search capabilities with fuzzy matching, filters, and relevance scoring
 */

import { Client } from '@elastic/elasticsearch';
import logger from './logger.js';

const ES_ENABLED = process.env.ELASTICSEARCH_ENABLED === 'true';
let esClient = null;
let isConnected = false;

/**
 * Initialize Elasticsearch client
 */
export async function initializeElasticsearch() {
  if (!ES_ENABLED) {
    logger.info('Elasticsearch is disabled');
    return null;
  }

  try {
    esClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth:
        process.env.ELASTICSEARCH_USER && process.env.ELASTICSEARCH_PASSWORD
          ? {
              username: process.env.ELASTICSEARCH_USER,
              password: process.env.ELASTICSEARCH_PASSWORD
            }
          : undefined,
      maxRetries: 3,
      requestTimeout: 10000
    });

    // Test connection
    const health = await esClient.cluster.health();
    isConnected = true;

    logger.info('✅ Elasticsearch connected', {
      clusterName: health.cluster_name,
      status: health.status,
      nodes: health.number_of_nodes
    });

    // Create indices if they don't exist
    await createIndices();

    return esClient;
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch', { error: error.message });
    isConnected = false;
    return null;
  }
}

/**
 * Create Elasticsearch indices with mappings
 */
async function createIndices() {
  const indices = [
    {
      index: 'listings',
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'standard' },
          description: { type: 'text', analyzer: 'standard' },
          crop_id: { type: 'integer' },
          crop_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          farmer_id: { type: 'keyword' },
          farmer_name: { type: 'text' },
          region_id: { type: 'integer' },
          region_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          quantity: { type: 'float' },
          unit: { type: 'keyword' },
          price_per_unit: { type: 'float' },
          status: { type: 'keyword' },
          is_verified: { type: 'boolean' },
          harvest_date: { type: 'date' },
          created_at: { type: 'date' },
          location: { type: 'geo_point' },
          tags: { type: 'keyword' }
        }
      }
    },
    {
      index: 'users',
      mappings: {
        properties: {
          id: { type: 'keyword' },
          full_name: { type: 'text', analyzer: 'standard' },
          phone: { type: 'keyword' },
          role: { type: 'keyword' },
          region_id: { type: 'integer' },
          region_name: { type: 'text' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'date' }
        }
      }
    },
    {
      index: 'crops',
      mappings: {
        properties: {
          id: { type: 'integer' },
          name_en: { type: 'text', analyzer: 'standard' },
          name_am: { type: 'text', analyzer: 'standard' },
          name_om: { type: 'text', analyzer: 'standard' },
          category: { type: 'keyword' }
        }
      }
    }
  ];

  for (const { index, mappings } of indices) {
    try {
      const exists = await esClient.indices.exists({ index });

      if (!exists) {
        await esClient.indices.create({
          index,
          body: { mappings }
        });
        logger.info(`Elasticsearch index created: ${index}`);
      }
    } catch (error) {
      logger.error(`Failed to create index ${index}`, { error: error.message });
    }
  }
}

/**
 * Index a listing document
 */
export async function indexListing(listing) {
  if (!isConnected || !esClient) return false;

  try {
    await esClient.index({
      index: 'listings',
      id: listing.id,
      document: {
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        crop_id: listing.crop_id,
        crop_name: listing.crop || listing.crop_name,
        farmer_id: listing.farmer_id,
        farmer_name: listing.farmer || listing.farmer_name,
        region_id: listing.region_id,
        region_name: listing.region || listing.region_name,
        quantity: listing.quantity,
        unit: listing.unit,
        price_per_unit: listing.price_per_unit,
        status: listing.status,
        is_verified: listing.is_verified || false,
        harvest_date: listing.harvest_date,
        created_at: listing.created_at || new Date(),
        tags: [listing.crop, listing.region, listing.unit].filter(Boolean)
      },
      refresh: 'wait_for'
    });

    logger.debug('Listing indexed', { listingId: listing.id });
    return true;
  } catch (error) {
    logger.error('Failed to index listing', { listingId: listing.id, error: error.message });
    return false;
  }
}

/**
 * Advanced listing search with filters
 */
export async function searchListings(params) {
  if (!isConnected || !esClient) return null;

  const {
    query = '',
    crop_id,
    region_id,
    min_price,
    max_price,
    status = 'active',
    verified_only = false,
    sort_by = 'relevance',
    page = 1,
    per_page = 20
  } = params;

  try {
    const must = [];
    const filter = [];

    // Text search with fuzzy matching
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description^2', 'crop_name^2', 'region_name'],
          fuzziness: 'AUTO',
          prefix_length: 1,
          operator: 'or'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Filters
    if (status) filter.push({ term: { status } });
    if (crop_id) filter.push({ term: { crop_id } });
    if (region_id) filter.push({ term: { region_id } });
    if (verified_only) filter.push({ term: { is_verified: true } });

    // Price range
    if (min_price || max_price) {
      const range = {};
      if (min_price) range.gte = min_price;
      if (max_price) range.lte = max_price;
      filter.push({ range: { price_per_unit: range } });
    }

    // Sorting
    const sortOptions = {
      relevance: [{ _score: 'desc' }, { created_at: 'desc' }],
      price_asc: [{ price_per_unit: 'asc' }, { _score: 'desc' }],
      price_desc: [{ price_per_unit: 'desc' }, { _score: 'desc' }],
      newest: [{ created_at: 'desc' }, { _score: 'desc' }],
      quantity: [{ quantity: 'desc' }, { _score: 'desc' }]
    };

    const result = await esClient.search({
      index: 'listings',
      from: (page - 1) * per_page,
      size: per_page,
      query: {
        bool: { must, filter }
      },
      sort: sortOptions[sort_by] || sortOptions.relevance,
      highlight: {
        fields: {
          title: {},
          description: {},
          crop_name: {}
        }
      }
    });

    logger.info('Elasticsearch search completed', {
      query,
      total: result.hits.total.value,
      took: result.took
    });

    return {
      total: result.hits.total.value,
      page,
      per_page,
      results: result.hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score,
        _highlights: hit.highlight
      }))
    };
  } catch (error) {
    logger.error('Elasticsearch search failed', { error: error.message });
    return null;
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSuggestions(query, field = 'title') {
  if (!isConnected || !esClient || !query) return [];

  try {
    const result = await esClient.search({
      index: 'listings',
      size: 10,
      query: {
        bool: {
          must: [
            {
              match_phrase_prefix: {
                [field]: {
                  query,
                  max_expansions: 10
                }
              }
            }
          ],
          filter: [{ term: { status: 'active' } }]
        }
      },
      _source: [field, 'crop_name', 'region_name']
    });

    return result.hits.hits.map(hit => hit._source);
  } catch (error) {
    logger.error('Failed to get suggestions', { error: error.message });
    return [];
  }
}

/**
 * Delete listing from index
 */
export async function deleteListingFromIndex(listingId) {
  if (!isConnected || !esClient) return false;

  try {
    await esClient.delete({
      index: 'listings',
      id: listingId
    });

    logger.debug('Listing deleted from index', { listingId });
    return true;
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return true; // Already deleted
    }
    logger.error('Failed to delete listing from index', { listingId, error: error.message });
    return false;
  }
}

/**
 * Bulk index listings
 */
export async function bulkIndexListings(listings) {
  if (!isConnected || !esClient || !listings.length) return 0;

  try {
    const operations = listings.flatMap(listing => [
      { index: { _index: 'listings', _id: listing.id } },
      {
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        crop_id: listing.crop_id,
        crop_name: listing.crop,
        farmer_id: listing.farmer_id,
        region_id: listing.region_id,
        region_name: listing.region,
        quantity: listing.quantity,
        unit: listing.unit,
        price_per_unit: listing.price_per_unit,
        status: listing.status,
        created_at: listing.created_at || new Date()
      }
    ]);

    const result = await esClient.bulk({
      operations,
      refresh: 'wait_for'
    });

    const indexed = result.items.filter(item => !item.index.error).length;
    logger.info('Bulk indexing completed', { total: listings.length, indexed });

    return indexed;
  } catch (error) {
    logger.error('Bulk indexing failed', { error: error.message });
    return 0;
  }
}

/**
 * Aggregate search for analytics
 */
export async function getSearchAggregations() {
  if (!isConnected || !esClient) return null;

  try {
    const result = await esClient.search({
      index: 'listings',
      size: 0,
      query: {
        term: { status: 'active' }
      },
      aggs: {
        by_crop: {
          terms: { field: 'crop_name.keyword', size: 20 }
        },
        by_region: {
          terms: { field: 'region_name.keyword', size: 20 }
        },
        price_stats: {
          stats: { field: 'price_per_unit' }
        },
        price_ranges: {
          range: {
            field: 'price_per_unit',
            ranges: [
              { to: 1000 },
              { from: 1000, to: 3000 },
              { from: 3000, to: 5000 },
              { from: 5000 }
            ]
          }
        }
      }
    });

    return result.aggregations;
  } catch (error) {
    logger.error('Failed to get aggregations', { error: error.message });
    return null;
  }
}

/**
 * Get cluster health
 */
export async function getHealth() {
  if (!isConnected || !esClient) {
    return { enabled: false, connected: false };
  }

  try {
    const health = await esClient.cluster.health();
    const stats = await esClient.indices.stats({ index: 'listings' });

    return {
      enabled: true,
      connected: isConnected,
      cluster: {
        name: health.cluster_name,
        status: health.status,
        nodes: health.number_of_nodes
      },
      indices: {
        listings: {
          docs: stats.indices?.listings?.total?.docs?.count || 0,
          size: stats.indices?.listings?.total?.store?.size_in_bytes || 0
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get Elasticsearch health', { error: error.message });
    return { enabled: true, connected: false, error: error.message };
  }
}

/**
 * Close Elasticsearch connection
 */
export async function closeElasticsearch() {
  if (esClient) {
    try {
      await esClient.close();
      logger.info('Elasticsearch connection closed');
    } catch (error) {
      logger.error('Error closing Elasticsearch', { error: error.message });
    }
  }
}

// Graceful shutdown
process.on('SIGINT', closeElasticsearch);
process.on('SIGTERM', closeElasticsearch);

export default {
  initialize: initializeElasticsearch,
  indexListing,
  searchListings,
  getSuggestions,
  deleteListingFromIndex,
  bulkIndexListings,
  getSearchAggregations,
  getHealth,
  close: closeElasticsearch
};
