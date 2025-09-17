// Basit WhatsApp butonu – gerektiğinde phone ve message props'u ile özelleştirilebilir.
import PropTypes from 'prop-types';

export default function WhatsAppButton({ phone = '905414526058', message = 'Merhaba, teknik servis için destek almak istiyorum.', subtitle = 'Teknik Servis' }) {
  const encoded = encodeURIComponent(message);
  const href = `https://wa.me/${phone}?text=${encoded}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişim"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] group flex items-center gap-3 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white pl-4 pr-5 py-3 text-xs font-semibold tracking-wide transition transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12.04 2c-5.52 0-10 4.42-10 9.87 0 1.74.47 3.43 1.37 4.92L2 22l5.4-1.76c1.43.78 3.05 1.19 4.67 1.19h.01c5.52 0 10-4.42 10-9.87 0-2.64-1.07-5.12-3.02-6.99A10.55 10.55 0 0 0 12.04 2Zm5.88 14.19c-.25.7-1.46 1.33-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.11-1-.32-1.72-.63-3.03-1.31-5-4.37-5.15-4.58-.15-.21-1.23-1.64-1.23-3.13 0-1.48.78-2.2 1.06-2.5.28-.3.61-.37.82-.37.2 0 .4.01.57.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.21-.15.33-.3.51-.15.17-.31.39-.44.52-.15.15-.31.32-.13.63.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.54.31.15.49.13.67-.08.18-.21.77-.88.97-1.18.2-.3.41-.24.68-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.07.12.07.72-.18 1.42Z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-bold text-[11px] -mb-0.5">WhatsApp</span>
    <span className="block text-[10px] opacity-90">{subtitle}</span>
      </span>
    </a>
  );
}

WhatsAppButton.propTypes = {
  phone: PropTypes.string,
  message: PropTypes.string,
  subtitle: PropTypes.string
};
