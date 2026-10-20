/**
 * Weather Forecast Page
 * Advanced weather and agricultural insights for Ethiopian farmers
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, Eye, Gauge, Calendar, MapPin, AlertTriangle, TrendingUp, Sprout, CloudDrizzle, CloudSnow, CloudLightning } from 'lucide-react';
import { useT } from '../i18n';

export default function Weather() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('addis-ababa');
  const [activeTab, setActiveTab] = useState('current');
  const [forecast, setForecast] = useState([]);

  // Ethiopian regions for weather
  const regions = [
    { id: 'addis-ababa', name: 'Addis Ababa', lat: 9.03, lon: 38.74 },
    { id: 'oromia', name: 'Oromia (Adama)', lat: 8.54, lon: 39.27 },
    { id: 'amhara', name: 'Amhara (Bahir Dar)', lat: 11.59, lon: 37.39 },
    { id: 'tigray', name: 'Tigray (Mekelle)', lat: 13.49, lon: 39.47 },
    { id: 'snnpr', name: 'SNNPR (Hawassa)', lat: 7.06, lon: 38.48 },
    { id: 'sidama', name: 'Sidama (Hawassa)', lat: 7.06, lon: 38.48 },
  ];

  // Mock current weather data (in production, fetch from API)
  const currentWeather = {
    temp: 22,
    feels_like: 20,
    humidity: 59,
    wind_speed: 3.3,
    pressure: 1013,
    visibility: 10,
    uv_index: 7,
    condition: 'scattered clouds',
    icon: 'partly-cloudy',
    description: 'Perfect conditions for planting teff',
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };

  // Mock 7-day forecast
  const sevenDayForecast = [
    { day: 'Mon', date: 'Oct 21', high: 24, low: 15, condition: 'sunny', rain: 0, icon: Sun },
    { day: 'Tue', date: 'Oct 22', high: 23, low: 16, condition: 'partly-cloudy', rain: 10, icon: Cloud },
    { day: 'Wed', date: 'Oct 23', high: 21, low: 14, condition: 'rainy', rain: 80, icon: CloudRain },
    { day: 'Thu', date: 'Oct 24', high: 20, low: 13, condition: 'rainy', rain: 70, icon: CloudRain },
    { day: 'Fri', date: 'Oct 25', high: 22, low: 15, condition: 'cloudy', rain: 20, icon: Cloud },
    { day: 'Sat', date: 'Oct 26', high: 25, low: 16, condition: 'sunny', rain: 5, icon: Sun },
    { day: 'Sun', date: 'Oct 27', high: 26, low: 17, condition: 'sunny', rain: 0, icon: Sun },
  ];

  // Agricultural insights based on weather
  const agriculturalInsights = [
    {
      title: 'Planting Recommendation',
      icon: Sprout,
      color: 'var(--g700)',
      bg: 'var(--g100)',
      message: 'Excellent conditions for planting teff and barley this week',
      action: 'View Crop Calendar'
    },
    {
      title: 'Irrigation Alert',
      icon: Droplets,
      color: '#0288D1',
      bg: '#E1F5FE',
      message: 'Rain expected Wed-Thu. Reduce irrigation by 40%',
      action: 'Adjust Schedule'
    },
    {
      title: 'Pest Warning',
      icon: AlertTriangle,
      color: '#F57C00',
      bg: '#FFF3E0',
      message: 'High humidity may increase aphid activity. Monitor crops',
      action: 'Prevention Tips'
    },
    {
      title: 'Harvest Window',
      icon: Calendar,
      color: '#7B1FA2',
      bg: '#F3E5F5',
      message: 'Optimal harvest conditions expected Sat-Sun. Plan accordingly',
      action: 'Set Reminder'
    }
  ];

  // Hourly forecast for today
  const hourlyForecast = [
    { time: '6 AM', temp: 16, icon: Cloud, rain: 0 },
    { time: '9 AM', temp: 20, icon: Sun, rain: 0 },
    { time: '12 PM', temp: 24, icon: Sun, rain: 0 },
    { time: '3 PM', temp: 25, icon: Cloud, rain: 5 },
    { time: '6 PM', temp: 21, icon: Cloud, rain: 10 },
    { time: '9 PM', temp: 18, icon: CloudDrizzle, rain: 20 },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, [selectedRegion]);

  const getWeatherIcon = (condition) => {
    const icons = {
      'sunny': Sun,
      'partly-cloudy': Cloud,
      'cloudy': Cloud,
      'rainy': CloudRain,
      'drizzle': CloudDrizzle,
      'thunderstorm': CloudLightning,
      'snow': CloudSnow
    };
    return icons[condition] || Cloud;
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid var(--g700)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cloud size={32} style={{ color: 'var(--g700)' }} />
            Weather Forecast
          </h1>
          <p className="muted">Real-time weather data and agricultural insights for Ethiopian farmers</p>
        </div>
        <select 
          value={selectedRegion} 
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="field"
          style={{ width: 'auto', minWidth: '200px' }}
        >
          {regions.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Current Weather Hero Card */}
      <div className="weather-hero">
        <div className="weather-hero-main">
          <div className="weather-hero-left">
            <div className="weather-icon-large">
              {currentWeather.icon === 'partly-cloudy' ? <Cloud size={80} /> : <Sun size={80} />}
            </div>
            <div>
              <div className="weather-temp-large">{currentWeather.temp}°C</div>
              <div className="weather-condition">{currentWeather.condition}</div>
              <div className="weather-feels">Feels like {currentWeather.feels_like}°C</div>
            </div>
          </div>
          <div className="weather-hero-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={16} style={{ color: 'var(--muted)' }} />
              <span style={{ fontWeight: '600' }}>
                {regions.find(r => r.id === selectedRegion)?.name}
              </span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              {currentWeather.date}
            </div>
            <div className="weather-ag-insight">
              <Sprout size={20} />
              <span>{currentWeather.description}</span>
            </div>
          </div>
        </div>

        {/* Weather Stats Grid */}
        <div className="weather-stats-grid">
          <div className="weather-stat-card">
            <Droplets size={24} style={{ color: '#0288D1' }} />
            <div>
              <div className="weather-stat-label">Humidity</div>
              <div className="weather-stat-value">{currentWeather.humidity}%</div>
            </div>
          </div>
          <div className="weather-stat-card">
            <Wind size={24} style={{ color: '#00897B' }} />
            <div>
              <div className="weather-stat-label">Wind Speed</div>
              <div className="weather-stat-value">{currentWeather.wind_speed} m/s</div>
            </div>
          </div>
          <div className="weather-stat-card">
            <Gauge size={24} style={{ color: '#5E35B1' }} />
            <div>
              <div className="weather-stat-label">Pressure</div>
              <div className="weather-stat-value">{currentWeather.pressure} hPa</div>
            </div>
          </div>
          <div className="weather-stat-card">
            <Eye size={24} style={{ color: '#F57C00' }} />
            <div>
              <div className="weather-stat-label">Visibility</div>
              <div className="weather-stat-value">{currentWeather.visibility} km</div>
            </div>
          </div>
          <div className="weather-stat-card">
            <Sun size={24} style={{ color: '#FDD835' }} />
            <div>
              <div className="weather-stat-label">UV Index</div>
              <div className="weather-stat-value">{currentWeather.uv_index} High</div>
            </div>
          </div>
          <div className="weather-stat-card">
            <Thermometer size={24} style={{ color: '#E53935' }} />
            <div>
              <div className="weather-stat-label">Temperature</div>
              <div className="weather-stat-value">{currentWeather.temp}°C</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agricultural Insights */}
      <div className="section">
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>
          Agricultural Insights
        </h2>
        <div className="ag-insights-grid">
          {agriculturalInsights.map((insight, idx) => (
            <div key={idx} className="ag-insight-card" style={{ borderLeft: `4px solid ${insight.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: insight.bg,
                  color: insight.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <insight.icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
                    {insight.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                    {insight.message}
                  </p>
                  <button className="btn btn-sm" style={{ fontSize: '13px' }}>
                    {insight.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'current' ? 'on' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Current Weather
        </button>
        <button 
          className={`tab ${activeTab === 'hourly' ? 'on' : ''}`}
          onClick={() => setActiveTab('hourly')}
        >
          Hourly Forecast
        </button>
        <button 
          className={`tab ${activeTab === '7day' ? 'on' : ''}`}
          onClick={() => setActiveTab('7day')}
        >
          7-Day Forecast
        </button>
      </div>

      {/* Hourly Forecast */}
      {activeTab === 'hourly' && (
        <div className="card">
          <h2>Today's Hourly Forecast</h2>
          <div className="hourly-forecast-scroll">
            {hourlyForecast.map((hour, idx) => (
              <div key={idx} className="hourly-forecast-item">
                <div className="hourly-time">{hour.time}</div>
                <hour.icon size={32} style={{ color: 'var(--g700)' }} />
                <div className="hourly-temp">{hour.temp}°</div>
                <div className="hourly-rain">
                  <Droplets size={14} style={{ color: '#0288D1' }} />
                  {hour.rain}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Forecast */}
      {activeTab === '7day' && (
        <div className="card">
          <h2>7-Day Weather Forecast</h2>
          <div className="forecast-grid">
            {sevenDayForecast.map((day, idx) => (
              <div key={idx} className="forecast-day-card">
                <div className="forecast-day-header">
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{day.day}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{day.date}</div>
                </div>
                <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
                  <day.icon size={48} style={{ color: 'var(--g700)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>High</div>
                    <div style={{ fontSize: '20px', fontWeight: '800' }}>{day.high}°</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Low</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--muted)' }}>{day.low}°</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0288D1' }}>
                  <Droplets size={16} />
                  <span>{day.rain}% chance of rain</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Weather Details */}
      {activeTab === 'current' && (
        <div className="card">
          <h2>Current Weather Details</h2>
          <div className="weather-details-grid">
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#E3F2FD', color: '#0288D1' }}>
                <Thermometer size={24} />
              </div>
              <div>
                <div className="weather-detail-label">Temperature</div>
                <div className="weather-detail-value">{currentWeather.temp}°C</div>
                <div className="weather-detail-sub">Feels like {currentWeather.feels_like}°C</div>
              </div>
            </div>
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#E1F5FE', color: '#0288D1' }}>
                <Droplets size={24} />
              </div>
              <div>
                <div className="weather-detail-label">Humidity</div>
                <div className="weather-detail-value">{currentWeather.humidity}%</div>
                <div className="weather-detail-sub">Moderate level</div>
              </div>
            </div>
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#E0F2F1', color: '#00897B' }}>
                <Wind size={24} />
              </div>
              <div>
                <div className="weather-detail-label">Wind Speed</div>
                <div className="weather-detail-value">{currentWeather.wind_speed} m/s</div>
                <div className="weather-detail-sub">Light breeze</div>
              </div>
            </div>
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#F3E5F5', color: '#7B1FA2' }}>
                <Gauge size={24} />
              </div>
              <div>
                <div className="weather-detail-label">Pressure</div>
                <div className="weather-detail-value">{currentWeather.pressure} hPa</div>
                <div className="weather-detail-sub">Normal</div>
              </div>
            </div>
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#FFF3E0', color: '#F57C00' }}>
                <Eye size={24} />
              </div>
              <div>
                <div className="weather-detail-label">Visibility</div>
                <div className="weather-detail-value">{currentWeather.visibility} km</div>
                <div className="weather-detail-sub">Excellent</div>
              </div>
            </div>
            <div className="weather-detail-item">
              <div className="weather-detail-icon" style={{ background: '#FFFDE7', color: '#F9A825' }}>
                <Sun size={24} />
              </div>
              <div>
                <div className="weather-detail-label">UV Index</div>
                <div className="weather-detail-value">{currentWeather.uv_index}</div>
                <div className="weather-detail-sub">High - Use protection</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Tips */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--g700), var(--g900))', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              Weather Tips for Farmers
            </h3>
            <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '12px' }}>
              Based on current weather conditions, we recommend monitoring your crops closely. 
              The upcoming rain is beneficial for recently planted crops. Ensure proper drainage 
              in low-lying areas to prevent waterlogging.
            </p>
            <button className="btn" style={{ background: 'white', color: 'var(--g700)', border: 'none' }}>
              View Full Agricultural Advisory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
