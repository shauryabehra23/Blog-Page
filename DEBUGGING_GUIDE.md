# Blog Display Debugging Guide

## Quick Test Steps

### 1. Check if blogs exist in database

Open browser console and run:

```javascript
fetch("http://localhost:3000/blogs/debug/all-blogs")
  .then((r) => r.json())
  .then((d) => console.log("Total blogs in DB:", d.count, "\nBlogs:", d.blogs));
```

**Expected**: Shows count > 0 with blog list

---

### 2. Verify your userId in localStorage

```javascript
const user = JSON.parse(localStorage.getItem("user"));
console.log("Your userId:", user._id);
console.log("Your email:", user.email);
```

**Expected**: Shows a valid ObjectId like `674abc123def456789ghijk`

---

### 3. Test the getUserBlogs endpoint

```javascript
const user = JSON.parse(localStorage.getItem("user"));
fetch(`http://localhost:3000/blogs/user/${user._id}`)
  .then((r) => r.json())
  .then((d) => console.log("Authored blogs:", d));
```

**Expected**: Returns `{ success: true, blogs: [...], count: X }`

---

### 4. Test the getUserCollaboratingBlogs endpoint

```javascript
const user = JSON.parse(localStorage.getItem("user"));
fetch(`http://localhost:3000/blogs/user/${user._id}/collaborating`)
  .then((r) => r.json())
  .then((d) => console.log("Collaborating blogs:", d));
```

**Expected**: Returns `{ success: true, blogs: [...], count: X }`

---

### 5. Check browser console for errors

Look for these specific logs in ColorLog:

- `[PROFILE] Fetching blogs for user: ...` should appear
- `[PROFILE] Authored blogs: X` should show count
- `[PROFILE] Collaborating blogs: X` should show count

If these don't appear, the fetch never happened.

---

## Backend Logs

Start server with debug output:

```bash
npm run dev  # Check console output
```

Look for these log patterns:

- `[GET USER BLOGS] Fetching blogs for author: USERID`
- `[GET USER BLOGS] Found: X blogs`
- `[GET COLLAB BLOGS] Searching by collaborator email: EMAIL@example.com`

---

## Common Issues & Fixes

### ❌ Issue: "No blogs yet" / "Not collaborating on any blogs yet"

**Cause**: Either no blogs exist, or userId doesn't match author field

**Fix**:

1. Create a new blog first (go to /add-blog)
2. Verify blog was created: Check `/debug/all-blogs`
3. If blog exists but doesn't show on profile:
   - Compare the `author` field in DB with your userId from localStorage
   - If they don't match, there's a data mismatch

### ❌ Issue: API returns 400 error

**Cause**: Backend error, check server logs

**Fix**:

1. Look at server console for error message
2. Check NetworkTab in DevTools to see error response

### ❌ Issue: userId is different format

**Cause**: userId stored in different format (string vs ObjectId)

**Fix**:

1. Verify userId format matches what MongoDB uses
2. In schema, author is `ObjectId` - backend should handle string->ObjectId conversion automatically

---

## Data Flow Verification

### Creating a Blog

1. ✅ Go to `/add-blog`
2. ✅ Fill form and submit
3. ✅ Blog created with `author: [YOUR_ID]`
4. ✅ Sections stored in blog document
5. ✅ Collaborators invited (if any)

### Viewing Own Profile

1. ✅ Navigate to `/profile` (no userId param = own profile)
2. ✅ useEffect runs with `userIdForBlogs = authUser._id`
3. ✅ Calls `blogAPI.getUserBlogs(userIdForBlogs)`
4. ✅ Backend searches `Blog.find({ author: userIdForBlogs })`
5. ✅ Returns blogs where YOU are the author

---

## Still Not Working?

1. **Check if authUser.\_id is loaded**:
   - Add breakpoint in ProfilePage useEffect
   - Verify `userIdForBlogs` is not undefined

2. **Check MongoDB directly**:
   - Connect to MongoDB Compass
   - Look at `blogs` collection
   - Verify your userId matches `author` field exactly

3. **Check network requests**:
   - Open DevTools → Network tab
   - Filter for `/blogs/user/`
   - Check if request was made
   - Check response status and data
