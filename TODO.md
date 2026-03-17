# Accept Invite Fix TODO

## Steps:

- [x] Step 1: Create `frontend/src/pages/AcceptInvite/AcceptInvitePage.jsx` with useEffect API call
- [x] Step 2: Edit `frontend/src/App.jsx` to add route `/accept-invite/:token`
- [ ] Step 3: Test by sending invite and clicking link

Current: ✅ Steps 1-2 complete. Ready for Step 3: Test.

To test:

1. Ensure backend running: cd backend && npm start (should mount /api/collaborator)
2. Frontend: cd frontend && npm run dev
3. From AddBlogPage, send invite to your email/other.
4. Click link in email: should hit AcceptInvitePage, call API, show success/redirect.
