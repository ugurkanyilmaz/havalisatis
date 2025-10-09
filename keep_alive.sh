#!/bin/bash
# DEPRECATED: Bu dosya artık kullanılmıyor
# Yeni konum: api/cron/keep_alive.php
# 
# Bu bash versiyonu alternatif olarak kullanılabilir ama
# PHP versiyonu önerilir (daha fazla özellik + log yönetimi)

# Your site URL
SITE_URL="https://havalielaletlerisatis.com"

# Ping health check endpoint
curl -s -o /dev/null -w "Health check: %{http_code}\n" "${SITE_URL}/api/health.php"

# Also warm up the home page
curl -s -o /dev/null -w "Home: %{http_code}\n" "${SITE_URL}/api/home.php"

# Warm up a sample product query
curl -s -o /dev/null -w "Products: %{http_code}\n" "${SITE_URL}/api/products.php?page=1&per_page=20"

exit 0
