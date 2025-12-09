# Git Commands to Push Project to GitHub
# Run these commands in PowerShell after installing Git

# 1. Navigate to project directory
cd "d:\Rumeth Jayasinghe\Semester 6\6) 40_COE3012_Computer System Engineering\Assignment"

# 2. Configure Git (first time only)
git config --global user.name "rumethnadawa"
git config --global user.email "your-email@example.com"

# 3. Initialize Git repository
git init

# 4. Add all files to staging
git add .

# 5. Create first commit
git commit -m "Initial commit: Smart Fire Detection System with ML, Firebase, and ThingSpeak integration"

# 6. Set main branch
git branch -M main

# 7. Add remote repository
git remote add origin https://github.com/rumethnadawa/Fire-Detection.git

# 8. Push to GitHub
git push -u origin main

# Note: You may be prompted to authenticate with GitHub
# Use your GitHub username and Personal Access Token (not password)
