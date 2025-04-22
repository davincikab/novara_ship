/* eslint-disable react/prop-types */
import {
    createContext, useContext, useEffect, useMemo, useState
  } from 'react';
 
  import en from './resources/l10n/en.json'; 
  import it from './resources/l10n/it.json'; 
  
  const languages = {
    en: { data: en, country: 'US', name: 'English' },
    it: { data: it, country: 'IT', name: 'Italiano' }
  };


export const savePersistedState = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const usePersistedState =  (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);

    return stickyValue ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    if (value !== defaultValue ) {
      savePersistedState(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [key, value]);

  return [value, setValue];
};
  
  const getDefaultLanguage = () => {
    const browserLanguages = window.navigator.languages ? window.navigator.languages.slice() : [];
    const browserLanguage = window.navigator.userLanguage || window.navigator.language;
    browserLanguages.push(browserLanguage);
    browserLanguages.push(browserLanguage.substring(0, 2));
  
    for (let i = 0; i < browserLanguages.length; i += 1) {
      let language = browserLanguages[i].replace('-', '');
      if (language in languages) {
        return language;
      }
      if (language.length > 2) {
        language = language.substring(0, 2);
        if (language in languages) {
          return language;
        }
      }
    }
    return 'en';
  };
  
  const LocalizationContext = createContext({
    languages,
    language: 'it',
    setLanguage: () => {},
  });
  
  export const LocalizationProvider = ({ children }) => {
    const [language, setLanguage] = usePersistedState('language', getDefaultLanguage());
  
    const value = useMemo(() => ({ languages, language, setLanguage }), [ language, setLanguage]);
  
    useEffect(() => {
      let selected;
      if (language.length > 2) {
        selected = `${language.slice(0, 2)}-${language.slice(-2).toLowerCase()}`;
      } else {
        selected = language;
      }
    //   dayjs.locale(selected);
    }, [language]);
  
    return (
      <LocalizationContext.Provider value={value}>
        {children}
      </LocalizationContext.Provider>
    );
  };
  
  export const useLocalization = () => useContext(LocalizationContext);
  
  export const useTranslation = () => {
    const context = useContext(LocalizationContext);
    const { data } = context.languages[context.language];
    return useMemo(() => (key) => data[key], [data]);
  };

  export const useTranslateTo = (langCode) => {
    const context = useContext(LocalizationContext);
    const { data } = context.languages[langCode] ? context.languages[langCode] : context.languages[context.language];
     return useMemo(() => (key) => data[key], [data]);
  }
  
  export const useTranslationKeys = (predicate) => {
    const context = useContext(LocalizationContext);
    const { data } = context.languages[context.language];
    return Object.keys(data).filter(predicate);
  };
  