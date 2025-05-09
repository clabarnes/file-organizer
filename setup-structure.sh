#!/bin/bash

# Create directories
mkdir -p .github/workflows
mkdir -p app/components
mkdir -p app/hooks
mkdir -p app/types
mkdir -p electron/icons
mkdir -p public

# Create files
touch .github/workflows/build.yml
touch app/globals.css

# Add placeholder files for empty folders
touch app/components/.gitkeep
touch app/hooks/.gitkeep
touch app/types/.gitkeep
touch electron/icons/.gitkeep
touch public/.gitkeep

echo "Folder structure created!"
