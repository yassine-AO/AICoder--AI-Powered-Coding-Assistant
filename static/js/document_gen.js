// Documentation Modal
const docBtn = document.querySelector('.doc-btn');
const docModal = document.querySelector('.doc-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');
const generateBtn = document.querySelector('#generate-doc');

docBtn.addEventListener('click', () => {
    docModal.classList.add('active');
    modalOverlay.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    docModal.classList.remove('active');
    modalOverlay.classList.remove('active');
});

modalOverlay.addEventListener('click', () => {
    docModal.classList.remove('active');
    modalOverlay.classList.remove('active');
});

//function that handles the generation of the Documentation
// Add these functions at the top of the file
function createPDF(markdownContent) {
    // Initialize Showdown converter with all features enabled
    const converter = new showdown.Converter({
        tables: true,
        tasklists: true,
        strikethrough: true,
        emoji: true,
        simplifiedAutoLink: true,
        parseImgDimensions: true,
        literalMidWordUnderscores: true,
        smartIndentationFix: true,
        ghCodeBlocks: true,
        openLinksInNewWindow: true
    });
    
    // Convert markdown to HTML
    const html = converter.makeHtml(markdownContent);
    
    // Create temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Initialize document definition
    const docDefinition = {
        content: [],
        styles: {
            header: {
                fontSize: 24,
                bold: true,
                color: '#CD0404',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            timestamp: {
                fontSize: 12,
                color: '#666666',
                alignment: 'center',
                margin: [0, 0, 0, 20]
            },
            heading: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            codeBlock: {
                font: 'Roboto',
                fontSize: 10,
                background: '#f6f8fa',
                margin: [0, 5, 0, 5],
                padding: [5, 5, 5, 5],
                lineHeight: 1.2
            },
            link: {
                color: '#0366d6',
                decoration: 'underline'
            },
            paragraph: {
                fontSize: 12,
                margin: [0, 5, 0, 5],
                lineHeight: 1.4
            },
            footer: {
                fontSize: 10,
                color: '#666666',
                alignment: 'center',
                margin: [0, 10, 0, 0]
            }
        },
        defaultStyle: {
            font: 'Roboto'
        },
        fonts: {
            Roboto: {
                normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
                bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
                italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
                bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
            }
        }
    };
    
    // Add header
    docDefinition.content.push(
        { text: 'AI*Coder Documentation', style: 'header' },
        { text: `Generated on ${new Date().toLocaleString()}`, style: 'timestamp' }
    );
    
    // Process content
    Array.from(tempDiv.children).forEach(element => {
        if (element.tagName.match(/^H[1-6]$/)) {
            // Handle headings
            docDefinition.content.push({
                text: element.textContent,
                style: 'heading',
                fontSize: 18 - (parseInt(element.tagName[1]) * 2)
            });
        } else if (element.tagName === 'PRE') {
            // Handle code blocks with better formatting
            const code = element.textContent;
            docDefinition.content.push({
                text: code,
                style: 'codeBlock'
            });
        } else if (element.tagName === 'A') {
            // Handle links
            docDefinition.content.push({
                text: element.textContent,
                link: element.href,
                style: 'link'
            });
        } else {
            // Handle regular text and check for nested links
            const links = element.getElementsByTagName('a');
            if (links.length > 0) {
                const textParts = [];
                let lastIndex = 0;
                
                Array.from(links).forEach(link => {
                    const linkText = link.textContent;
                    const linkIndex = element.textContent.indexOf(linkText, lastIndex);
                    
                    if (linkIndex > lastIndex) {
                        textParts.push({
                            text: element.textContent.substring(lastIndex, linkIndex),
                            style: 'paragraph'
                        });
                    }
                    
                    textParts.push({
                        text: linkText,
                        link: link.href,
                        style: 'link'
                    });
                    
                    lastIndex = linkIndex + linkText.length;
                });
                
                if (lastIndex < element.textContent.length) {
                    textParts.push({
                        text: element.textContent.substring(lastIndex),
                        style: 'paragraph'
                    });
                }
                
                docDefinition.content.push({
                    stack: textParts,
                    style: 'paragraph'
                });
            } else {
                docDefinition.content.push({
                    text: element.textContent,
                    style: 'paragraph'
                });
            }
        }
    });
    
    // Add footer
    docDefinition.content.push({
        text: 'Generated by AI*Coder - Your Intelligent Programming Assistant',
        style: 'footer',
        pageBreak: 'before'
    });
    
    return pdfMake.createPdf(docDefinition);
}

// Modify the click handler section
generateBtn.addEventListener('click', () => {
    // Get the current conversation ID from the URL
    const pathParts = window.location.pathname.split('/');
    const conversationId = pathParts[pathParts.length - 1];
    
    // Get form data
    const docFormat = document.getElementById('doc-format').value;
    const prompt = document.querySelector('.doc-modal textarea').value;
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    // Send AJAX request
    fetch('/generate_document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversation_id: conversationId,
            format: docFormat,
            prompt: prompt
        })
    })
    .then(response => response.text())
    .then(content => {
        if (docFormat === 'pdf') {
            const pdfDoc = createPDF(content);
            pdfDoc.download(`AI_Coder_Documentation_${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.innerHTML = 'Generate Documentation';
            
            // Close modal
            docModal.classList.remove('active');
            modalOverlay.classList.remove('active');
        } else {
            // Handle other formats as before
            const blob = new Blob([content], {
                type: docFormat === 'latex' ? 'application/x-tex' :
                      docFormat === 'markdown' ? 'text/markdown' : 'text/plain'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_Coder_Documentation_${timestamp}.${
                docFormat === 'latex' ? 'tex' :
                docFormat === 'markdown' ? 'md' : 'txt'
            }`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
        
        // Reset button state
        generateBtn.disabled = false;
        generateBtn.innerHTML = 'Generate Documentation';
        
        // Close modal
        docModal.classList.remove('active');
        modalOverlay.classList.remove('active');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate documentation');
        
        // Reset button state
        generateBtn.disabled = false;
        generateBtn.innerHTML = 'Generate Documentation';
    });
});