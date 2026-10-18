/**
 * Swagger/OpenAPI Documentation Configuration
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AgriConnect API',
    version: '1.0.0',
    description: 'Agricultural marketplace platform connecting Ethiopian farmers with buyers',
    contact: {
      name: 'AgriConnect Team',
      email: 'support@agriconnect.et'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server'
    },
    {
      url: 'https://api.agriconnect.et',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Listings', description: 'Marketplace listing operations' },
    { name: 'Inquiries', description: 'Buyer-farmer communication' },
    { name: 'Prices', description: 'Market price tracking' },
    { name: 'Reference', description: 'Reference data (crops, regions, markets)' },
    { name: 'Dashboard', description: 'User dashboard data' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Admin', description: 'Admin operations' },
    { name: 'Search', description: 'Advanced search with Elasticsearch' },
    { name: 'Monitoring', description: 'Health and metrics' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          phone: { type: 'string', pattern: '^(09|07)[0-9]{8}$' },
          full_name: { type: 'string' },
          role: { type: 'string', enum: ['farmer', 'buyer', 'admin', 'agronomist'] },
          region_id: { type: 'integer' },
          preferred_lang: { type: 'string', enum: ['en', 'am', 'om'] },
          is_verified: { type: 'boolean' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          farmer_id: { type: 'string', format: 'uuid' },
          crop_id: { type: 'integer' },
          region_id: { type: 'integer' },
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string' },
          quantity: { type: 'number', minimum: 0 },
          unit: { type: 'string', enum: ['kg', 'quintal', 'ton', 'piece'] },
          price_per_unit: { type: 'number', minimum: 0 },
          location_detail: { type: 'string' },
          harvest_date: { type: 'string', format: 'date' },
          image_urls: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'sold', 'expired', 'removed'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Inquiry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          listing_id: { type: 'string', format: 'uuid' },
          buyer_id: { type: 'string', format: 'uuid' },
          quantity_wanted: { type: 'number', minimum: 0 },
          offered_price: { type: 'number', minimum: 0 },
          message: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      MarketPrice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          crop_id: { type: 'integer' },
          market_id: { type: 'integer' },
          price: { type: 'number', minimum: 0 },
          unit: { type: 'string' },
          recorded_on: { type: 'string', format: 'date' },
          recorded_by: { type: 'string', format: 'uuid' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ForbiddenError: {
        description: 'User does not have required permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFoundError: {
        description: 'The specified resource was not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'password', 'full_name', 'role'],
                properties: {
                  phone: { type: 'string', pattern: '^(09|07)[0-9]{8}$' },
                  password: { type: 'string', minLength: 6 },
                  full_name: { type: 'string' },
                  role: { type: 'string', enum: ['farmer', 'buyer'] },
                  region_id: { type: 'integer' },
                  preferred_lang: { type: 'string', enum: ['en', 'am', 'om'], default: 'en' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': {
            description: 'Phone number already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'password'],
                properties: {
                  phone: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/listings': {
      get: {
        tags: ['Listings'],
        summary: 'Get all active listings',
        parameters: [
          { name: 'crop_id', in: 'query', schema: { type: 'integer' } },
          { name: 'region_id', in: 'query', schema: { type: 'integer' } },
          { name: 'max_price', in: 'query', schema: { type: 'number' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List of listings',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Listing' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Listings'],
        summary: 'Create a new listing',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['crop_id', 'title', 'quantity', 'unit', 'price_per_unit', 'region_id'],
                properties: {
                  crop_id: { type: 'integer' },
                  title: { type: 'string', maxLength: 200 },
                  description: { type: 'string' },
                  quantity: { type: 'number', minimum: 0 },
                  unit: { type: 'string', enum: ['kg', 'quintal', 'ton', 'piece'] },
                  price_per_unit: { type: 'number', minimum: 0 },
                  region_id: { type: 'integer' },
                  location_detail: { type: 'string' },
                  harvest_date: { type: 'string', format: 'date' },
                  image_urls: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Listing created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Listing' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' }
        }
      }
    },
    '/api/monitoring/health': {
      get: {
        tags: ['Monitoring'],
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                    services: {
                      type: 'object',
                      properties: {
                        database: {
                          type: 'object',
                          properties: {
                            connected: { type: 'boolean' },
                            latency: { type: 'number' }
                          }
                        },
                        redis: {
                          type: 'object',
                          properties: {
                            enabled: { type: 'boolean' },
                            connected: { type: 'boolean' }
                          }
                        },
                        elasticsearch: {
                          type: 'object',
                          properties: {
                            enabled: { type: 'boolean' },
                            connected: { type: 'boolean' },
                            status: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
