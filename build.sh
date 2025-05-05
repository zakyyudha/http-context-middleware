#!/bin/bash
set -e

echo "=== HTTP Context Middleware Build Script ==="
echo "Cleaning dist directory..."
rm -rf dist

echo "Checking TypeScript installation..."
npx tsc --version

echo "Checking tsconfig.json..."
cat tsconfig.json

echo "Checking for duplicate exports..."
grep -r "export default" src/

echo "Compiling TypeScript..."
npx tsc --listEmittedFiles

# Check if compilation succeeded
if [ $? -eq 0 ]; then
  echo "Compilation successful!"
  echo "Output files:"
  ls -la dist/

  # Add .mjs extension handling for ESM compatibility
  echo "Updating package.json for ESM output..."
  cat > dist/package.json << EOF
{
  "type": "module"
}
EOF

  echo "Running tests..."
  npm test
else
  echo "Compilation failed. See errors above."
  exit 1
fi
