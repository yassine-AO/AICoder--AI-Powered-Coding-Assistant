from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey, DateTime, String, Text
from datetime import datetime
from db import db

# Define the User model
class User(db.Model):
    __tablename__ = 'users'
    userID = db.Column(String(50), primary_key=True)
    email = db.Column(String(100), nullable=False, unique=True)
    name = db.Column(String(100), nullable=False)  # New attribute: Name
    surname = db.Column(String(100), nullable=False)  # New attribute: Surname
    photo_url = db.Column(String(200), nullable=True)  # New attribute: Photo URL (optional)

    # Relationship with Conversation (One-to-Many)
    conversations = relationship("Conversation", back_populates="user")

    #Get numebr of conversations for the user
    def getConvoCount(self):
        """Returns the total number of conversations for this user."""
        return len(self.conversations)
    
    #Get numebr of messages for the user
    def getMessageCount(self):
        """Returns the total number of messages across all conversations for this user."""
        total_messages = 0
        for conversation in self.conversations:
            total_messages += len(conversation.messages)
        return total_messages
    

# Define the Conversation model
class Conversation(db.Model):
    __tablename__ = 'conversations'
    conversationID = db.Column(String(50), primary_key=True)
    userID = db.Column(String(50), ForeignKey('users.userID'), nullable=False)  # Foreign key to User
    name = db.Column(String(100), nullable=True)  # New attribute: Name
    timestamp = db.Column(DateTime, default=datetime.utcnow)

    # Relationship with User (Many-to-One)
    user = relationship("User", back_populates="conversations")

    # Relationship with Message (One-to-Many)
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")

    # Relationship with documentations (One-to-Many)
    documentations = relationship("Documentation", back_populates="conversation", cascade="all, delete")

# Define the Message model
class Message(db.Model):
    __tablename__ = 'messages'
    messageID = db.Column(String(50), primary_key=True)
    conversationID = db.Column(String(50), ForeignKey('conversations.conversationID'), nullable=False)  # Foreign key to Conversation
    sender = db.Column(String(50), nullable=False)
    content = db.Column(Text, nullable=False)
    timestamp = db.Column(DateTime, default=datetime.utcnow)

    # Relationship with Conversation (Many-to-One)
    conversation = relationship("Conversation", back_populates="messages")


    # Relationship with File (One-to-Many)
    files = relationship("File", back_populates="message")


#Files Model
class File(db.Model):
    __tablename__ = 'files'
    fileID = db.Column(String(50), primary_key=True)
    messageID = db.Column(String(50), ForeignKey('messages.messageID'), nullable=False)  # Foreign key to Message
    title = db.Column(String(100), nullable=False)
    content = db.Column(Text, nullable=False)

    # Relationship with Message (Many-to-One)
    message = relationship("Message", back_populates="files")


# Define the documentations model
class Documentation(db.Model):
    __tablename__ = 'documentations'
    documentationID = db.Column(String(50), primary_key=True)
    conversationID = db.Column(String(50), ForeignKey('conversations.conversationID'),nullable=False)  # Foreign key to Conversation
    timestamp = db.Column(DateTime, default=datetime.utcnow)

    # Relationship with Conversation (Many-to-One)
    conversation = relationship("Conversation", back_populates="documentations")
