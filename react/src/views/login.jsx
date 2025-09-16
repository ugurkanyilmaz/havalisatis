import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import './auth.css';

// Modern Login Page (only UI / no real API calls)
export default function LoginPage(){
	const [form, setForm] = useState({ email:'', password:'' });
	const [vErrors, setVErrors] = useState({ email:'', password:'' });
	const [show, setShow] = useState(false);
	const navigate = useNavigate();
	const { login, loading, error } = useAuth();

	function handleChange(e){
		const { name, value } = e.target;
		setForm(f=>({...f, [name]: value }));
		if(name === 'email'){
			setVErrors(v=>({...v, email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)? '' : 'Geçersiz email'}));
		}
	}

	async function handleSubmit(e){
		e.preventDefault();
		if(vErrors.email){ return; }
		const ok = await login(form.email, form.password);
		if(ok){
			navigate('/');
		}
	}

	return (
		<div className="auth-wrapper">
			<div className="auth-shell">
				<aside className="auth-side">
					<div className="auth-brand">
						<h1 className="auth-logo">KETEN PNÖMATİK</h1>
						<p className="auth-desc">Profesyonel ve endüstriyel pnömatik çözümler: verimlilik, dayanıklılık ve ergonomi tek platformda.</p>
						<ul className="auth-bullets">
							<li>Profesyonel Seri</li>
							<li>Endüstriyel Seri</li>
							<li>Hızlı Servis</li>
						</ul>
					</div>
					<div className="auth-side-footer">© {new Date().getFullYear()} Keten</div>
				</aside>
				<form className="auth-box" onSubmit={handleSubmit}>
					<h2>Giriş</h2>
					<p className="auth-sub">Kontrol paneline eriş</p>
					<div className="field">
						<label htmlFor="login-email">E-POSTA</label>
						<div className="control">
							<input id="login-email" name="email" type="email" placeholder="ornek@domain.com" required value={form.email} onChange={handleChange} />
						</div>
					</div>
					<div className="field">
						<label htmlFor="login-password">ŞİFRE</label>
						<div className="control">
							<input id="login-password" name="password" type={show? 'text':'password'} placeholder="••••••••" required value={form.password} onChange={handleChange} />
							<button type="button" className="toggle-pass" onClick={()=>setShow(s=>!s)}>{show? 'GİZLE':'GÖSTER'}</button>
						</div>
					</div>
					{error && <div className="error">{error}</div>}
					<button className="submit" disabled={loading}>{loading? 'GİRİŞ YAPILIYOR...':'GİRİŞ'}</button>
					<div className="divider" />
					<p className="swap-text">Hesabın yok mu? <Link to="/register">Kayıt Ol</Link></p>
					<Link className="home-link" to="/">← Ana Sayfa</Link>
				</form>
			</div>
		</div>
	);
}

