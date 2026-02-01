#!/usr/bin/env python3

import re

# Fix English chapter-3.html
with open('subjects/english/chapter-3.html', 'r', encoding='utf-8') as f:
    english_content = f.read()

# Fix 1: Poem buttons - Replace the button line specifically
english_content = re.sub(
    r'<button type="button" class="save-poem-btn" onclick="savePoem\(\'\$\{type\}\', \'\$\{poemContent\.replace\(/\'/g, \'\\\\\\\\?\'\'\)\}\'\)">💾 Save Poem</button>',
    r'<button type="button" class="save-poem-btn" data-poem-type="${type}">💾 Save Poem</button>',
    english_content
)

english_content = re.sub(
    r'<button type="button" class="share-poem-btn" onclick="sharePoem\(\'\$\{type\}\', \'\$\{poemContent\.replace\(/\'/g, \'\\\\\\\\?\'\'\)\}\'\)">📤 Share Poem</button>',
    r'<button type="button" class="share-poem-btn" data-poem-type="${type}">📤 Share Poem</button>',
    english_content
)

english_content = re.sub(
    r'<button type="button" class="new-poem-btn" onclick="startPoemCreation\(\'\$\{type\}\'\)">✨ Create Another</button>',
    r'<button type="button" class="new-poem-btn" data-poem-type="${type}">✨ Create Another</button>',
    english_content
)

# Add poem data storage before const displayHTML
english_content = re.sub(
    r'(\s+const displayHTML = `)',
    r'''            // Store poem data safely
            window.lastCreatedPoem = {
                type: type,
                content: poemContent
            };
            
\1''',
    english_content,
    count=1
)

# Fix 2: Writing button - Replace inline onclick
english_content = re.sub(
    r'<button type="button" class="save-writing-btn" onclick="saveWriting\(\'\$\{technique\}\', \'\$\{writing\.replace\(/\'/g, \'\\\\\\\\?\'\'\)\}\'\)">💾 Save My Writing</button>',
    r'<button type="button" class="save-writing-btn" data-technique="${technique}" data-writing-id="${uniqueId}">💾 Save My Writing</button>',
    english_content
)

# Add unique ID generation before feedback
english_content = re.sub(
    r'(\s+let feedback = `)',
    r'''            // Store writing data safely
            const uniqueId = 'writing-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            if (!window.savedWritings) window.savedWritings = {};
            window.savedWritings[uniqueId] = writing;
            
\1''',
    english_content,
    count=1
)

# Fix 3: Add delegated event listeners before closing script tag
delegated_listeners = '''
        // Delegated event listeners for safe handling
        document.addEventListener('click', function(event) {
            // Handle poem buttons
            const savePoemBtn = event.target.closest('.save-poem-btn');
            if (savePoemBtn && window.lastCreatedPoem) {
                savePoem(window.lastCreatedPoem.type, window.lastCreatedPoem.content);
                return;
            }
            
            const sharePoemBtn = event.target.closest('.share-poem-btn');
            if (sharePoemBtn && window.lastCreatedPoem) {
                sharePoem(window.lastCreatedPoem.type, window.lastCreatedPoem.content);
                return;
            }
            
            const newPoemBtn = event.target.closest('.new-poem-btn');
            if (newPoemBtn && window.lastCreatedPoem) {
                startPoemCreation(window.lastCreatedPoem.type);
                return;
            }
            
            // Handle writing save button
            const saveWritingBtn = event.target.closest('.save-writing-btn');
            if (saveWritingBtn) {
                const technique = saveWritingBtn.dataset.technique;
                const writingId = saveWritingBtn.dataset.writingId;
                if (window.savedWritings && window.savedWritings[writingId]) {
                    saveWriting(technique, window.savedWritings[writingId]);
                }
                return;
            }
        });
    </script>'''

english_content = re.sub(
    r'    </script>\s*</body>',
    delegated_listeners + '\n</body>',
    english_content
)

with open('subjects/english/chapter-3.html', 'w', encoding='utf-8') as f:
    f.write(english_content)

print('✓ Fixed XSS issues in subjects/english/chapter-3.html')

# Fix Social Studies chapter-3.html
with open('subjects/social-studies/chapter-3.html', 'r', encoding='utf-8') as f:
    social_studies_content = f.read()

# Fix: Add fallback for undefined actionResponses
social_studies_content = re.sub(
    r'(\s+resultElement\.innerHTML = `)',
    r'''            const response = actionResponses[actionName] ?? 'No response available for that action.';
            
\1''',
    social_studies_content,
    count=1
)

social_studies_content = re.sub(
    r'\$\{actionResponses\[actionName\]\}',
    r'${response}',
    social_studies_content
)

with open('subjects/social-studies/chapter-3.html', 'w', encoding='utf-8') as f:
    f.write(social_studies_content)

print('✓ Fixed undefined handling in subjects/social-studies/chapter-3.html')

print('\n✓ All XSS issues fixed successfully!')
