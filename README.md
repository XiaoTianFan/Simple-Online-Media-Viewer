
# Media Indexer

## Introduction

**Media Indexer** is a web application designed to manage and display a collection of media files, including images and videos. Built with Flask for the backend and vanilla JavaScript for the frontend, Media Indexer offers a user-friendly interface with robust filtering options and an automated playback feature.

## Features

- **Authentication:** Secure login system to protect your media collection.
- **Media Management:** Automatically indexes media files from specified directories.
- **Filtering:** Filter media by rating, nickname, category, and type (image/video).
- **Navigation:** Easily browse through media with Previous and Next buttons.
- **Automated Playback:** Play button to automatically cycle through images every 5 seconds and advance to the next media upon video completion.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Dynamic Updating:** Automatically updates the media index when files are added or removed from the directory.

## Getting Started

Follow these instructions to set up and run Media Indexer on your local machine.

### Prerequisites

- **Python 3.7 or higher**: Ensure that Python is installed on your system. You can download it from [here](https://www.python.org/downloads/).
- **Git**: To clone the repository. Download it from [here](https://git-scm.com/downloads).

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/media-indexer.git
   cd media-indexer
   ```

2. **Create a Virtual Environment**

   It's recommended to use a virtual environment to manage dependencies.

   ```bash
   python3 -m venv venv
   ```

3. **Activate the Virtual Environment**

   - **Windows:**

     ```bash
     venv\Scripts\activate
     ```

   - **macOS and Linux:**

     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**

   ```bash
   pip install Flask, hashlib, secrets
   ```

5. **Configure the Application**

   - **Set the Password:**

     The default password is hardcoded as `12345`. **For security reasons, it's highly recommended to change this password.**

     Open `server.py` and modify the `your_password`:

6. **Prepare the Media Directory**

   Ensure that your media files (images and videos) are placed in the sub directories in the rood dir. The application will automatically index supported media types:

   - **Image Extensions:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`
   - **Video Extensions:** `.mp4`, `.avi`, `.mov`, `.mkv`, `.flv`, `.wmv`, `.mpeg`

7. **Run the Application**

   ```bash
   python server.py
   ```

   or double clike `0_run_server.bat`

   The application will be accessible at `http://localhost:1111`.

## Usage

1. **Access the Application**

   Open your web browser and navigate to `http://localhost:1111`.

2. **Login**

   Enter the password you set in the `server.py` file to access the media gallery.

3. **Browse Media**

   - **Filters:** Use the filter options to narrow down media based on rating, nickname, category, or type.
   - **Navigation:** Use the Previous and Next buttons to navigate through the media.
   - **Automated Playback:** Click the **Play** button to start automatic cycling through images every 5 seconds and to advance to the next media item after a video finishes playing. Click **Pause** to stop autoplay.

4. **Managing Media**

   - Add or remove media files from the designated directories. The application will automatically update the media index.

## License

This project is licensed under the [MIT License]. 