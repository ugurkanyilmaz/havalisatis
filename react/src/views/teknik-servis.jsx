import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { setHomeHead } from '../lib/head_manager.js';

export default function TeknikServis(){
  useEffect(() => {
    setHomeHead({
      title: 'Teknik Servis - Havalı El Aletleri Tamiri',
      description: 'Marka farketmeksizin tüm havalı el aletleri tamiri, pnömatik alet servisi, yedek parça ve bakım hizmetleri. Hızlı ve güvenilir teknik servis.',
      robots: 'index,follow'
    });
    // Add extra meta tags and JSON-LD structured data (managed by data-head-managed="keten")
    try {
      if (typeof document !== 'undefined') {
        const head = document.head;
        // Meta: keywords
        const metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', 'havalı el aletleri tamiri, pnömatik alet servisi, hava aleti yedek parça, profesyonel el aletleri bakımı, teknik servis');
        metaKeywords.setAttribute('data-head-managed', 'keten');
        head.appendChild(metaKeywords);

        // Meta: author
        const metaAuthor = document.createElement('meta');
        metaAuthor.setAttribute('name', 'author');
        metaAuthor.setAttribute('content', 'Keten Teknik Servis');
        metaAuthor.setAttribute('data-head-managed', 'keten');
        head.appendChild(metaAuthor);

        // OG type: service
        const metaOgType = document.createElement('meta');
        metaOgType.setAttribute('property', 'og:type');
        metaOgType.setAttribute('content', 'service');
        metaOgType.setAttribute('data-head-managed', 'keten');
        head.appendChild(metaOgType);

        // JSON-LD graph: LocalBusiness + Service
        const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : undefined;
        const localBusiness = {
          '@type': 'LocalBusiness',
          name: 'Keten Teknik Servis',
          '@id': origin ? `${origin}#organization` : undefined,
          telephone: ['+90 541 452 60 58', '+90 262 643 43 39'],
          email: 'info@ketenpnomatik.com.tr',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Yenikent, Mehmet Akif Ersoy Cad. No:52',
            addressLocality: 'Gebze',
            postalCode: '41400',
            addressRegion: 'Kocaeli',
            addressCountry: 'TR'
          },
          openingHoursSpecification: [
            { '@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday','Tuesday','Wednesday','Thursday','Friday'], 'opens': '09:00', 'closes': '18:00' },
            { '@type': 'OpeningHoursSpecification', 'dayOfWeek': 'Saturday', 'opens': '09:00', 'closes': '13:00' }
          ],
          serviceArea: 'TR'
        };

        const service = {
          '@type': 'Service',
          name: 'Havalı El Aletleri Teknik Servis',
          description: 'Marka farketmeksizin tüm havalı el aletleri tamiri, bakım ve yedek parça temini.',
          provider: { '@type': 'LocalBusiness', name: 'Keten Teknik Servis' }
        };

        const graph = {
          '@context': 'https://schema.org',
          '@graph': [localBusiness, service]
        };
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.text = JSON.stringify(graph);
        s.setAttribute('data-head-managed', 'keten');
        head.appendChild(s);
      }
    } catch (err) {
      // ignore non-critical head injection errors
    }
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">Teknik Servis</h1>
        <p className="text-neutral-600 mt-2">Her markadan Tüm Havalı - Elektrikli aletler için yetkili teknik servis, bakım ve orijinal yedek parça desteği.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold">Hizmetlerimiz</h2>
          <ul className="list-disc list-inside text-neutral-700 space-y-2">
            <li>Periyodik bakım ve kontrol</li>
            <li>Arıza tespiti ve onarım</li>
            <li>Orijinal yedek parça temini</li>
            <li>Garanti içi / garanti dışı servis işlemleri</li>
            <li>Montaj, eğitim ve saha desteği</li>
            <li>Yerinde tork ölçüm ve kalibrasyon hizmeti</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Nasıl gönderirsiniz?</h3>
          <p className="text-neutral-700">Ürünü kargo ile servise gönderebilir veya yetkili servise bırakabilirsiniz. Lütfen ürün ile birlikte fatura/servis formu ekleyiniz. Daha hızlı işleme almak için önceden <NavLink to="/iletisim" className="text-brand-orange underline">iletişime</NavLink> geçerek kayıt oluşturun.</p>

          <h3 className="text-xl font-semibold mt-6">Servis Ücreti & Süre</h3>
          <p className="text-neutral-700">Arıza tespitinden sonra onarım maliyeti ve süre bilgisi tarafınıza iletilir. Onay vermeniz halinde işlem başlatılır.</p>
        </div>

        <aside className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
          <h4 className="text-lg font-semibold">İletişim & Adres</h4>
          <p className="text-neutral-700 mt-2">Keten Teknik Servis Merkezi</p>
          <address className="not-italic text-neutral-700 mt-2">Yenikent, Mehmet Akif Ersoy Cad. No:52<br />41400 Gebze/Kocaeli</address>

          <div className="mt-4">
            <a href="tel:+905414526058" className="block font-semibold text-brand-orange">+90 (541) 452 60 58</a>
            <a href="tel:+902626434339" className="block font-semibold text-brand-orange mt-1">+90 (262) 643 43 39 <span className="text-[11px] text-neutral-600">(PBX)</span></a>
            <a href="mailto:info@ketenpnomatik.com.tr" className="block mt-1 text-neutral-700">info@ketenpnomatik.com.tr</a>
          </div>

          <div className="mt-6">
            <h5 className="font-semibold">Çalışma Saatleri</h5>
            <p className="text-neutral-700">Hafta içi: 08:00 - 18:00<br />Cumartesi: 08:00 - 13:00</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
