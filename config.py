# config.py

import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/aicoder'  # MySQL database URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable modification tracking to save resources