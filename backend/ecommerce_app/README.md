# Ecommerce App Backend

Bu proje FastAPI tabanlı e-ticaret + randevu sistemi backend iskeletidir.

## Klasör Yapısı
```
ecommerce_app/
  app/
    main.py
    config.py
    database.py
    dependencies.py
    models/
      user.py
      product.py
      appointment.py
    schemas/
      user.py
      product.py
      appointment.py
    crud/
      user.py
      product.py
      appointment.py
    api/
      __init__.py
      auth.py
      products.py
      appointments.py
      admin.py
    services/
      payment.py
  tests/
  requirements.txt
  README.md
```

## Çalıştırma
```
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Alembic Migration
Artık tablolar otomatik oluşturulmuyor. Migration komutları:
```
alembic upgrade head
alembic revision --autogenerate -m "change"
```

`alembic.ini` ve `alembic/` dizini proje kökünde (ecommerce_app) yer alır.

## Docker ile Çalıştırma
```
cd backend
docker compose build
docker compose up -d
# Migration
docker exec -it ecommerce_backend bash -c "alembic upgrade head"
```

Kod değişiklikleri `--reload` ile otomatik yansır. Environment değişiklikleri için yeniden başlatın.
