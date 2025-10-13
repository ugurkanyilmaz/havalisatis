import React from 'react';
import { Link } from 'react-router-dom';
import { SOCIAL_LINKS } from '../lib/socialLinks.js';
import urwareLogo from './urware.net_logo.png';

export default function Footer() {
  return (
    <footer className="bg-[#1f1f20] text-neutral-400 text-sm relative">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-12">
        <div className="space-y-3">
          <h4 className="text-white font-semibold tracking-wide">KETEN PNÖMATİK</h4>
          <p className="text-xs leading-relaxed text-neutral-400">Profesyonel el aletleri satış platformu.</p>
          <div className="text-xs text-neutral-400 mt-3 space-y-1">
            <div>Adres: <a href="https://goo.gl/maps/" target="_blank" rel="noopener noreferrer" className="text-neutral-200 hover:underline">Yenikent, Mehmet Akif Ersoy Cad. No:52, 41400 Gebze/Kocaeli</a></div>
            <div>Telefon: <a href="tel:+905414526058" className="text-neutral-200 hover:underline">+90 (541) 452 60 58</a></div>
            <div>Telefon (PBX): <a href="tel:+902626434339" className="text-neutral-200 hover:underline">+90 (262) 643 43 39</a></div>
            <div>E-posta: <a href="mailto:info@ketenpnomatik.com.tr" className="text-neutral-200 hover:underline">info@ketenpnomatik.com.tr</a></div>
          </div>
        </div>

        <div>
          <h5 className="text-white font-semibold mb-3 text-xs tracking-wider">BİLGİ</h5>
          <ul className="space-y-1 text-xs text-neutral-400">
            <li><Link to="/iletisim" className="hover:underline">İletişim</Link></li>
            <li><Link to="/urunler" className="hover:underline">Ürünlerimiz</Link></li>
            <li><Link to="/teknik-servis" className="hover:underline">Teknik Servis</Link></li>
            <li><a href="/katalog.pdf" className="hover:underline">Katalog (PDF)</a></li>
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all shadow-lg backdrop-blur-sm border border-emerald-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.42-10 9.87 0 1.74.47 3.43 1.37 4.92L2 22l5.4-1.76c1.43.78 3.05 1.19 4.67 1.19h.01c5.52 0 10-4.42 10-9.87 0-2.64-1.07-5.12-3.02-6.99A10.55 10.55 0 0 0 12.04 2Zm5.88 14.19c-.25.7-1.46 1.33-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.11-1-.32-1.72-.63-3.03-1.31-5-4.37-5.15-4.58-.15-.21-1.23-1.64-1.23-3.13 0-1.48.78-2.2 1.06-2.5.28-.3.61-.37.82-.37.2 0 .4.01.57.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.21-.15.33-.3.51-.15.17-.31.39-.44.52-.15.15-.31.32-.13.63.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.54.31.15.49.13.67-.08.18-.21.77-.88.97-1.18.2-.3.41-.24.68-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.07.12.07.72-.18 1.42Z"/></svg>
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 hover:text-pink-300 transition-all shadow-lg backdrop-blur-sm border border-pink-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-.88a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76Z"/></svg>
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all shadow-lg backdrop-blur-sm border border-red-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10.5 15.02V8.98L15.5 12l-5 3.02Z"/></svg>
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition-all shadow-lg backdrop-blur-sm border border-blue-600/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13.5 9H16l.5-3h-3V4.5c0-.966.196-1.5 1.5-1.5H16V0h-2.4C10.9 0 9.5 1.343 9.5 3.8V6H7v3h2.5v12h4V9Z"/></svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start justify-center">
          <h5 className="text-white font-semibold mb-2 text-xs tracking-wider">Demo Talep</h5>
          <p className="text-xs text-neutral-200 leading-relaxed mb-3">Türkiye’nin her yerindeki satış temsilcilerimizden demo talep edin, ürünlerimizi kendi çalışma alanınızda deneyimleyin.</p>
          <Link to="/iletisim" className="inline-flex items-center gap-2 rounded-lg bg-brand-orange text-white text-[13px] font-semibold px-4 py-2">Demo Talep Et</Link>
        </div>
      </div>

      <div className="border-t border-white/5 text-center py-5 text-[11px] tracking-wide">
        © {new Date().getFullYear()} Keten Pnömatik.
      </div>

      {/* Urware logo - directly visible bottom-right (no effects) */}
      <a href="https://urware.net" target="_blank" rel="noopener noreferrer" className="absolute right-6 bottom-6 z-50 opacity-20 hover:opacity-100 transform hover:scale-105 transition-all duration-200" title="urware.net">
        <img src={urwareLogo} alt="urware.net" className="block w-7 md:w-11 h-auto" />
      </a>
    </footer>
  );
}
