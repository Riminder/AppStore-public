@echo off
REM CV Killer - Quick Setup Script for Windows

echo.
echo 🚀 CV Killer - Setup Script
echo ================================
echo.

REM Check Python version
python --version
echo.

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo ⬇️  Installing dependencies...
pip install -r requirements.txt

REM Setup environment
echo.
echo ⚙️  Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env file - IMPORTANT: Update with your API keys!
) else (
    echo ✓ .env file already exists
)

REM Run migrations
echo.
echo 🗄️  Running database migrations...
python manage.py migrate

REM Create superuser (optional)
echo.
set /p create_superuser="👤 Create superuser? (y/n): "
if "%create_superuser%"=="y" (
    python manage.py createsuperuser
)

echo.
echo ================================
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit .env with your API keys:
echo    - OPENCLAW_API_KEY
echo    - HRFLOW_API_KEY
echo    - HRFLOW_SOURCE_KEY
echo.
echo 2. Start the server:
echo    python manage.py runserver
echo.
echo 3. Visit http://localhost:8000
echo.
pause
