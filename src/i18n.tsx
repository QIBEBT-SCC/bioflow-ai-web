import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
    .init({
        resources,
        fallbackLng: 'zh', // 默认使用中文
        debug: false, // 生产环境关闭debug

        detection: {
            // 检测顺序：localStorage -> navigator -> htmlTag -> 默认语言
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            // 支持的语言列表
            lookupLocalStorage: 'i18nextLng',
            // 语言映射：将浏览器语言代码映射到我们支持的语言
            convertDetectedLanguage: (lng: string) => {
                // 支持的语言列表
                const supportedLanguages = ['zh', 'en'];
                
                // 如果是完整语言代码（如 zh-CN, en-US），提取主要部分
                const mainLang = lng.split('-')[0].toLowerCase();
                
                // 如果支持的语言中包含主要语言，返回主要语言
                if (supportedLanguages.includes(mainLang)) {
                    return mainLang;
                }
                
                // 如果不支持，返回默认语言
                return 'zh';
            }
        },

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });