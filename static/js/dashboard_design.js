document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const conversationsBtn = document.getElementById('conversations-btn');
    const conversationsSidebar = document.getElementById('conversations-sidebar');
    const closeConversationsBtn = document.getElementById('close-conversations');
    const profileBtn = document.getElementById('profile-btn');
    const profileSidebar = document.getElementById('profile-sidebar');
    const closeProfileBtn = document.getElementById('close-profile');
    const overlay = document.getElementById('overlay');
    const messagesDiv = document.getElementById('messages');
    const logoutButton = document.getElementById('logoutButton');
    const heroContent = document.getElementById('hero-content');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
    const fileUpload = document.getElementById('file-upload');
    const filePreview = document.getElementById('file-preview');
    let eventSource = null;
    let isAssistantTyping = false;

    // Highlight all code blocks on page load
    function highlightAllCodeBlocks() {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(codeElement => {
            let className = codeElement.className || '';
            if (!className || className === '') {
                className = 'language-text';
            }
            if (!className.startsWith('language-')) {
                className = `language-${className.replace(/^language-/, '')}`;
            }
            const supportedLanguages = [
                'python', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 'typescript',
                'ruby', 'sql', 'json', 'yaml', 'markdown', 'bash', 'rust', 'kotlin', 'swift', 'dart', 'text'
            ];
            const language = className.replace('language-', '').toLowerCase();
            if (!supportedLanguages.includes(language)) {
                className = 'language-text';
            }
            codeElement.className = className;
            try {
                Prism.highlightElement(codeElement);
            } catch (err) {
                console.warn('Prism highlighting failed for', className, ':', err);
                codeElement.className = 'language-text';
            }
        });
    }
    // Call highlightAllCodeBlocks immediately after DOM is loaded
    highlightAllCodeBlocks();

    
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    conversationsBtn.addEventListener('click', function() {
        conversationsSidebar.classList.add('active');
        overlay.classList.add('active');
        if (profileSidebar.classList.contains('active')) {
            profileSidebar.classList.remove('active');
        }
    });

    closeConversationsBtn.addEventListener('click', function() {
        conversationsSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    profileBtn.addEventListener('click', function() {
        profileSidebar.classList.add('active');
        overlay.classList.add('active');
        if (conversationsSidebar.classList.contains('active')) {
            conversationsSidebar.classList.remove('active');
        }
    });

    closeProfileBtn.addEventListener('click', function() {
        profileSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        conversationsSidebar.classList.remove('active');
        profileSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    logoutButton.addEventListener('click', function() {
        window.location.href = '/logout';
    });

    scrollToBottomBtn.addEventListener('click', function() {
        const lastMessage = messagesDiv.lastElementChild;
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
            const inputContainer = document.querySelector('.input-container');
            inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    });

    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const messagesHeight = messagesDiv.offsetHeight;
        const messagesTop = messagesDiv.getBoundingClientRect().top + window.scrollY;
        const messagesBottom = messagesTop + messagesHeight;
        const inputHeight = document.querySelector('.input-container').offsetHeight + 40;

        if (scrollPosition + windowHeight < messagesBottom - inputHeight - 50) {
            scrollToBottomBtn.classList.add('visible');
        } else {
            scrollToBottomBtn.classList.remove('visible');
        }
    });

    function addClipboardButton(container) {
        const clipboardBtn = document.createElement('button');
        clipboardBtn.className = 'clipboard-btn';
        clipboardBtn.innerHTML = '<i class="fas fa-clipboard"></i>';
        clipboardBtn.addEventListener('click', function() {
            const text = container.innerText || container.textContent;
            navigator.clipboard.writeText(text).then(() => {
                clipboardBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    clipboardBtn.innerHTML = '<i class="fas fa-clipboard"></i>';
                }, 2000);
            }).catch(err => console.error('Failed to copy:', err));
        });
        container.appendChild(clipboardBtn);
    }

    function addCodeClipboardButtons(container) {
        const codeBlocks = container.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            const codeClipboardBtn = document.createElement('button');
            codeClipboardBtn.className = 'code-clipboard-btn';
            codeClipboardBtn.innerHTML = '<i class="fas fa-clipboard"></i>';
            codeClipboardBtn.addEventListener('click', function() {
                const text = pre.innerText || pre.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    codeClipboardBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        codeClipboardBtn.innerHTML = '<i class="fas fa-clipboard"></i>';
                    }, 2000);
                }).catch(err => console.error('Failed to copy:', err));
            });
            pre.appendChild(codeClipboardBtn);
            const codeElement = pre.querySelector('code');
            if (codeElement && codeElement.isConnected) {
                let className = codeElement.className || pre.className || '';
                if (!className || className === '') {
                    className = 'language-text';
                }
                if (!className.startsWith('language-')) {
                    className = `language-${className.replace(/^language-/, '')}`;
                }
                const supportedLanguages = [
                    'python', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 'typescript',
                    'ruby', 'sql', 'json', 'yaml', 'markdown', 'bash', 'rust', 'kotlin', 'swift', 'dart', 'text'
                ];
                const language = className.replace('language-', '').toLowerCase();
                if (!supportedLanguages.includes(language)) {
                    className = 'language-text';
                }
                codeElement.className = className;
                try {
                    Prism.highlightElement(codeElement);
                } catch (err) {
                    console.warn('Prism highlighting failed for', className, ':', err);
                    codeElement.className = 'language-text';
                }
            }
        });
    }

    function loadConversation(convId) {
        if (!convId) {
            console.error('No conversation ID provided');
            heroContent.style.display = 'block';
            messagesDiv.style.display = 'none';
            return;
        }

        fetch(`/conversation/${convId}/messages`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(messages => {
                if (Array.isArray(messages) && messages.length > 0) {
                    messagesDiv.innerHTML = '';
                    messages.forEach(m => {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = `message ${m.sender} fade-in`;
                        if (m.sender === 'assistant') {
                            msgDiv.innerHTML = marked.parse(m.content);
                            addClipboardButton(msgDiv);
                            addCodeClipboardButtons(msgDiv);
                        } else {
                            let content = m.content ? m.content.replace(/\n/g, '<br>') : '';
                            if (m.file && m.file.title) {
                                content = `<i class="fas fa-file-code"></i> ${m.file.title}${content ? '<br>' + content : ''}`;
                            }
                            msgDiv.innerHTML = content;
                        }
                        messagesDiv.appendChild(msgDiv);
                        console.log('Added message:', m.sender, m.content.substring(0, 50)); // Debug log
                    });
                    heroContent.style.display = 'none';
                    messagesDiv.style.display = 'flex';
                    highlightAllCodeBlocks();
                    const lastMessage = messagesDiv.lastElementChild;
                    if (lastMessage) {
                        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                    if (messages[messages.length - 1].sender === 'user' && !isAssistantTyping) {
                        startEventSource(convId);
                    }
                } else {
                    console.warn('No messages found for conversation', convId);
                    heroContent.style.display = 'block';
                    messagesDiv.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error loading conversation:', error);
                heroContent.style.display = 'block';
                messagesDiv.style.display = 'none';
            });
    }

    if (currentConversationId && currentConversationId !== '') {
        loadConversation(currentConversationId);
    } else {
        heroContent.style.display = 'block';
        messagesDiv.style.display = 'none';
    }

    conversationsSidebar.addEventListener('click', function(e) {
        const convItem = e.target.closest('.conversation-item');

        if (convItem && !e.target.closest('.conversation-actions')) {
            const convId = convItem.dataset.convId;
            window.location.href = `/conversation/${convId}`;
        } else if (e.target.closest('.icon-btn .fa-edit')) {
            const btn = e.target.closest('.icon-btn');
            const convId = btn.closest('.conversation-item').dataset.convId;
            const currentName = btn.closest('.conversation-item').querySelector('.conversation-name').textContent;
            const newName = prompt('Enter new conversation name:', currentName);
            if (newName && newName !== currentName) {
                fetch(`/rename_conversation/${convId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `name=${encodeURIComponent(newName)}`
                })
                .then(response => response.json())
                .then(data => {
                    const convItem = document.querySelector(`.conversation-item[data-conv-id="${data.conversationID}"]`);
                    convItem.querySelector('.conversation-name').textContent = data.name;
                })
                .catch(error => console.error('Error renaming conversation:', error));
            }
        } else if (e.target.closest('.delete-btn')) {
            const btn = e.target.closest('.delete-btn');
            const convId = btn.dataset.convId;
            if (confirm('Are you sure you want to delete this conversation?')) {
                fetch(`/delete_conversation/${convId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .then(response => response.json())
                .then(data => {
                    const convItem = btn.closest('.conversation-item');
                    convItem.style.transition = 'opacity 0.3s ease';
                    convItem.style.opacity = '0';
                    setTimeout(() => {
                        convItem.remove();
                        if (currentConversationId === convId) {
                            window.location.href = data.redirect;
                        }
                    }, 300);
                })
                .catch(error => {
                    console.error('Error deleting conversation:', error);
                    alert('Failed to delete conversation. Please try again.');
                });
            }
        }
    });


    fileUpload.addEventListener('change', function() {
        filePreview.innerHTML = '';
        if (fileUpload.files.length > 0) {
            const file = fileUpload.files[0];
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-preview-item';
            fileDiv.innerHTML = `<i class="fas fa-file"></i> ${file.name}`;
            filePreview.appendChild(fileDiv);
        }
    });

    sendBtn.addEventListener('click', function() {
        const prompt = promptInput.value.trim();
        const file = fileUpload.files[0];
        if ((prompt || file) && !isAssistantTyping) {
            const conversationId = currentConversationId || null;
            const formData = new FormData();
            formData.append('message', prompt);
            if (conversationId) {
                formData.append('conversation_id', conversationId);
            }
            if (file) {
                formData.append('file', file);
            }
            fetch('/send_message', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    const userDiv = document.createElement('div');
                    userDiv.className = 'message user fade-in';
                    let content = prompt ? prompt.replace(/\n/g, '<br>') : '';
                    if (file) {
                        content = `<i class="fas fa-file-code"></i> ${file.name}${content ? '<br>' + content : ''}`;
                    }
                    userDiv.innerHTML = content;
                    messagesDiv.appendChild(userDiv);
                    console.log('Added user message:', content.substring(0, 50)); // Debug log
                    promptInput.value = '';
                    promptInput.style.height = 'auto';
                    promptInput.placeholder = 'How can AI*Coder help you today?';
                    fileUpload.value = '';
                    filePreview.innerHTML = '';
                    startEventSource(data.conversationID);
                }
            })
            .catch(error => console.error('Error sending message:', error));
        } else if (isAssistantTyping) {
            stopAssistantTyping();
        }
    });

    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isAssistantTyping) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    function startEventSource(convId) {
        if (eventSource) eventSource.close();
        eventSource = new EventSource(`/stream/${convId}`);
        isAssistantTyping = true;
        promptInput.disabled = true;
        sendBtn.classList.add('loading');
        sendBtn.disabled = false;

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            let assistantDiv = messagesDiv.querySelector('.message.assistant:last-child');
            if (!assistantDiv) {
                assistantDiv = document.createElement('div');
                assistantDiv.className = 'message assistant fade-in';
                messagesDiv.appendChild(assistantDiv);
            }
            assistantDiv.innerHTML = marked.parse(data.content);
            if (!assistantDiv.querySelector('.clipboard-btn')) {
                addClipboardButton(assistantDiv);
            }
            addCodeClipboardButtons(assistantDiv);
            assistantDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        };

        eventSource.onerror = function() {
            eventSource.close();
            isAssistantTyping = false;
            promptInput.disabled = false;
            sendBtn.classList.remove('loading');
            highlightAllCodeBlocks();
            const lastMessage = messagesDiv.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        };

        eventSource.onopen = function() {
            isAssistantTyping = true;
            promptInput.disabled = true;
            sendBtn.classList.add('loading');
        };
    }

    function stopAssistantTyping() {
        if (eventSource) {
            eventSource.close();
            isAssistantTyping = false;
            promptInput.disabled = false;
            sendBtn.classList.remove('loading');
            highlightAllCodeBlocks();
            const lastMessage = messagesDiv.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }
});