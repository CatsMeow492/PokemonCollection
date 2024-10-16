import json
import psycopg2
from datetime import datetime
from psycopg2 import sql

# Connect to your PostgreSQL database
conn = psycopg2.connect(
    host="pokemoncollection-dev.cfonra9kx6z2.us-east-1.rds.amazonaws.com",
    database="pokemoncollection-dev",
    user="",
    password=""
)
cursor = conn.cursor()

# Load JSON data
with open('./market_data.json') as f:
    data = json.load(f)

# Set to keep track of items we've already added to the Items table
processed_items = set()

# Insert data into the MarketData table
for entry in data['data']:
    item_id = entry['id']
    price = entry['price']
    fetched_at = datetime.fromisoformat(entry['fetched_at'].replace('Z', '+00:00'))

    # Skip entries with empty item_id
    if not item_id:
        continue

    # Check if we need to insert this item into the Items table
    if item_id not in processed_items:
        cursor.execute("SELECT 1 FROM Items WHERE item_id = %s", (item_id,))
        if cursor.fetchone() is None:
            # If the item doesn't exist, insert it into the Items table
            cursor.execute(
                """
                INSERT INTO Items (item_id, name, type)
                VALUES (%s, %s, %s)
                ON CONFLICT (item_id) DO NOTHING
                """,
                (item_id, entry['name'], entry['type'])
            )
        processed_items.add(item_id)

    # Check if this exact entry already exists in MarketData
    cursor.execute(
        """
        SELECT 1 FROM MarketData 
        WHERE item_id = %s AND fetched_at = %s
        """,
        (item_id, fetched_at)
    )
    if cursor.fetchone() is None:
        # If the entry doesn't exist, insert it
        cursor.execute(
            """
            INSERT INTO MarketData (item_id, price, fetched_at)
            VALUES (%s, %s, %s)
            """,
            (item_id, price, fetched_at)
        )
    else:
        print(f"Skipping duplicate entry: item_id={item_id}, fetched_at={fetched_at}")

    conn.commit()

cursor.close()
conn.close()

print("Data migration completed successfully.")
