// components/RankingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { rankingAPI } from '../services/api';
import axios from 'axios';
import { 
  Row, 
  Col, 
  Tabs, 
  Typography, 
  Button,
  Tooltip,
  Statistic
} from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined,
  TeamOutlined,
  BankOutlined,
  GlobalOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';

import RisingStarsList from './rankings/RisingStarsList.jsx';
import TopProfilesList from './rankings/TopProfilesList.jsx';
import CategoryRanking from './rankings/CategoryRanking.jsx';
import LocationRanking from './rankings/LocationRanking.jsx';
import AdvancedSearch from './rankings/AdvancedSearch.jsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RankingDashboard = () => {
  const [risingStars, setRisingStars] = useState([]);
  const [topProfiles, setTopProfiles] = useState([]);
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

  useEffect(() => {
    fetchRankings();
    fetchAvailableCountries();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesForCountry(selectedCountry);
    }
  }, [selectedCountry]);

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
      
      if (countriesData.length > 0) {
        fetchCountryDetails(countriesData);
      }
    } catch (error) {
      console.error('Error fetching available countries:', error);
    }
  };

  const fetchCountryDetails = async (countryCodes) => {
    setLoadingCountries(true);
    try {
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
      const citiesFromDb = await getCitiesFromDatabase(countryCode);
      
      if (citiesFromDb && citiesFromDb.length > 0) {
        setCities(citiesFromDb);
        return;
      }
      
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

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedCountry(null);
    setSelectedCity(null);
    setSearchQuery('');
    setSearchResults(null);
  };

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
          <RisingStarsList 
            risingStars={risingStars} 
            loading={loading}
          />
        </Col>
        <Col xs={24} lg={12}>
          <TopProfilesList 
            topProfiles={topProfiles} 
            loading={loading}
          />
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
          <CategoryRanking
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            loadingCategories={loadingCategories}
          />
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
          <LocationRanking
            countries={countries}
            availableCountries={availableCountries}
            cities={cities}
            categories={categories}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            selectedCategory={selectedCategory}
            loadingCountries={loadingCountries}
            loadingCategories={loadingCategories}
            loading={loading}
            setSelectedCountry={setSelectedCountry}
            setSelectedCity={setSelectedCity}
            setSelectedCategory={setSelectedCategory}
            setCities={setCities}
          />
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
          <AdvancedSearch
            categories={categories}
            countries={countries}
            availableCountries={availableCountries}
            selectedCategory={selectedCategory}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            searchQuery={searchQuery}
            searchResults={searchResults}
            loadingCategories={loadingCategories}
            loadingCountries={loadingCountries}
            loading={loading}
            setSelectedCategory={setSelectedCategory}
            setSelectedCountry={setSelectedCountry}
            setSelectedCity={setSelectedCity}
            setSearchQuery={setSearchQuery}
            setSearchResults={setSearchResults}
          />
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