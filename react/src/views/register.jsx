import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';

export default function Register(){
	const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', show:false });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	// Native browser validation kullanılacak; ekstra field validation state kaldırıldı
	const navigate = useNavigate();

	function handleChange(e){
		const { name, value } = e.target;
		setForm(f=>({...f, [name]: value }));
	}

	async function handleSubmit(e){
		e.preventDefault();
		setLoading(true); setError(null);
		try {
			// Client-side final check
			// Native validation yeterli; ek JS kontrolü yok
			const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000/api') + '/auth/register', {
				method:'POST',
				headers:{ 'Content-Type':'application/json' },
				body: JSON.stringify({ email: form.email.trim(), phone: form.phone.trim(), password: form.password, full_name: form.name.trim() })
			});
			if(!res.ok){
				let msg = 'Kayıt başarısız';
				try { const j = await res.json(); if(j?.detail) msg = j.detail; } catch{}
				throw new Error(msg);
			}
			setSuccess(true);
			setForm({ name:'', email:'', phone:'', password:'', show:false });
			setTimeout(()=> navigate('/login'), 1200);
		} catch (err){
			setError(err.message);
		} finally { setLoading(false); }
	}

	return (
		<div className="auth-wrapper">
			<div className="auth-shell">
				<aside className="auth-side">
					<div className="auth-brand">
						<h1 className="auth-logo">KETEN PNÖMATİK</h1>
						<p className="auth-desc">Dayanıklı ve verimli pnömatik el aletleri ile üretim süreçlerinde süreklilik sağlayın.</p>
						<ul className="auth-bullets">
							<li>Profesyonel Seri</li>
							<li>Endüstriyel Seri</li>
							<li>Servis & Destek</li>
						</ul>
					</div>
					<div className="auth-side-footer">© {new Date().getFullYear()} Keten</div>
				</aside>
				<form className="auth-box" onSubmit={handleSubmit}>
					<h2>Kayıt Ol</h2>
					<p className="auth-sub">Hesap oluştur</p>
					<div className="field">
						<label htmlFor="reg-name">AD SOYAD</label>
						<div className="control">
							<input id="reg-name" name="name" required placeholder="Ad Soyad" value={form.name} onChange={handleChange} />
						</div>
					</div>
					<div className="field">
						<label htmlFor="reg-email">E-POSTA</label>
						<div className="control">
							<input id="reg-email" name="email" type="email" required placeholder="ornek@domain.com" value={form.email} onChange={handleChange} />
						</div>
					</div>
						<div className="field">
							<label htmlFor="reg-phone">TELEFON</label>
							<div className="control">
								<input id="reg-phone" name="phone" type="tel" required placeholder="5XX XXX XX XX" pattern="5[0-9]{9}" title="5 ile başlayan 10 haneli numara giriniz (5XXXXXXXXX)" value={form.phone} onChange={handleChange} />
							</div>
						</div>
					<div className="field">
						<label htmlFor="reg-pass">ŞİFRE</label>
						<div className="control">
							<input id="reg-pass" name="password" type={form.show? 'text':'password'} required placeholder="••••••••" minLength={8} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}" title="En az 8 karakter, harf ve rakam içermeli" value={form.password} onChange={handleChange} autoComplete="new-password" />
							<button type="button" className="toggle-pass" onClick={()=>setForm(f=>({...f, show: !f.show}))}>{form.show? 'GİZLE':'GÖSTER'}</button>
						</div>
					</div>
					{error && <div className="error">{error}</div>}
					{success && <div className="success">Kayıt başarılı, yönlendiriliyorsunuz...</div>}
					<button className="submit" disabled={loading}>{loading? 'KAYIT YAPILIYOR...':'KAYIT OL'}</button>
					<div className="divider" />
					<p className="swap-text">Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
					<Link className="home-link" to="/">← Ana Sayfa</Link>
				</form>
			</div>
		</div>
	);
}

