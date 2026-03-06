# TODO - Fix Explore Page and Profile Picture Issues

## Issue 1: Explore Page Not Fetching Blogs

- [x] 1.1 Check ExplorePage.jsx for data handling issues
- [x] 1.2 Add better error handling and logging for debugging
- [x] 1.3 Make response handling more flexible to handle different response formats

## Issue 2: Profile Picture Not Updating

- [x] 2.1 Fix backend ProfileControllers.js - use Cloudinary storage result directly (req.file.secure_url)
- [x] 2.2 Add updateUser function to AuthContext.jsx
- [x] 2.3 Update ProfilePage.jsx to use context updateUser function
- [x] 2.4 Add re-fetch user data after profile pic update in ProfilePage.jsx
