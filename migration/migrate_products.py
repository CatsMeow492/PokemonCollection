import json
import psycopg2
from psycopg2 import sql

# Database connection parameters
db_params = {
    "host": "pokemoncollection-dev.cfonra9kx6z2.us-east-1.rds.amazonaws.com",
    "database": "pokemoncollection-dev",
    "user": "",
    "password": ""
}

# Load JSON data
with open('shop.json', 'r') as file:
    data = json.load(file)

# Connect to the database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

# Insert products into the Products table
for product in data['products']:
    cursor.execute(
        sql.SQL("""
        INSERT INTO Products (product_id, name, description, price, image)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (product_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            image = EXCLUDED.image
        """),
        (
            product['id'],
            product['name'],
            product['description'],
            product['price'],
            product['image']
        )
    )

# Commit the changes and close the connection
conn.commit()
cursor.close()
conn.close()

print("Product data migration completed successfully.")

