// hooks/useSearch.js - version corrigée
import { useState, useCallback, useEffect, useRef } from 'react';
import { searchAPI } from '../components/services/api';

export const useSearch = (initialType = 'all') => {
  const [searchState, setSearchState] = useState({
    query: '',
    type: initialType,
    results: {
      profiles: [],
      posts: [],
      groups: [],
      categories: [],
      tags: [],
      count: 0,
      query: ''
    },
    loading: false,
    error: null,
    filters: {},
    suggestions: []
  });
  
  const debounceTimeout = useRef(null);
  const abortController = useRef(null);
  
  const search = useCallback(async (query, type = searchState.type, filters = {}) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        query: '',
        results: {
          profiles: [], posts: [], groups: [], categories: [], tags: [], count: 0, query: ''
        }
      }));
      return;
    }
    
    // Annuler la requête précédente
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Nouveau controller pour cette requête
    abortController.current = new AbortController();
    
    // Debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    setSearchState(prev => ({ 
      ...prev, 
      query, 
      type, 
      loading: true, 
      error: null,
      filters 
    }));
    
    debounceTimeout.current = setTimeout(async () => {
      try {
        let response;
        
        if (type === 'all') {
          response = await searchAPI.searchAll(query, {
            ...filters,
            signal: abortController.current.signal
          });
        } else {
          const method = `search${type.charAt(0).toUpperCase() + type.slice(1)}`;
          response = await searchAPI[method](query, {
            ...filters,
            signal: abortController.current.signal
          });
        }
        
        if (type === 'all') {
          setSearchState(prev => ({
            ...prev,
            results: {
              ...response.data,
              count: response.data.count || 0,
              query
            },
            loading: false
          }));
        } else {
          setSearchState(prev => ({
            ...prev,
            results: {
              ...prev.results,
              [type]: response.data,
              count: Array.isArray(response.data) ? response.data.length : 0,
              query
            },
            loading: false
          }));
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          // Requête annulée intentionnellement
          return;
        }
        
        console.error('Search error:', error);
        setSearchState(prev => ({
          ...prev,
          error: error.response?.data?.error || error.message || 'Erreur de recherche',
          loading: false
        }));
      }
    }, 400); // 400ms debounce
  }, [searchState.type]);
  
  // Fonction pour changer le type de recherche
  const setType = useCallback((type) => {
    setSearchState(prev => ({ ...prev, type }));
  }, []);
  
  const getSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchState(prev => ({ ...prev, suggestions: [] }));
      return;
    }
    
    try {
      const response = await searchAPI.getSearchSuggestions(query);
      setSearchState(prev => ({ 
        ...prev, 
        suggestions: response.data.suggestions || [] 
      }));
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  }, []);
  
  const clearResults = useCallback(() => {
    // Annuler les requêtes en cours
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setSearchState({
      query: '',
      type: initialType,
      results: {
        profiles: [], posts: [], groups: [], categories: [], tags: [], count: 0, query: ''
      },
      loading: false,
      error: null,
      filters: {},
      suggestions: []
    });
  }, [initialType]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);
  
  return {
    ...searchState,
    search,
    setType, // AJOUTEZ CETTE FONCTION
    getSuggestions,
    clearResults
  };
};