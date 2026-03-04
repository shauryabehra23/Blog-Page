import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Login/LoginPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import ExplorePage from "./pages/Explore/ExplorePage";
import AddBlogPage from "./pages/AddBlog/AddBlogPage";
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
          <Route path="/explore" element={<ExplorePage />} />
          <Route
            path="/add-blog"
            element={
              isAuthenticated ? <AddBlogPage /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
