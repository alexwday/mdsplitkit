// Global state
let activeFilename = null;
let currentContent = "";
let currentHeadings = [];
let selectedSplitLine = null; // 1-based line number where the *next* chapter starts
let originalLineCount = 0;
let currentLineCount = 0;
let extractedChapters = []; // Array of extracted filenames

// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const titleNavigator = document.getElementById('title-navigator');
const headingsList = document.getElementById('headings-list');
const searchInput = document.getElementById('search-input');
const contentViewer = document.getElementById('content-viewer');
const markdownContent = document.getElementById('markdown-content');
const extractionControls = document.getElementById('extraction-controls');
const selectedLineDisplay = document.getElementById('selected-line-display');
const totalLinesCount = document.getElementById('total-lines-count'); // Displays current lines
const extractBtn = document.getElementById('extract-btn');
const extractRemainingBtn = document.getElementById('extract-remaining-btn'); // New button
const activeFilenameDisplay = document.getElementById('active-filename');

// New DOM Elements for added features
const rightSidebar = document.getElementById('right-sidebar'); // Right sidebar for extracted chapters
const extractedChaptersListRight = document.getElementById('extracted-chapters-list-right'); // List in right sidebar
const progressSection = document.getElementById('progress-section');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const extractedLinesCount = document.getElementById('extracted-lines-count');
const originalLinesCount = document.getElementById('original-lines-count');


// Modal Elements
const extractModal = document.getElementById('extract-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelExtractBtn = document.getElementById('cancel-extract-btn');
const confirmExtractBtn = document.getElementById('confirm-extract-btn');
const chapterFilenameInput = document.getElementById('chapter-filename');
const contentPreview = document.getElementById('content-preview');
const modalSplitLine = document.getElementById('modal-split-line');
const modalActiveFilename = document.getElementById('modal-active-filename');

// --- Initialization ---
function initializeApp() {
    // Load initial data passed from Flask template
    if (initialData && initialData.filename) {
        activeFilename = initialData.filename;
        currentContent = initialData.content;
        currentHeadings = initialData.headings;
        originalLineCount = initialData.original_line_count || 0;
        currentLineCount = initialData.current_line_count || 0;
        extractedChapters = initialData.extracted_chapters || [];
        updateUIForLoadedFile();
    } else {
        // No file initially loaded
        resetUI();
    }

    // Event Listeners
    fileInput.addEventListener('change', handleFileUpload);
    searchInput.addEventListener('input', filterHeadingsList);
    headingsList.addEventListener('click', handleHeadingClick);
    markdownContent.addEventListener('click', handleContentClick); // For line selection
    extractBtn.addEventListener('click', openExtractModal);
    extractRemainingBtn.addEventListener('click', handleExtractRemaining); // Listener for new button
    closeModalBtn.addEventListener('click', closeExtractModal);
    cancelExtractBtn.addEventListener('click', closeExtractModal);
    confirmExtractBtn.addEventListener('click', handleExtractConfirm);
}

function resetUI() {
     uploadArea.classList.remove('hidden');
     titleNavigator.classList.add('hidden');
     extractionControls.classList.add('hidden');
     rightSidebar.classList.add('hidden'); // Hide right sidebar
     progressSection.classList.add('hidden');
     activeFilenameDisplay.textContent = 'No file loaded';
     markdownContent.innerHTML = '';
     headingsList.innerHTML = '';
     extractedChaptersListRight.innerHTML = ''; // Clear right list
     selectedSplitLine = null;
     updateSelectionUI();
     updateProgressBar(0, 0); // Reset progress bar
     extractRemainingBtn.disabled = true; // Disable remaining button
}

// --- File Handling ---
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/load_file', { // Use the new endpoint
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // Update global state from response
        activeFilename = data.filename;
        currentContent = data.content;
        currentHeadings = data.headings;
        originalLineCount = data.original_line_count;
        currentLineCount = data.current_line_count;
        extractedChapters = data.extracted_chapters; // Should be empty initially

        // Update UI
        updateUIForLoadedFile();

    } catch (error) {
        console.error('File load error:', error);
        alert(`Error loading file: ${error.message}`);
        // Reset UI to initial state
        activeFilename = null;
        currentContent = "";
        currentHeadings = [];
        originalLineCount = 0;
        currentLineCount = 0;
        extractedChapters = [];
        resetUI();
    }
}

function updateUIForLoadedFile() {
    activeFilenameDisplay.textContent = `Editing: ${activeFilename}`;
    uploadArea.classList.add('hidden'); // Hide upload area
    titleNavigator.classList.remove('hidden');
    extractionControls.classList.remove('hidden');
    rightSidebar.classList.remove('hidden'); // Show right sidebar
    progressSection.classList.remove('hidden'); // Show progress bar section

    renderMarkdownContent(currentContent);
    renderHeadingsList(currentHeadings);
    updateExtractedChaptersList(); // Update list (initially empty)
    updateProgressBar(currentLineCount, originalLineCount); // Update progress

    selectedSplitLine = null; // Reset selection on new file load
    updateSelectionUI();
    extractRemainingBtn.disabled = currentLineCount <= 0; // Enable if content exists
}


// --- Content Rendering & Selection ---
function renderMarkdownContent(content) {
    markdownContent.innerHTML = ''; // Clear previous content
    const lines = content.split('\n');
    currentLineCount = lines.length; // Update current line count

    lines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.classList.add('line');
        const lineNumber = index + 1; // 1-based line number
        lineElement.setAttribute('data-line', lineNumber);

        const lineNumberSpan = document.createElement('span');
        lineNumberSpan.classList.add('line-number');
        lineNumberSpan.textContent = lineNumber;
        lineElement.appendChild(lineNumberSpan);

        const lineTextSpan = document.createElement('span');
        lineTextSpan.classList.add('line-text');
        // Basic Markdown heading highlighting
        if (line.match(/^#{1,6}\s+/)) {
            const level = line.match(/^(#{1,6})\s+/)[1].length;
            lineTextSpan.classList.add('heading', `h${level}`);
        }
        lineTextSpan.textContent = line;
        lineElement.appendChild(lineTextSpan);

        markdownContent.appendChild(lineElement);
    });

    totalLinesCount.textContent = currentLineCount; // Update display
    extractRemainingBtn.disabled = currentLineCount <= 0; // Update button state
}

function handleContentClick(event) {
    const lineElement = event.target.closest('.line');
    if (lineElement) {
        const lineNumber = parseInt(lineElement.getAttribute('data-line'));
        if (!isNaN(lineNumber)) {
            selectSplitLine(lineNumber);
        }
    }
}

// --- Headings List Rendering & Selection ---
function renderHeadingsList(headings) {
    headingsList.innerHTML = ''; // Clear previous list
    if (!headings || headings.length === 0) {
        headingsList.innerHTML = '<p>No headings found.</p>';
        return;
    }

    headings.forEach(heading => {
        const item = document.createElement('div');
        item.classList.add('heading-item');
        item.setAttribute('data-line', heading.line_number);
        item.setAttribute('data-level', heading.level);
        item.setAttribute('data-line', heading.line_number); // Ensure line number is set on item

        // 1. Level Indicator (H1, H2)
        const levelSpan = document.createElement('span');
        levelSpan.classList.add('heading-level-indicator');
        levelSpan.textContent = `H${heading.level}`;
        item.appendChild(levelSpan);

        // 2. Title Text (with wrapper for indentation)
        const textWrapper = document.createElement('span'); // Wrapper for text + indentation
        textWrapper.classList.add('heading-text-wrapper');
        // Indentation will be applied via CSS using data-level on heading-item

        const textSpan = document.createElement('span');
        textSpan.classList.add('heading-text');
        textSpan.textContent = heading.text;
        textWrapper.appendChild(textSpan); // Put text inside wrapper
        item.appendChild(textWrapper); // Add wrapper to item

        // 3. Line Number Indicator (L123) - Moved to the end
        const lineNumSpan = document.createElement('span');
        lineNumSpan.classList.add('heading-line-indicator');
        lineNumSpan.textContent = `L${heading.line_number}`;
        item.appendChild(lineNumSpan);


        headingsList.appendChild(item);
    });
}

function handleHeadingClick(event) {
    const headingItem = event.target.closest('.heading-item');
    if (headingItem) {
        const lineNumber = parseInt(headingItem.getAttribute('data-line'));
        if (!isNaN(lineNumber)) {
            selectSplitLine(lineNumber);
            // Scroll content view to the selected heading's line
            scrollToLine(lineNumber);
        }
    }
}

function filterHeadingsList() {
    const searchTerm = searchInput.value.toLowerCase();
    const items = headingsList.querySelectorAll('.heading-item');
    items.forEach(item => {
        // Search only within the heading text itself
        const text = item.querySelector('.heading-text').textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none'; // Use flex since items are flex
    });
}

// --- Selection Management ---
function selectSplitLine(lineNumber) {
    // Deselect previous line in content view
    const previouslySelectedContentLine = markdownContent.querySelector('.line.selected');
    if (previouslySelectedContentLine) {
        previouslySelectedContentLine.classList.remove('selected');
    }
     // Deselect previous heading in list view
    const previouslySelectedHeading = headingsList.querySelector('.heading-item.selected');
    if (previouslySelectedHeading) {
        previouslySelectedHeading.classList.remove('selected');
    }

    selectedSplitLine = lineNumber;

    // Highlight selected line in content view
    const currentContentLine = markdownContent.querySelector(`.line[data-line="${lineNumber}"]`);
    if (currentContentLine) {
        currentContentLine.classList.add('selected');
    }
     // Highlight selected heading in list view
    const currentHeadingItem = headingsList.querySelector(`.heading-item[data-line="${lineNumber}"]`);
     if (currentHeadingItem) {
        currentHeadingItem.classList.add('selected');
    }

    updateSelectionUI();
}

function updateSelectionUI() {
    if (selectedSplitLine !== null) {
        selectedLineDisplay.textContent = `Line ${selectedSplitLine}`;
        extractBtn.disabled = false;
    } else {
        selectedLineDisplay.textContent = 'None';
        extractBtn.disabled = true;
    }
     // Also deselect highlights if selection is cleared
    if (selectedSplitLine === null) {
        const selectedLines = markdownContent.querySelectorAll('.line.selected');
        selectedLines.forEach(line => line.classList.remove('selected'));
        const selectedHeadings = headingsList.querySelectorAll('.heading-item.selected');
        selectedHeadings.forEach(item => item.classList.remove('selected'));
    }
}

function scrollToLine(lineNumber) {
    const lineElement = markdownContent.querySelector(`.line[data-line="${lineNumber}"]`);
    if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// --- Progress Bar Update ---
function updateProgressBar(currentLines, originalLines) {
    originalLineCount = originalLines > 0 ? originalLines : 1; // Avoid division by zero
    currentLineCount = currentLines;
    const linesExtracted = originalLineCount - currentLineCount;
    const percentage = originalLineCount > 0 ? Math.round((linesExtracted / originalLineCount) * 100) : 0;

    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
    extractedLinesCount.textContent = linesExtracted;
    originalLinesCount.textContent = originalLineCount;

    // Show the progress section if we have an original count
    progressSection.classList.toggle('hidden', originalLineCount <= 0);
}

// --- Extracted Chapters List Update ---
function updateExtractedChaptersList() {
    // Target the list in the right sidebar
    extractedChaptersListRight.innerHTML = ''; // Clear list
    if (extractedChapters.length === 0) {
        extractedChaptersListRight.innerHTML = '<p>No chapters extracted yet.</p>';
        rightSidebar.classList.add('hidden'); // Hide sidebar if empty
        return;
    }
    rightSidebar.classList.remove('hidden'); // Show sidebar if not empty
    extractedChapters.forEach(filename => {
        const item = document.createElement('div');
        item.classList.add('extracted-chapter-item');
        item.textContent = filename;
        extractedChaptersListRight.appendChild(item);
    });
}


// --- Extraction Modal & Logic ---
function openExtractModal() {
    if (selectedSplitLine === null || selectedSplitLine <= 0) {
        alert('Please select a valid split line first.');
        return;
    }
    if (selectedSplitLine > currentLineCount + 1) {
         alert(`Selected split line (${selectedSplitLine}) is beyond the current content end (${currentLineCount}). Please select a valid line.`);
         return;
    }


    // Suggest a filename based on the first heading before the split line
    const lines = currentContent.split('\n');
    // Ensure split line is within bounds for slicing
    const safeSplitIndex = Math.min(selectedSplitLine - 1, lines.length);
    const contentToExtract = lines.slice(0, safeSplitIndex).join('\n');

    const firstHeadingMatch = contentToExtract.match(/^#{1,6}\s+(.+)/m);
    let suggestedName = `chapter_${extractedChapters.length + 1}.md`; // Default fallback with increment
    if (firstHeadingMatch) {
        suggestedName = firstHeadingMatch[1].trim().toLowerCase().replace(/[^a-z0-9\s_]/g, '').replace(/\s+/g, '_') + '.md';
    }

    chapterFilenameInput.value = suggestedName;
    contentPreview.textContent = contentToExtract.substring(0, 300) + (contentToExtract.length > 300 ? '...' : ''); // Show preview
    modalSplitLine.textContent = selectedSplitLine;
    modalActiveFilename.textContent = activeFilename;

    extractModal.classList.remove('hidden');
}

function closeExtractModal() {
    extractModal.classList.add('hidden');
    chapterFilenameInput.value = ''; // Clear input
    contentPreview.textContent = '';
}

async function handleExtractConfirm() {
    const outputFilename = chapterFilenameInput.value.trim();
    if (!outputFilename) {
        alert('Please enter a filename for the extracted chapter.');
        return;
    }
    if (selectedSplitLine === null) {
        alert('No split line selected.'); // Should not happen if button is enabled correctly
        return;
    }

    try {
        confirmExtractBtn.disabled = true; // Prevent double-clicks
        confirmExtractBtn.textContent = 'Extracting...';

        const response = await fetch('/extract_chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                split_line_number: selectedSplitLine,
                output_filename: outputFilename
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // Update state with remaining content and new headings from response
        currentContent = data.remaining_content;
        currentHeadings = data.headings;
        originalLineCount = data.original_line_count; // Update from backend
        currentLineCount = data.current_line_count;   // Update from backend
        extractedChapters = data.extracted_chapters; // Update from backend


        // Update UI
        renderMarkdownContent(currentContent); // This updates currentLineCount display too
        renderHeadingsList(currentHeadings);
        updateProgressBar(currentLineCount, originalLineCount); // Update progress bar
        updateExtractedChaptersList(); // Update extracted list

        selectedSplitLine = null; // Reset selection
        updateSelectionUI();

        closeExtractModal();

    } catch (error) {
        console.error('Extraction error:', error);
        alert(`Error extracting chapter: ${error.message}`);
    } finally {
         confirmExtractBtn.disabled = false;
         confirmExtractBtn.textContent = 'Confirm & Extract';
    }
}

// --- Handle Extract Remaining ---
async function handleExtractRemaining() {
    if (currentLineCount <= 0) {
        alert('No content remaining to extract.');
        return;
    }

    // Prompt for the filename for the last chapter
    const defaultName = `chapter_${extractedChapters.length + 1}_final.md`;
    const outputFilename = prompt(`Enter a filename for the final remaining chapter:`, defaultName);

    if (!outputFilename) {
        return; // User cancelled prompt
    }

     // Confirmation dialog
    if (!confirm(`Are you sure you want to extract all remaining content into "${outputFilename}" and clear the original file "${activeFilename}"? This cannot be undone.`)) {
        return;
    }

    try {
        extractRemainingBtn.disabled = true; // Disable button during processing
        extractRemainingBtn.textContent = 'Extracting...';

         const response = await fetch('/extract_remaining', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ output_filename: outputFilename })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

         // Update state with empty content and final chapter list
        currentContent = data.remaining_content; // Should be ""
        currentHeadings = data.headings; // Should be []
        originalLineCount = data.original_line_count;
        currentLineCount = data.current_line_count; // Should be 0
        extractedChapters = data.extracted_chapters;

         // Update UI
        renderMarkdownContent(currentContent);
        renderHeadingsList(currentHeadings);
        updateProgressBar(currentLineCount, originalLineCount);
        updateExtractedChaptersList();
        selectedSplitLine = null;
        updateSelectionUI();

        alert(data.message || 'Final chapter extracted successfully.');


    } catch (error) {
        console.error('Final extraction error:', error);
        alert(`Error extracting final chapter: ${error.message}`);
    } finally {
        // Keep button disabled after successful final extraction as there's nothing left.
        extractRemainingBtn.textContent = 'Extract Remaining as Last Chapter';
    }
}


// --- Run Initialization ---
initializeApp();
