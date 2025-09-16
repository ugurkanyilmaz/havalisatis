import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);
const LANG_KEY = 'pref:lang';
const MESSAGES = {
  tr: {
    home: 'Ana Sayfa', products: 'Ürünler', contact: 'İletişim', service: 'Teknik Servis',
    cart: 'Sepet', login: 'Giriş', register: 'Kayıt', logout: 'Çıkış Yap', theme: 'Tema', language: 'Dil', dark: 'Karanlık', light: 'Aydınlık'
  },
  en: {
    home: 'Home', products: 'Products', contact: 'Contact', service: 'Service',
    cart: 'Cart', login: 'Login', register: 'Register', logout: 'Logout', theme: 'Theme', language: 'Language', dark: 'Dark', light: 'Light'
  }
};

export function LanguageProvider({ children }){
  const [lang, setLang] = useState(()=> localStorage.getItem(LANG_KEY) || 'tr');
  useEffect(()=>{ localStorage.setItem(LANG_KEY, lang); }, [lang]);
  const t = (key)=> MESSAGES[lang][key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang(){
  const ctx = useContext(LanguageContext);
  if(!ctx) throw new Error('LanguageContext missing');
  return ctx;
}
