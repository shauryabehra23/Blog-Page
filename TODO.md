# Task: Add Likes Functionality

## Steps to Complete:

- [x] 1. Analyze existing codebase (Blog model, Follows model, routes, controllers)
- [x] 2. Create Likes schema (similar to Follows)
- [x] 3. Add backend endpoints for toggle like and get like status
- [x] 4. Update frontend API
- [x] 5. Update ReadBlogPage to use the endpoints
- [x] 6. Test the implementation

## Notes:

- Views are already incrementing in getBlog controller - no changes needed!
- Likes schema uses unique compound index to prevent duplicate likes
- Created Likes model at backend/models/Likes.js
- Added toggleLike and getLikeStatus controllers
- Added /:id/like and /:id/like/status routes
- Updated frontend API with likeBlog and getLikeStatus functions
- Updated ReadBlogPage with AuthContext and API calls

---

# Task: Add Comment Feature

## Steps to Complete:

- [x] 1. Create Comment model at backend/models/Comment.js
- [x] 2. Create comment routes at backend/routes/commentRoutes.js
- [x] 3. Update server.js to register comment routes
- [x] 4. Add comment API methods to frontend/src/utils/api.js
- [x] 5. Update ReadBlogPage to fetch comments from API
- [x] 6. Update UI to display comments properly with author info
- [x] 7. Add comment submission with authentication

## Notes:

- Comment schema includes: content, author, blog, parentComment (for replies), likes, isEdited, timestamps
- Added indexes for efficient querying by blog and parentComment
- Backend routes:
  - GET /comments/blog/:blogId - Get comments for a blog (sorted by newest)
  - POST /comments - Create a new comment (requires auth)
  - DELETE /comments/:id - Delete a comment (requires auth, author only)
  - POST /comments/:id/like - Like/unlike a comment (requires auth)
- Frontend updates:
  - Added commentAPI with getByBlogId, create, delete, like methods
  - Updated ReadBlogPage with useEffect to fetch comments
  - Updated UI to show loading state and empty state
  - Added authentication check for commenting
  - Display author name and profile picture
