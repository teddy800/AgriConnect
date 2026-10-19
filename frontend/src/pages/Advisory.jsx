import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Calendar, MessageCircle, Search, Sprout, Droplets, Bug, Package, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Advisory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('crops');
  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState([]);
  const [bestPractices, setBestPractices] = useState([]);
  const [seasonalCalendar, setSeasonalCalendar] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cropsData, practicesData, calendarData] = await Promise.all([
        api.get('/advisory/crops'),
        api.get('/advisory/best-practices'),
        api.get('/advisory/seasonal-calendar')
      ]);
      
      setCrops(cropsData.crops || []);
      setBestPractices(practicesData.categories || []);
      setSeasonalCalendar(calendarData);
      
      if (user) {
        const recsData = await api.get('/advisory/recommendations');
        setRecommendations(recsData.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch advisory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !user) return;
    
    try {
      setAskingQuestion(true);
      const response = await api.post('/advisory/ask', {
        question: question.trim(),
        crop: selectedCrop?.name,
        topic: activeTab
      });
      setAnswer(response);
    } catch (error) {
      console.error('Failed to ask question:', error);
      alert('Failed to get answer. Please try again.');
    } finally {
      setAskingQuestion(false);
    }
  };

  const getIconForCategory = (category) => {
    const icons = {
      'Soil Management': <Sprout className="w-6 h-6" />,
      'Water Management': <Droplets className="w-6 h-6" />,
      'Pest Management': <Bug className="w-6 h-6" />,
      'Post-Harvest': <Package className="w-6 h-6" />
    };
    return icons[category] || <BookOpen className="w-6 h-6" />;
  };

  const getImportanceColor = (importance) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800 border-red-300',
      'High': 'bg-orange-100 text-orange-800 border-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[importance] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agricultural advisory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold">Agricultural Advisory</h1>
            <p className="text-green-100 mt-1">Expert farming guidance and best practices for Ethiopian agriculture</p>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Your Personalized Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{rec.type}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{rec.title}</h4>
                    {rec.tips && (
                      <ul className="text-sm text-gray-700 space-y-1">
                        {rec.tips.slice(0, 2).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {rec.activities && (
                      <ul className="text-sm text-gray-700 space-y-1">
                        {rec.activities.slice(0, 2).map((activity, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('crops')}
          className={`px-4 py-2 font-medium whitespace-nowrap transition ${
            activeTab === 'crops'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sprout className="w-5 h-5 inline mr-2" />
          Crop Guide
        </button>
        <button
          onClick={() => setActiveTab('practices')}
          className={`px-4 py-2 font-medium whitespace-nowrap transition ${
            activeTab === 'practices'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-5 h-5 inline mr-2" />
          Best Practices
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 font-medium whitespace-nowrap transition ${
            activeTab === 'calendar'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Seasonal Calendar
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`px-4 py-2 font-medium whitespace-nowrap transition ${
            activeTab === 'ask'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageCircle className="w-5 h-5 inline mr-2" />
          Ask Expert
        </button>
      </div>

      {/* Crop Guide Tab */}
      {activeTab === 'crops' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCrop(crop)}
                className="card hover:shadow-lg transition cursor-pointer border-2 hover:border-green-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{crop.name}</h3>
                    <p className="text-sm text-gray-600">{crop.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    crop.demand === 'Very High' ? 'bg-green-100 text-green-800' :
                    crop.demand === 'High' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {crop.demand}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{crop.season}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Yield: {crop.yield}</span>
                  </div>
                  <div className="text-xs text-gray-500">{crop.duration}</div>
                </div>

                <button className="mt-3 w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium">
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Crop Detail Modal */}
          {selectedCrop && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCrop(null)}>
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCrop.name}</h2>
                    <button
                      onClick={() => setSelectedCrop(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Click on specific sections for detailed information about growing {selectedCrop.name}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setQuestion(`How do I grow ${selectedCrop.name}?`);
                      setActiveTab('ask');
                      setSelectedCrop(null);
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Ask AI Assistant about {selectedCrop.name}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Best Practices Tab */}
      {activeTab === 'practices' && (
        <div className="space-y-6">
          {bestPractices.map((category, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg text-green-700">
                  {getIconForCategory(category.category)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                  <p className="text-sm text-gray-600">{category.count} practices available</p>
                </div>
              </div>

              <div className="space-y-3">
                {category.practices.map((practice, pidx) => (
                  <div
                    key={pidx}
                    onClick={() => setSelectedPractice(practice)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border-2 hover:border-green-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{practice.title}</h4>
                        <p className="text-sm text-gray-700">{practice.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getImportanceColor(practice.importance)}`}>
                        {practice.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal Calendar Tab */}
      {activeTab === 'calendar' && seasonalCalendar && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-8 h-8 text-amber-700" />
              <div>
                <h3 className="text-2xl font-bold text-amber-900">Current Season: {seasonalCalendar.current_season}</h3>
                <p className="text-amber-700">{seasonalCalendar.message}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(seasonalCalendar.calendar).map(([season, data]) => (
              <div
                key={season}
                className={`card ${
                  season === seasonalCalendar.current_season
                    ? 'border-4 border-green-500 bg-green-50'
                    : 'border-2 border-gray-200'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{season}</h3>
                <p className="text-sm text-gray-600 mb-4">{data.season}</p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2">Activities:</h4>
                    <ul className="space-y-1">
                      {data.activities.map((activity, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {data.crops_to_plant && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2">Crops to Plant:</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.crops_to_plant.map((crop, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.crops_to_harvest && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2">Crops to Harvest:</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.crops_to_harvest.map((crop, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Weather:</strong> {data.weather_watch}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask Expert Tab */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <h3 className="text-xl font-bold text-purple-900 mb-2">AI Agricultural Assistant</h3>
            <p className="text-purple-700">Ask any farming question and get expert guidance powered by our knowledge base.</p>
          </div>

          {!user && (
            <div className="card bg-yellow-50 border-2 border-yellow-200">
              <p className="text-yellow-800">Please login to ask questions and get personalized advice.</p>
            </div>
          )}

          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Question:
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., When should I plant teff? How do I control pests on my maize crop?"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 min-h-[100px]"
              disabled={!user || askingQuestion}
            />

            <button
              onClick={handleAskQuestion}
              disabled={!user || !question.trim() || askingQuestion}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {askingQuestion ? 'Getting Answer...' : 'Ask Question'}
            </button>
          </div>

          {answer && (
            <div className="card bg-green-50 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 mb-2">Answer:</h4>
                  <p className="text-gray-800 whitespace-pre-line mb-4">{answer.answer}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      answer.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      answer.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Confidence: {answer.confidence}
                    </span>
                  </div>

                  {answer.related_topics && answer.related_topics.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Related Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {answer.related_topics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {answer.resources && answer.resources.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Additional Resources:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {answer.resources.map((resource, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-green-600" />
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Questions */}
          <div className="card">
            <h4 className="font-bold text-gray-900 mb-3">Quick Questions:</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'When should I plant teff?',
                'How do I control fall armyworm?',
                'What fertilizer should I use for wheat?',
                'How much water does coffee need?',
                'When is the best time to harvest maize?',
                'How do I improve my soil fertility?'
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    if (user) handleAskQuestion();
                  }}
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-green-500 rounded-lg text-left text-sm transition"
                  disabled={!user}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
