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
    # Insert user
    user_data = data['user']
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

        # Insert items and user items
        for item in collection['collection']:
            # Insert item if not exists
            cursor.execute(
                sql.SQL("""
                INSERT INTO Items (item_id, name, edition, set, image, type)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (item_id) DO NOTHING
                """),
                (
                    item['id'],
                    item['name'],
                    item['edition'],
                    item['set'],
                    item['image'],
                    'Pokemon Card'  # Assuming all items are Pokemon cards
                )
            )

            # Insert user item
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

