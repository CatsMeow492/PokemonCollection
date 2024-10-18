import bcrypt

password = "1234"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))


UPDATE Users 
SET password = '$2b$12$aeu1uJmhMB1m27qicGcbIuf3MwLxj9Faegl9OgIl9WXHJbd6iVQ5y'
WHERE user_id = 2;