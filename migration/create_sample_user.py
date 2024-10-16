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

# Sample user data
sample_user = {
    "username": "ash_ketchum",
    "first_name": "Ash",
    "last_name": "Ketchum",
    "email": "ash@pokemon.com",
    "password": "pikachu123",  # This will be hashed before storage
    "profile_picture": "https://example.com/ash.jpg",
    "is_admin": True,
    "is_subscribed": True
}

# Connect to the database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

# Hash the password
hashed_password = bcrypt.hashpw(sample_user['password'].encode('utf-8'), bcrypt.gensalt())

# Insert the user
try:
    cursor.execute(
        sql.SQL("""
        INSERT INTO Users (username, first_name, last_name, email, password, profile_picture, joined, last_login, is_admin, is_subscribed)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """),
        (
            sample_user['username'],
            sample_user['first_name'],
            sample_user['last_name'],
            sample_user['email'],
            hashed_password.decode('utf-8'),
            sample_user['profile_picture'],
            datetime.now(),
            datetime.now(),
            sample_user['is_admin'],
            sample_user['is_subscribed']
        )
    )
    conn.commit()
    print("Sample user created successfully.")
except psycopg2.errors.UniqueViolation:
    print("A user with this username or email already exists.")
    conn.rollback()
except Exception as e:
    print(f"An error occurred: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()

