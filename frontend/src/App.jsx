import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
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
import { AuthContext } from "./context/AuthContext";
import "./App.css";

function App() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />
            }
          />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/read/:blogId" element={<ReadBlogPage />} />
          <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
          <Route
            path="/add-blog"
            element={
              isAuthenticated ? <AddBlogPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/author-edit/:blogId"
            element={
              isAuthenticated ? <AuthorEditPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/collab-edit/:blogId/:sectionId"
            element={
              isAuthenticated ? (
                <CollaboratorEditPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
