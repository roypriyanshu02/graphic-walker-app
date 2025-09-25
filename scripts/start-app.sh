#!/bin/bash

# Graphic Walker Application Startup Script
# This script starts both the backend server and frontend development server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    print_status "Stopping processes on port $port..."
    
    if port_in_use $port; then
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
        
        if port_in_use $port; then
            print_warning "Some processes on port $port may still be running"
        else
            print_success "Stopped processes on port $port"
        fi
    else
        print_status "No processes running on port $port"
    fi
}

# Function to install dependencies
install_dependencies() {
    local dir=$1
    local name=$2
    
    print_status "Installing $name dependencies..."
    cd "$dir"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in $dir"
        exit 1
    fi
    
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm install
        print_success "$name dependencies installed"
    else
        print_status "$name dependencies are up to date"
    fi
    
    cd - > /dev/null
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    cd server
    
    # Start server in background
    if command_exists "nodemon"; then
        npm run dev > ../logs/backend.log 2>&1 &
    else
        npm start > ../logs/backend.log 2>&1 &
    fi
    
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    cd - > /dev/null
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            print_success "Backend server started on http://localhost:5000"
            return 0
        fi
        sleep 1
    done
    
    print_error "Backend server failed to start within 30 seconds"
    return 1
}

# Function to start frontend server
start_frontend() {
    print_status "Starting frontend development server..."
    cd client
    
    # Start frontend in background
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    cd - > /dev/null
    
    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend server started on http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    print_error "Frontend server failed to start within 60 seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down servers..."
    
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # Kill any remaining processes on our ports
    kill_port 5000
    kill_port 3000
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "🚀 Starting Graphic Walker Application"
    echo "========================================"
    
    # Check prerequisites
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 14+ and try again."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        print_error "Node.js version 14+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    
    # Create logs directory
    mkdir -p logs
    
    # Setup cleanup trap
    trap cleanup EXIT INT TERM
    
    # Stop any existing processes
    kill_port 5000
    kill_port 3000
    
    # Check if directories exist
    if [ ! -d "server" ]; then
        print_error "Server directory not found"
        exit 1
    fi
    
    if [ ! -d "client" ]; then
        print_error "Client directory not found"
        exit 1
    fi
    
    # Install dependencies
    install_dependencies "server" "backend"
    install_dependencies "client" "frontend"
    
    # Start backend server
    if ! start_backend; then
        print_error "Failed to start backend server"
        exit 1
    fi
    
    # Start frontend server
    if ! start_frontend; then
        print_error "Failed to start frontend server"
        exit 1
    fi
    
    # Display success message
    echo ""
    print_success "🎉 Graphic Walker Application is running!"
    echo "========================================"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:5000"
    echo -e "${GREEN}API Documentation:${NC} http://localhost:5000/"
    echo -e "${GREEN}Health Check:${NC} http://localhost:5000/health"
    echo ""
    echo -e "${YELLOW}Logs:${NC}"
    echo -e "  Backend: logs/backend.log"
    echo -e "  Frontend: logs/frontend.log"
    echo ""
    echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"
    echo ""
    
    # Wait for user interrupt
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
