import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Login/LoginPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import ExplorePage from "./pages/Explore/ExplorePage";
import AddBlogPage from "./pages/AddBlog/AddBlogPage";
import ReadBlogPage from "./pages/ReadBlog/ReadBlogPage";
import AcceptInvitePage from "./pages/AcceptInvite/AcceptInvitePage";
import AuthorEditPage from "./pages/AuthorEdit/AuthorEditPage";
import CollaboratorEditPage from "./pages/CollaboratorEdit/CollaboratorEditPage";
import { ProtectedRoute, AuthRoute } from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute component={<HomePage />} fallback="/login" />
            }
          />
          <Route
            path="/login"
            element={<AuthRoute component={<LoginPage />} fallback="/" />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute component={<ProfilePage />} fallback="/login" />
            }
          />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/read/:blogId" element={<ReadBlogPage />} />
          <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
          <Route
            path="/add-blog"
            element={
              <ProtectedRoute component={<AddBlogPage />} fallback="/login" />
            }
          />
          <Route
            path="/author-edit/:blogId"
            element={
              <ProtectedRoute
                component={<AuthorEditPage />}
                fallback="/login"
              />
            }
          />
          <Route
            path="/collab-edit/:blogId/:sectionId"
            element={
              <ProtectedRoute
                component={<CollaboratorEditPage />}
                fallback="/login"
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
