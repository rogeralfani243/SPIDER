import React, { useState } from 'react';
import axios from 'axios';

const SignUp = ({ onRegister, onSwitchToLogin, onRedirectToProfile }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation côté client
    if (!formData.username || !formData.password) {
      setError('Le nom d\'utilisateur et le mot de passe sont requis');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Tentative d\'inscription...', { 
        username: formData.username,
        hasPassword: !!formData.password 
      });

      // 1. Inscription uniquement - le token est retourné directement
      const response = await axios.post(
        'http://localhost:8000/accounts/auth/register/',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ Registration successful:', response.data);
      
      // 2. Le backend retourne directement le token, pas besoin de relogin
      const { token, user } = response.data;

      // Sauvegarder le token et les données utilisateur
      if (token) {
        localStorage.setItem('token', token);
        // Configurer Axios pour les futures requêtes
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        console.log('🔑 Token saved successfully');
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('👤 User data saved:', user.username);
      }

      setSuccess('Compte créé avec succès! Redirection...');

      // Appeler le callback onRegister si fourni
      if (onRegister) {
        onRegister(user);
      }

      // 3. Redirection directe vers la modification du profil
      setTimeout(() => {
        if (onRedirectToProfile) {
          onRedirectToProfile();
        } else {
          window.location.href = '/profile-modif';
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Registration error:', error);
      handleRegistrationError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationError = (error) => {
    if (error.response?.data) {
      const errors = error.response.data;
      
      if (errors.error) {
        // Erreur personnalisée du backend
        setError(errors.error);
      } else if (errors.username) {
        setError(`Nom d'utilisateur: ${errors.username.join(', ')}`);
      } else if (errors.email) {
        setError(`Email: ${errors.email.join(', ')}`);
      } else if (errors.password) {
        setError(`Mot de passe: ${errors.password.join(', ')}`);
      } else if (typeof errors === 'object') {
        // Erreurs de validation Django
        const errorMessages = Object.values(errors).flat();
        setError(errorMessages.join(', '));
      } else {
        setError('Erreur lors de la création du compte');
      }
    } else if (error.request) {
      setError('Erreur réseau - impossible de contacter le serveur');
    } else {
      setError('Erreur inattendue lors de l\'inscription');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Nom d'utilisateur *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="3"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Prénom</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Nom</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Mot de passe *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
            style={{ width: '100%', padding: '10px' }}
          />
          <small style={{ color: '#666' }}>Minimum 6 caractères</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Confirmer le mot de passe *</label>
          <input
            type="password"
            name="password_confirm"
            value={formData.password_confirm}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        {error && (
          <div style={{
            color: '#d32f2f',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {success && (
          <div style={{
            color: '#2e7d32',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>Succès:</strong> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Création du compte...' : 'Créer un compte'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span>Déjà un compte ? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Se connecter
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUp;