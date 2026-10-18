/**
 * API Versioning Middleware
 * Supports version detection and routing
 */

/**
 * API Version Detection Middleware
 * Extracts version from URL path, header, or query parameter
 */
export function detectApiVersion(req, res, next) {
  let version = 'v1'; // Default version

  // Method 1: From URL path (/api/v1/...)
  const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
  if (pathMatch) {
    version = `v${pathMatch[1]}`;
  }
  
  // Method 2: From custom header (API-Version: v1)
  else if (req.headers['api-version']) {
    version = req.headers['api-version'];
  }
  
  // Method 3: From query parameter (?version=v1)
  else if (req.query.version) {
    version = req.query.version;
    delete req.query.version; // Remove from query to avoid conflicts
  }

  // Validate version format
  if (!/^v\d+$/.test(version)) {
    return res.status(400).json({
      error: 'Invalid API version',
      message: `Version "${version}" is not valid. Use format: v1, v2, etc.`,
      supportedVersions: ['v1']
    });
  }

  // Check if version is supported
  const supportedVersions = ['v1'];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      error: 'Unsupported API version',
      message: `API version "${version}" is not supported`,
      supportedVersions
    });
  }

  // Attach version to request
  req.apiVersion = version;

  // Add version to response headers
  res.setHeader('API-Version', version);

  next();
}

/**
 * API Version Deprecation Warning
 * Warns clients when using deprecated API versions
 */
export function checkDeprecatedVersion(req, res, next) {
  const deprecatedVersions = {
    // Example: 'v1': { sunset: '2027-12-31', replacement: 'v2' }
  };

  const version = req.apiVersion || 'v1';

  if (deprecatedVersions[version]) {
    const deprecation = deprecatedVersions[version];
    res.setHeader('Warning', `299 - "API version ${version} is deprecated. Use ${deprecation.replacement}. Sunset date: ${deprecation.sunset}"`);
    res.setHeader('Sunset', deprecation.sunset);
  }

  next();
}

/**
 * Version-specific route handling
 * Allows different behavior for different API versions
 */
export function versionedResponse(versions) {
  return (req, res, next) => {
    const version = req.apiVersion || 'v1';
    const handler = versions[version] || versions.default;

    if (!handler) {
      return res.status(501).json({
        error: 'Not implemented',
        message: `This endpoint is not available in API version ${version}`
      });
    }

    // Replace response.json with versioned handler
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const versionedData = handler(data, req);
      return originalJson(versionedData);
    };

    next();
  };
}

/**
 * Redirect legacy routes to versioned routes
 */
export function redirectToVersioned(req, res, next) {
  // If path doesn't include version, redirect to v1
  if (!req.path.match(/^\/api\/v\d+\//)) {
    const versionedPath = req.path.replace(/^\/api\//, '/api/v1/');
    
    // Preserve query parameters
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString()
      : '';

    return res.redirect(301, versionedPath + queryString);
  }

  next();
}

/**
 * API Version Info Endpoint Handler
 */
export function getApiVersionInfo(req, res) {
  res.json({
    currentVersion: 'v1',
    supportedVersions: ['v1'],
    latestVersion: 'v1',
    deprecatedVersions: [],
    documentation: '/api/docs',
    releaseNotes: 'https://docs.agriconnect.et/changelog'
  });
}
