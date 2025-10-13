import React from 'react';

export default function IadePolitikasi() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white border rounded mt-6">
      <h1 className="text-2xl font-semibold mb-4">İade Politikası</h1>

      <p className="mb-3">Müşteri memnuniyeti bizim için önemlidir. Aşağıda iade süreçlerimiz ile ilgili kısa ve anlaşılır bilgiler yer almaktadır:</p>

      <h2 className="text-lg font-medium mt-4">Genel Koşullar</h2>
      <ul className="list-disc list-inside mt-2 mb-3 text-sm">
        <li>Ürünü teslim aldıktan sonra iade talebinizi en geç 14 gün içinde iletmeniz gerekmektedir.</li>
        <li>İade edilecek ürünün tekrar satılabilir durumda, orijinal ambalajında ve tüm aksesuarları ile birlikte olması gerekir.</li>
        <li>Üründe gözle görülür bir yıpranma, hasar veya kullanıcı kaynaklı aşınma bulunmamalıdır. Eğer ürünün üzerinde herhangi bir yıpranma yoksa iade kabul edilir.</li>
      </ul>

      <h2 className="text-lg font-medium mt-4">Kabul Edilen Durumlar</h2>
      <p className="mt-2 mb-3 text-sm">Aşağıdaki durumlarda iade talebiniz değerlendirilecektir:</p>
      <ul className="list-disc list-inside mt-2 mb-3 text-sm">
        <li>Ürün hasarsız, eksiksiz ve teslim alındığı haliyle iade edilirse.</li>
        <li>Üründe üretim hatası veya yanlış gönderim gibi nedenler varsa.</li>
      </ul>

      <h2 className="text-lg font-medium mt-4">İade Adımları</h2>
      <ol className="list-decimal list-inside mt-2 mb-3 text-sm">
        <li>Öncelikle bizimle iletişime geçin: <strong>info@ketenpnomatik.com.tr</strong> veya <strong>0(262) 643 43 39</strong>.</li>
        <li>İade talebi oluştururken sipariş numarası, ürünün SKU'su ve iade sebebini belirtin.</li>
        <li>İade onayı aldıktan sonra ürünü orijinal ambalajı ve tüm aksesuarları ile beraber gönderebilirsiniz.</li>
        <li>Ürün tarafımıza ulaştıktan sonra inceleme yapılır. Uygun bulunursa iade işlemi ve geri ödeme 7 iş günü içinde tamamlanır.</li>
      </ol>

      <h2 className="text-lg font-medium mt-4">Notlar</h2>
      <p className="text-sm mt-2 mb-3">Nakliye kaynaklı hasarlar veya teslimatta eksik ürün bildirimi için lütfen teslimatı almadan önce paket üzerinde gözle görünür hasar varsa kuryeye tutanak tutturunuz ve bizimle irtibata geçiniz.</p>

      <p className="text-sm text-gray-600 mt-4">Daha fazla sorunuz varsa lütfen <a className="text-blue-600 underline" href="/iletisim">İletişim</a> sayfamızdan bizimle iletişime geçin.</p>
    </div>
  );
}
