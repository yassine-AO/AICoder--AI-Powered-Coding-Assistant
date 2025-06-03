from groq import Groq
from googlesearch import search

# Initialize the Groq client with the API key
client = Groq(api_key="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")

def get_links(conversation_data):
    """
    Generate a concise title/summary for a conversation using Groq API.
    Args:
        conversation_data (str): The conversation content to summarize
    Returns:
        str: A single sentence summary/title of the conversation
    """
    messages = [
        {"role": "system", "content": """
        You are a title generator for programming-related conversations. 
        Your task is to analyze the conversation and generate ONE concise sentence (max 10-15 words) 
        that captures the main programming issue or question being discussed.
        Focus on the technical problem and potential solution domain.
        Make the title searchable and relevant for technical troubleshooting.
        """},
        {"role": "user", "content": conversation_data}
    ]

    response = client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        max_tokens=50,
    )


    #now we get the links withh google search
    query = response.choices[0].message.content.strip()
    links = search(query, num_results=5)
    
    return links

# the function that generate the data of the Documentation
def generate_doc(data, doc_format, prompt):
    # Prepare conversation data as a string
    conversation_text = ""
    for msg in data:
        conversation_text += f"[{msg['sender']}] {msg['timestamp']}\n"
        conversation_text += f"{msg['content']}\n"
        if 'files' in msg:
            for file in msg['files']:
                conversation_text += f"\nFile: {file['title']}\n"
                conversation_text += f"{file['content']}\n"
        conversation_text += "\n---\n\n"
    
    # Prepare system message based on format
    format_instruction = {
        'pdf': 'markdown but no table of Contents',  # We'll convert markdown to PDF later
        'latex': 'latex',
        'markdown': 'markdown',
        'txt': 'markdown'
    }[doc_format]
    
    # Prepare the prompt for AI with better instructions
    system_prompt = f"""Create a comprehensive and well-structured technical documentation in {format_instruction} format. Your documentation should:

        1. Structure:
        - Have a clear table of contents
        - Include sections for problem description, solution approach, and implementation
        - Use proper headings and subheadings for easy navigation

        2. Content Focus:
        - Clearly explain the technical problem and its context
        - Provide detailed solution steps with explanations
        - Include relevant code snippets with comments
        - Highlight key technical decisions and their reasoning
        - Document any important dependencies or requirements

        3. Quality Standards:
        - Be technically accurate and precise
        - Use clear, professional language
        - Include practical examples where relevant
        - Provide troubleshooting tips if applicable
        - Reference any external resources mentioned in the conversation

        Format the documentation to be both comprehensive and easy to follow. Make it a valuable resource that others can use to understand and solve similar problems.

        Additional User Requirements: {prompt if prompt else 'None'}"""
    
    from groq import Groq
    client = Groq(api_key="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")
    
    # Get AI response
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": conversation_text}
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.5,
        max_tokens=32000
    )
    
    return response.choices[0].message.content


 