import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English
  
  // Load saved language preference on app start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage && ['en', 'ta', 'hi'].includes(savedLanguage)) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };
    
    loadLanguage();
  }, []);
  
  // Save language preference when it changes
  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('appLanguage', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };
  
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};