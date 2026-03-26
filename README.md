# Quill & Ray Blog Platform

A full-stack blog application built with **React** (Frontend) and **Node.js/Express** (Backend), featuring collaborative editing, user authentication, and rich content management with **Cloudinary** integration.

---

## 🎯 Project Overview

Quill & Ray is a modern blogging platform that enables users to create, read, edit, and collaborate on blog posts. The platform supports role-based access control, allowing blog authors to invite collaborators to edit specific sections of their blogs.

**Key Features:**

- 📝 Rich text editor with Tiptap
- 👥 Multi-user collaboration with role-based access
- 🖼️ Image management via Cloudinary
- 🔐 JWT-based authentication
- 💬 Comment system
- ❤️ Like/Follow functionality
- 📱 Responsive design with Tailwind CSS

---

## 🎯 Strategic Decisions

### 1. **Section-Based Collaboration (vs Real-Time Editing)**

- **Decision:** Authors own their blogs; collaborators edit assigned sections only
- **Why:** WebSocket-based real-time collaboration risks data loss — collaborators could accidentally erase the author's work due to conflict resolution issues
- **Benefit:** Clear ownership, reduced conflict, author maintains full control

### 2. **JWT Authentication (vs Session-Based)**

- **Decision:** Stateless JWT tokens over server-side sessions
- **Benefit:** Scalability, no session storage needed, works seamlessly with frontend token storage

### 3. **Tiptap Editor**

- **Decision:** Chose Tiptap over other rich text editors
- **Why:** Popular, well-maintained, lightweight, extensive documentation

### 4. **Brevo API (Email Service)**

- **Decision:** HTTP API instead of SMTP/traditional email
- **Why:**
  - No domain setup needed
  - No subscription/server configuration required
  - Simple HTTP calls via Axios
  - No conflicts with other email packages
- **Note:** Previous setup had unused Resend/Nodemailer — Brevo kept this clean

### 5. **React + Vite (vs Next.js)**

- **Decision:** React with Vite for frontend
- **Why:** Next.js not in current stack; planned for future phases when needed for SSR/static generation
- **Current Focus:** Fast development with Vite, clear React component structure

### 6. **Cloudinary for Images (vs Local Storage / AWS S3)**

- **Decision:** Cloudinary for image storage
- **Why:**
  - Local storage would be deleted on server restart
  - AWS S3 overkill for just blog images (unnecessary complexity/cost)
  - Cloudinary provides: CDN delivery, image optimization, easy integration
- **Trade-off:** External dependency for images, but minimal operational overhead

### 7. **MongoDB (NoSQL)**

- **Decision:** MongoDB for flexible schema storage
- **Benefit:** Blog structure with sections, tags, and nested data maps naturally to documents
- **Scaling:** Can evolve schema as features grow without migrations

---

## 📁 Project Structure

```
Blog-Page/
├── backend/
│   ├── config/              # Configuration files (Cloudinary, Multer)
│   ├── controllers/         # Business logic
│   ├── DB/                  # Database connection
│   ├── helpers/             # Utility helpers
│   ├── middleWares/         # Express middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── server.js            # Express server entry point
│   ├── package.json
│   └── .env                 # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── context/         # React Context (Auth)
    │   ├── hooks/           # Custom React hooks
    │   ├── utils/           # Utility functions
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

---

## 🔧 Tech Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (jsonwebtoken)
- **Email Service:** Brevo API
- **File Storage:** Cloudinary
- **File Upload:** Multer
- **Encryption:** bcrypt
- **HTTP Client:** Axios

### Frontend

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS
- **Rich Editor:** Tiptap
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Router:** React Router

---

## 📦 Installation

### Backend Setup

```bash
cd backend
npm install
```

**Environment Variables** (.env):

```
MONGO_URL=your_mongodb_url
SECRET_KEY=your_secret_key
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd frontend
npm install
```

---

## 🚀 Running the Project

### Development Mode

**Backend:**

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

**Frontend:**

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

### Production Build

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
```

---

## 📡 API Routes

### Authentication (`/auth`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Blogs (`/blogs`)

- `GET /blogs` - Fetch all blogs
- `GET /blogs/:id` - Fetch single blog
- `GET /blogs/:id/edit-access` - Get blog for editing (role-based)
- `POST /blogs` - Create new blog
- `PUT /blogs/:id` - Update blog
- `DELETE /blogs/:id` - Delete blog

### Collaborators (`/collaborator`)

- `POST /collaborator/invite` - Send collaboration invites
- `POST /collaborator/accept/:token` - Accept invite
- `GET /collaborator/pending` - Get pending invites

### Comments (`/comments`)

- `POST /comments` - Create comment
- `GET /comments/:blogId` - Fetch blog comments
- `DELETE /comments/:id` - Delete comment

### Profile (`/profile`)

- `GET /profile/:userId` - Get user profile
- `PUT /profile/:userId` - Update user profile

---

## 🔐 Authentication Flow

1. User registers/logs in via `/auth/register` or `/auth/login`
2. Server returns JWT token
3. Token stored in localStorage (frontend)
4. Subsequent requests include token in Authorization header
5. Backend validates token via `checkTokenMw` middleware

---

## 👥 Collaboration System

### How It Works:

1. **Blog Author** creates sections in their blog
2. **Author** invites collaborators by email for specific sections
3. **Brevo API** sends invitation emails with accept links
4. **Collaborator** clicks link and accepts the invite
5. **Collaborator** can edit only their assigned section
6. **Role-based access** enforced on backend

### Role Permissions:

| Action                | Author | Collaborator |
| --------------------- | ------ | ------------ |
| View Blog             | ✅     | ✅           |
| Edit Full Blog        | ✅     | ❌           |
| Edit Assigned Section | ✅     | ✅           |
| Manage Sections       | ✅     | ❌           |
| Delete Blog           | ✅     | ❌           |

---

## 🖼️ Frontend Pages

- **Login/Register** - Authentication pages
- **Home** - Discover featured blogs
- **Explore** - Browse all blogs
- **Profile** - User profile & settings
- **Read Blog** - View blog content with comments & likes
- **Add Blog** - Create new blog
- **Edit Blog** - Edit blog (author only) or section (collaborator)
- **Accept Invite** - Accept collaboration invites

---

## 📧 Email Service (Brevo)

Brevo is used for sending collaboration invitation emails.

**Features:**

- HTML-formatted emails with styling
- Accept invite button with token-based link
- Reply-to blog owner
- 30-day invite expiration

---

## 🛠️ Key Controllers

### authControllers.js

- User registration & authentication
- Password hashing with bcrypt
- JWT token generation

### blogControllers.js

- CRUD operations for blogs
- Blog search & filtering
- Role-based edit access

### collaboratorControllers.js

- Manage collaboration invites
- Send invites via Brevo API
- Handle invite acceptance

### ProfileControllers.js

- User profile management
- Avatar updates

---

## 🔄 Data Models

### User

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String (URL),
  bio: String,
  followers: [User],
  following: [User]
}
```

### Blog

```javascript
{
  title: String,
  category: String,
  tags: [String],
  coverImage: String (URL),
  author: User,
  sections: [{
    sectionId: String,
    sectionTitle: String,
    content: String,
    seqNo: Number
  }],
  likes: Number,
  comments: [Comment],
  createdAt: Date,
  updatedAt: Date
}
```

### CollaboratorBlog

```javascript
{
  blog: Blog,
  collaboratorEmail: String,
  sectionId: String,
  sectionTitle: String,
  user: User (blog author),
  inviteToken: String,
  status: 'pending' | 'accepted' | 'rejected',
  expiresAt: Date
}
```

---

## 📝 Environment Variables

### Backend (.env)

```
MONGO_URL=                    # MongoDB connection string
SECRET_KEY=                   # JWT secret key
BREVO_API_KEY=               # Brevo email service API key
EMAIL_USER=                  # Sender email address
EMAIL_PASS=                  # Email account password
CLOUDINARY_CLOUD_NAME=       # Cloudinary cloud name
CLOUDINARY_API_KEY=          # Cloudinary API key
CLOUDINARY_API_SECRET=       # Cloudinary API secret
FRONTEND_URL=                # Frontend URL for invite links
```

---

## 🚀 Deployment

### Backend (Node.js)

- Deploy to Heroku, Render, or Railway
- Set environment variables on platform
- Start command: `npm start`

### Frontend (React)

- Build: `npm run build`
- Deploy to Vercel, Netlify, or GitHub Pages
- Update `FRONTEND_URL` in backend for production

---

## 📚 Key Features Details

### Rich Text Editing

- Powered by Tiptap
- Formatting toolbar (bold, italic, links, etc.)
- Character/word count
- Image upload support

### Image Management

- Cloudinary integration for image storage
- Drag-and-drop upload
- Cover image preview
- Responsive image delivery

### Authentication & Security

- Password hashing with bcrypt
- JWT tokens with 24h expiration
- Protected routes with middleware
- CORS enabled for security

---

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**

- Verify `MONGO_URL` in `.env`
- Check MongoDB cluster credentials
- Ensure IP is whitelisted in MongoDB Atlas

**Email Not Sending**

- Verify `BREVO_API_KEY` is valid
- Check `EMAIL_USER` is configured
- Ensure recipient email is correct

**Image Upload Failed**

- Verify Cloudinary credentials
- Check file size limits
- Ensure multer configuration is correct

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👤 Author

**Shaurya Behra**

- GitHub: [@shaurya-behra](https://github.com/shaurya-behra)

---

## 🙏 Acknowledgments

- [Tiptap](https://tiptap.dev/) - Rich text editor
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Cloudinary](https://cloudinary.com/) - Image management
- [Brevo](https://www.brevo.com/) - Email service
- [Vite](https://vitejs.dev/) - Frontend build tool

---

**Last Updated:** March 26, 2026
