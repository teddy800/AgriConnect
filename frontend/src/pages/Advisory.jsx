import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Calendar, MessageCircle, Search, Sprout, Droplets, Bug, Package, TrendingUp, Award, ChevronRight, Sparkles, Sun, Cloud, Zap, Leaf } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

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
      'Soil Management': <Sprout style={{ width: '24px', height: '24px' }} />,
      'Water Management': <Droplets style={{ width: '24px', height: '24px' }} />,
      'Pest Management': <Bug style={{ width: '24px', height: '24px' }} />,
      'Post-Harvest': <Package style={{ width: '24px', height: '24px' }} />
    };
    return icons[category] || <BookOpen style={{ width: '24px', height: '24px' }} />;
  };

  const getImportanceColor = (importance) => {
    const colors = {
      'Critical': { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
      'High': { bg: '#FED7AA', color: '#9A3412', border: '#FB923C' },
      'Medium': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
      'Low': { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' }
    };
    return colors[importance] || colors['Low'];
  };

  const filteredCrops = crops.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid #E2F1E7', borderTop: '4px solid #1B7F3B', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#0F4D2A', fontWeight: '700', fontSize: '16px' }}>Loading agricultural advisory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1400px', padding: '32px' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', borderRadius: '24px', padding: '40px', marginBottom: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15, 77, 42, 0.25)' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)' }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        <div style={{ position: 'relative', zIndex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center' }}>
              <Lightbulb style={{ width: '36px', height: '36px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'white', lineHeight: '1.2', marginBottom: '8px' }}>Agricultural Advisory</h1>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', lineHeight: '1.5' }}>Expert farming guidance and best practices for Ethiopian agriculture</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '2px solid #93C5FD', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E3A8A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ width: '24px', height: '24px' }} />
            Your Personalized Recommendations
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #BFDBFE', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: rec.priority === 'high' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : rec.priority === 'medium' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'grid', placeItems: 'center', flexShrink: '0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                    <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', background: rec.priority === 'high' ? '#FEE2E2' : rec.priority === 'medium' ? '#FEF3C7' : '#D1FAE5', color: rec.priority === 'high' ? '#991B1B' : rec.priority === 'medium' ? '#92400E' : '#065F46' }}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '13px', color: '#60756A', fontWeight: '600' }}>{rec.type}</span>
                    </div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0F4D2A', marginBottom: '12px' }}>{rec.title}</h4>
                    {rec.tips && (
                      <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: '0', margin: '0' }}>
                        {rec.tips.slice(0, 2).map((tip, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '14px', color: '#3C5245' }}>
                            <ChevronRight style={{ width: '18px', height: '18px', color: '#1B7F3B', flexShrink: '0', marginTop: '2px' }} />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {rec.activities && (
                      <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: '0', margin: '0' }}>
                        {rec.activities.slice(0, 2).map((activity, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '14px', color: '#3C5245' }}>
                            <ChevronRight style={{ width: '18px', height: '18px', color: '#3B82F6', flexShrink: '0', marginTop: '2px' }} />
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', background: 'white', padding: '8px', borderRadius: '16px', border: '2px solid #E2F1E7', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        {[
          { id: 'crops', label: 'Crop Guide', icon: <Sprout style={{ width: '20px', height: '20px' }} /> },
          { id: 'practices', label: 'Best Practices', icon: <BookOpen style={{ width: '20px', height: '20px' }} /> },
          { id: 'calendar', label: 'Seasonal Calendar', icon: <Calendar style={{ width: '20px', height: '20px' }} /> },
          { id: 'ask', label: 'Ask Expert', icon: <MessageCircle style={{ width: '20px', height: '20px' }} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#60756A',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(15, 77, 42, 0.3)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Crop Guide Tab */}
      {activeTab === 'crops' && (
        <div>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#60756A' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search crops..."
              style={{ width: '100%', paddingLeft: '54px', height: '52px', border: '2px solid #E2F1E7', borderRadius: '16px', fontSize: '15px', background: 'white', fontWeight: '500' }}
              onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
              onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredCrops.map((crop, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCrop(crop)}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '2px solid #E2F1E7',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 77, 42, 0.15)';
                  e.currentTarget.style.borderColor = '#1B7F3B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#E2F1E7';
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', opacity: '0.5' }}></div>
                
                <div style={{ position: 'relative', zIndex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: '1' }}>
                      <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '6px' }}>{crop.name}</h3>
                      <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>{crop.category}</p>
                    </div>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      background: crop.demand === 'Very High' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : crop.demand === 'High' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : '#E2F1E7',
                      color: crop.demand === 'Very High' || crop.demand === 'High' ? 'white' : '#1B7F3B',
                      boxShadow: crop.demand === 'Very High' || crop.demand === 'High' ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
                    }}>
                      {crop.demand}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#F8FCF9', borderRadius: '12px' }}>
                      <Calendar style={{ width: '18px', height: '18px', color: '#1B7F3B' }} />
                      <span style={{ fontSize: '13px', color: '#3C5245', fontWeight: '600' }}>{crop.season}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#F8FCF9', borderRadius: '12px' }}>
                      <TrendingUp style={{ width: '18px', height: '18px', color: '#1B7F3B' }} />
                      <span style={{ fontSize: '13px', color: '#3C5245', fontWeight: '600' }}>Yield: {crop.yield}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8FA599', fontWeight: '600', padding: '10px', background: '#F8FCF9', borderRadius: '12px' }}>
                      Duration: {crop.duration}
                    </div>
                  </div>

                  <button style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#0F4D2A',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)';
                    e.currentTarget.style.color = '#0F4D2A';
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices Tab */}
      {activeTab === 'practices' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {bestPractices.map((category, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', color: '#1B7F3B', display: 'grid', placeItems: 'center' }}>
                  {getIconForCategory(category.category)}
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>{category.category}</h3>
                  <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>{category.count} practices available</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {category.practices.map((practice, pidx) => {
                  const colors = getImportanceColor(practice.importance);
                  return (
                    <div
                      key={pidx}
                      onClick={() => setSelectedPractice(practice)}
                      style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)',
                        borderRadius: '16px',
                        border: `2px solid ${colors.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: '1' }}>
                          <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0F4D2A', marginBottom: '8px' }}>{practice.title}</h4>
                          <p style={{ fontSize: '14px', color: '#3C5245', lineHeight: '1.6' }}>{practice.description}</p>
                        </div>
                        <span style={{
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          background: colors.bg,
                          color: colors.color,
                          border: `2px solid ${colors.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {practice.importance}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal Calendar Tab */}
      {activeTab === 'calendar' && seasonalCalendar && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', borderRadius: '20px', padding: '24px', marginBottom: '28px', border: '2px solid #FCD34D', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.9)', display: 'grid', placeItems: 'center' }}>
                <Sun style={{ width: '32px', height: '32px', color: '#D97706' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#78350F', marginBottom: '4px' }}>
                  Current Season: {seasonalCalendar.current_season}
                </h3>
                <p style={{ fontSize: '15px', color: '#92400E', fontWeight: '600' }}>{seasonalCalendar.message}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {Object.entries(seasonalCalendar.calendar).map(([season, data]) => {
              const isCurrent = season === seasonalCalendar.current_season;
              return (
                <div
                  key={season}
                  style={{
                    background: isCurrent ? 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)' : 'white',
                    borderRadius: '20px',
                    padding: '28px',
                    border: isCurrent ? '3px solid #1B7F3B' : '2px solid #E2F1E7',
                    boxShadow: isCurrent ? '0 12px 32px rgba(15, 77, 42, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 14px', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: 'white', boxShadow: '0 4px 12px rgba(15, 77, 42, 0.3)' }}>
                      ACTIVE
                    </div>
                  )}
                  
                  <h3 style={{ fontSize: '24px', fontWeight: '900', color: isCurrent ? '#0F4D2A' : '#14261B', marginBottom: '8px' }}>{season}</h3>
                  <p style={{ fontSize: '14px', color: isCurrent ? '#1B7F3B' : '#60756A', fontWeight: '700', marginBottom: '20px' }}>{data.season}</p>

                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap style={{ width: '18px', height: '18px', color: '#1B7F3B' }} />
                        Activities:
                      </h4>
                      <ul style={{ display: 'grid', gap: '10px', listStyle: 'none', padding: '0', margin: '0' }}>
                        {data.activities.map((activity, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '14px', color: '#3C5245', padding: '10px', background: 'white', borderRadius: '12px' }}>
                            <ChevronRight style={{ width: '18px', height: '18px', color: '#1B7F3B', flexShrink: '0', marginTop: '2px' }} />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {data.crops_to_plant && (
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Leaf style={{ width: '18px', height: '18px', color: '#1B7F3B' }} />
                          Crops to Plant:
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {data.crops_to_plant.map((crop, idx) => (
                            <span key={idx} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}>
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.crops_to_harvest && (
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                          Crops to Harvest:
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {data.crops_to_harvest.map((crop, idx) => (
                            <span key={idx} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}>
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '14px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <Cloud style={{ width: '20px', height: '20px', color: '#1E40AF', flexShrink: '0', marginTop: '2px' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1E40AF', fontWeight: '800', marginBottom: '4px' }}>Weather Watch:</strong>
                          <span style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: '600' }}>{data.weather_watch}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ask Expert Tab */}
      {activeTab === 'ask' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', borderRadius: '20px', padding: '28px', marginBottom: '28px', border: '2px solid #C084FC', boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15)' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#581C87', marginBottom: '8px' }}>AI Agricultural Assistant</h3>
            <p style={{ fontSize: '15px', color: '#7C3AED', fontWeight: '600' }}>Ask any farming question and get expert guidance powered by our knowledge base</p>
          </div>

          {!user && (
            <div style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', borderRadius: '18px', padding: '20px', marginBottom: '24px', border: '2px solid #FCD34D' }}>
              <p style={{ fontSize: '15px', color: '#78350F', fontWeight: '700' }}>Please login to ask questions and get personalized advice.</p>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '2px solid #E2F1E7', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '12px' }}>
              Your Question:
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., When should I plant teff? How do I control pests on my maize crop?"
              style={{ width: '100%', padding: '16px', border: '2px solid #E2F1E7', borderRadius: '16px', fontSize: '15px', minHeight: '140px', fontFamily: 'inherit', resize: 'vertical', background: '#F8FCF9' }}
              disabled={!user || askingQuestion}
              onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
              onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
            />

            <button
              onClick={handleAskQuestion}
              disabled={!user || !question.trim() || askingQuestion}
              style={{
                marginTop: '16px',
                padding: '14px 28px',
                background: user && question.trim() && !askingQuestion ? 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)' : '#E2F1E7',
                border: 'none',
                borderRadius: '14px',
                color: user && question.trim() && !askingQuestion ? 'white' : '#8FA599',
                fontSize: '16px',
                fontWeight: '800',
                cursor: user && question.trim() && !askingQuestion ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: user && question.trim() && !askingQuestion ? '0 6px 16px rgba(15, 77, 42, 0.3)' : 'none'
              }}
            >
              {askingQuestion ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }}></div>
                  Getting Answer...
                </>
              ) : (
                <>
                  <MessageCircle style={{ width: '20px', height: '20px' }} />
                  Ask Question
                </>
              )}
            </button>
          </div>

          {answer && (
            <div style={{ background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', borderRadius: '20px', padding: '28px', border: '2px solid #1B7F3B', boxShadow: '0 12px 32px rgba(15, 77, 42, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', flexShrink: '0', boxShadow: '0 4px 12px rgba(15, 77, 42, 0.3)' }}>
                  <Lightbulb style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div style={{ flex: '1' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0F4D2A', marginBottom: '12px' }}>Answer:</h4>
                  <p style={{ fontSize: '15px', color: '#14261B', lineHeight: '1.7', marginBottom: '16px', whiteSpace: 'pre-line' }}>{answer.answer}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '800',
                      background: answer.confidence === 'high' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : answer.confidence === 'medium' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#E2F1E7',
                      color: answer.confidence === 'high' || answer.confidence === 'medium' ? 'white' : '#1B7F3B',
                      boxShadow: answer.confidence === 'high' || answer.confidence === 'medium' ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
                    }}>
                      Confidence: {answer.confidence}
                    </span>
                  </div>

                  {answer.related_topics && answer.related_topics.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F4D2A', marginBottom: '10px' }}>Related Topics:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {answer.related_topics.map((topic, idx) => (
                          <span key={idx} style={{ padding: '6px 12px', background: 'white', border: '2px solid #1B7F3B', borderRadius: '10px', fontSize: '13px', color: '#1B7F3B', fontWeight: '700' }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {answer.resources && answer.resources.length > 0 && (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F4D2A', marginBottom: '10px' }}>Additional Resources:</p>
                      <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: '0', margin: '0' }}>
                        {answer.resources.map((resource, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#14261B', fontWeight: '600', padding: '10px', background: 'white', borderRadius: '10px' }}>
                            <ChevronRight style={{ width: '16px', height: '16px', color: '#1B7F3B' }} />
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
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '2px solid #E2F1E7', marginTop: '24px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0F4D2A', marginBottom: '16px' }}>Quick Questions:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
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
                  disabled={!user}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)',
                    border: '2px solid #E2F1E7',
                    borderRadius: '14px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#3C5245',
                    cursor: user ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: user ? '1' : '0.6'
                  }}
                  onMouseEnter={(e) => {
                    if (user) {
                      e.currentTarget.style.borderColor = '#1B7F3B';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #E2F1E7 0%, #F1F8F3 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2F1E7';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #F8FCF9 0%, white 100%)';
                  }}
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
