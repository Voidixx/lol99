#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Auto-install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the application  
npm start