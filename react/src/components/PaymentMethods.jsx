import React from 'react';
import { Shield, Lock } from 'lucide-react';

export default function PaymentMethods() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Güvenli Ödeme Yöntemleri
          </h2>
          <p className="text-gray-600 text-sm">
            Tüm ödemeleriniz SSL sertifikası ile korunmaktadır
          </p>
        </div>

        {/* Ödeme Logoları */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-center gap-6 flex-wrap mb-6">
            {/* Mastercard */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <circle cx="26" cy="22.5" r="12" fill="#EB001B"/>
                <circle cx="44" cy="22.5" r="12" fill="#F79E1B"/>
                <path d="M35 22.5c0-4.2-2.1-7.9-5.3-10.1 3.2-2.2 5.3-5.9 5.3-10.1 0 4.2 2.1 7.9 5.3 10.1-3.2 2.2-5.3 5.9-5.3 10.1z" fill="#FF5F00"/>
              </svg>
            </div>

            {/* Visa */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#1A1F71"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">VISA</text>
              </svg>
            </div>

            {/* Troy */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#00ADEF"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">TROY</text>
              </svg>
            </div>

            {/* Maestro */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <circle cx="26" cy="22.5" r="12" fill="#0099DF"/>
                <circle cx="44" cy="22.5" r="12" fill="#CC0000"/>
              </svg>
            </div>

            {/* American Express */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#006FCF"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">AMEX</text>
              </svg>
            </div>

            {/* Axess */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#E4002B"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">AXESS</text>
              </svg>
            </div>

            {/* Bonus Card */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#FDB913"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#333" textAnchor="middle">BONUS</text>
              </svg>
            </div>

            {/* Maximum */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#D71921"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">MAXIMUM</text>
              </svg>
            </div>

            {/* CardFinans */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#0052A5"/>
                <circle cx="20" cy="22.5" r="6" fill="white"/>
                <circle cx="50" cy="22.5" r="6" fill="white"/>
              </svg>
            </div>

            {/* World */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#0066B2"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">WORLD</text>
              </svg>
            </div>

            {/* Paraf */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#00A651"/>
                <text x="35" y="28" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">PARAF</text>
              </svg>
            </div>

            {/* Bankkart */}
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <svg width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect width="70" height="45" rx="6" fill="#E30613"/>
                <rect x="10" y="18" width="50" height="9" rx="2" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-medium">3D Secure</span>
              <span className="text-gray-400">•</span>
              <Lock className="w-5 h-5 text-blue-600" />
              <span className="font-medium">256-bit SSL</span>
            </div>
            <p className="text-sm text-gray-600">
              Taksit imkanı • Havale/EFT ile ödeme seçeneği
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}