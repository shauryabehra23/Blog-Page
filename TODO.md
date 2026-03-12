# Fix ReadBlogPage Like Status & Auth Issues ✅

## Steps

### 1. [✅] Update backend auth middleware

- Edit `backend/middleWares/authMw.js`
- Make `checkTokenMw` block (401) on invalid tokens like `tokenAuthMw`

### 2. [✅] Enhance frontend API error handling

- Edit `frontend/src/utils/api.js`
- Add 400 auth error handling in interceptor (clear token)

### 3. [ ] Test fixes

**To test:**

- Restart backend: `cd backend && npm start`
- Navigate to any ReadBlog page
- Check console: No more 400 \"undefined \_id\" errors
- Like button should work correctly
- Test stale token: Manually delete/edit localStorage token, reload → should redirect to /login

_Note: Image styling skipped per user request._

**Status: Code fixes complete. Restart backend and test!**
