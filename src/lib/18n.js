import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

const LANG_KEY = 'user_language';

// ✅ Función para inicializar idioma guardado o del sistema
const initLanguage = async () => {
  try {
    // Busca idioma guardado en AsyncStorage
    const storedLang = await AsyncStorage.getItem(LANG_KEY);

    if (storedLang) {
      return storedLang;
    }

    // Si no hay guardado, toma el idioma del sistema
    const locales = RNLocalize.getLocales();
    const deviceLang =
      Array.isArray(locales) && locales.length > 0
        ? locales[0].languageCode
        : 'es';

    // Devuelve el idioma soportado más cercano
    return ['es', 'en', 'pt'].includes(deviceLang) ? deviceLang : 'es';
  } catch (error) {
    console.error('Error al inicializar idioma:', error);
    return 'es';
  }
};

// ✅ Inicialización de i18n
(async () => {
  const lang = await initLanguage();

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: lang,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

  // Escucha cambios del sistema (opcional)
  RNLocalize.addEventListener('change', async () => {
    const locales = RNLocalize.getLocales();
    const newLang =
      Array.isArray(locales) && locales.length > 0
        ? locales[0].languageCode
        : 'es';

    const validLang = ['es', 'en', 'pt'].includes(newLang)
      ? newLang
      : 'es';
    await AsyncStorage.setItem(LANG_KEY, validLang);
    i18n.changeLanguage(validLang);
  });
})();

export const setAppLanguage = async (lang) => {
  await AsyncStorage.setItem(LANG_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
