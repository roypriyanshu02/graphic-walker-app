#!/usr/bin/env bash

# Graphic Walker Application Startup Script
# This script starts both the backend server and frontend development server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Resolve project root (one level up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs"

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

# Function to check if a port is in use (tries lsof then ss)
port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -i :"$port" >/dev/null 2>&1
        return $?
    elif command_exists ss; then
        ss -ltnp 2>/dev/null | grep -q ":$port\b" >/dev/null 2>&1
        return $?
    else
        # Can't reliably check, assume not in use
        print_warning "Neither lsof nor ss found; cannot reliably check port $port"
        return 1
    fi
}

# Function to kill processes on a port (best-effort)
kill_port() {
    local port=$1
    print_status "Stopping processes on port $port..."

    if command_exists lsof; then
        local pids
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
            sleep 1
        fi
    elif command_exists ss; then
        # Try to extract PIDs from ss output (best-effort)
        local pids
        pids=$(ss -ltnp 2>/dev/null | awk -v p=":$port" '$0 ~ p { for(i=1;i<=NF;i++) if($i ~ /pid=/) print $i }' | sed -E 's/.*pid=([0-9]+),.*/\1/' || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
            sleep 1
        fi
    else
        print_warning "No tooling available to kill processes on port $port"
    fi

    if port_in_use "$port"; then
        print_warning "Some processes on port $port may still be running"
    else
        print_success "Stopped processes on port $port"
    fi
}

# Function to install dependencies
install_dependencies() {
    local dir=$1
    local name=$2

    print_status "Checking $name dependencies in $dir..."
    if [ ! -f "$dir/package.json" ]; then
        print_error "package.json not found in $dir"
        exit 1
    fi

    # Determine package manager
    local pkg_mgr="npm"
    if [ -f "$dir/yarn.lock" ]; then
        pkg_mgr="yarn"
    fi

    # Install if node_modules is missing or package.json is newer
    if [ ! -d "$dir/node_modules" ] || [ "$dir/package.json" -nt "$dir/node_modules" ]; then
        print_status "Installing $name dependencies using $pkg_mgr..."
        (cd "$dir" && $pkg_mgr install)
        print_success "$name dependencies installed"
    else
        print_status "$name dependencies are up to date"
    fi
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    mkdir -p "$LOGS_DIR"

    if [ ! -d "$PROJECT_ROOT/server" ]; then
        print_error "Server directory not found at $PROJECT_ROOT/server"
        return 1
    fi

    local pkg_mgr="npm"
    if [ -f "$PROJECT_ROOT/server/yarn.lock" ]; then
        pkg_mgr="yarn"
    fi

    if command_exists nodemon; then
        (cd "$PROJECT_ROOT/server" && nohup $pkg_mgr run dev > "$LOGS_DIR/backend.log" 2>&1 &)
    else
        (cd "$PROJECT_ROOT/server" && nohup $pkg_mgr start > "$LOGS_DIR/backend.log" 2>&1 &)
    fi

    # Capture PID of last background process in the server directory
    sleep 0.2
    local pid
    pid=$(lsof -ti :5000 2>/dev/null || true)
    if [ -z "$pid" ]; then
        # fallback to jobs/PID scanning
        pid=$(pgrep -f "node" | head -n1 || true)
    fi
    echo "$pid" > "$LOGS_DIR/backend.pid" || true

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
    mkdir -p "$LOGS_DIR"

    if [ ! -d "$PROJECT_ROOT/client" ]; then
        print_error "Client directory not found at $PROJECT_ROOT/client"
        return 1
    fi

    local pkg_mgr="npm"
    if [ -f "$PROJECT_ROOT/client/yarn.lock" ]; then
        pkg_mgr="yarn"
    fi

    (cd "$PROJECT_ROOT/client" && nohup $pkg_mgr start > "$LOGS_DIR/frontend.log" 2>&1 &)

    sleep 0.2
    local pid
    pid=$(lsof -ti :3000 2>/dev/null || true)
    if [ -z "$pid" ]; then
        pid=$(pgrep -f "react-scripts|vite|webpack-dev-server" | head -n1 || true)
    fi
    echo "$pid" > "$LOGS_DIR/frontend.pid" || true

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

    if [ -f "$LOGS_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOGS_DIR/backend.pid")
        kill "$BACKEND_PID" 2>/dev/null || true
        rm -f "$LOGS_DIR/backend.pid"
    fi

    if [ -f "$LOGS_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOGS_DIR/frontend.pid")
        kill "$FRONTEND_PID" 2>/dev/null || true
        rm -f "$LOGS_DIR/frontend.pid"
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

    # Move to project root so relative paths work consistently
    cd "$PROJECT_ROOT"

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
    NODE_VERSION=$(node -v | sed 's/^v//' | cut -d'.' -f1)
    if [ "${NODE_VERSION:-0}" -lt 14 ]; then
        print_error "Node.js version 14+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "Prerequisites check passed"

    # Create logs directory
    mkdir -p "$LOGS_DIR"

    # Setup cleanup trap
    trap cleanup EXIT INT TERM

    # Stop any existing processes
    kill_port 5000
    kill_port 3000

    # Install dependencies
    install_dependencies "$PROJECT_ROOT/server" "backend"
    install_dependencies "$PROJECT_ROOT/client" "frontend"

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
    echo -e "  Backend: $LOGS_DIR/backend.log"
    echo -e "  Frontend: $LOGS_DIR/frontend.log"
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
