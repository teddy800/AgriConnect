import { createContext, useContext, useState } from 'react';

const dict = {
  en: {
    market: 'Marketplace', prices: 'Prices', inquiries: 'Inquiries', post: 'Post produce',
    login: 'Log in', logout: 'Log out', register: 'Register', search: 'Search',
    allCrops: 'All crops', allRegions: 'All regions', sendInquiry: 'Send inquiry',
    noListings: 'No listings match. Try removing a filter.', available: 'available',
    phone: 'Phone (09...)', password: 'Password', fullName: 'Full name', publish: 'Publish listing',
    alerts: 'Alerts', accept: 'Accept', reject: 'Reject'
  },
  am: {
    market: 'ገበያ', prices: 'ዋጋ', inquiries: 'ጥያቄዎች', post: 'ምርት ለጥፍ',
    login: 'ግባ', logout: 'ውጣ', register: 'ተመዝገብ', search: 'ፈልግ',
    allCrops: 'ሁሉም ሰብሎች', allRegions: 'ሁሉም ክልሎች', sendInquiry: 'ጥያቄ ላክ',
    noListings: 'ምንም ምርት አልተገኘም። ማጣሪያ ያስወግዱ።', available: 'ይገኛል',
    phone: 'ስልክ (09...)', password: 'የይለፍ ቃል', fullName: 'ሙሉ ስም', publish: 'ምርቱን አትም',
    alerts: 'ማሳወቂያዎች', accept: 'ተቀበል', reject: 'ውድቅ አድርግ'
  },
  om: {
    market: 'Gabaa', prices: 'Gatii', inquiries: 'Gaaffiiwwan', post: 'Oomisha maxxansi',
    login: 'Seeni', logout: "Ba'i", register: 'Galmaa\'i', search: 'Barbaadi',
    allCrops: 'Midhaan hunda', allRegions: 'Naannoo hunda', sendInquiry: 'Gaaffii ergi',
    noListings: 'Oomishni hin argamne. Calaltuu kaasi.', available: 'ni jira',
    phone: 'Bilbila (09...)', password: 'Jecha icciitii', fullName: 'Maqaa guutuu', publish: 'Oomisha maxxansi',
    alerts: 'Beeksisa', accept: 'Fudhadhu', reject: 'Didi'
  }
};

const Ctx = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const change = l => { localStorage.setItem('lang', l); setLang(l); };
  const t = k => dict[lang][k] ?? dict.en[k] ?? k;
  return <Ctx.Provider value={{ t, lang, setLang: change }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);