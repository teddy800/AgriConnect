import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import { q } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// Agricultural Advisory System
// AI-powered farming guidance and recommendations
// ============================================

/**
 * Knowledge base for Ethiopian agriculture
 */
const CROP_KNOWLEDGE_BASE = {
  'Teff': {
    category: 'Cereal',
    optimal_temp: { min: 10, max: 27, ideal: 18 },
    growing_season: 'June to November',
    soil_type: 'Well-drained loam or clay',
    water_needs: 'Moderate to high (450-550mm)',
    growth_duration: '90-150 days',
    planting_depth: '1-2 cm',
    spacing: '20-30 cm between rows',
    fertilizer: 'NPK 18:46:0 at planting, Urea top-dress',
    common_pests: ['Teff rust', 'Shoot fly', 'Aphids'],
    diseases: ['Head smut', 'Leaf blight'],
    harvest_time: 'When 75% of seeds are ripe',
    yield_potential: '1.5-2.5 tons/hectare',
    market_demand: 'Very High',
    tips: [
      'Plant after heavy rains for best germination',
      'Weed control is critical in first 30 days',
      'Apply nitrogen at tillering and heading stages',
      'Harvest when moisture is low to prevent molding'
    ]
  },
  'Maize': {
    category: 'Cereal',
    optimal_temp: { min: 18, max: 32, ideal: 25 },
    growing_season: 'March to July or July to December',
    soil_type: 'Deep, well-drained fertile loam',
    water_needs: 'High (500-800mm)',
    growth_duration: '90-120 days',
    planting_depth: '3-5 cm',
    spacing: '75 cm between rows, 25 cm between plants',
    fertilizer: 'DAP at planting, Urea split application',
    common_pests: ['Maize stalk borer', 'Fall armyworm', 'Aphids'],
    diseases: ['Gray leaf spot', 'Maize streak virus', 'Rust'],
    harvest_time: 'When kernels are hard and dry',
    yield_potential: '3-6 tons/hectare',
    market_demand: 'High',
    tips: [
      'Scout regularly for fall armyworm',
      'Hill up soil around stems for support',
      'Apply first nitrogen at knee-high stage',
      'Hand pollination can increase yield in small plots'
    ]
  },
  'Coffee': {
    category: 'Cash Crop',
    optimal_temp: { min: 15, max: 24, ideal: 20 },
    growing_season: 'Year-round (perennial)',
    soil_type: 'Rich, well-drained volcanic soil',
    water_needs: 'High, well-distributed (1500-2000mm)',
    growth_duration: '3-4 years to first harvest',
    planting_depth: 'Transplant seedlings',
    spacing: '2m x 2m',
    fertilizer: 'Organic compost, NPK annually',
    common_pests: ['Coffee berry borer', 'Coffee leaf miner'],
    diseases: ['Coffee wilt disease', 'Coffee berry disease', 'Leaf rust'],
    harvest_time: 'When berries are deep red',
    yield_potential: '0.8-1.5 tons/hectare (clean coffee)',
    market_demand: 'Very High (Export)',
    tips: [
      'Provide 50% shade for optimal growth',
      'Prune regularly to maintain productivity',
      'Process berries within 24 hours of harvest',
      'Implement integrated pest management'
    ]
  },
  'Wheat': {
    category: 'Cereal',
    optimal_temp: { min: 15, max: 25, ideal: 20 },
    growing_season: 'July to November',
    soil_type: 'Well-drained clay loam',
    water_needs: 'Moderate (350-500mm)',
    growth_duration: '120-150 days',
    planting_depth: '3-5 cm',
    spacing: '15-20 cm between rows',
    fertilizer: 'DAP and Urea split application',
    common_pests: ['Wheat stem sawfly', 'Russian wheat aphid'],
    diseases: ['Wheat rust', 'Septoria', 'Fusarium head blight'],
    harvest_time: 'When grain moisture is 13-14%',
    yield_potential: '2-4 tons/hectare',
    market_demand: 'High',
    tips: [
      'Apply herbicides 30-40 days after sowing',
      'Monitor for rust diseases regularly',
      'Harvest promptly to avoid shattering',
      'Store in clean, dry conditions'
    ]
  },
  'Barley': {
    category: 'Cereal',
    optimal_temp: { min: 10, max: 20, ideal: 15 },
    growing_season: 'June to November',
    soil_type: 'Well-drained loam',
    water_needs: 'Low to moderate (250-375mm)',
    growth_duration: '90-120 days',
    planting_depth: '3-5 cm',
    spacing: '15-20 cm between rows',
    fertilizer: 'DAP at planting, minimal nitrogen',
    common_pests: ['Barley shoot fly', 'Armyworm'],
    diseases: ['Net blotch', 'Scald', 'Powdery mildew'],
    harvest_time: 'When grain is hard',
    yield_potential: '1.5-3 tons/hectare',
    market_demand: 'Moderate',
    tips: [
      'Grows well in marginal soils',
      'Suitable for cool highland areas',
      'Good rotation crop with legumes',
      'Malt barley commands premium prices'
    ]
  }
};

/**
 * Farming best practices database
 */
const BEST_PRACTICES = {
  'Soil Management': [
    {
      title: 'Crop Rotation',
      description: 'Rotate cereal crops with legumes to improve soil nitrogen and break pest cycles.',
      importance: 'High',
      benefits: ['Improved soil fertility', 'Reduced pest pressure', 'Better yields'],
      steps: [
        'Year 1: Plant cereals (teff, wheat, barley)',
        'Year 2: Plant legumes (chickpea, lentils, field peas)',
        'Year 3: Return to cereals',
        'Avoid planting same crop family consecutively'
      ]
    },
    {
      title: 'Composting',
      description: 'Create nutrient-rich organic compost from farm waste.',
      importance: 'High',
      benefits: ['Reduced fertilizer costs', 'Improved soil structure', 'Water retention'],
      steps: [
        'Collect crop residues and animal manure',
        'Layer green and brown materials',
        'Maintain moisture and turn regularly',
        'Apply when fully decomposed (3-6 months)'
      ]
    },
    {
      title: 'Soil Testing',
      description: 'Test soil pH and nutrient levels for precise fertilization.',
      importance: 'Medium',
      benefits: ['Optimized fertilizer use', 'Cost savings', 'Better crop performance']
    }
  ],
  'Water Management': [
    {
      title: 'Rainwater Harvesting',
      description: 'Collect and store rainwater for dry season irrigation.',
      importance: 'High',
      benefits: ['Water availability', 'Extended growing season', 'Drought resilience'],
      steps: [
        'Construct collection ponds or tanks',
        'Install gutters on farm structures',
        'Use stored water during dry spells',
        'Protect water from contamination'
      ]
    },
    {
      title: 'Drip Irrigation',
      description: 'Efficient water delivery directly to plant roots.',
      importance: 'Medium',
      benefits: ['Water savings up to 50%', 'Reduced weed growth', 'Better yields'],
      requirements: ['Initial investment for system', 'Regular maintenance', 'Clean water source']
    },
    {
      title: 'Mulching',
      description: 'Cover soil with organic material to retain moisture.',
      importance: 'High',
      benefits: ['Reduced water loss', 'Weed suppression', 'Soil temperature regulation'],
      materials: ['Crop residues', 'Grass clippings', 'Straw', 'Leaves']
    }
  ],
  'Pest Management': [
    {
      title: 'Integrated Pest Management (IPM)',
      description: 'Combine multiple strategies to control pests sustainably.',
      importance: 'High',
      benefits: ['Reduced pesticide use', 'Lower costs', 'Environmental protection'],
      strategies: [
        'Regular field monitoring and scouting',
        'Use resistant crop varieties',
        'Encourage natural predators',
        'Apply pesticides only when necessary',
        'Rotate pesticide types to prevent resistance'
      ]
    },
    {
      title: 'Biological Control',
      description: 'Use natural enemies to control pests.',
      importance: 'Medium',
      benefits: ['Eco-friendly', 'Long-term solution', 'No chemical residues'],
      examples: [
        'Ladybugs for aphid control',
        'Parasitic wasps for caterpillars',
        'Birds for insect control',
        'Beneficial nematodes for soil pests'
      ]
    }
  ],
  'Post-Harvest': [
    {
      title: 'Proper Drying',
      description: 'Reduce grain moisture to safe storage levels.',
      importance: 'Critical',
      benefits: ['Prevents mold', 'Reduces losses', 'Maintains quality'],
      guidelines: [
        'Dry grains to 12-14% moisture',
        'Use clean, dry surfaces for sun drying',
        'Protect from rain and dew',
        'Test moisture with meter or bite test'
      ]
    },
    {
      title: 'Storage Management',
      description: 'Store crops properly to prevent losses.',
      importance: 'Critical',
      benefits: ['Reduced losses', 'Better prices', 'Year-round income'],
      tips: [
        'Clean storage facilities before use',
        'Use airtight containers when possible',
        'Apply natural pesticides (neem, ash)',
        'Regular inspection for pests',
        'Keep records of stock in/out'
      ]
    }
  ]
};

/**
 * Seasonal calendar for Ethiopian agriculture
 */
const SEASONAL_CALENDAR = {
  'Belg' (February - May): {
    season: 'Small Rains',
    activities: [
      'Plant short-season crops (maize, sorghum)',
      'Prepare land for Meher season',
      'Apply fertilizers to existing crops',
      'Harvest early-planted vegetables'
    ],
    crops_to_plant: ['Maize', 'Sorghum', 'Haricot bean', 'Vegetables'],
    weather_watch: 'Monitor rainfall patterns for planting timing'
  },
  'Meher' (June - September): {
    season: 'Main Rains',
    activities: [
      'Main planting season for cereals',
      'Weed control crucial',
      'Apply nitrogen fertilizer',
      'Monitor for pests and diseases'
    ],
    crops_to_plant: ['Teff', 'Wheat', 'Barley', 'Maize', 'Sorghum', 'Pulses'],
    weather_watch: 'Peak rainfall - ensure drainage'
  },
  'Bega' (October - January): {
    season: 'Dry Season',
    activities: [
      'Main harvest season',
      'Threshing and storage',
      'Sell produce at good prices',
      'Prepare land for Belg season',
      'Repair farm equipment'
    ],
    crops_to_harvest: ['Teff', 'Wheat', 'Barley', 'Maize', 'Sorghum'],
    weather_watch: 'Dry weather - good for harvest and drying'
  }
};

// ============================================
// API Endpoints
// ============================================

/**
 * GET /api/advisory/crops
 * Get comprehensive crop information
 */
router.get('/crops', optionalAuth, async (req, res) => {
  try {
    const { crop_name, category } = req.query;
    
    let crops = Object.keys(CROP_KNOWLEDGE_BASE);
    
    // Filter by specific crop
    if (crop_name) {
      const cropData = CROP_KNOWLEDGE_BASE[crop_name];
      if (!cropData) {
        return res.status(404).json({ error: 'Crop information not found' });
      }
      return res.json({
        crop: crop_name,
        ...cropData,
        additional_resources: [
          'Ministry of Agriculture extension services',
          'Local agricultural research centers',
          'Farmer training centers'
        ]
      });
    }
    
    // Filter by category
    if (category) {
      crops = crops.filter(c => CROP_KNOWLEDGE_BASE[c].category === category);
    }
    
    // Return all crops summary
    const cropsSummary = crops.map(name => ({
      name,
      category: CROP_KNOWLEDGE_BASE[name].category,
      season: CROP_KNOWLEDGE_BASE[name].growing_season,
      duration: CROP_KNOWLEDGE_BASE[name].growth_duration,
      yield: CROP_KNOWLEDGE_BASE[name].yield_potential,
      demand: CROP_KNOWLEDGE_BASE[name].market_demand
    }));
    
    res.json({ crops: cropsSummary, total: cropsSummary.length });
  } catch (error) {
    logger.error('Advisory crops error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch crop information' });
  }
});

/**
 * GET /api/advisory/best-practices
 * Get farming best practices
 */
router.get('/best-practices', optionalAuth, (req, res) => {
  try {
    const { category } = req.query;
    
    if (category && BEST_PRACTICES[category]) {
      return res.json({
        category,
        practices: BEST_PRACTICES[category],
        total: BEST_PRACTICES[category].length
      });
    }
    
    // Return all categories
    const allPractices = Object.keys(BEST_PRACTICES).map(cat => ({
      category: cat,
      count: BEST_PRACTICES[cat].length,
      practices: BEST_PRACTICES[cat].map(p => ({
        title: p.title,
        description: p.description,
        importance: p.importance
      }))
    }));
    
    res.json({ categories: allPractices });
  } catch (error) {
    logger.error('Best practices error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch best practices' });
  }
});

/**
 * GET /api/advisory/seasonal-calendar
 * Get Ethiopian seasonal farming calendar
 */
router.get('/seasonal-calendar', optionalAuth, (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    // Determine current season
    let currentSeason;
    if (currentMonth >= 2 && currentMonth <= 5) currentSeason = 'Belg';
    else if (currentMonth >= 6 && currentMonth <= 9) currentSeason = 'Meher';
    else currentSeason = 'Bega';
    
    res.json({
      current_season: currentSeason,
      current_month: currentMonth,
      calendar: SEASONAL_CALENDAR,
      current_activities: SEASONAL_CALENDAR[currentSeason],
      message: `Currently in ${currentSeason} season`
    });
  } catch (error) {
    logger.error('Seasonal calendar error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch seasonal calendar' });
  }
});

/**
 * POST /api/advisory/ask
 * AI-powered advisory - Ask farming questions
 */
router.post('/ask', auth, async (req, res) => {
  try {
    const { question, crop, topic } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    // Log the question
    await q(
      `INSERT INTO advisory_questions (user_id, question, crop, topic, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [req.user.id, question, crop || null, topic || null]
    ).catch(() => {}); // Soft fail if table doesn't exist
    
    // Simple AI logic - match keywords to responses
    const answer = generateAnswer(question, crop, topic);
    
    res.json({
      question,
      answer: answer.text,
      confidence: answer.confidence,
      related_topics: answer.related,
      resources: answer.resources
    });
  } catch (error) {
    logger.error('Advisory ask error', { error: error.message });
    res.status(500).json({ error: 'Failed to process question' });
  }
});

/**
 * GET /api/advisory/recommendations
 * Get personalized farming recommendations
 */
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRegion = req.user.region_id;
    
    // Get user's crops from listings
    const userCrops = await q(
      'SELECT DISTINCT crop_name FROM listings WHERE seller_id=$1 AND status=$2',
      [userId, 'active']
    );
    
    const recommendations = [];
    
    // Generate recommendations based on user's crops
    for (const { crop_name } of userCrops) {
      if (CROP_KNOWLEDGE_BASE[crop_name]) {
        const cropInfo = CROP_KNOWLEDGE_BASE[crop_name];
        recommendations.push({
          crop: crop_name,
          type: 'cultivation',
          priority: 'high',
          title: `${crop_name} Growing Tips`,
          tips: cropInfo.tips,
          relevant_practices: ['Soil Management', 'Water Management', 'Pest Management']
        });
      }
    }
    
    // Add seasonal recommendations
    const currentMonth = new Date().getMonth() + 1;
    let currentSeason;
    if (currentMonth >= 2 && currentMonth <= 5) currentSeason = 'Belg';
    else if (currentMonth >= 6 && currentMonth <= 9) currentSeason = 'Meher';
    else currentSeason = 'Bega';
    
    recommendations.push({
      type: 'seasonal',
      priority: 'medium',
      title: `${currentSeason} Season Activities`,
      activities: SEASONAL_CALENDAR[currentSeason].activities,
      crops_to_consider: SEASONAL_CALENDAR[currentSeason].crops_to_plant || []
    });
    
    res.json({
      user_id: userId,
      total_recommendations: recommendations.length,
      recommendations,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Recommendations error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate AI answer to farming question
 */
function generateAnswer(question, crop, topic) {
  const q = question.toLowerCase();
  
  // Planting questions
  if (q.includes('when') && (q.includes('plant') || q.includes('sow'))) {
    if (crop && CROP_KNOWLEDGE_BASE[crop]) {
      return {
        text: `${crop} is best planted during ${CROP_KNOWLEDGE_BASE[crop].growing_season}. The optimal temperature range is ${CROP_KNOWLEDGE_BASE[crop].optimal_temp.ideal}°C. Plant at a depth of ${CROP_KNOWLEDGE_BASE[crop].planting_depth} with ${CROP_KNOWLEDGE_BASE[crop].spacing} spacing.`,
        confidence: 'high',
        related: ['Soil preparation', 'Fertilization', 'Irrigation'],
        resources: ['Local agricultural extension', 'Seed suppliers']
      };
    }
    return {
      text: 'Planting time depends on your region and crop. In Ethiopia, the main planting season (Meher) is June-September, and the short season (Belg) is February-May. Always consider local rainfall patterns and temperature.',
      confidence: 'medium',
      related: ['Crop selection', 'Climate zones', 'Seasonal calendar'],
      resources: ['Ministry of Agriculture', 'Local extension services']
    };
  }
  
  // Fertilizer questions
  if (q.includes('fertilizer') || q.includes('fertilize')) {
    if (crop && CROP_KNOWLEDGE_BASE[crop]) {
      return {
        text: `For ${crop}, use ${CROP_KNOWLEDGE_BASE[crop].fertilizer}. Apply at the correct growth stages and follow recommended rates. Organic compost is also beneficial for soil health.`,
        confidence: 'high',
        related: ['Soil testing', 'Composting', 'Application timing'],
        resources: ['Agricultural supply stores', 'Soil testing labs']
      };
    }
    return {
      text: 'Fertilizer needs vary by crop and soil type. Generally, DAP (Diammonium Phosphate) is applied at planting, and Urea for nitrogen during growth. Consider soil testing for precise recommendations. Organic compost improves soil structure.',
      confidence: 'medium',
      related: ['Soil management', 'Crop nutrition', 'Organic farming'],
      resources: ['Agro-dealers', 'Extension agents']
    };
  }
  
  // Pest/disease questions
  if (q.includes('pest') || q.includes('disease') || q.includes('insect')) {
    return {
      text: 'Implement Integrated Pest Management (IPM): 1) Scout fields regularly, 2) Use resistant varieties, 3) Encourage natural predators, 4) Apply pesticides only when necessary, 5) Rotate pesticide types. Early detection is key to effective control.',
      confidence: 'high',
      related: ['IPM strategies', 'Biological control', 'Chemical pesticides'],
      resources: ['Plant clinics', 'Extension services', 'Agro-vet shops']
    };
  }
  
  // Watering questions
  if (q.includes('water') || q.includes('irrigat')) {
    return {
      text: 'Water requirements depend on crop type, growth stage, and weather. Generally, water when soil feels dry 5-10cm deep. Morning watering is best. Consider drip irrigation for efficiency. Mulching helps retain moisture and reduce watering needs.',
      confidence: 'high',
      related: ['Irrigation systems', 'Water harvesting', 'Mulching'],
      resources: ['Irrigation suppliers', 'Water management guides']
    };
  }
  
  // Harvest questions
  if (q.includes('harvest') || q.includes('when to pick')) {
    if (crop && CROP_KNOWLEDGE_BASE[crop]) {
      return {
        text: `Harvest ${crop} ${CROP_KNOWLEDGE_BASE[crop].harvest_time}. The crop takes ${CROP_KNOWLEDGE_BASE[crop].growth_duration} to mature. Post-harvest, dry properly to 12-14% moisture and store in clean, dry conditions.`,
        confidence: 'high',
        related: ['Post-harvest handling', 'Storage', 'Marketing'],
        resources: ['Processing centers', 'Storage facilities']
      };
    }
    return {
      text: 'Harvest timing is crucial for quality. Most crops are ready when they reach physiological maturity - look for color changes, firmness, or moisture content. Harvest in dry weather, handle carefully, and dry or store properly immediately.',
      confidence: 'medium',
      related: ['Maturity indicators', 'Harvest tools', 'Post-harvest losses'],
      resources: ['Harvest equipment', 'Storage solutions']
    };
  }
  
  // General response
  return {
    text: 'Thank you for your question! For specific advice, please consult with local agricultural extension officers or visit your nearest farmer training center. They can provide guidance tailored to your location and conditions. You can also explore our best practices and crop guides.',
    confidence: 'low',
    related: ['Crop guides', 'Best practices', 'Extension services'],
    resources: ['Ministry of Agriculture', 'Research centers', 'Farmer cooperatives']
  };
}

export default router;
