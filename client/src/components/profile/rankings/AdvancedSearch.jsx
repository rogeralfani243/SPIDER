// components/AdvancedSearch.jsx
import React, { useState } from 'react';
import { rankingAPI } from '../../services/api';
import { 
  Card, 
  List, 
  Select, 
  Typography, 
  Empty,
  Avatar,
  Tag,
  Button,
  Row,
  Col,
  Input,
  Tooltip
} from 'antd';
import { 
  SearchOutlined,
  FilterOutlined,
  BankOutlined,
  FlagOutlined,
  EnvironmentOutlined,
  StarFilled,
  UserOutlined,
  TrophyFilled,
  CrownFilled,
  FireFilled
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const AdvancedSearch = ({
  categories,
  countries,
  availableCountries,
  selectedCategory,
  selectedCountry,
  selectedCity,
  searchQuery,
  searchResults,
  loadingCategories,
  loadingCountries,
  loading,
  setSelectedCategory,
  setSelectedCountry,
  setSelectedCity,
  setSearchQuery,
  setSearchResults
}) => {
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
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
    }
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

  const getCountryName = (country) => {
    if (!country) return null;
    if (typeof country === 'string') return country;
    if (typeof country === 'object' && country.name) return country.name;
    return country;
  };

  // Logique simple pour obtenir le badge de rang BASÉ SUR LES DONNÉES RÉELLES
  const getRankBadge = (profile, index) => {
    // Priorité 1: Rang réel du backend
    const realRank = profile.real_rank || profile.global_rank;
    
    if (realRank) {
      if (realRank === 1) return { color: '#FFD700', icon: <CrownFilled />, text: '1' };
      if (realRank === 2) return { color: '#C0C0C0', icon: <CrownFilled />, text: '2' };
      if (realRank === 3) return { color: '#CD7F32', icon: <CrownFilled />, text: '3' };
      if (realRank <= 10) return { color: '#1890ff', icon: <TrophyFilled />, text: `#${realRank}` };
      return { color: '#8c8c8c', icon: null, text: `#${realRank}` };
    }
    
    // Priorité 2: Rang de recherche
    const searchRank = profile.search_position;
    if (searchRank) {
      return { color: '#722ed1', icon: null, text: `#${searchRank}` };
    }
    
    // Priorité 3: Position dans la liste (fallback)
    const listPosition = index + 1;
    if (listPosition <= 3) {
      const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
      const icons = [<CrownFilled />, <CrownFilled />, <CrownFilled />];
      return { color: colors[index], icon: icons[index], text: listPosition === 1 ? '1st' : listPosition === 2 ? '2' : '3' };
    }
    
    return { color: '#ca0303ff', icon: null, text: `#${listPosition}` };
  };

  return (
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
                <Button type="primary" icon={<SearchOutlined />} loading={loading}>
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
              renderItem={(profile, index) => {
                const categoryName = getCategoryName(profile.category);
                const userDisplayName = getUserDisplayName(profile.user);
                const countryName = getCountryName(profile.country);
                const rankBadge = getRankBadge(profile, index);
                
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: 'relative' }}>
                          <Avatar 
                            src={profile.image} 
                            size={44}
                            icon={<UserOutlined />}
                            style={{ cursor: 'pointer' }}
                            onClick={() => window.location.href = `/profile/${profile.id}`}
                          />
                          {profile.is_rising && (
                            <div style={{
                              position: 'absolute',
                              top: -4,
                              left: -4,
                              background: '#ff4d4f',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 9,
                              border: '2px solid white',
                              zIndex: 1
                            }}>
                              <FireFilled />
                            </div>
                          )}
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
                                <span style={{ fontSize: 9, marginLeft: 1 }}>{rankBadge.text}</span>
                              </div>
                            ) : (
                              rankBadge.text
                            )}
                          </div>
                        </div>
                      }
                      
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${profile.id}`}>
                            {userDisplayName}
                          </Text>
                          {profile.is_rising && (
                            <Tag color="red" style={{ fontSize: '10px', padding: '0 6px', height: 18 }}>
                              <FireFilled style={{ fontSize: 9 }} /> Rising
                            </Tag>
                          )}
                          {profile.global_rank && profile.global_rank <= 100 && (
                            <Tag color="default" style={{ fontSize: '10px', padding: '0 6px', height: 18 }}>
                              #{profile.global_rank} Global
                            </Tag>
                          )}
                        </div>
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
                loading={loading}
              >
                Search with Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AdvancedSearch;