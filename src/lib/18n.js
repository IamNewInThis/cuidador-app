import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';
import { initReactI18next } from 'react-i18next';
import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';
const locales = RNLocalize.getLocales();
const deviceLang = Array.isArray(locales) && locales.length > 0 ? locales[0].languageCode : 'en';

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: { es: { translation: es }, en: { translation: en }, pt: { translation: pt } },
        lng: ['es', 'en', 'pt'].includes(deviceLang) ? deviceLang : 'es',
        fallbackLng: 'es',
        interpolation: { escapeValue: false },
    });

export default i18n;