import sqlite3
from pathlib import Path


def main():
    db_path = Path("/app/ecommerce.db")
    if not db_path.exists():
        print(f"DB not found at {db_path}")
        return 1
    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute(
        """
        SELECT id, sku, title, main_img, img1, img2, img3, img4
        FROM products
        ORDER BY id ASC
        LIMIT 10
        """
    )
    rows = cur.fetchall()
    print("Sample product image fields:\n")
    for r in rows:
        print(
            f"id={r['id']} sku={r['sku']}\n"
            f"  title    : {r['title']}\n"
            f"  main_img : {r['main_img']}\n"
            f"  img1     : {r['img1']}\n"
            f"  img2     : {r['img2']}\n"
            f"  img3     : {r['img3']}\n"
            f"  img4     : {r['img4']}\n"
        )
    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
