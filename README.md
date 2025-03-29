# Patient Timeline

A minimal, Git-inspired web application for tracking a patient's medical encounters over time. Each medical encounter (.med file) is treated like a "commit" in the patient's medical history, providing a clear timeline of diagnoses and medical conducts.

## Installation

### Prerequisites
- Python 3.8+
- Modern web browser
- Git (for cloning the repository)

### Local Installation

1. **Clone the Repository**
   ```
   git clone https://github.com/yourusername/patient-timeline.git
   cd patient-timeline
   ```

2. **Set Up a Virtual Environment**
   ```
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```
   pip install -r requirements.txt
   ```

4. **Run the Application**
   ```
   python app.py
   ```
   
   Access it at `http://127.0.0.1:5000`

## Usage

### View Timeline
The application automatically loads all available patient encounters in chronological order. The most recent patient information is displayed in the header.

### Add New Encounters

#### Upload .med Files
1. Click the "Upload .med Files" button
2. Select one or more .med files from your computer
3. The timeline will automatically update with the new encounters

#### Fetch from API
1. Click the "Fetch from API" button
2. The application will connect to the Neurology Patient Management System API
3. New encounters will be fetched and added to the timeline

### View Encounter Details
1. Click on any encounter in the timeline
2. The side panel will display detailed information about the encounter
3. Use the "Download .med file" button to save the raw .med file

## .med File Format
Encounters are stored as `.med` files in JSON format:
```json
{
  "name": "pat1",
  "age": "74",
  "sex": "male",
  "diagnosis": "Parkinson's Disease",
  "medical_conducts": {
    "prescriptions": ["Levodopa/Carbidopa"],
    "exam_requests": ["Magnetic Resonance Imaging (MRI) Brain"],
    "referrals": ["Physical Medicine and Rehabilitation (PM&R)"]
  },
  "timestamp": "2025-03-27T23:15:40.336957Z"
}
```

## Deployment on Render.com

1. **Push to GitHub**: Ensure your repository is on GitHub.
2. **Create a Web Service**:
   - Log in to [Render.com](https://render.com), click "New +", and select "Web Service".
   - Connect your GitHub repository.
3. **Configure the Service**:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment Variables**: Add `FLASK_ENV=production` for production mode.
4. **Deploy**: Click "Create Web Service" and wait for deployment. Your app will be live at a URL like `https://your-app.onrender.com`.

## Customization

### Add New Fields
To add new fields to the patient records:
1. Update the parsing logic in `app.py`
2. Modify the timeline display in `main.js`
3. Update the detail view in the `showEncounterDetails` function

### Change API Source
To connect to a different API source:
1. Modify the `fetch_from_api` function in `app.py` with the new URL
2. Update the parsing logic to match the new data format

## License
MIT License - See LICENSE file for details. Features

- **Timeline Visualization**: View all patient encounters in chronological order
- **Multiple Input Sources**:
  - Upload individual or multiple .med files
  - Fetch data from an external API (Neurology Patient Management System)
- **Detailed View**: Click on any encounter to see full details
- **Responsive Design**: Works on desktop and mobile devices
- **Easy Deployment**: Ready to deploy on Render.com or local environments

##
