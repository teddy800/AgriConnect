/**
 * Performance Optimization Utilities
 * High-level performance monitoring and optimization
 */

// Debounce function for search/filter inputs
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize events
export function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer for lazy loading images
export const createLazyLoader = (callback) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before element is visible
    });
  }
  return null;
};

// Prefetch data for upcoming routes
export const prefetchRoute = (url) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};

// Measure and log performance metrics
export const measurePerformance = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    const metrics = {
      // Page Load Time
      pageLoad: navigation?.loadEventEnd - navigation?.fetchStart,
      // DOM Content Loaded
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
      // First Paint
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      // First Contentful Paint
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      // Time to Interactive (approximation)
      timeToInteractive: navigation?.domInteractive - navigation?.fetchStart
    };
    
    console.log('📊 Performance Metrics:', metrics);
    return metrics;
  }
  return null;
};

// Image lazy loading with placeholder
export const lazyLoadImage = (img) => {
  if (img.dataset.src) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.classList.add('loaded');
  }
};

// Preload critical resources
export const preloadResource = (href, as, type = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Check if device is low-end and reduce animations
export const isLowEndDevice = () => {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  // Check device memory (if available)
  const memory = navigator.deviceMemory || 4;
  
  return cores < 4 || memory < 4;
};

// Enable/disable animations based on device capability
export const optimizeAnimations = () => {
  if (isLowEndDevice()) {
    document.documentElement.style.setProperty('--animation-duration', '0ms');
    console.log('⚡ Animations disabled for low-end device');
  }
};

// Report Web Vitals (Core Web Vitals monitoring)
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // web-vitals not installed, skip
    });
  }
};

// Memory management - clear caches
export const clearCache = () => {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
};

// Detect and warn about memory leaks
export const monitorMemory = () => {
  if ('memory' in performance) {
    const used = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
    const limit = performance.memory.jsHeapSizeLimit / 1048576;
    
    console.log(`💾 Memory Usage: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB`);
    
    if (used / limit > 0.9) {
      console.warn('⚠️ High memory usage detected. Consider optimizing.');
    }
  }
};

// Request Idle Callback wrapper
export const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 1);
  }
};

// Optimize network requests with priority hints
export const fetchWithPriority = (url, priority = 'auto') => {
  return fetch(url, {
    priority, // 'high', 'low', 'auto'
  });
};

// Service Worker registration helper
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
};

// Initialize all performance optimizations
export const initPerformanceOptimizations = () => {
  // Measure initial performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      measurePerformance();
      scheduleIdleTask(() => {
        optimizeAnimations();
        if (import.meta.env.DEV) {
          monitorMemory();
        }
      });
    }, 0);
  });
  
  // Register service worker in production
  registerServiceWorker();
  
  // Report Web Vitals
  reportWebVitals(console.log);
};
