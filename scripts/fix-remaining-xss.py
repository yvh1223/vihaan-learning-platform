#!/usr/bin/env python3

# Read file
with open('subjects/english/chapter-3.html', 'r') as f:
    lines = f.readlines()

# Fix line 758 - save-poem button
if 758 <= len(lines):
    lines[757] = lines[757].replace(
        "onclick=\"savePoem('${type}', '${poemContent.replace(/'/g, '\\\\\\\'')}')\"",
        "data-poem-type=\"${type}\""
    )

# Fix line 759 - share-poem button  
if 759 <= len(lines):
    lines[758] = lines[758].replace(
        "onclick=\"sharePoem('${type}', '${poemContent.replace(/'/g, '\\\\\\\'')}')\"",
        "data-poem-type=\"${type}\""
    )

# Fix line 1263 - save-writing button
if 1263 <= len(lines):
    lines[1262] = lines[1262].replace(
        "onclick=\"saveWriting('${technique}', '${writing.replace(/'/g, '\\\\\\\'')}')\"",
        "data-technique=\"${technique}\" data-writing-id=\"${uniqueId}\""
    )

# Write back
with open('subjects/english/chapter-3.html', 'w') as f:
    f.writelines(lines)

print("✓ Fixed remaining onclick handlers")
