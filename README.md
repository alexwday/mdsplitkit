# ✂️ MDSplitKit: Effortless Markdown Chapter Splitting

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.6+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

<img src="docs/images/banner.png" alt="MDSplitKit Banner" width="800px"/>

**Tame your large Markdown files! Split documents into chapters with an intuitive web interface.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#%EF%B8%8F-usage) • [Why MDSplitKit?](#-why-mdsplitkit) • [Contributing](#-contributing)

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎬 Demo](#-demo)
- [🤔 Why MDSplitKit?](#-why-mdsplitkit)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Installation](#-installation)
- [⚙️ Usage](#️-usage)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)

## ✨ Features

* **⬆️ Upload & View:** Easily upload large Markdown files.
* **📄 Line-Numbered Display:** View your content with clear line numbers.
* **🖱️ Interactive Splitting:** Select the *start* of the next chapter by:
  * Clicking a line number in the code viewer.
  * Clicking a detected title in the sidebar list.
* **✂️ Incremental Extraction:** Extract content *before* your selected line into a new chapter file.
* **💾 Auto-Save Progress:** **Crucially, MDSplitKit overwrites the original uploaded file** with the *remaining* content after each split, saving your progress incrementally. No more manual copy-pasting!
* **📊 Progress Tracking:** A visual progress bar shows how much of the original file you've processed.
* **📂 Output Management:** See a list of extracted chapter filenames directly in the interface. Chapters are saved to `static/output/`.

## 🎬 Demo

<div align="center">
  <img src="docs/images/demo.png" alt="MDSplitKit Demo" width="800px"/>
  <p><em>Screenshot of the MDSplitKit interface showing loaded content and extracted chapters.</em></p>
</div>

## 🤔 Why MDSplitKit?

Working with massive Markdown documents (like textbooks, manuscripts, or extensive notes) can be cumbersome. MDSplitKit streamlines the process of breaking these down into manageable chapters or sections without needing complex scripts or manual file juggling.

**Key benefits:**
- **No coding required:** Simple web interface handles everything
- **Incremental workflow:** Split one chapter at a time, maintaining your progress
- **Visual helpers:** Detect and navigate to headings easily
- **Self-contained:** Works locally, no need for cloud services

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Markdown Parsing:** Python `markdown` library, `PyYAML` (for potential front matter)

## 📁 Project Structure

```
mdsplitkit/
├── app.py             # Main Flask application logic
├── requirements.txt   # Python dependencies
├── run.sh             # Script to setup environment and run the app
├── sample_textbook.md # Example large markdown file
├── static/            # Frontend assets (CSS, JS, Output Chapters)
│   ├── css/
│   ├── js/
│   └── output/        # Default location for extracted chapters
├── templates/
│   └── index.html     # Main HTML template
├── utils/
│   └── markdown_parser.py # Logic for parsing and splitting
├── docs/
│   └── images/        # Banner and demo images
├── .venv/             # Virtual environment (if created using script)
└── README.md          # This file
```

## 🚀 Installation

### Prerequisites

* **Python 3.6+:** Required to run the application.

### Option 1: Quick Start (Recommended)

```bash
# Clone the repository
git clone https://github.com/alexwday/mdsplitkit.git
cd mdsplitkit

# Run the setup script (creates venv and installs dependencies)
./run.sh
```

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/alexwday/mdsplitkit.git
cd mdsplitkit

# Create virtual environment
python3 -m venv .venv

# Activate the environment (macOS/Linux)
source .venv/bin/activate
# Or on Windows
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## ⚙️ Usage

1. **Activate Environment:** If not already active
   ```bash
   source .venv/bin/activate  # macOS/Linux
   # .venv\Scripts\activate   # Windows
   ```

2. **Launch the App:**
   ```bash
   python3 app.py
   ```

3. **Open in Browser:** Navigate to [http://127.0.0.1:5001/](http://127.0.0.1:5001/)

### Workflow

1. **Load:** Click "Load Markdown File" and select your `.md` file.
2. **Select Split Point:** Browse the content viewer. Click the line number (or title in the sidebar) where the *next* chapter begins.
3. **Extract:** Click "Extract Chapter". Confirm or edit the filename in the pop-up. **Read the warning about overwriting the original!** Click "Confirm & Extract".
4. **Repeat:** The app saves the chapter, **overwrites the uploaded file with the remainder**, and refreshes. Repeat steps 2-3.
5. **Stop:** Press `Ctrl+C` in the terminal when finished.

<details>
<summary><strong>📋 Example Workflow</strong></summary>

Let's say you have a large textbook in markdown format:

1. Upload `complete_textbook.md` (contains all chapters)
2. Navigate to line 78, the start of Chapter 1
3. Click "Extract Chapter" > Save as "00_introduction.md"
4. Remaining content refreshes (Chapter 1 onwards)
5. Navigate to line 145, the start of Chapter 2
6. Click "Extract Chapter" > Save as "01_chapter1.md"
7. Continue this process for all chapters
</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

* [Flask](https://flask.palletsprojects.com/) - The web framework used
* [Prism.js](https://prismjs.com/) - For syntax highlighting
* [Python Markdown](https://python-markdown.github.io/) - For markdown parsing
* All contributors who help improve this tool