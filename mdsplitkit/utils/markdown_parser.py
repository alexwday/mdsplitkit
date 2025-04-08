import re

def get_headings_with_lines(markdown_text):
    """Extract all headings from markdown text.

    Returns a list of heading objects, each containing:
    - level (int): Heading level (1-6)
    - text (str): Heading text
    - line_number (int): 1-based line number where the heading starts
    """
    lines = markdown_text.split('\n')
    headings = []
    
    heading_regex = re.compile(r'^(#{1,6})\s+(.+)')
    
    for i, line in enumerate(lines):
        match = heading_regex.match(line)
        if match:
            level = len(match.group(1))
            text = match.group(2).strip()
            # Line number is 1-based index
            line_number = i + 1 
            
            headings.append({
                'level': level,
                'text': text,
                'line_number': line_number 
            })
    
    return headings
