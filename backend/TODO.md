# TODO: Add Middleware for Login and Register Validation

## Tasks

- [x] Implement `registerMw` in `backend/middleWares/authMw.js` to validate email and password format for registration.
- [ ] Implement `loginMw` in `backend/middleWares/authMw.js` to validate email format for login.
- [ ] Update `backend/routes/authRoutes.js` to apply `registerMw` to the `/register` route and `loginMw` to the `/loginAuth` route.
- [ ] Test the middleware by running the server and checking validation errors.

## Validation Rules

- **Email**: Must be a valid email format (e.g., using regex).
- **Password** (for register): At least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
