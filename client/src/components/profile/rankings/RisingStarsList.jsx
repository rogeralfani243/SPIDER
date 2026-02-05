// components/RisingStarsList.jsx
import React from 'react';
import { 
  Card, 
  List, 
  Tag, 
  Statistic, 
  Typography, 
  Empty,
  Avatar,
  Tooltip,
  Button
} from 'antd';
import { 
  RiseOutlined, 
  FireOutlined,
  StarFilled,
  FlagOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const RisingStarsList = ({ risingStars, loading }) => {
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
};

export default RisingStarsList;