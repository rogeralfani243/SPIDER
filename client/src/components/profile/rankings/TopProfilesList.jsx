// components/TopProfilesList.jsx
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
  TrophyOutlined,
  TrophyFilled,
  StarFilled,
  FireOutlined,
  FlagOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const TopProfilesList = ({ topProfiles, loading }) => {
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
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <span>Top  Profiles</span>
          <Tag color="blue" style={{ fontSize: '11px', fontWeight: 'normal' }}>
            Minimum 3 reviews
          </Tag>
        </div>
      }
      loading={loading}
      style={{ height: '100%', borderRadius: 8 }}
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
            const handleClickProfile = () => (window.location.href = `/profile/${profile.id}`);
            
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
                        <Avatar 
                          src={profile.image} 
                          size={44}
                          style={{
                            border: index < 3 ? '3px solid transparent' : 'none',
                          }}
                          onClick={() => window.location.href = `/profile/${profile.id}`}
                        />
                      ) : (
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
                  }
                  title={
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
};

export default TopProfilesList;