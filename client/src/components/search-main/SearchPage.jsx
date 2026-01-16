// pages/SearchPage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import SearchResults from './searchResult';
import DashboardMain from '../dashboard_main';
const SearchPage = () => {
  const location = useLocation();
  
  return (
        <>

    <div className="search-page">

      <SearchResults />
    </div>
        </>
  );
};

export default SearchPage;