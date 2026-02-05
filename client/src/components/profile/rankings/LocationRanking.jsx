// components/LocationRanking.jsx
import React, { useState, useEffect } from 'react';
import { rankingAPI } from '../../services/api';
import { 
  Card, 
  List, 
  Select, 
  Typography, 
  Empty,
  Avatar,
  Tag,
  Statistic,
  Button,
  Row,
  Col,
  Spin
} from 'antd';
import { 
  GlobalOutlined,
  EnvironmentOutlined,
  BankOutlined,
  FilterOutlined,
  SearchOutlined,
  FlagOutlined,
  TeamOutlined,
  StarFilled,
  FireOutlined,
  TrophyFilled,
  LoadingOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

const LocationRanking = ({
  countries,
  availableCountries,
  cities,
  categories,
  selectedCountry,
  selectedCity,
  selectedCategory,
  loadingCountries,
  loadingCategories,
  loading,
  setSelectedCountry,
  setSelectedCity,
  setSelectedCategory,
  setCities
}) => {
  const [countryLeaders, setCountryLeaders] = useState([]);
  const [cityLeaders, setCityLeaders] = useState([]);

  useEffect(() => {
    if (selectedCountry) {
      fetchTopByCountry(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCity && selectedCountry) {
      fetchTopByCity(selectedCity, selectedCountry);
    }
  }, [selectedCity, selectedCountry]);

  const fetchTopByCountry = async (countryCode) => {
    try {
      const res = await rankingAPI.getTopByCountry(countryCode);
      setCountryLeaders(res.data || []);
    } catch (error) {
      console.error('Error fetching country leaders:', error);
    }
  };

  const fetchTopByCity = async (city, countryCode) => {
    try {
      const res = await rankingAPI.getTopByCity(city, countryCode);
      setCityLeaders(res.data || []);
    } catch (error) {
      console.error('Error fetching city leaders:', error);
    }
  };

  const fetchLocationResults = async () => {
    if (!selectedCountry) return;
    
    try {
      if (selectedCity) {
        const res = await rankingAPI.getTopByCityAndCategory(
          selectedCity, 
          selectedCountry, 
          selectedCategory
        );
        setCityLeaders(res.data || []);
      } else {
        const res = await rankingAPI.getTopByCountryAndCategory(
          selectedCountry, 
          selectedCategory
        );
        setCountryLeaders(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching location results:', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setSelectedCategory(null);
    setCountryLeaders([]);
    setCityLeaders([]);
  };

  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Uncategorized';
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Unknown User';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const username = user.username || '';
      
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return username;
    }
    return 'Unknown User';
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    
    let firstName = '';
    let lastName = '';
    
    if (typeof user === 'object') {
      firstName = user.first_name || '';
      lastName = user.last_name || '';
    }
    
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getAvatarColor = (id) => {
    const colors = [
      '#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1',
      '#13c2c2', '#eb2f96', '#faad14', '#a0d911', '#2f54eb',
    ];
    
    if (!id) return colors[0];
    
    const hash = id.toString().split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  const getRankBadge = (index) => {
    if (index === 0) return { color: '#FFD700', icon: <TrophyFilled /> };
    if (index === 1) return { color: '#C0C0C0', icon: <TrophyFilled /> };
    if (index === 2) return { color: '#CD7F32', icon: <TrophyFilled /> };
    return { color: '#ca0303ff', icon: null };
  };

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1890ff' }}>
            <FilterOutlined /> Filter by Location & Category
          </Title>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
            Select a location and optionally filter by category to see top profiles
          </Text>
        </div>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                <GlobalOutlined /> Country
              </Text>
              <Select 
                placeholder="Select country" 
                style={{ width: '100%' }}
                onChange={(value) => {
                  setSelectedCountry(value);
                  setSelectedCity(null);
                  setCityLeaders([]);
                }}
                allowClear
                showSearch
                loading={loadingCountries}
                value={selectedCountry}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {countries.map(country => (
                  <Option key={country.code} value={country.code}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {country.flag ? (
                        <img 
                          src={country.flag} 
                          alt={country.name}
                          style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2 }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <FlagOutlined style={{ 
                        display: country.flag ? 'none' : 'inline', 
                        fontSize: 14,
                        color: '#8c8c8c'
                      }} />
                      <span>{country.name}</span>
                      {availableCountries.includes(country.code) && (
                        <Tag color="blue" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                          Active
                        </Tag>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                <EnvironmentOutlined /> City (Optional)
              </Text>
              <Select 
                placeholder="Select city" 
                style={{ width: '100%' }}
                onChange={(value) => setSelectedCity(value)}
                allowClear
                showSearch
                value={selectedCity}
                disabled={!selectedCountry}
              >
                {cities.map(city => (
                  <Option key={city.code || city.name} value={city.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EnvironmentOutlined style={{ fontSize: 14 }} />
                      {city.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                <BankOutlined /> Category (Optional)
              </Text>
              <Select 
                placeholder="Filter by category" 
                style={{ width: '100%' }}
                onChange={(value) => setSelectedCategory(value)}
                allowClear
                loading={loadingCategories}
                value={selectedCategory}
              >
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {cat.color && (
                        <div style={{
                          width: 12,
                          height: 12,
                          backgroundColor: cat.color,
                          borderRadius: '50%',
                        }} />
                      )}
                      <span>{cat.name}</span>
                      {cat.profile_count > 0 && (
                        <Tag color="default" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                          {cat.profile_count}
                        </Tag>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
        
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button 
            type="primary" 
            onClick={fetchLocationResults}
            icon={<SearchOutlined />}
            loading={loading}
            disabled={!selectedCountry}
          >
            Search Location
          </Button>
          
          <Button 
            onClick={handleClearFilters}
            icon={<FilterOutlined />}
            disabled={!selectedCountry && !selectedCity && !selectedCategory}
          >
            Clear Filters
          </Button>
          
          {(selectedCountry || selectedCity || selectedCategory) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Active filters:
              </Text>
              {selectedCountry && (
                <Tag 
                  color="green" 
                  closable 
                  onClose={() => {
                    setSelectedCountry(null);
                    setSelectedCity(null);
                    setCityLeaders([]);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FlagOutlined />
                  {countries.find(c => c.code === selectedCountry)?.name}
                </Tag>
              )}
              {selectedCity && (
                <Tag 
                  color="orange" 
                  closable 
                  onClose={() => setSelectedCity(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <EnvironmentOutlined />
                  {selectedCity}
                </Tag>
              )}
              {selectedCategory && (
                <Tag 
                  color="blue" 
                  closable 
                  onClose={() => setSelectedCategory(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BankOutlined />
                  {categories.find(c => c.id === selectedCategory)?.name}
                </Tag>
              )}
            </div>
          )}
        </div>
      </div>
      
      {selectedCountry ? (
        <div>
          <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {selectedCity ? (
                <>
                  <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  <Title level={4} style={{ margin: 0 }}>
                    Top Profiles in {selectedCity}, {countries.find(c => c.code === selectedCountry)?.name}
                  </Title>
                </>
              ) : (
                <>
                  <FlagOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  <Title level={4} style={{ margin: 0 }}>
                    Top Profiles in {countries.find(c => c.code === selectedCountry)?.name}
                  </Title>
                </>
              )}
            </div>
            
            {selectedCategory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <BankOutlined style={{ color: '#722ed1' }} />
                <Text strong style={{ color: '#722ed1' }}>
                  Filtered by: {categories.find(c => c.id === selectedCategory)?.name}
                </Text>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <Statistic 
                title="Total Results" 
                value={cityLeaders.length || countryLeaders.length} 
                valueStyle={{ fontSize: 20, color: '#1890ff' }}
                prefix={<TeamOutlined />}
              />
              {selectedCategory && (
                <Statistic 
                  title="In Category" 
                  value={categories.find(c => c.id === selectedCategory)?.profile_count || 0} 
                  valueStyle={{ fontSize: 20, color: '#722ed1' }}
                  prefix={<BankOutlined />}
                />
              )}
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16 }}>
                Loading profiles for {selectedCity ? selectedCity : countries.find(c => c.code === selectedCountry)?.name}...
              </Text>
            </div>
          ) : selectedCity ? (
            <div>
              {cityLeaders.length > 0 ? (
                <List
                  style={{maxHeight:'400px', overflowY:'auto', padding:'10px 10px' }}
                  dataSource={cityLeaders}
                  renderItem={(profile, index) => {
                    const categoryName = getCategoryName(profile.category);
                    const userDisplayName = getUserDisplayName(profile.user);
                    const rankBadge = getRankBadge(index);
                    
                    return (
                      <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <List.Item.Meta
                          avatar={
                            <div style={{ position: 'relative', cursor: 'pointer' }}>
                              <Avatar 
                                src={profile.image} 
                                size={48}
                                style={{
                                  backgroundColor: !profile.image ? getAvatarColor(profile.user?.id || profile.id) : undefined,
                                  fontSize: !profile.image ? 16 : undefined,
                                  fontWeight: !profile.image ? 'bold' : undefined,
                                  color: !profile.image ? 'white' : undefined,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onClick={() => window.location.href = `/profile/${profile.id}`}
                              >
                                {!profile.image && getUserInitials(profile.user)}
                              </Avatar>
                              
                              <div 
                                style={{
                                  position: 'absolute',
                                  bottom: -6,
                                  right: -6,
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: rankBadge.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: 12,
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 1
                                }}
                              >
                                {rankBadge.icon ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {rankBadge.icon}
                                    <span style={{ fontSize: 9, marginLeft: 1 }}>{index + 1}</span>
                                  </div>
                                ) : (
                                  index + 1
                                )}
                              </div>
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Text strong style={{ fontSize: 15, cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${profile.id}`}>
                                {userDisplayName}
                              </Text>
                              {profile.is_rising && (
                                <Tag 
                                  color="red" 
                                  style={{ 
                                    fontSize: '10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <FireOutlined style={{ fontSize: 9 }} />
                                  Rising
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <div style={{ marginTop: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                                  <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                    {(profile.average_rating || 0).toFixed(1)}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                                    • {profile.total_feedbacks || 0} reviews
                                  </Text>
                                </div>
                                <Tag color="blue" style={{ fontSize: '11px' }}>
                                  {categoryName}
                                </Tag>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <TeamOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {profile.followers_count || 0} followers
                                  </Text>
                                </div>
                              </div>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {profile.bio ? `${profile.bio.substring(0, 120)}...` : 'No bio available'}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p>No profiles found in {selectedCity}</p>
                      {selectedCategory && (
                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                          No {categories.find(c => c.id === selectedCategory)?.name} profiles found in {selectedCity}
                        </Text>
                      )}
                      <Button 
                        type="link" 
                        onClick={handleClearFilters}
                        style={{ marginTop: 16 }}
                      >
                        Try different filters
                      </Button>
                    </div>
                  }
                />
              )}
            </div>
          ) : (
            <div>
              {countryLeaders.length > 0 ? (
                <List
                  style={{maxHeight:'400px', overflowY:'auto',padding:'10px 10px' }}
                  dataSource={countryLeaders}
                  renderItem={(profile, index) => {
                    const categoryName = getCategoryName(profile.category);
                    const userDisplayName = getUserDisplayName(profile.user);
                    const rankBadge = getRankBadge(index);
                    
                    return (
                      <List.Item
                        extra={
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {profile.city && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <EnvironmentOutlined style={{ fontSize: 11 }} />
                                  {profile.city}
                                </div>
                              )}
                            </div>
                          </div>
                        }
                        style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                      >
                        <List.Item.Meta
                          avatar={
                            <div style={{ position: 'relative', cursor: 'pointer' }}>
                              <Avatar 
                                src={profile.image} 
                                size={48}
                                style={{
                                  backgroundColor: !profile.image ? getAvatarColor(profile.user?.id || profile.id) : undefined,
                                  fontSize: !profile.image ? 16 : undefined,
                                  fontWeight: !profile.image ? 'bold' : undefined,
                                  color: !profile.image ? 'white' : undefined,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onClick={() => window.location.href = `/profile/${profile.id}`}
                              >
                                {!profile.image && getUserInitials(profile.user)}
                              </Avatar>
                              
                              <div 
                                style={{
                                  position: 'absolute',
                                  bottom: -6,
                                  right: -6,
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: rankBadge.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: 12,
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 1
                                }}
                              >
                                {rankBadge.icon ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {rankBadge.icon}
                                    <span style={{ fontSize: 9, marginLeft: 1 }}>{index + 1}</span>
                                  </div>
                                ) : (
                                  index + 1
                                )}
                              </div>
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Text strong style={{ fontSize: 15, cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${profile.id}`}>
                                {userDisplayName}
                              </Text>
                              {profile.is_rising && (
                                <Tag 
                                  color="red" 
                                  style={{ 
                                    fontSize: '10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <FireOutlined style={{ fontSize: 9 }} />
                                  Rising
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <div style={{ marginTop: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                                  <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                    {(profile.average_rating || 0).toFixed(1)}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                                    • {profile.total_feedbacks || 0} reviews
                                  </Text>
                                </div>
                                <Tag color="blue" style={{ fontSize: '11px' }}>
                                  {categoryName}
                                </Tag>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <TeamOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {profile.followers_count || 0} followers
                                  </Text>
                                </div>
                              </div>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {profile.bio ? `${profile.bio.substring(0, 100)}...` : 'No bio available'}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p>No profiles found in {countries.find(c => c.code === selectedCountry)?.name}</p>
                      {selectedCategory && (
                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                          No {categories.find(c => c.id === selectedCategory)?.name} profiles found in this country
                        </Text>
                      )}
                      <Button 
                        type="link" 
                        onClick={handleClearFilters}
                        style={{ marginTop: 16 }}
                      >
                        Try different filters
                      </Button>
                    </div>
                  }
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p>Select a country to view top profiles by location</p>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                You can optionally filter by city and category for more specific results
              </Text>
            </div>
          }
        />
      )}
    </Card>
  );
};

export default LocationRanking;