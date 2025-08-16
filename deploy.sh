#!/bin/bash

# Day Planner Deployment Script

echo "🚀 Starting Day Planner deployment..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Built files are in the 'dist' directory"
    echo ""
    echo "🌐 Deployment options:"
    echo "1. Netlify: Drag and drop the 'dist' folder to https://app.netlify.com/drop"
    echo "2. Vercel: Run 'npx vercel --prod' in this directory"
    echo "3. GitHub Pages: Push to GitHub and enable Pages in repository settings"
    echo "4. Static hosting: Upload the 'dist' folder contents to your web server"
    echo ""
    echo "🎉 Your Day Planner is ready to deploy!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi