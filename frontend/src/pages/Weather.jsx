import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, TrendingUp, Sprout, Calendar } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useTranslation } from '../i18n';

export default function Weather() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // current, forecast, insights

  useEffect(() => {
    fetchLocations();
    fetchWeatherData();
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const data = await api('/weather/locations');
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      const query = selectedLocation ? `?location=${selectedLocation}` : '';
      
      const [current, forecast] = await Promise.all([
        api(`/weather/current${query}`),
        api(`/weather/forecast${query}`)
      ]);
      
      setCurrentWeather(current);
      setForecast(forecast);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: <Sun className="w-12 h-12 text-yellow-500" />,
      Clouds: <Cloud className="w-12 h-12 text-gray-500" />,
      Rain: <CloudRain className="w-12 h-12 text-blue-500" />,
      Drizzle: <CloudRain className="w-12 h-12 text-blue-400" />,
      Wind: <Wind className="w-12 h-12 text-gray-600" />
    };
    return icons[condition] || <Cloud className="w-12 h-12 text-gray-400" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-50 border-red-200 text-red-800',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      low: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colors[priority] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getInsightTypeColor = (type) => {
    const colors = {
      warning: 'bg-orange-500',
      success: 'bg-green-500',
      info: 'bg-blue-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sun className="w-8 h-8 text-yellow-500" />
            Weather Forecast
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time weather data and agricultural insights for Ethiopian farmers
          </p>
        </div>

        {/* Location Selector */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">My Region ({currentWeather?.location || 'Ethiopia'})</option>
          {locations.map(loc => (
            <option key={loc.name} value={loc.name}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'current'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Current Weather
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'forecast'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          7-Day Forecast
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'insights'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Agricultural Insights
        </button>
      </div>

      {/* Current Weather Tab */}
      {activeTab === 'current' && currentWeather && (
        <div className="space-y-6">
          {/* Main Weather Card */}
          <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{currentWeather.location}</h2>
                <p className="text-blue-100">
                  {new Date(currentWeather.current.timestamp).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-center">
                {getWeatherIcon(currentWeather.current.weather.main)}
                <p className="mt-2 text-xl capitalize">{currentWeather.current.weather.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="text-6xl font-bold">{Math.round(currentWeather.current.temperature)}°C</div>
                <p className="text-blue-100 mt-2">
                  Feels like {Math.round(currentWeather.current.feels_like)}°C
                </p>
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Humidity */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Droplets className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-2xl font-bold">{currentWeather.current.humidity}%</p>
                </div>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Wind className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-2xl font-bold">{currentWeather.current.wind_speed} m/s</p>
                </div>
              </div>
            </div>

            {/* Pressure */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Gauge className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Pressure</p>
                  <p className="text-2xl font-bold">{currentWeather.current.pressure} hPa</p>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Visibility</p>
                  <p className="text-2xl font-bold">{currentWeather.current.visibility} km</p>
                </div>
              </div>
            </div>

            {/* UV Index */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Sun className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">UV Index</p>
                  <p className="text-2xl font-bold">{currentWeather.current.uv_index}</p>
                  <p className="text-xs text-gray-500">
                    {currentWeather.current.uv_index < 3 ? 'Low' : 
                     currentWeather.current.uv_index < 6 ? 'Moderate' :
                     currentWeather.current.uv_index < 8 ? 'High' : 'Very High'}
                  </p>
                </div>
              </div>
            </div>

            {/* Clouds */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Cloud className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Cloud Cover</p>
                  <p className="text-2xl font-bold">{currentWeather.current.clouds}%</p>
                </div>
              </div>
            </div>

            {/* Sunrise */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Sun className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Sunrise</p>
                  <p className="text-xl font-bold">
                    {new Date(currentWeather.current.sunrise).toLocaleTimeString('en-US', { 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Sunset */}
            <div className="card">
              <div className="flex items-center gap-3">
                <Sun className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Sunset</p>
                  <p className="text-xl font-bold">
                    {new Date(currentWeather.current.sunset).toLocaleTimeString('en-US', { 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Forecast */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              24-Hour Forecast
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4">
                {currentWeather.hourly?.slice(0, 12).map((hour, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center p-3 bg-gray-50 rounded-lg min-w-[100px]">
                    <p className="text-sm font-medium text-gray-600">
                      {new Date(hour.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' })}
                    </p>
                    <div className="my-2">
                      {getWeatherIcon(hour.weather.main)}
                    </div>
                    <p className="text-xl font-bold">{Math.round(hour.temperature)}°C</p>
                    <p className="text-xs text-gray-500 mt-1">💧 {hour.humidity}%</p>
                    <p className="text-xs text-blue-600 mt-1">🌧️ {hour.precipitation_probability}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Forecast Tab */}
      {activeTab === 'forecast' && forecast && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-green-600" />
            7-Day Weather Forecast
          </h3>
          
          <div className="grid gap-4">
            {forecast.daily?.map((day, idx) => (
              <div key={idx} className="card hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-32">
                      <p className="font-bold text-gray-900">
                        {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getWeatherIcon(day.weather.main)}
                      <span className="capitalize text-gray-700">{day.weather.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="text-xl font-bold">
                        {Math.round(day.temperature.max)}° / {Math.round(day.temperature.min)}°
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Rain</p>
                      <p className="text-xl font-bold text-blue-600">{day.precipitation_probability}%</p>
                      <p className="text-xs text-gray-500">{day.precipitation_amount} mm</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Wind</p>
                      <p className="text-xl font-bold">{day.wind_speed} m/s</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Humidity</p>
                      <p className="text-xl font-bold">{day.humidity}%</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">UV</p>
                      <p className="text-xl font-bold">{day.uv_index}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agricultural Insights Tab */}
      {activeTab === 'insights' && (currentWeather || forecast) && (
        <div className="space-y-6">
          {/* Weather Insights */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-yellow-600" />
              Weather Insights & Alerts
            </h3>
            
            <div className="grid gap-4">
              {currentWeather?.insights?.map((insight, idx) => (
                <div key={idx} className={`card border-2 ${getPriorityColor(insight.priority)}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${getInsightTypeColor(insight.type)} text-white`}>
                      <span className="text-2xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{insight.title}</h4>
                      <p className="text-gray-700">{insight.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          {insight.category.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          Priority: {insight.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!currentWeather?.insights || currentWeather.insights.length === 0) && (
                <div className="card bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <div>
                      <h4 className="font-bold text-green-900">All Clear!</h4>
                      <p className="text-green-800">No weather alerts or warnings for your area.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Crop Recommendations */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sprout className="w-7 h-7 text-green-600" />
              Crop Recommendations
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {forecast?.recommendations?.map((rec, idx) => (
                <div key={idx} className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{rec.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-green-900 mb-1">{rec.crop}</h4>
                      <p className="font-semibold text-green-800 mb-2">{rec.action}</p>
                      <p className="text-gray-700 text-sm mb-2">{rec.description}</p>
                      <div className="inline-block px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        ⏰ {rec.timing}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!forecast?.recommendations || forecast.recommendations.length === 0) && (
                <div className="card col-span-2">
                  <p className="text-gray-600 text-center">No specific recommendations at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Weather Summary for Planning */}
          <div className="card bg-blue-50 border-2 border-blue-200">
            <h3 className="text-xl font-bold mb-3 text-blue-900">📊 Week Summary for Planning</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-medium">Average Temperature</p>
                <p className="text-2xl font-bold text-blue-900">
                  {forecast?.daily ? Math.round(
                    forecast.daily.reduce((sum, d) => sum + (d.temperature.max + d.temperature.min) / 2, 0) / forecast.daily.length
                  ) : 0}°C
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Expected Rainfall</p>
                <p className="text-2xl font-bold text-blue-900">
                  {forecast?.daily ? Math.round(
                    forecast.daily.reduce((sum, d) => sum + d.precipitation_amount, 0) * 10
                  ) / 10 : 0} mm
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Rainy Days</p>
                <p className="text-2xl font-bold text-blue-900">
                  {forecast?.daily ? forecast.daily.filter(d => d.precipitation_probability > 60).length : 0} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
