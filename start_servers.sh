#!/bin/bash

# Start TurboTariff Servers Script
# This script starts both the Flask tariff server and the Next.js frontend

# Check if Python and Node.js are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Set variables
FLASK_PORT=5001
NEXTJS_PORT=3000
PROJECT_DIR=$(pwd)
VENV_DIR="$PROJECT_DIR/venv"
NEXTJS_DIR="$PROJECT_DIR/turbotariff"

# Create and activate virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    source "$VENV_DIR/bin/activate"
else
    source "$VENV_DIR/Scripts/activate"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start Flask server in the background
echo "Starting Flask tariff server on port $FLASK_PORT..."
python3 tariff_server.py &
FLASK_PID=$!

# Save Flask PID
echo $FLASK_PID > flask_server.pid

# Install Node.js dependencies and start Next.js server
echo "Installing Node.js dependencies..."
cd "$NEXTJS_DIR" || exit
npm install

echo "Starting Next.js server on port $NEXTJS_PORT..."
npm run dev &
NEXTJS_PID=$!

# Save Next.js PID
echo $NEXTJS_PID > nextjs_server.pid

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

# Print URLs
echo ""
echo "======== TurboTariff Servers Started ========"
echo "Flask Tariff Server: http://localhost:$FLASK_PORT"
echo "Next.js Frontend:   http://localhost:$NEXTJS_PORT"
echo "==========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to kill servers when script is terminated
function cleanup {
    echo "Stopping servers..."
    if [ -f "$NEXTJS_DIR/nextjs_server.pid" ]; then
        kill $(cat "$NEXTJS_DIR/nextjs_server.pid")
        rm "$NEXTJS_DIR/nextjs_server.pid"
    fi
    if [ -f "$PROJECT_DIR/flask_server.pid" ]; then
        kill $(cat "$PROJECT_DIR/flask_server.pid")
        rm "$PROJECT_DIR/flask_server.pid"
    fi
    echo "Servers stopped"
    exit 0
}

# Register the cleanup function to be called on script termination
trap cleanup SIGINT SIGTERM

# Keep script running
wait