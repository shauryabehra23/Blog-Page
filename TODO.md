# Blog Storage Issues - Fix Plan

## Issues Identified:

### 1. ReadBlogPage.jsx - Missing Image Extension

- Error: "Unknown node type: image"
- Fix: Add Image extension to generateHTML extensions array ✅ FIXED

### 2. ReadBlogPage.jsx - Plain String Content Not Handled

- Error: "Unexpected tokenhttps://re' 'h', '... is not valid JSON"
- Fix: Handle both string and object content formats ✅ FIXED

### 3. AddBlogPage.jsx - Images Not Being Uploaded to Cloudinary

- Evidence: contentImages in database contains "blob:http://localhost:5173/..."
- Root cause: Upload is failing silently or URL replacement isn't working
- Fix: Added comprehensive logging to trace the issue

## Implementation Steps:

### Step 1: Fix ReadBlogPage.jsx ✅ COMPLETED

- [x] Add Image extension import from @tiptap/extension-image
- [x] Add Image extension to generateHTML extensions array
- [x] Handle plain string content (for Postman/manual entry)
- [x] Display string content as image if it's a URL, otherwise as plain text

### Step 2: Add Logging to AddBlogPage.jsx ✅ COMPLETED

- [x] Added console.log for upload responses
- [x] Added console.log for image ID to URL mapping
- [x] Added console.log for content replacement process

### Step 3: Testing Required

- [ ] Test by creating a new blog with images through the UI
- [ ] Check browser console for upload logs
- [ ] Verify images are stored with Cloudinary URLs in the database
