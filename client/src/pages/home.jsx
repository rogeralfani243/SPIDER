import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/main.css'
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/main')
      .then(response => {
        setPosts(response.data.posts || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Derniers posts</h1>
      {posts.length === 0 ? (
        <p>Aucun post pour le moment.</p>
      ) : (
        posts.map(post => (
          <div key={post.id} style={{
            border: '1px solid #ddd',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '8px'
          }}>
            <p><strong>@{post.user?.username}</strong></p>
            <p>{post.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Home;