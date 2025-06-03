from flask import Flask, request, jsonify, render_template, redirect, session, Response
import firebase_admin
from firebase_admin import auth, credentials
from flask_sqlalchemy import SQLAlchemy
from groq import Groq
from config import Config
import time
from datetime import datetime
import uuid
import json
from db import db
from logic import get_links

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = "as3ab secret key fl3alam"
db.init_app(app)

from models import User, Conversation, Message, File , Documentation # Added File import

cred = firebase_admin.credentials.Certificate("key.json")
firebase_admin.initialize_app(cred)

client = Groq(api_key="your_groq_api_key")


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/verify-token', methods=['POST'])
def verify_token():
    try:
        data = request.json
        id_token = data.get('token')
        email = data.get('email')
        name = data.get('name', '')
        surname = data.get('surname', '')
        photo_url = data.get('photo_url', None)

        if not id_token or not email:
            return jsonify({'error': 'No token or email provided'}), 400

        try:
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token.get('uid')

            if not uid:
                return jsonify({'error': 'Invalid token: Missing UID'}), 400

            user = User.query.filter_by(userID=uid).first()
            if not user:
                user = User(userID=uid, email=email, name=name, surname=surname, photo_url=photo_url)
                db.session.add(user)
                db.session.commit()
                print(f"New user created: {email}")
            else:
                user.email = email
                user.name = name
                user.surname = surname
                user.photo_url = photo_url
                db.session.commit()
                print(f"User data updated: {email}")

            session['user'] = {
                'userID': user.userID,
                'email': user.email,
                'name': user.name,
                'surname': user.surname,
                'photo_url': user.photo_url
            }
            return jsonify({'success': True, 'user': session['user']}), 200

        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid token provided'}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'Token has expired'}), 401
        except auth.RevokedIdTokenError:
            return jsonify({'error': 'Token has been revoked'}), 401
        except Exception as e:
            db.session.rollback()
            print(f"Error during token verification: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401

    except Exception as e:
        db.session.rollback()
        print(f"Error in verify_token: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 401


@app.route('/dashboard')
def dashboard():
    userlogged = session.get('user')
    if not userlogged:
        return redirect('/')
    userID = session['user']['userID']
    user = User.query.filter_by(userID=userID).first()
    convo_count = user.getConvoCount()
    messages_count = user.getMessageCount()

    conversations = Conversation.query.filter_by(userID=user.userID).order_by(Conversation.timestamp.desc()).all()
    return render_template('dashboard.html', user=user, convo_count=convo_count, messages_count=messages_count,
                           conversations=conversations)


@app.route('/conversation/<conversation_id>')
def conversation(conversation_id):
    userlogged = session.get('user')
    if not userlogged:
        return redirect('/')
    userID = session['user']['userID']
    user = User.query.filter_by(userID=userID).first()
    convo = Conversation.query.filter_by(conversationID=conversation_id, userID=userID).first()
    if not convo:
        return redirect('/dashboard')
    convo_count = user.getConvoCount()
    messages_count = user.getMessageCount()
    conversations = Conversation.query.filter_by(userID=user.userID).order_by(Conversation.timestamp.desc()).all()
    return render_template('dashboard.html', user=user, convo_count=convo_count, messages_count=messages_count,
                           conversations=conversations, current_conversation_id=conversation_id)





@app.route('/rename_conversation/<conversation_id>', methods=['POST'])
def rename_conversation(conversation_id):
    if not session.get('user'):
        return jsonify({'error': 'Not logged in'}), 401
    conv = Conversation.query.filter_by(conversationID=conversation_id, userID=session['user']['userID']).first()
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404
    new_name = request.form.get('name')
    if not new_name:
        return jsonify({'error': 'No name provided'}), 400
    conv.name = new_name
    db.session.commit()
    print(f"Conversation {conversation_id} renamed to: {new_name}")
    return jsonify({'conversationID': conversation_id, 'name': new_name}), 200


@app.route('/delete_conversation/<conversation_id>', methods=['POST'])
def delete_conversation(conversation_id):
    if not session.get('user'):
        return jsonify({'error': 'Not logged in'}), 401
    conv = Conversation.query.filter_by(conversationID=conversation_id, userID=session['user']['userID']).first()
    if conv:
        db.session.delete(conv)
        db.session.commit()
        print(f"Conversation {conversation_id} deleted")
        return jsonify({'redirect': '/dashboard'}), 200
    return jsonify({'error': 'Conversation not found'}), 404


@app.route('/conversation/<conversation_id>/messages')
def get_conversation_messages(conversation_id):
    if not session.get('user'):
        return jsonify({'error': 'Not logged in'}), 401
    messages = Message.query.filter_by(conversationID=conversation_id).order_by(Message.timestamp.asc()).all()
    return jsonify([{
        'sender': m.sender,
        'content': m.content,
        'timestamp': m.timestamp.isoformat(),
        'file': {'title': m.files[0].title, 'content': m.files[0].content} if m.files and len(m.files) > 0 else None
    } for m in messages])


@app.route('/send_message', methods=['POST'])
def send_message():
    if not session.get('user'):
        return jsonify({'error': 'Not logged in'}), 401

    conversation_id = request.form.get('conversation_id')
    message_content = request.form.get('message')
    user_id = session['user']['userID']

    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        existing_convos = Conversation.query.filter_by(userID=user_id).all()
        max_num = 0
        for conv in existing_convos:
            if conv.name and conv.name.startswith("Conversation "):
                try:
                    num = int(conv.name.split("Conversation ")[1])
                    max_num = max(max_num, num)
                except ValueError:
                    continue
        new_num = max_num + 1
        new_name = f"Conversation {new_num}"
        new_conv = Conversation(conversationID=conversation_id, userID=user_id, name=new_name)
        db.session.add(new_conv)
        db.session.commit()
        print(f"New conversation created via send_message: {conversation_id} with name '{new_name}'")

    message_id = str(uuid.uuid4())
    new_message = Message(
        messageID=message_id,
        conversationID=conversation_id,
        sender="user",
        content=message_content
    )
    db.session.add(new_message)
    db.session.commit()

    # Handle file upload
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename:
            file_content = file.read().decode('utf-8', errors='ignore')
            file_id = str(uuid.uuid4())
            new_file = File(
                fileID=file_id,
                messageID=message_id,
                title=file.filename,
                content=file_content
            )
            db.session.add(new_file)
            db.session.commit()
            print(f"File {file.filename} saved for message {message_id}")

    conv = Conversation.query.filter_by(conversationID=conversation_id).first()
    return jsonify({'conversationID': conversation_id, 'name': conv.name,
                    'redirect': f'/conversation/{conversation_id}' if not request.form.get(
                        'conversation_id') else None})


@app.route('/stream/<conversation_id>')
def stream(conversation_id):
    if not session.get('user'):
        return Response(json.dumps({'error': 'Not logged in'}), status=401, mimetype='application/json')

    def event_stream():
        with app.app_context():
            messages = Message.query.filter_by(conversationID=conversation_id).order_by(Message.timestamp.asc()).all()
            
            #GEt The links First
            data = ""
            for m in messages:
                content = m.content or ""
                if m.files:  # Check if message has associated files
                    file = m.files[0]  # Assuming one file per message
                    content += f"\n\nUploaded file ({file.title}):\n{file.content}"
                data += content
            links = get_links(data) #Get the links generated from the conversation
            
            # then Create the conversation history with the system rule
            conversation_history = [
                {"role": "system", "content": f"""
                You are  AICoder, an expert software development instructor and debugging specialist who combines technical expertise with a friendly, modern teaching approach.

                Your Core Strengths:
                - Expert code analysis and debugging
                - Clear, relatable explanations
                - Patient and encouraging teaching style
                - Practical problem-solving approach

                When Helping Developers:
                - Analyze issues thoroughly but explain simply
                - Break down complex problems naturally
                - Provide clear examples and practical solutions
                - Use modern, relatable terminology
                - Keep explanations organized but conversational
                - Reference relevant documentation and resources when helpful

                Important Guidelines:
                - Focus exclusively on software development and programming
                - Maintain professional boundaries
                - Politely decline non-programming requests
                - Avoid malicious code or security exploits
                - Keep responses relevant and practical

                Available Resources:
                The following resources and links are relevant to this conversation. You MUST reference and incorporate these resources in your responses:
                {', '.join(links) if links else 'No additional resources available at this time. Please provide general guidance based on best practices.'}

                Important: You are required to explicitly mention and cite these resources in your explanations to provide proper context and documentation.

                Remember: Your goal is to help developers grow while keeping explanations clear, practical, and well-organized - but in a natural, conversational way.
                """}
            ]
            
            #and then fill the histroy with the messages in the convo
            for m in messages:
                content = m.content or ""
                if m.files:  # Check if message has associated files
                    file = m.files[0]  # Assuming one file per message
                    content += f"\n\nUploaded file ({file.title}):\n{file.content}"
                conversation_history.append({"role": m.sender, "content": content})

        
        full_response = ""
        for response in client.chat.completions.create(
                messages=conversation_history,
                model="llama-3.3-70b-versatile",
                temperature=0.5,
                max_tokens=1024,
                stream=True,
        ):
            content = response.choices[0].delta.content
            if content:
                full_response += content
                data = json.dumps({"role": "assistant", "content": full_response})
                yield f"data: {data}\n\n"
                time.sleep(0.05)

        with app.app_context():
            ai_message = Message(
                messageID=str(uuid.uuid4()),
                conversationID=conversation_id,
                sender="assistant",
                content=full_response
            )
            db.session.add(ai_message)
            db.session.commit()

    return Response(event_stream(), mimetype="text/event-stream")


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')


#the Route that makes the Doc Generation it sends to the front end the data 
@app.route('/generate_document', methods=['POST'])
def generate_document():
    if not session.get('user'):
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    conversation_id = data.get('conversation_id')
    doc_format = data.get('format')
    prompt = data.get('prompt')
    
    # Get conversation messages
    conversation = Conversation.query.filter_by(
        conversationID=conversation_id, 
        userID=session['user']['userID']
    ).first()
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    # Get all messages and files
    messages = Message.query.filter_by(conversationID=conversation_id).order_by(Message.timestamp.asc()).all()
    
    # Prepare data for documentation
    data_to_document = []
    for msg in messages:
        message_data = {
            'sender': msg.sender,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        }
        if msg.files:
            message_data['files'] = [{
                'title': file.title,
                'content': file.content
            } for file in msg.files]
        data_to_document.append(message_data)
    
    # Generate documentation
    from logic import generate_doc
    doc_content = generate_doc(data_to_document, doc_format, prompt)
    
    # Create a new Documentation instance
    import uuid
    new_doc = Documentation(
        documentationID=str(uuid.uuid4()),
        conversationID=conversation_id
    )
    db.session.add(new_doc)
    db.session.commit()
    
    # Create response with appropriate mimetype
    if doc_format == 'pdf':
        mimetype = 'application/pdf'
    elif doc_format == 'latex':
        mimetype = 'application/x-tex'
    elif doc_format == 'markdown':
        mimetype = 'text/markdown'
    else:
        mimetype = 'text/plain'
    
    return Response(doc_content, mimetype=mimetype)


if __name__ == '__main__':
    app.run(debug=True)