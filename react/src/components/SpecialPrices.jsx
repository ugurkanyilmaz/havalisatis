import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProtectedImage from './ProtectedImage.jsx';
import { formatPriceTL } from '../lib/format.js';
// Swiper
// SpecialPrices uses a marquee-style strip; no Swiper required here

function normalizeImgUrl(s) {
	if (!s) return null;
	s = String(s).trim();
	if (/^https?:\/\//i.test(s)) return s;
	if (/^\/\//.test(s)) return window.location.protocol + s;
	if (/^[^\s\/]+\.[^\s\/]+/.test(s)) return 'https://' + s;
	return s;
}

function SmallTile({ item, active, onClick }) {
	const img = normalizeImgUrl(item.main_img || item.img1 || '');

	// compute discounted price if discount present
	const rawList = item.list_price;
	const list = rawList === 0 || rawList === '0' ? 0 : (rawList ? Number(rawList) : null);
	const disc = Number(item.discount) || 0;
	const discounted = list && disc > 0 ? Math.round((list * (100 - disc)) / 100) : list;

	return (
		<button onClick={() => onClick(item)} className={`w-full p-4 rounded-lg bg-white border hover:shadow-lg transform transition duration-200 ${active ? 'ring-2 ring-orange-300 scale-105' : ''}`}>
			<div className="flex items-center gap-4">
				<div className="w-20 h-20 bg-neutral-50 rounded-md overflow-hidden flex items-center justify-center">
					{img ? <ProtectedImage src={img} alt={item.title || item.sku} className="w-full h-full object-contain" /> : <div className="text-xs text-neutral-400">No img</div>}
				</div>
				<div className="text-left flex-1">
					<div className="text-sm text-neutral-500">{item.sku}</div>
					<div className="text-md font-semibold line-clamp-2">{item.title}</div>
					<div className="mt-2 flex items-center gap-3">
						{disc > 0 && (
							<span className="inline-flex items-center justify-center bg-brand-orange/10 text-brand-orange text-xs font-semibold px-2 py-1 rounded">-%{disc}</span>
						)}
						<div className="text-lg text-brand-orange font-extrabold">{list === 0 ? 'Fiyat için teklif alınız' : (discounted ? formatPriceTL(discounted) : 'Teklif Al')}</div>
					</div>
				</div>
			</div>
		</button>
	);

	}

export default function SpecialPrices({ specialPrices = [] }) {
	const navigate = useNavigate();
	const items = Array.isArray(specialPrices) ? specialPrices : [];
	const [activeIdx, setActiveIdx] = useState(0);
	const timer = useRef(null);
	const swiperRef = useRef(null);

	// keep active index valid when items change
	useEffect(() => {
		if (!items.length) { setActiveIdx(0); return; }
		setActiveIdx(i => Math.min(i, items.length - 1));
	}, [items.length]);

	// auto-advance
	useEffect(() => {
		if (timer.current) { clearInterval(timer.current); timer.current = null; }
		if (items.length <= 1) return;
		timer.current = setInterval(() => {
			setActiveIdx(i => {
				const next = (i + 1) % items.length;
				try { swiperRef.current?.slideTo(next); } catch (e) {}
				return next;
			});
		}, 5000);
		return () => { clearInterval(timer.current); timer.current = null; };
	}, [items.length]);

	function onSelect(item) {
		const i = items.findIndex(x => x.sku === item.sku);
		if (i >= 0) {
			setActiveIdx(i);
			try { swiperRef.current?.slideTo(i); } catch (e) {}
		}
		// navigate to product detail page
		try {
			navigate(`/urunler/${encodeURIComponent(item.sku)}`);
		} catch (e) {}

		// restart timer
		if (timer.current) { clearInterval(timer.current); timer.current = null; }
		timer.current = setInterval(() => setActiveIdx(i => (i + 1) % items.length), 5000);
	}

	return (
		<section className="py-12 bg-gradient-to-br from-neutral-50 to-orange-50 border-t border-neutral-100">
			<div className="max-w-7xl mx-auto px-8">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-3xl md:text-4xl font-extrabold">Özel Fiyatlar</h3>
					<Link to="/urunler?filter=special" className="text-base text-orange-600 font-semibold">Tümünü Gör</Link>
				</div>

				<div className="overflow-hidden bg-white border rounded-xl p-6 shadow-md">
					{/* Full-width marquee strip (no featured card) */}
					{items.length === 0 ? (
						<div className="py-8 text-center text-neutral-500">Özel fiyatlı ürün bulunamadı.</div>
					) : (
						<div className="marquee flex gap-6 items-center will-change-transform" style={{ animationPlayState: 'running' }} onMouseEnter={(e)=>{ e.currentTarget.style.animationPlayState='paused'; }} onMouseLeave={(e)=>{ e.currentTarget.style.animationPlayState='running'; }}>
							{[...items, ...items].map((it, i) => (
								<div key={`${it.sku || 'item'}-${i}-m`} className="flex-shrink-0" style={{ width: 360 }}>
									<SmallTile item={it} active={(i % items.length) === activeIdx} onClick={onSelect} />
								</div>
							))}
						</div>
					)}
					<style>{`
						.marquee { animation: marquee 18s linear infinite; }
						@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
					`}</style>
				</div>
			</div>
		</section>
	);
}


