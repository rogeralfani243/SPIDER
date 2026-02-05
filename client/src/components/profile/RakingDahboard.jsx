// components/RankingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { rankingAPI } from '../services/api';
import { 
  Card, 
  Row, 
  Col, 
  List, 
  Tag, 
  Statistic, 
  Select, 
  Typography, 
  Tabs, 
  Input, 
  Spin,
  Button,
  Empty,
  Avatar,
  Tooltip
} from 'antd';
import { 
  RiseOutlined, 
  TrophyOutlined, 
  StarOutlined, 
  FireOutlined, 
  GlobalOutlined, 
  EnvironmentOutlined,
  SearchOutlined,
  FilterOutlined,
  TrophyFilled,
  StarFilled,
  UserOutlined,
  TeamOutlined,
  FlagOutlined,
  BankOutlined,
  DashboardOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

const RankingDashboard = () => {
  const [risingStars, setRisingStars] = useState([]);
  const [topProfiles, setTopProfiles] = useState([]);
  const [categoryLeaders, setCategoryLeaders] = useState([]);
  const [countryLeaders, setCountryLeaders] = useState([]);
  const [cityLeaders, setCityLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const navigate = useNavigate()
  // Helper function to safely get category name
  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Uncategorized';
  };

  // Helper function to safely get user name
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

  // Helper function to safely get country name
  const getCountryName = (country) => {
    if (!country) return null;
    if (typeof country === 'string') return country;
    if (typeof country === 'object' && country.name) return country.name;
    return country;
  };
// Fonction pour obtenir les initiales d'un utilisateur
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
  
  // Fallback à l'username
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase();
  }
  
  return 'U';
};

// Fonction pour générer une couleur stable basée sur l'ID
const getAvatarColor = (id) => {
  const colors = [
    '#1890ff', // blue
    '#52c41a', // green
    '#fa8c16', // orange
    '#f5222d', // red
    '#722ed1', // purple
    '#13c2c2', // cyan
    '#eb2f96', // magenta
    '#faad14', // gold
    '#a0d911', // lime
    '#2f54eb', // geekblue
  ];
  
  if (!id) return colors[0];
  
  // Générer un index stable basé sur l'ID
  const hash = id.toString().split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};
  useEffect(() => {
    fetchRankings();
    fetchAvailableCountries();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesForCountry(selectedCountry);
      fetchTopByCountry(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCity && selectedCountry) {
      fetchTopByCity(selectedCity, selectedCountry);
    }
  }, [selectedCity, selectedCountry]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const [risingRes, topRes] = await Promise.all([
        rankingAPI.getRisingStars(),
        rankingAPI.getTopProfiles(),
      ]);
      
      setRisingStars(risingRes.data || []);
      setTopProfiles(topRes.data || []);
      
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCountries = async () => {
    try {
      const res = await rankingAPI.getAvailableCountries();
      const countriesData = res.data || [];
      setAvailableCountries(countriesData);
      
      // Fetch country details from public API for available countries
      if (countriesData.length > 0) {
        fetchCountryDetails(countriesData);
      }
    } catch (error) {
      console.error('Error fetching available countries:', error);
    }
  };
const fetchLocationResults = async () => {
  if (!selectedCountry) return;
  
  setLoading(true);
  try {
    if (selectedCity) {
      // Récupérer les résultats par ville (avec/sans catégorie)
      const res = await rankingAPI.getTopByCityAndCategory(
        selectedCity, 
        selectedCountry, 
        selectedCategory
      );
      setCityLeaders(res.data || []);
    } else {
      // Récupérer les résultats par pays (avec/sans catégorie)
      const res = await rankingAPI.getTopByCountryAndCategory(
        selectedCountry, 
        selectedCategory
      );
      setCountryLeaders(res.data || []);
    }
  } catch (error) {
    console.error('Error fetching location results:', error);
  } finally {
    setLoading(false);
  }
};
  const fetchCountryDetails = async (countryCodes) => {
    setLoadingCountries(true);
    try {
      // Using REST Countries API v3.1
      const response = await axios.get(
        `https://restcountries.com/v3.1/alpha?codes=${countryCodes.join(',')}&fields=name,cca2,flags,capital`
      );
      
      const countryData = response.data.map(country => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flags?.svg || country.flags?.png,
        capital: country.capital?.[0] || 'N/A'
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setCountries(countryData);
    } catch (error) {
      console.error('Error fetching country details:', error);
      // Fallback to basic country data
      const fallbackCountries = countryCodes.map(code => ({
        code,
        name: code,
        flag: null,
        capital: 'N/A'
      }));
      setCountries(fallbackCountries);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await rankingAPI.getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCitiesForCountry = async (countryCode) => {
    try {
      // Try to get cities from our database first
      const citiesFromDb = await getCitiesFromDatabase(countryCode);
      
      if (citiesFromDb && citiesFromDb.length > 0) {
        setCities(citiesFromDb);
        return;
      }
      
      // Fallback: Use a free cities API (no API key needed)
      const fallbackCities = getFallbackCities(countryCode);
      setCities(fallbackCities);
      
    } catch (error) {
      console.error('Error fetching cities:', error);
      const fallbackCities = getFallbackCities(countryCode);
      setCities(fallbackCities);
    }
  };

  const getCitiesFromDatabase = async (countryCode) => {
    try {
      // This would be an API endpoint that returns cities from your database
      const response = await rankingAPI.getCitiesByCountry(countryCode);
      return response.data || [];
    } catch (error) {
      return null;
    }
  };

  const getFallbackCities = (countryCode) => {
    const cityMap = {
      'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
      'GB': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow', 'Edinburgh'],
      'FR': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Lille'],
      'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart'],
      'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa'],
      'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
      'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga'],
      'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa'],
    };
    
    const cities = cityMap[countryCode] || ['Major Cities'];
    return cities.map(city => ({ code: city.toLowerCase().replace(/\s+/g, '-'), name: city }));
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchResults(null);
    
    try {
      const res = await rankingAPI.getTopByCategory(categoryId);
      setCategoryLeaders(res.data || []);
    } catch (error) {
      console.error('Error fetching category leaders:', error);
    }
  };

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await rankingAPI.searchProfiles(
        searchQuery, 
        selectedCategory, 
        selectedCountry, 
        selectedCity
      );
      setSearchResults(res.data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedCountry(null);
    setSelectedCity(null);
    setSearchQuery('');
    setSearchResults(null);
    setCategoryLeaders([]);
    setCountryLeaders([]);
    setCityLeaders([]);
  };

  const getRankBadge = (index) => {
    if (index === 0) return { color: '#FFD700', icon: <TrophyFilled /> };
    if (index === 1) return { color: '#C0C0C0', icon: <TrophyFilled /> };
    if (index === 2) return { color: '#CD7F32', icon: <TrophyFilled /> };
    return { color: '#ca0303ff', icon: null };
  };

  const RisingStarsList = () => (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiseOutlined style={{ color: '#fa8c16' }} />
          <span>Rising Stars</span>
          <Tag color="red" style={{ fontSize: '11px', fontWeight: 'normal' }}>
            3+ reviews this week
          </Tag>
        </div>
      }
      loading={loading}
      style={{ height: '100%', borderRadius: 8 }}
      extra={
        <Tooltip title="Profiles with 3+ reviews in the last 7 days">
          <Button type="text" icon={<FireOutlined />} size="small" />
        </Tooltip>
      }
    >
      {risingStars.length > 0 ? (
        <List
             style={{maxHeight:'300px', overflowY:'auto',padding:'10px 10px' }}
       
          dataSource={risingStars}
          renderItem={(profile, index) => {
            const countryName = getCountryName(profile.country);
            const categoryName = getCategoryName(profile.category);
            const userDisplayName = getUserDisplayName(profile.user);
            
            return (
              <List.Item
                actions={[
                  <Statistic 
                    key="weekly"
                    title="This Week"
                    value={profile.weekly_feedbacks || 0}
                    valueStyle={{ fontSize: 14, color: '#52c41a' }}
                    prefix={<FireOutlined style={{ fontSize: 12 }} />}
                  />
                ]}
                style={{ padding: '12px 0' }}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ position: 'relative' }}>
                      <Avatar 
                        src={profile.image} 
                        size={52}
                        icon={<UserOutlined />}
                        style={{ border: '2px solid #ff4d4f', cursor:'pointer' }}
                      onClick={() => {window.location.href=(`/profile/${profile.id}`)}}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: '#ff4d4f',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FireOutlined style={{ fontSize: 10, color: 'white' }} />
                      </div>
                    </div>
                  }
                  title={
                    <div>
                      <Text strong style={{ fontSize: 15 }} onClick={() => {window.location.href=(`/profile/${profile.id}`)}}>
                        {userDisplayName}
                      </Text>
                      {countryName && (
                        <Tag 
                          color="default" 
                          style={{ 
                            marginLeft: 8, 
                            fontSize: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <FlagOutlined style={{ fontSize: 9 }} />
                          {countryName}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                          <Text style={{ fontSize: 13, fontWeight: 500 }}>
                            {(profile.average_rating || 0).toFixed(1)}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {categoryName}
                        </Text>
                        {profile.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EnvironmentOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {profile.city}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {profile.bio ? `${profile.bio.substring(0, 70)}...` : 'No bio available'}
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
          description="No rising stars this week"
        />
      )}
    </Card>
  );

  const TopProfilesList = () => (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <span>Top 10 Profiles</span>
          <Tag color="blue" style={{ fontSize: '11px', fontWeight: 'normal' }}>
            Minimum 3 reviews
          </Tag>
        </div>
      }
      loading={loading}
      style={{ height: '100%', borderRadius: 8, }}
      extra={
        <Tooltip title="Based on balanced scoring of ratings and review count">
          <Button type="text" icon={<DashboardOutlined />} size="small" />
        </Tooltip>
      }
    >
      {topProfiles.length > 0 ? (
        <List
        style={{maxHeight:'300px', overflowY:'auto',padding:'10px 10px' }}
          dataSource={topProfiles}
          renderItem={(profile, index) => {
            const rankBadge = getRankBadge(index);
            const countryName = getCountryName(profile.country);
            const categoryName = getCategoryName(profile.category);
            const userDisplayName = getUserDisplayName(profile.user);
            const handleClickProfile = () =>(window.location.href = `/profile/${profile.id}`)
            return (
              <List.Item

                actions={[
                  <Statistic 
                    key="followers"
                    title="Followers"
                    value={profile.followers_count || 0}
                    valueStyle={{ fontSize: 14 }}
                    prefix={<TeamOutlined style={{ fontSize: 12 }} />}
                  />
                ]}
                style={{ padding: '12px 0' }}
              >
                <List.Item.Meta

     avatar={
  <div style={{ position: 'relative', cursor: 'pointer' }}>
    {profile.image ? (
      // Avec photo
      <Avatar 
        src={profile.image} 
        size={44}
        style={{
          border: index < 3 ? '3px solid transparent' : 'none',
        }}
        onClick={() => window.location.href = `/profile/${profile.id}`}
      />
    ) : (
      // Sans photo - afficher les initiales
      <Avatar 
        size={44}
        style={{
          backgroundColor: getAvatarColor(profile.user?.id || profile.id),
          border: index < 3 ? '3px solid transparent' : 'none',
          fontSize: 16,
          fontWeight: 'bold',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleClickProfile}
      >
        {getUserInitials(profile.user)}
      </Avatar>
    )}
    
    {/* Badge de rang avec trophée en bas à droite */}
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
    
    {/* Optionnel: bordure colorée pour les 3 premiers */}
    {index < 3 && (
      <div 
        style={{
          position: 'absolute',
          top: -3,
          left: -3,
          right: -3,
          bottom: -3,
          borderRadius: '50%',
          border: `2px solid ${rankBadge.color}`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
    )}
  </div>
}                  title={
                    <div>
                      <Text strong style={{ fontSize: 15, cursor: 'pointer' }} onClick={handleClickProfile}>
                        {userDisplayName}
                      </Text>
                      {profile.is_rising && (
                        <Tag 
                          color="red" 
                          style={{ 
                            marginLeft: 8, 
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
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                          <Text style={{ fontSize: 13, fontWeight: 500 }}>
                            {(profile.average_rating || 0).toFixed(1)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                            ({profile.total_feedbacks || 0} reviews)
                          </Text>
                        </div>
                        {countryName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FlagOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {countryName}
                            </Text>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {categoryName}
                        </Text>
                        {profile.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EnvironmentOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {profile.city}
                            </Text>
                          </div>
                        )}
                      </div>
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
          description="No profiles with sufficient reviews"
        />
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          Profile Rankings
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Discover top profiles based on ratings, reviews, and engagement
        </Text>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <RisingStarsList />
        </Col>
        <Col xs={24} lg={12} >
          <TopProfilesList />
        </Col>
      </Row>
      
      <Tabs 
        defaultActiveKey="category" 
        style={{ marginTop: 32 }}
        tabBarExtraContent={
          <Button 
            type="text" 
            icon={<FilterOutlined />} 
            onClick={handleClearFilters}
            disabled={!selectedCategory && !selectedCountry && !selectedCity && !searchQuery}
          >
            Clear Filters
          </Button>
        }
      >
        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BankOutlined />
              By Category
            </span>
          } 
          key="category"
        >
          <Card style={{ borderRadius: 8 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Select 
                placeholder="Select a category" 
                style={{ width: 320 }}
                onChange={handleCategoryChange}
                allowClear
                loading={loadingCategories}
                value={selectedCategory}
                suffixIcon={loadingCategories ? <LoadingOutlined /> : null}
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
              {selectedCategory && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Showing top profiles in {categories.find(c => c.id === selectedCategory)?.name}
                </Text>
              )}
            </div>
            
            {selectedCategory && categoryLeaders.length > 0 ? (
              <List
                dataSource={categoryLeaders}
                renderItem={(profile, index) => {
                  const countryName = getCountryName(profile.country);
                  const categoryName = getCategoryName(profile.category);
                  const userDisplayName = getUserDisplayName(profile.user);
                  
                  return (
                    <List.Item
                      extra={
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: 20, 
                            fontWeight: 'bold', 
                            color: index < 3 ? '#ff4d4f' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {index < 3 && <TrophyFilled style={{ fontSize: 16 }} />}
                            #{index + 1}
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            <TeamOutlined style={{ marginRight: 4 }} />
                            {profile.followers_count || 0} followers
                          </div>
                        </div>
                      }
                      style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={profile.image} 
                            size={48}
                            icon={<UserOutlined />}
                            style={{ cursor: 'pointer' }}
                            onClick={() => window.location.href = `/profile/${profile.id}`}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 15 }}>
                              {userDisplayName}
                            </Text>
                            {profile.is_rising && (
                              <Tag 
                                color="red" 
                                style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <FireOutlined style={{ fontSize: 9 }} />
                                Rising
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                  {(profile.average_rating || 0).toFixed(1)}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                                  • {profile.total_feedbacks || 0} reviews
                                </Text>
                              </div>
                              {countryName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <FlagOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {countryName}
                                  </Text>
                                </div>
                              )}
                            </div>
                            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>
                              {profile.bio ? `${profile.bio.substring(0, 100)}...` : 'No bio available'}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : selectedCategory && !loading ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p>No profiles found in this category</p>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Try selecting a different category or check back later
                    </Text>
                  </div>
                }
              />
            ) : null}
          </Card>
        </TabPane>
        
<TabPane 
  tab={
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <GlobalOutlined />
      By Location
    </span>
  } 
  key="country"
>
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
          // Afficher les tops par ville (avec/sans catégorie)
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
                            
                            {/* Badge de rang */}
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
          // Afficher les tops par pays (avec/sans catégorie)
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
                            
                            {/* Badge de rang */}
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
</TabPane>
        
        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SearchOutlined />
              Advanced Search
            </span>
          } 
          key="search"
        >
          <Card style={{ borderRadius: 8 }}>
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilterOutlined />
                Combined Filters
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Select 
                    placeholder="Category"
                    style={{ width: '100%' }}
                    onChange={(value) => setSelectedCategory(value)}
                    allowClear
                    loading={loadingCategories}
                    value={selectedCategory}
                  >
                    {categories.map(cat => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} md={8}>
                  <Select 
                    placeholder="Country"
                    style={{ width: '100%' }}
                    onChange={(value) => setSelectedCountry(value)}
                    allowClear
                    showSearch
                    loading={loadingCountries}
                    value={selectedCountry}
                  >
                    {countries
                      .filter(country => 
                        availableCountries.length === 0 || 
                        availableCountries.includes(country.code)
                      )
                      .map(country => (
                        <Option key={country.code} value={country.code}>
                          {country.name}
                        </Option>
                      ))}
                  </Select>
                </Col>
                <Col xs={24} md={8}>
                  <Search 
                    placeholder="Search by name, city, or skills"
                    allowClear
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={handleSearch}
                    enterButton={
                      <Button type="primary" icon={<SearchOutlined />}>
                        Search
                      </Button>
                    }
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            </div>
            
            {searchResults !== null ? (
              searchResults.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title level={5} style={{ margin: 0 }}>
                      Search Results ({searchResults.length})
                    </Title>
                    <Button 
                      type="text" 
                      size="small"
                      onClick={() => setSearchResults(null)}
                    >
                      Clear Results
                    </Button>
                  </div>
                  <List
                       style={{maxHeight:'300px', overflowY:'auto',padding:'10px 10px' }}
       
                    dataSource={searchResults}
                    renderItem={(profile) => {
                      const categoryName = getCategoryName(profile.category);
                      const userDisplayName = getUserDisplayName(profile.user);
                      const countryName = getCountryName(profile.country);
                      
                      return (
                        <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                src={profile.image} 
                                size={44}
                                icon={<UserOutlined />}
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.location.href = `/profile/${profile.id}`}
                              />
                            }
                            title={
                              <Text strong style={{ fontSize: 14 }}>
                                {userDisplayName}
                              </Text>
                            }
                            description={
                              <div style={{ marginTop: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                                      {(profile.average_rating || 0).toFixed(1)}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                                      ({profile.total_feedbacks || 0} reviews)
                                    </Text>
                                  </div>
                                  {categoryName && (
                                    <Tag color="blue" style={{ fontSize: '10px', padding: '0 6px' }}>
                                      {categoryName}
                                    </Tag>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {profile.city && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <EnvironmentOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        {profile.city}
                                      </Text>
                                    </div>
                                  )}
                                  {countryName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <FlagOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        {countryName}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No profiles found matching your search criteria"
                />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Title level={5} style={{ marginBottom: 8 }}>
                  Find profile
                </Title>
                <Text type="secondary" style={{ fontSize: 14, marginBottom: 24, display: 'block' }}>
                  Use the filters above to refine your search
                </Text>
                
                {(selectedCategory || selectedCountry || selectedCity || searchQuery) && (
                  <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Active Filters:
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedCategory && (
                        <Tag 
                          color="blue" 
                          closable 
                          onClose={() => setSelectedCategory(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <BankOutlined />
                          Category: {categories.find(c => c.id === selectedCategory)?.name}
                        </Tag>
                      )}
                      {selectedCountry && (
                        <Tag 
                          color="green" 
                          closable 
                          onClose={() => setSelectedCountry(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FlagOutlined />
                          Country: {countries.find(c => c.code === selectedCountry)?.name}
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
                          City: {selectedCity}
                        </Tag>
                      )}
                      {searchQuery && (
                        <Tag 
                          color="purple" 
                          closable 
                          onClose={() => setSearchQuery('')}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <SearchOutlined />
                          Search: {searchQuery}
                        </Tag>
                      )}
                    </div>
                    <Button 
                      type="primary" 
                      onClick={handleSearch}
                      style={{ marginTop: 12 }}
                      icon={<SearchOutlined />}
                    >
                      Search with Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
      
      <div style={{ marginTop: 32, padding: 16, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Rankings are updated daily based on review activity and engagement metrics
        </Text>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FireOutlined />
            {risingStars.length} Rising Stars
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrophyOutlined />
            {topProfiles.length} Top Profiles
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <BankOutlined />
            {categories.length} Categories
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <GlobalOutlined />
            {availableCountries.length} Countries
          </Text>
        </div>
      </div>
    </div>
  );
};

export default RankingDashboard;