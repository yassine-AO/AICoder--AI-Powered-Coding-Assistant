#calling the db , i did this so there will be no circular imports, any file that wants the db he can call this file's function = db
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
