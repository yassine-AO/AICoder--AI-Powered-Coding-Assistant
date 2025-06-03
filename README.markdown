# AlCoder - AI-Powered Coding Assistance Platform

## Overview
AlCoder is a sophisticated web-based platform designed to revolutionize software development by integrating advanced artificial intelligence (AI) with practical coding workflows. Built as a full-stack Flask application, it combines a robust backend, an intuitive frontend, and a relational MySQL database to deliver a seamless experience for developers, from beginners to professionals. AlCoder leverages the Groq API for real-time AI assistance, supports persistent conversations, and offers automated documentation generation in multiple formats, making it an indispensable tool for coding education, collaboration, and productivity.

This project was initiated in 2023, inspired by the rise of large language models (LLMs) and tools like GitHub Copilot, with the goal of creating a specialized, accessible solution. Version 1.0, released in October 2024, includes core features such as secure authentication, real-time AI interaction, and extensible architecture.

## Features
- **Secure Authentication**: Implements Google OAuth via Firebase for fast, reliable, and secure user login.
- **Persistent Conversations**: Enables users to create, rename, and delete conversations, stored in a MySQL database for session continuity.
- **Real-Time AI Interaction**: Utilizes the Groq API (llama-3.3-70b-versatile model) to process text inputs and analyze uploaded code files, providing rapid and accurate responses.
- **Automated Documentation**: Generates professional documents (PDF, Markdown, LaTeX, plain text) from AI interactions with customizable prompts.
- **Intuitive Interface**: Features a responsive dashboard with syntax highlighting (via Prism.js) and real-time response streaming using Server-Sent Events (SSE).
- **Modular and Extensible**: Designed with a separated frontend and backend, facilitating maintenance and future enhancements.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript, with Prism.js for syntax highlighting and static assets in the `static/` directory.
- **Backend**: Flask (Python) framework, with SQLAlchemy for ORM and Groq API for AI processing.
- **Database**: MySQL with tables for users, conversations, messages, files, resources, and documentation.
- **Authentication**: Firebase Google OAuth for secure user management.
- **Deployment**: Compatible with Gunicorn and Nginx (with SSL via Certbot) for production environments.

## Project Structure
```
alcoder/
├── app.py              # Main Flask application file with routes and AI logic
├── config.py           # Configuration settings (e.g., database URI, API keys)
├── create_tables.py    # Script to initialize MySQL database tables
├── db/                 # Database-related files (e.g., migrations or connection logic)
├── logic/              # Business logic or helper functions
├── models.py           # SQLAlchemy models for database interactions
├── static/             # Static files (CSS, JS, e.g., dashboard_design.js)
├── templates/          # HTML templates (index.html, dashboard.html)
├── .gitattributes      # Git configuration file
├── README.md           # Project documentation
├── requirements.txt    # List of Python dependencies
```

## Installation and Setup
Follow these steps to set up and run AlCoder locally on your machine.

### Prerequisites
- **Python**: Version 3.8 or higher.
- **MySQL**: Installed and running locally.
- **Git**: For cloning the repository.
- **Firebase Account**: For Google OAuth and service account credentials.
- **Groq API Key**: Obtained from the Groq website.

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/alcoder.git
   cd alcoder
   ```

2. **Create a Virtual Environment**:
   - Run: `python -m venv venv` to create a virtual environment.
   - Activate it:
     - Windows: `venv\Scripts\activate`
     - Mac/Linux: `source venv/bin/activate`
   - You should see `(venv)` in your terminal prompt.

3. **Install Dependencies**:
   - With the virtual environment active, install required packages:
     ```bash
     pip install -r requirements.txt
     ```

4. **Configure Firebase**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Create a new project and enable Google OAuth under Authentication.
   - Generate a service account key (JSON file) and download it as `key.json`.
   - Place `key.json` in the project root directory.

5. **Obtain Groq API Key**:
   - Sign up at [Groq](https://groq.com/) and retrieve your API key.
   - Open `app.py` and replace the placeholder `GROQ_API_KEY` with your key (e.g., within the API call configuration).

6. **Set Up MySQL Database**:
   - Create a MySQL database named `alcoder`:
     ```sql
     CREATE DATABASE alcoder;
     ```
   - Update the database URI in `config.py`:
     ```python
     SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/alcoder'
     ```
   - Run the table creation script:
     ```bash
     python create_tables.py
     ```

7. **Run the Application**:
   - Ensure the virtual environment is active.
   - Start the Flask server:
     ```bash
     python app.py
     ```
   - Access the app at `http://localhost:5000` in your browser.

8. **Optional Production Deployment**:
   - Use Gunicorn to run the app:
     ```bash
     gunicorn -w 4 --bind 0.0.0.0:8000 app:app
     ```
   - Configure Nginx as a reverse proxy to `http://localhost:8000` and secure it with SSL using Certbot.

## How It Works
### Main Mechanism
AlCoder operates as a Flask web application that authenticates users via Firebase Google OAuth. Upon login, it connects to a MySQL database to manage user profiles, conversations, and messages. The core functionality revolves around facilitating AI-driven coding assistance and generating documentation.

### AI Integration
The backend sends user inputs (text or uploaded files) to the Groq API, which leverages the llama-3.3-70b-versatile model to generate responses. These responses are tailored to coding queries, code analysis, or documentation suggestions, providing high accuracy and speed.

### Server-Sent Events (SSE)
Real-time interaction is achieved using Server-Sent Events, implemented in `app.py`. SSE allows the server to push updates to the client (browser) as the AI generates responses, eliminating the need for periodic polling. The frontend, managed by `dashboard_design.js`, listens for these events and dynamically updates the chat interface.

### Frontend and User Experience
- **`index.html`**: Serves as the initial login page with a "Sign in with Google" button.
- **`dashboard.html`**: Displays a sidebar for conversation navigation, a chat area with Prism.js for syntax-highlighted code, and action buttons (e.g., "New Conversation", "Generate Document").
- User actions (e.g., sending messages, uploading files) trigger POST requests to Flask routes, which handle database storage and AI processing.

### Documentation Generation
The app can export conversation data into structured documents. Users select a format (e.g., Markdown, PDF) and provide optional prompts, and the backend compiles the content, leveraging AI to ensure coherence and professionalism.

## Demo Video
To see AlCoder in action, watch the demo video below:

## Demo Video  
[Click here to watch the AICoder demo video](https://vimeo.com/1090111275)



## Future Enhancements
- **Voice Chat**: Integrate Web Speech API for voice-based interactions.
- **Advanced Code Analysis**: Add linter support (e.g., Pylint) for optimization suggestions.
- **Performance Optimization**: Implement Redis caching for frequent AI responses and enable Gzip compression.
- **Scalability**: Containerize with Docker and add load balancing (e.g., HAProxy).
- **IDE Integration**: Develop plugins for VSCode or PyCharm.


## License
This project is licensed under the MIT License. Free to use and modify with attribution to Yassine Aouni.


*Last updated: June 03, 2025, 02:38 PM +01*