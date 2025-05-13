import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import LanguageDetector from 'i18next-browser-languagedetector';

import {i18nextPlugin} from 'translation-check'

import enTrans from "@/assets/locales/en/translation.json";
import zhTrans from "@/assets/locales/zh/translation.json";

const resources = {
    "en": {
        translation: enTrans
    },
    "zh": {
        translation: zhTrans
    }
}

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .use(i18nextPlugin)
    .init({
        resources,
        fallbackLng: 'en',
        lng: navigator.language,
        debug: true,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });


export default i18n;