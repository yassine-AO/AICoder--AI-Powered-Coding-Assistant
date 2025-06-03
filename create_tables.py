from app import app  # Import the Flask app instance
from models import db  # Import the SQLAlchemy db instance

# Create an application context
with app.app_context():
    db.create_all()
    print("Tables created successfully.")