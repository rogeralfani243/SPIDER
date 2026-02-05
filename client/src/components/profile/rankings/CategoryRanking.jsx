// components/CategoryRanking.jsx
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
  Statistic
} from 'antd';
import { 
  TrophyFilled,
  StarFilled,
  FireOutlined,
  FlagOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const CategoryRanking = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  loadingCategories 
}) => {
  const [categoryLeaders, setCategoryLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    
    try {
      const res = await rankingAPI.getTopByCategory(categoryId);
      setCategoryLeaders(res.data || []);
    } catch (error) {
      console.error('Error fetching category leaders:', error);
    } finally {
      setLoading(false);
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

  return (
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
          loading={loading}
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
  );
};

export default CategoryRanking;