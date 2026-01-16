// src/context/CategoryContext.jsx
import React, { createContext, useState, useContext } from 'react';

const CategoryContext = createContext();

export const useCategory = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState('software');
  const [categoryData, setCategoryData] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  const changeCategory = async (categorySlug) => {
    setActiveCategory(categorySlug);
    
    // Charger les données de la catégorie
    try {
      const response = await categoryService.getCategoryByName(categorySlug);
      setCategoryData(response.data.category);
      setSubcategories(response.data.subcategories || []);
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  return (
    <CategoryContext.Provider value={{
      activeCategory,
      categoryData,
      subcategories,
      changeCategory,
      setCategoryData
    }}>
      {children}
    </CategoryContext.Provider>
  );
};