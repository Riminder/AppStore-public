#!/bin/bash

# CV Killer - Quick Setup Script

echo "🚀 CV Killer - Setup Script"
echo "================================"

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo ""
echo "⬇️  Installing dependencies..."
pip install -r requirements.txt

# Setup environment
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file - IMPORTANT: Update with your API keys!"
else
    echo "✓ .env file already exists"
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
python manage.py migrate

# Create superuser (optional)
echo ""
echo "👤 Create superuser? (y/n)"
read -r create_superuser
if [[ $create_superuser == "y" || $create_superuser == "Y" ]]; then
    python manage.py createsuperuser
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env with your API keys:"
echo "   - OPENCLAW_API_KEY"
echo "   - HRFLOW_API_KEY"
echo "   - HRFLOW_SOURCE_KEY"
echo ""
echo "2. Start the server:"
echo "   python manage.py runserver"
echo ""
echo "3. Visit http://localhost:8000"
echo ""
