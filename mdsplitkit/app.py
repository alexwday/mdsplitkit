import os
from flask import Flask, render_template, request, jsonify, abort
# Import get_headings_with_lines from markdown_parser
from utils.markdown_parser import get_headings_with_lines

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads' # Store original uploads separately
app.config['OUTPUT_FOLDER'] = 'static/output' # Keep output here

# Global variables to store state related to the active file
active_file_path = None
original_line_count = 0
extracted_chapters_filenames = [] # List to store names of extracted files

# Ensure necessary directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    """ Renders the main page. If a file is active, it loads its state. """
    global active_file_path, original_line_count, extracted_chapters_filenames
    content = ""
    headings = []
    filename = None
    current_line_count = 0

    if active_file_path and os.path.exists(active_file_path):
        try:
            with open(active_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Calculate current line count
            current_line_count = len(content.splitlines()) # Use splitlines for accuracy
            headings = get_headings_with_lines(content)
            filename = os.path.basename(active_file_path)
        except Exception as e:
            print(f"Error reading active file {active_file_path}: {e}")
            # Reset if file is problematic
            active_file_path = None
            original_line_count = 0
            extracted_chapters_filenames = []
            return render_template('index.html', error="Error loading the active file.")
    else:
        # If no active file, reset state
        active_file_path = None
        original_line_count = 0
        extracted_chapters_filenames = []


    # Pass all relevant state to the template
    return render_template(
        'index.html',
        content=content,
        headings=headings,
        filename=filename,
        current_line_count=current_line_count,
        original_line_count=original_line_count,
        extracted_chapters=extracted_chapters_filenames
    )


@app.route('/load_file', methods=['POST'])
def load_file():
    """ Handles file upload, saves it, sets it as active, calculates original line count, and returns initial data. """
    global active_file_path, original_line_count, extracted_chapters_filenames
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save the uploaded file to the UPLOAD_FOLDER
        filename = file.filename # Use original filename for clarity
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # print(f"Attempting to save uploaded file to: {os.path.abspath(save_path)}") # Removed dev print
        try:
            file.save(save_path)
            # print(f"Successfully saved file to: {save_path}") # Removed dev print
            active_file_path = save_path # Set this newly saved file as the active one
            extracted_chapters_filenames = [] # Reset extracted list on new file load
            
            # Read content, calculate original lines, and extract headings
            with open(active_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_line_count = len(content.splitlines()) # Store original count
            current_line_count = original_line_count # Initially, current is original
            headings = get_headings_with_lines(content)

            return jsonify({
                'message': 'File loaded successfully',
                'filename': filename,
                'content': content,
                'headings': headings,
                'original_line_count': original_line_count,
                'current_line_count': current_line_count, # Send current count too
                'extracted_chapters': extracted_chapters_filenames # Send empty list
            })
        except Exception as e:
            # print(f"!!! Error saving file to {save_path}: {e}") # Removed dev print
            active_file_path = None
            original_line_count = 0
            extracted_chapters_filenames = []
            return jsonify({'error': f'Error processing file: {e}'}), 500
    
    return jsonify({'error': 'File processing failed'}), 500


@app.route('/extract_chunk', methods=['POST'])
def extract_chunk():
    """ Extracts content, saves it, overwrites active file, updates state, and returns updated state. """
    global active_file_path, original_line_count, extracted_chapters_filenames
    if not active_file_path or not os.path.exists(active_file_path):
        return jsonify({'error': 'No active file to process'}), 400

    data = request.json
    split_line_number = data.get('split_line_number')
    output_filename = data.get('output_filename')

    if not isinstance(split_line_number, int) or split_line_number <= 0:
        return jsonify({'error': 'Invalid split line number'}), 400
    if not output_filename:
        return jsonify({'error': 'Output filename is required'}), 400

    # Sanitize output filename
    output_filename = "".join(c for c in output_filename if c.isalnum() or c in (' ', '.', '_')).rstrip()
    if not output_filename.lower().endswith('.md'):
        output_filename += '.md'
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

    try:
        # Read the current content of the active file
        with open(active_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Line numbers are 1-based, adjust for 0-based list index
        split_index = split_line_number - 1

        if split_index < 0 or split_index > len(lines): # Allow splitting at the very end
             return jsonify({'error': f'Split line number {split_line_number} is out of range (1-{len(lines)})'}), 400

        # Split the content
        content_to_extract = "".join(lines[:split_index])
        remaining_content = "".join(lines[split_index:])

        # Save the extracted chapter
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content_to_extract)
        
        # Add filename to the list of extracted chapters
        extracted_chapters_filenames.append(output_filename)

        # Overwrite the active file with the remaining content
        with open(active_file_path, 'w', encoding='utf-8') as f:
            f.write(remaining_content)

        # Get new headings and current line count for the remaining content
        new_headings = get_headings_with_lines(remaining_content)
        current_line_count = len(remaining_content.splitlines())

        return jsonify({
            'message': f'Chapter "{output_filename}" extracted successfully.',
            'remaining_content': remaining_content,
            'headings': new_headings,
            'original_line_count': original_line_count, # Pass original count
            'current_line_count': current_line_count,   # Pass new current count
            'extracted_chapters': extracted_chapters_filenames # Pass updated list
        })

    except Exception as e:
        print(f"Error during extraction: {e}") # Keep generic error print for server logs
        return jsonify({'error': f'An error occurred during extraction: {e}'}), 500


@app.route('/extract_remaining', methods=['POST'])
def extract_remaining():
    """ Extracts all remaining content, saves it, and clears the active file. """
    global active_file_path, original_line_count, extracted_chapters_filenames
    if not active_file_path or not os.path.exists(active_file_path):
        return jsonify({'error': 'No active file to process'}), 400

    data = request.json
    output_filename = data.get('output_filename')

    if not output_filename:
        return jsonify({'error': 'Output filename is required'}), 400

    # Sanitize output filename
    output_filename = "".join(c for c in output_filename if c.isalnum() or c in (' ', '.', '_')).rstrip()
    if not output_filename.lower().endswith('.md'):
        output_filename += '.md'
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

    try:
        # Read the current (remaining) content
        with open(active_file_path, 'r', encoding='utf-8') as f:
            remaining_content = f.read()

        if not remaining_content.strip():
             return jsonify({'error': 'No content remaining to extract.'}), 400

        # Save the remaining content as the last chapter
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(remaining_content)

        # Add filename to the list
        extracted_chapters_filenames.append(output_filename)

        # Clear the active file (overwrite with empty content)
        with open(active_file_path, 'w', encoding='utf-8') as f:
            f.write("")

        # Return empty state
        return jsonify({
            'message': f'Final chapter "{output_filename}" extracted successfully. Original file is now empty.',
            'remaining_content': "",
            'headings': [],
            'original_line_count': original_line_count,
            'current_line_count': 0,
            'extracted_chapters': extracted_chapters_filenames
        })

    except Exception as e:
        print(f"Error during final extraction: {e}")
        return jsonify({'error': f'An error occurred during final extraction: {e}'}), 500


if __name__ == '__main__':
    # Run the Flask app on port 5001
    # Note: debug=True is generally not recommended for production deployments
    app.run(debug=True, port=5001)
