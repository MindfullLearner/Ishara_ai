
from getpass import getpass
import re
import traceback

from sqlalchemy import func
from pwdlib import PasswordHash

from database import SessionLocal
from models import User


password_hasher = PasswordHash.recommended()


def main():
    print("\n=== ISHARA AI — Create Administrator ===\n")

    full_name = input("Admin full name: ").strip()
    email = input("Admin email: ").strip().lower()

    # Validate full name
    if len(full_name) < 2 or len(full_name) > 100:
        print("Error: Name must contain 2–100 characters.")
        return

    # Validate email
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        print("Error: Enter a valid email address.")
        return

    # Get password
    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm password: ")

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    # Validate password
    if (
        len(password) < 8
        or len(password) > 128
        or not re.search(r"[A-Z]", password)
        or not re.search(r"\d", password)
    ):
        print(
            "Error: Password must be 8–128 characters "
            "and contain an uppercase letter and a number."
        )
        return

    db = SessionLocal()

    try:
        # Check whether account already exists
        user = (
            db.query(User)
            .filter(func.lower(User.email) == email)
            .first()
        )

        # Create account if it does not exist
        if user is None:
            user = User(
                full_name=full_name,
                email=email,
            )
            db.add(user)

        # Set administrator details
        user.full_name = full_name
        user.email = email
        user.password_hash = password_hasher.hash(password)

        user.role = "admin"
        user.status = "active"
        user.is_verified = True

        # Clear verification and password reset tokens
        user.verification_token_hash = None
        user.verification_token_expires = None
        user.reset_token_hash = None
        user.reset_token_expires = None

        # Reset login security counters
        user.failed_login_attempts = 0
        user.locked_until = None

        db.commit()

        print("\nAdministrator account successfully created/updated!")
        print("Email:", email)
        print("Role: admin")
        print("Status: active")
        print("Email verified: True")

    except Exception as e:
        db.rollback()

        print("\nUnable to create administrator.")
        print("Error Type:", type(e).__name__)
        print("Error Details:", str(e))

        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    main()
