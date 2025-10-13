// head_menager_home.js
// Small adapter that applies page-specific head/meta data using the shared head manager.
import { setHomeHead, clearHead } from './head_manager.js';

// These must match the internal constants used by head_manager.js so our extra metas
// are removed by clearHead()/removeManaged(). Keep in sync with head_manager.js
const MANAGED_ATTR = 'data-head-managed';
const MANAGED_VALUE = 'keten';

function addManagedMeta(nameOrProperty, content, isProperty = false) {
  if (!content) return;
  try {
    const m = document.createElement('meta');
    if (isProperty) m.setAttribute('property', nameOrProperty);
    else m.setAttribute('name', nameOrProperty);
    m.setAttribute('content', content);
    m.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    document.head.appendChild(m);
  } catch (e) {
    // ignore
  }
}

function addManagedJsonLd(obj) {
  if (!obj) return;
  try {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    s.text = JSON.stringify(obj, null, 2);
    document.head.appendChild(s);
  } catch (e) {
    // ignore
  }
}

export function applyHomeMeta() {
  if (typeof document === 'undefined') return;
  clearHead();
  setHomeHead({
    title: 'Keten Pnömatik | Havalı El Aletleri, Elektrikli Aletler ve Teknik Servis',
    description: 'Keten Pnömatik, profesyonel kullanıma uygun havalı el aletleri, elektrikli el aletleri, tork aletleri ve endüstriyel montaj ekipmanları satışı yapar. Uygun fiyatlı ürünler, yedek parça ve teknik servis desteği ile Türkiye genelinde hizmet veriyoruz.',
  });

  addManagedMeta('keywords', 'keten pnömatik, havalı el aletleri, elektrikli el aletleri, pnömatik ürünler, endüstriyel aletler, tork aletleri, somun sıkma makinesi, darbeli vidalama, tork tornavida, hava tabancası, endüstriyel ekipman, montaj aletleri, pnömatik sistemler, hava basınçlı aletler, profesyonel el aletleri, sanayi tipi el aletleri, endüstriyel servis, teknik destek');
  addManagedMeta('schema:description', 'Keten Pnömatik; havalı, elektrikli ve tork kontrollü el aletleri satışında uzmanlaşmış, sanayi tipi montaj çözümleri ve teknik servis hizmetleri sunan bir markadır.');
  // JSON-LD Schema.org (Organization + Service summary)
  addManagedJsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Keten Pnömatik",
    "url": "https://havalielaletlerisatis.com",
    "description": "Keten Pnömatik; havalı, elektrikli ve tork kontrollü el aletleri satışında uzmanlaşmış, sanayi tipi montaj çözümleri ve teknik servis hizmetleri sunan bir markadır.",
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "0262 643 43 39",
      "contactType": "sales",
      "availableLanguage": ["tr"]
    }]
  });
}

export function applyProductsMeta() {
  if (typeof document === 'undefined') return;
  clearHead();
  setHomeHead({
    title: 'Havalı & Elektrikli El Aletleri Ürünleri | Keten Pnömatik Ürün Kataloğu',
    description: 'Keten Pnömatik ürünleriyle havalı somun sıkma makinesi, elektrikli tork tornavida, hava tabancası, montaj ekipmanları ve kalibrasyon cihazlarını inceleyin. Yüksek performans, uzun ömür ve orijinal yedek parça garantisi!',
  });

  addManagedMeta('keywords', 'havalı el aletleri, elektrikli el aletleri, pnömatik ürünler, tork anahtarı, tork ölçer, somun sıkma makinesi, hava tabancası, montaj hattı aletleri, endüstriyel vidalama, basınçlı hava ekipmanları, profesyonel el aletleri, endüstriyel makine, pnömatik set, tork kontrol sistemleri, otomasyon montaj aletleri, keten ürünleri');
  addManagedMeta('schema:description', 'Keten Pnömatik ürün kataloğu; endüstriyel montaj, bakım ve üretim alanlarında kullanılan havalı, elektrikli ve tork kontrollü aletlerden oluşur.');
  addManagedJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Keten Pnömatik Ürün Kataloğu",
    "url": "https://havalielaletlerisatis.com/urunler",
    "description": "Keten Pnömatik ürün kataloğu; endüstriyel montaj, bakım ve üretim alanlarında kullanılan havalı, elektrikli ve tork kontrollü aletlerden oluşur.",
  });
}

export function applyServiceMeta() {
  if (typeof document === 'undefined') return;
  clearHead();
  setHomeHead({
    title: 'Teknik Servis | Keten Pnömatik – Havalı & Elektrikli Alet Servisi',
    description: 'Her markadan havalı el aleti servisi, elektrikli alet bakımı, tork kalibrasyonu ve yedek parça onarımı. Keten Pnömatik Teknik Servis, Gebze’de uzman kadro ve orijinal parça garantisiyle hızlı çözüm sunar.',
  });

  addManagedMeta('keywords', 'teknik servis, havalı el aleti servisi, elektrikli alet onarımı, tork kalibrasyonu, yedek parça değişimi, endüstriyel bakım, arıza tespiti, pnömatik servis, keten teknik servis, el aleti tamiri, sanayi tipi onarım, kalibrasyon hizmeti, garanti dışı servis, yerinde servis, bakım sözleşmesi');
  addManagedMeta('schema:description', 'Keten Teknik Servis, havalı ve elektrikli el aletlerinin bakım, onarım, kalibrasyon ve yedek parça temininde uzmanlaşmış, garanti içi ve dışı hizmet sunan bir teknik servis merkezidir.');
  addManagedJsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Keten Teknik Servis",
    "areaServed": "Türkiye",
    "serviceType": "Havalı ve elektrikli el aleti servisi, kalibrasyon, yedek parça",
    "url": "https://havalielaletlerisatis.com/teknik-servis",
    "description": "Keten Teknik Servis, havalı ve elektrikli el aletlerinin bakım, onarım, kalibrasyon ve yedek parça temininde uzmanlaşmış, garanti içi ve dışı hizmet sunan bir teknik servis merkezidir.",
  });
}

export function applyContactMeta() {
  if (typeof document === 'undefined') return;
  clearHead();
  setHomeHead({
    title: 'İletişim | Keten Pnömatik – Satış & Teknik Servis Destek Hattı',
    description: 'Keten Pnömatik ile iletişime geçin! Teknik servis talepleri, yedek parça siparişi, fiyat teklifi ve ürün desteği için bize telefon veya e-posta ile ulaşabilirsiniz. Gebze Merkez ofisimizde hizmetinizdeyiz.',
  });

  addManagedMeta('keywords', 'keten iletişim, teknik servis iletişim, havalı el aleti iletişim, elektrikli alet desteği, keten müşteri hizmetleri, keten pnömatik telefon, keten e-posta, gebze teknik servis, satış destek hattı, ürün teklifi, servis kaydı oluşturma, endüstriyel servis iletişimi');
  addManagedMeta('schema:description', 'Keten Pnömatik iletişim sayfası, kullanıcıların satış ve servis konularında destek almak, servis kaydı oluşturmak veya teklif talebinde bulunmak için başvurabileceği resmi iletişim kanallarını içerir.');
  addManagedJsonLd({
    "@context": "https://schema.org",
    "@type": "ContactPoint",
    "telephone": "0262 643 43 39",
    "contactType": "customer support",
    "areaServed": "TR",
    "availableLanguage": ["Turkish"],
    "description": "Keten Pnömatik iletişim sayfası, kullanıcıların satış ve servis konularında destek almak, servis kaydı oluşturmak veya teklif talebinde bulunmak için başvurabileceği resmi iletişim kanallarını içerir.",
  });
}

// Export defaults for convenience
export default {
  applyHomeMeta,
  applyProductsMeta,
  applyServiceMeta,
  applyContactMeta,
};
