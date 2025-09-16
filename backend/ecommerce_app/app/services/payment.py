# Ödeme ile ilgili servis fonksiyonları için placeholder
# Örnek: Stripe veya iyzico entegrasyonu

def charge_example(amount: int, currency: str = 'TRY'):
    return {"status": "success", "amount": amount, "currency": currency}
