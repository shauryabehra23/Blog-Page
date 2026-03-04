# Frontend Structure

## Folder Organization

```
src/
├── pages/                 # Page components (full page views)
│   ├── Home/             # Home page
│   ├── Login/            # Login page
│   ├── Profile/          # User profile page
│   ├── Explore/          # Browse blogs
│   └── AddBlog/          # Create new blog
├── components/           # Reusable components
│   ├── Navbar/          # Navigation bar
│   ├── Footer/          # Footer
│   └── BlogCard/        # Blog post card component
├── context/             # React Context (state management)
│   └── AuthContext.jsx  # Authentication context
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Authentication hook
│   └── useFetch.js      # Data fetching hook
├── utils/               # Utility functions and constants
│   ├── api.js           # Axios API client with interceptors
│   └── constants.js     # App-wide constants
├── assets/              # Static assets
│   └── images/          # Image files
├── App.jsx              # Root component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## File Descriptions

### Pages

- **HomePage**: Landing page with featured blogs
- **LoginPage**: User authentication
- **ProfilePage**: User profile and their blogs
- **ExplorePage**: Browse all blogs with search
- **AddBlogPage**: Create new blog posts

### Components

- **Navbar**: Navigation with responsive menu
- **Footer**: Footer with links and info
- **BlogCard**: Reusable blog post preview card

### Context & Hooks

- **AuthContext**: Global authentication state
- **useAuth**: Custom hook for authentication logic
- **useFetch**: Custom hook for API data fetching

### Utils

- **api.js**: Axios instance with API endpoints and interceptors
- **constants.js**: Constants like categories, HTTP status codes

## Getting Started

1. Install dependencies: `npm install`
2. Create `.env` file from `.env.example`
3. Update API URL if needed
4. Run dev server: `npm run dev`

## Features Ready to Implement

- ✅ Page routing structure
- ✅ Component structure
- ✅ API client setup
- ✅ Authentication context
- ✅ Custom hooks
- ✅ Responsive styling
- ⏳ Connect to backend APIs
- ⏳ Add routing library (React Router)
- ⏳ Add form validation
- ⏳ Add loading and error states

## Notes

- All components are set up without import errors
- Use `navigate()` from React Router when you add it
- API client is ready with interceptors for authentication
- Styling is basic but clean - customize as needed
