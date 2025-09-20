# Backend Deployment (Natro / VPS)

Bu belge FastAPI backend’ini Natro (veya herhangi bir Ubuntu VPS) üzerinde docker’sız olarak yayınlamak için adımları içerir. Alternatif olarak Docker Compose ile de çalıştırabilirsiniz.

## 1) Proje kopyalama ve Python ortamı

```bash
sudo mkdir -p /var/www/havalielaletlerisatis
sudo chown -R $USER:$USER /var/www/havalielaletlerisatis
# Sunucuya kodu aktarın (rsync/SFTP). Örnek rsync (yerel makineden):
rsync -av --delete ./ /var/www/havalielaletlerisatis/

python3 -m venv /var/www/havalielaletlerisatis/venv
source /var/www/havalielaletlerisatis/venv/bin/activate
pip install --upgrade pip
pip install -r /var/www/havalielaletlerisatis/backend/ecommerce_app/requirements.txt
```

## 2) .env

`/var/www/havalielaletlerisatis/backend/ecommerce_app/.env` dosyasını oluşturun:

```
APP_NAME=HavaliElAletleriSatis Backend
DEBUG=false
SECRET_KEY=CHANGE_ME
ALGORITHM=HS256
DATABASE_URL=sqlite:///./ecommerce.db
RATE_LIMIT_DEFAULT_LIMIT=120
RATE_LIMIT_DEFAULT_WINDOW_SECONDS=60
CORS_ALLOWED_ORIGINS=https://havalielaletlerisatis.com,https://www.havalielaletlerisatis.com
```

> Not: `SECRET_KEY` değerini güçlü bir anahtarla değiştirin. `DATABASE_URL` olarak Postgres kullanmak isterseniz `psycopg2` kurmanız ve URL’i güncellemeniz gerekir.

## 3) Alembic migration

```bash
cd /var/www/havalielaletlerisatis/backend/ecommerce_app
alembic upgrade head
```

> Alembic artık `alembic.ini` yerine uygulama ayarlarından (`.env` -> `DATABASE_URL`) DB URL okur.

## 4) systemd servis (Uvicorn)

`backend/deploy/havalielaletlerisatis.service` dosyasını `/etc/systemd/system/` altına kopyalayın ve servisi başlatın:

```bash
sudo cp /var/www/havalielaletlerisatis/backend/deploy/havalielaletlerisatis.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable havalielaletlerisatis
sudo systemctl restart havalielaletlerisatis
sudo systemctl status havalielaletlerisatis
```

> İleri seviye: Yük arttığında `uvicorn` yerine `gunicorn -k uvicorn.workers.UvicornWorker --workers 2` kullanılabilir.

## 5) Nginx reverse proxy (önerilir)

`backend/deploy/natro-nginx.conf` dosyasını `/etc/nginx/sites-available/havalielaletlerisatis` olarak kopyalayıp etkinleştirin:

```bash
sudo cp /var/www/havalielaletlerisatis/backend/deploy/natro-nginx.conf /etc/nginx/sites-available/havalielaletlerisatis
sudo ln -sf /etc/nginx/sites-available/havalielaletlerisatis /etc/nginx/sites-enabled/havalielaletlerisatis
sudo nginx -t && sudo systemctl reload nginx
```

Bu konfig `location /api/` isteklerini `127.0.0.1:8000`’e proxy’ler. SSL/LetsEncrypt kurulumu varsayılarak `listen 443 ssl;` ile sertifika eklenebilir.

## 6) Sağlık kontrolü

```bash
curl -i http://127.0.0.1:8000/api/health
```

Beklenen cevap: `{"status":"healthy"}`

## 7) Otomatik dağıtım betiği (opsiyonel)

`backend/deploy/deploy.sh` bash betiği yukarıdaki adımların çoğunu uygular. İçeriği sunucunuza göre düzenleyip çalıştırabilirsiniz.

---

Kontrol Listesi:
- [ ] `.env` içinde `SECRET_KEY` güçlü ve `DEBUG=false`
- [ ] `CORS_ALLOWED_ORIGINS` domain(ler)iniz ile uyumlu
- [ ] `alembic upgrade head` başarıyla tamamlandı
- [ ] `systemctl status havalielaletlerisatis` aktif (`active (running)`) görünüyor
- [ ] `curl http://127.0.0.1:8000/api/health` sağlıklı dönüş veriyor
