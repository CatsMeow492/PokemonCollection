import json
import psycopg2
from psycopg2 import sql
from datetime import datetime
import bcrypt

# Database connection parameters
db_params = {
    "host": "pokemoncollection-dev.cfonra9kx6z2.us-east-1.rds.amazonaws.com",
    "database": "pokemoncollection-dev",
    "user": "",
    "password": ""
}

# Load JSON data
with open('collection.json', 'r') as file:
    data = json.load(file)

# Connect to the database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

try:
    # Check if user exists and delete all related data if it does
    user_data = data['user']
    cursor.execute("SELECT user_id FROM Users WHERE username = %s", (user_data['username'],))
    existing_user = cursor.fetchone()

    if existing_user:
        user_id = existing_user[0]
        print(f"Deleting existing data for user {user_data['username']} (user_id: {user_id})")
        
        # Delete all related data
        cursor.execute("DELETE FROM UserItems WHERE collection_id IN (SELECT collection_id FROM Collections WHERE user_id = %s)", (user_id,))
        cursor.execute("DELETE FROM Collections WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM Users WHERE user_id = %s", (user_id,))
        
        print("Existing data deleted.")

    # Insert new user
    hashed_password = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
    
    cursor.execute(
        sql.SQL("""
        INSERT INTO Users (username, first_name, last_name, email, password, profile_picture, joined)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING user_id
        """),
        (
            user_data['username'],
            user_data['first_name'],
            user_data['last_name'],
            user_data['email'],
            hashed_password.decode('utf-8'),
            user_data['profile_picture'],
            datetime.now()
        )
    )
    user_id = cursor.fetchone()[0]
    print(f"New user {user_data['username']} inserted with user_id: {user_id}")

    # Insert collections and items
    for collection in user_data['collections']:
        # Insert collection
        cursor.execute(
            sql.SQL("""
            INSERT INTO Collections (user_id, collection_name)
            VALUES (%s, %s)
            RETURNING collection_id
            """),
            (user_id, collection['collectionName'])
        )
        collection_id = cursor.fetchone()[0]
        print(f"New collection '{collection['collectionName']}' inserted with collection_id: {collection_id}")

        # Insert cards
        for card in collection['collection']:
            cursor.execute(
                sql.SQL("""
                INSERT INTO Items (item_id, name, edition, set, image, type)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (item_id) DO UPDATE
                SET name = EXCLUDED.name, edition = EXCLUDED.edition, set = EXCLUDED.set, image = EXCLUDED.image
                """),
                (
                    card['id'],
                    card['name'],
                    card['edition'],
                    card['set'],
                    card['image'],
                    'Pokemon Card'
                )
            )

            cursor.execute(
                sql.SQL("""
                INSERT INTO UserItems (collection_id, item_id, grade, price, quantity)
                VALUES (%s, %s, %s, %s, %s)
                """),
                (
                    collection_id,
                    card['id'],
                    card['grade'],
                    card['price'],
                    card['quantity']
                )
            )

        # Insert other items (non-card collectibles)
        for item in collection.get('items', []):
            cursor.execute(
                sql.SQL("""
                INSERT INTO Items (item_id, name, edition, type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (item_id) DO UPDATE
                SET name = EXCLUDED.name, edition = EXCLUDED.edition
                """),
                (
                    item['id'],
                    item['name'],
                    item['edition'],
                    'Collectible Item'
                )
            )

            cursor.execute(
                sql.SQL("""
                INSERT INTO UserItems (collection_id, item_id, grade, price, quantity)
                VALUES (%s, %s, %s, %s, %s)
                """),
                (
                    collection_id,
                    item['id'],
                    item['grade'],
                    item['price'],
                    item['quantity']
                )
            )

    conn.commit()
    print("Collection data migration completed successfully.")

except Exception as e:
    conn.rollback()
    print(f"An error occurred: {e}")

finally:
    cursor.close()
    conn.close()
