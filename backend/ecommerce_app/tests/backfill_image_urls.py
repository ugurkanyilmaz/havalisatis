import sqlite3
import re
from pathlib import Path


def needs_scheme(url: str | None) -> bool:
    if not url:
        return False
    s = url.strip()
    if not s:
        return False
    low = s.lower()
    return not (low.startswith('http://') or low.startswith('https://') or low.startswith('data:'))


def fix(url: str | None) -> str | None:
    if not url:
        return url
    s = url.strip()
    if not s:
        return None
    if s.startswith('//'):
        return 'https:' + s
    if needs_scheme(s):
        return 'https://' + s.lstrip('/')
    return s


def main():
    db_path = Path('/app/ecommerce.db')
    if not db_path.exists():
        print(f'DB not found: {db_path}')
        return 1
    con = sqlite3.connect(str(db_path))
    cur = con.cursor()

    # products table
    cur.execute("SELECT id, main_img, img1, img2, img3, img4 FROM products")
    products = cur.fetchall()
    updated_p = 0
    for pid, m, i1, i2, i3, i4 in products:
        nm, ni1, ni2, ni3, ni4 = fix(m), fix(i1), fix(i2), fix(i3), fix(i4)
        if (nm != m) or (ni1 != i1) or (ni2 != i2) or (ni3 != i3) or (ni4 != i4):
            cur.execute(
                "UPDATE products SET main_img=?, img1=?, img2=?, img3=?, img4=? WHERE id=?",
                (nm, ni1, ni2, ni3, ni4, pid),
            )
            updated_p += 1

    # product_images table (if exists)
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_images'")
        if cur.fetchone():
            cur.execute("SELECT id, url FROM product_images")
            imgs = cur.fetchall()
            updated_i = 0
            for iid, url in imgs:
                nu = fix(url)
                if nu != url:
                    cur.execute("UPDATE product_images SET url=? WHERE id=?", (nu, iid))
                    updated_i += 1
        else:
            updated_i = 0
    except Exception:
        updated_i = 0

    con.commit()
    con.close()
    print(f"Updated products: {updated_p}, product_images: {updated_i}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
