# CV Killer - AI Sourcing Agent

> Intelligent AI-powered recruitment sourcing agent that finds candidate profiles across public web sources using OpenClaw and HrFlow.ai APIs.

## 🎯 What it does

CV Killer automates the candidate sourcing process by:
1. **Accepts job offers** - Upload job descriptions through a simple web interface
2. **Intelligent web scraping** - Uses OpenClaw to intelligently scrape public CV databases, LinkedIn profiles, GitHub portfolios, and other professional platforms
3. **Candidate parsing** - HrFlow.ai API parses raw CVs into standardized profiles
4. **Smart scoring** - Automatically scores and ranks candidates based on job requirements
5. **User feedback loop** - Captures recruiter feedback to refine results

## 🏗️ Architecture

```
apx-cv-killer/
├── assets/
│   ├── manage.py                 # Django management command
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example             # Environment variables template
│   ├── cv_killer/               # Django project settings
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # URL routing
│   │   └── wsgi.py              # WSGI application
│   ├── sourcing/                # Main Django app
│   │   ├── models.py            # Database models
│   │   ├── views.py             # Request handlers
│   │   ├── services.py          # Business logic (Openclaw, HrFlow)
│   │   ├── admin.py             # Django admin configuration
│   │   └── urls.py              # App URL routes
│   └── templates/               # HTML templates
│       ├── base.html            # Base template
│       └── sourcing/
│           ├── index.html       # Upload & search
│           ├── results.html     # Ranked results
│           └── candidate_detail.html  # Individual profile
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip or poetry
- API Keys:
  - OpenClaw API key
  - HrFlow.ai API key and source key

### Installation

1. **Navigate to the assets folder:**
```bash
cd apx-cv-killer/assets
```

2. **Create a virtual environment:**
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Setup environment variables:**
```bash
cp .env.example .env
# Then edit .env with your API keys and settings
```

5. **Run migrations:**
```bash
python manage.py migrate
```

6. **Create a superuser (optional, for admin access):**
```bash
python manage.py createsuperuser
```

7. **Start the development server:**
```bash
python manage.py runserver
```

The app will be available at `http://localhost:8000`

## 📊 Database Models

### JobOffer
Stores uploaded job descriptions and metadata
- `title`: Job position title
- `description`: Full job description
- `file`: Optional uploaded file (PDF/TXT/DOCX)
- `created_at`, `updated_at`: Timestamps

### SearchSession
Tracks the sourcing workflow for each job offer
- `job_offer`: Foreign key to JobOffer
- `status`: pending → running → completed/failed
- `search_query`: Extracted search terms
- `openclaw_results_count`: Number of profiles found

### CandidateProfile
Stores candidate profiles scraped from web sources
- `search_session`: Reference to search
- `source_url`: Profile URL
- `source_name`: Platform (LinkedIn, GitHub, etc.)
- `candidate_name`: Candidate's name
- `raw_data`: Raw profile data from OpenClaw

### CandidateScore
HrFlow scoring and user feedback
- `candidate`: OneToOne with CandidateProfile
- `hrflow_score`: Numerical score (0-100)
- `match_percentage`: Match to job requirements
- `skills_match`: JSON of matched skills
- `user_feedback`: Recruiter feedback (relevant/maybe/irrelevant)

## 🔌 API Integration

### OpenClaw Integration

The `OpenclawService` class in `sourcing/services.py` handles web scraping:

```python
openclaw = OpenclawService()
results = openclaw.search_profiles(query, search_session)
```

**TODO:** Implement actual API endpoint calls. Currently has placeholder implementation.

**Expected response:**
```json
{
  "results": [
    {
      "url": "https://...",
      "source": "linkedin",
      "name": "John Doe",
      "...": "raw profile data"
    }
  ]
}
```

### HrFlow.ai Integration

The `HrFlowService` class handles parsing and scoring:

```python
hrflow = HrFlowService()

# Parse raw profile
parsed = hrflow.parse_profile(raw_data)

# Score candidate against job
score = hrflow.score_candidate(job_description, parsed_profile)
```

**TODO:** Implement actual HrFlow API calls. Check HrFlow documentation for endpoints and parameters.

## 🎨 Frontend Pages

### 1. Upload Page (`/`)
- Simple form to upload job offer
- Drag & drop file upload
- Shows recent search history
- Real-time statistics

### 2. Results Page (`/search/<id>/`)
- Ranked table of candidates
- Live search status indicator
- Match percentage visualization
- One-click feedback submission
- Automatic refresh while processing

### 3. Candidate Detail (`/candidate/<id>/`)
- Full candidate profile view
- HrFlow score breakdown
- Matched skills display
- Direct link to source profile
- Feedback submission

## ⚙️ Configuration

Edit `.env` file to configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key (change in production) |
| `DEBUG` | Yes | Debug mode (set to False in production) |
| `OPENCLAW_API_KEY` | Yes | OpenClaw API authentication |
| `OPENCLAW_BASE_URL` | Yes | OpenClaw API endpoint |
| `HRFLOW_API_KEY` | Yes | HrFlow.ai API key |
| `HRFLOW_SOURCE_KEY` | Yes | HrFlow.ai source ID |
| `HRFLOW_BASE_URL` | Yes | HrFlow.ai API endpoint |
| `MAX_RESULTS` | No | Max candidates to process (default: 10) |
| `ALLOWED_HOSTS` | No | Comma-separated list of allowed domains |

## 🔄 Workflow

1. User uploads job offer on frontend
2. Backend creates `JobOffer` and `SearchSession` objects
3. `SourcingService` starts in background thread:
   - Extracts search query from job description
   - Calls OpenClaw API to search for profiles
   - For each result:
     - Creates `CandidateProfile` entry
     - Parses profile using HrFlow
     - Scores candidate against job requirements
     - Stores score in `CandidateScore`
4. Frontend displays results ranked by score
5. Recruiter can provide feedback for refinement

## 👥 Admin Interface

Access Django admin at `/admin/`:
- View all job offers and search sessions
- Inspect candidate profiles and scores
- Monitor search status and errors

## 🛠️ Development

### Run tests:
```bash
python manage.py test
```

### Create database migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Django shell:
```bash
python manage.py shell
```

## 📝 Next Steps for Hackathon

1. **Implement OpenClaw API calls** - Replace placeholders in `OpenclawService`
2. **Implement HrFlow API calls** - Add actual API integration in `HrFlowService`
3. **Add NLP for job parsing** - Improve `_extract_search_query()` method
4. **Add more sources** - Extend the web scraping to more platforms
5. **Implement caching** - Cache search results to improve performance
6. **Add analytics dashboard** - Show sourcing metrics and insights
7. **Deploy to production** - Use Gunicorn + PostgreSQL for production

## 🚀 Deployment

### Local Production Build:
```bash
python manage.py collectstatic --noinput
gunicorn cv_killer.wsgi:application --bind 0.0.0.0:8000
```

### Environment for Production:
```env
SECRET_KEY=generate-a-strong-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost/dbname
```

## 📚 Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [OpenClaw API Documentation](https://api.openclaw.io/docs)
- [HrFlow.ai API Documentation](https://api.hrflow.ai/docs)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)

## 💡 API Endpoints

- `GET /` - Upload page
- `POST /` - Submit job offer
- `GET /search/<id>/` - View search results
- `POST /candidate/<id>/feedback/` - Submit feedback
- `GET /candidate/<id>/` - View candidate details
- `GET /session/<id>/status/` - Check search status (JSON)

## 🏆 Team

Built for Hackathon - CV Killer Team

---

**Good luck with your hackathon! 🚀**
