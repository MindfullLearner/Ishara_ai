
from database import test_database_connection

if test_database_connection():
    print("SUCCESS: Connected to the ISHARA AI database!")
else:
    print("FAILED: Could not connect to PostgreSQL.")
