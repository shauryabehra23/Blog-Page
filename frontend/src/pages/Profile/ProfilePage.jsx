import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import { AuthContext } from "../../context/AuthContext";
import { userAPI, blogAPI } from "../../utils/api";
import { Edit2, Users, BookOpen, Loader, Heart } from "lucide-react";

export default function ProfilePage() {
  const { user: authUser, updateUser } = useContext(AuthContext);
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authoredBlogs, setAuthoredBlogs] = useState([]);
  const [collaboratingBlogs, setCollaboratingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isOwnProfile = !userId;

  // Separate published and draft blogs
  const publishedBlogs = authoredBlogs.filter(
    (blog) => blog.status === "published",
  );
  const draftBlogs = authoredBlogs.filter((blog) => blog.status === "draft");

  // Get the user ID to use for fetching blogs, relying primarily on URL or fetched user profile
  const userIdForBlogs = userId || user?._id || authUser?._id;

  // 1. Fetch User Profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        let response;
        if (isOwnProfile) {
          // This uses your auth token/cookie to get the profile, no need to wait for context!
          response = await userAPI.getProfile();
        } else {
          response = await userAPI.getById(userId);
        }
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false); // This will now correctly trigger!
      }
    };

    fetchUserProfile();
  }, [userId, isOwnProfile]); // Removed authUser from dependencies to prevent block

  // 2. Fetch authored and collaborating blogs
  useEffect(() => {
    const fetchUserBlogs = async () => {
      if (!userIdForBlogs) {
        return; // Silently wait until userIdForBlogs populates
      }

      setBlogsLoading(true);
      try {
        // Fetch authored blogs
        const authoredResponse = await blogAPI.getUserBlogs(userIdForBlogs);
        if (authoredResponse.data.success) {
          setAuthoredBlogs(authoredResponse.data.blogs || []);
        }

        // Fetch collaborating blogs (only for own profile)
        if (isOwnProfile) {
          try {
            const collabResponse =
              await blogAPI.getUserCollaboratingBlogs(userIdForBlogs);
            if (collabResponse.data.success) {
              setCollaboratingBlogs(collabResponse.data.blogs || []);
            }
          } catch (err) {
            console.error("Error fetching collaborating blogs:", err);
            setCollaboratingBlogs([]);
          }
        }
      } catch (err) {
        console.error("Error fetching user blogs:", err);
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchUserBlogs();
  }, [isOwnProfile, userIdForBlogs]);

  // 3. Handle Image Upload
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please select an image under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      const response = await userAPI.updateProfilePic(formData);

      if (response.data.success) {
        setUser((prev) => ({
          ...prev,
          profilePic: response.data.profilePic,
        }));

        if (authUser && isOwnProfile) {
          updateUser({ profilePic: response.data.profilePic });
        }
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError(
        err.response?.data?.message || "Failed to upload profile picture",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 4. Loading & Error States
  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (error && !user) {
    return (
      <div className="profile-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <p>No user data available</p>
      </div>
    );
  }

  // 5. Main Render
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="flex">
          <div className="profile-header-content">
            <img
              src={user.profilePic || "https://via.placeholder.com/150"}
              alt={user.name}
              className="profile-avatar"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
            />
            <div className="profile-info">
              <h1>{user.name}</h1>
              <p className="email">{user.email}</p>
            </div>
          </div>
          {isOwnProfile && (
            <div className="profile-header-actions flex flex-col">
              <button className="btn-edit">Edit UserName</button>
              <button
                className="btn-edit"
                onClick={triggerFileInput}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Edit Profile Picture"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <Users className="stat-icon" />
          <h3>{user.followerCount || 0}</h3>
          <p>Followers</p>
        </div>
        <div className="stat">
          <Users className="stat-icon" />
          <h3>{user.followingCount || 0}</h3>
          <p>Following</p>
        </div>
        <div className="stat">
          <Heart className="stat-icon" />
          <h3>{user.totalLikesReceived || 0}</h3>
          <p>Likes Received</p>
        </div>
      </div>

      <div className="profile-columns" style={{ marginTop: "30px" }}>
        <div className="profile-column">
          <div className="column-header">
            <BookOpen className="column-icon" />
            <h2>
              {isOwnProfile
                ? "My Published Blogs"
                : `${user.name}'s Published Blogs`}
            </h2>
          </div>
          {blogsLoading ? (
            <div className="blogs-placeholder">
              <Loader className="loading-spinner" />
              <p>Loading blogs...</p>
            </div>
          ) : publishedBlogs.length === 0 ? (
            <div className="blogs-placeholder">
              <BookOpen className="placeholder-icon" />
              <p>No published blogs yet</p>
            </div>
          ) : (
            <div className="blogs-rows">
              {publishedBlogs.map((blog) => (
                <div key={blog._id} className="blog-row">
                  <div
                    className="blog-row-content"
                    onClick={() => navigate(`/read/${blog._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <h3>{blog.title}</h3>
                    <p className="blog-meta">
                      {blog.createdAt &&
                        new Date(blog.createdAt).toLocaleDateString()}
                      {blog.sections?.length > 0 &&
                        ` • ${blog.sections.length} sections`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="profile-column">
            <div className="column-header">
              <BookOpen className="column-icon" />
              <h2>My Drafts</h2>
            </div>
            {blogsLoading ? (
              <div className="blogs-placeholder">
                <Loader className="loading-spinner" />
                <p>Loading drafts...</p>
              </div>
            ) : draftBlogs.length === 0 ? (
              <div className="blogs-placeholder">
                <BookOpen className="placeholder-icon" />
                <p>No drafts yet</p>
              </div>
            ) : (
              <div className="blogs-rows">
                {draftBlogs.map((blog) => (
                  <div key={blog._id} className="blog-row">
                    <div
                      className="blog-row-content"
                      onClick={() => navigate(`/read/${blog._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <h3>{blog.title}</h3>
                      <p className="blog-meta">
                        {blog.createdAt &&
                          new Date(blog.createdAt).toLocaleDateString()}
                        {blog.sections?.length > 0 &&
                          ` • ${blog.sections.length} sections`}
                      </p>
                    </div>
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/author-edit/${blog._id}`);
                      }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isOwnProfile && (
          <div className="profile-column">
            <div className="column-header">
              <Users className="column-icon" />
              <h2>Collaborating On</h2>
            </div>
            {blogsLoading ? (
              <div className="blogs-placeholder">
                <Loader className="loading-spinner" />
                <p>Loading collaborations...</p>
              </div>
            ) : collaboratingBlogs.length === 0 ? (
              <div className="blogs-placeholder">
                <Users className="placeholder-icon" />
                <p>No collaborations yet</p>
              </div>
            ) : (
              <div className="blogs-rows">
                {collaboratingBlogs.map((blog) => {
                  console.log(
                    "Collab blog:",
                    blog.title,
                    "mySection:",
                    blog.mySection,
                  );
                  return (
                    <div key={blog._id} className="blog-row">
                      <div
                        className="blog-row-content"
                        onClick={() => navigate(`/read/${blog._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <h3>{blog.title}</h3>
                        <p className="blog-meta">
                          {blog.createdAt &&
                            new Date(blog.createdAt).toLocaleDateString()}
                          {blog.mySection && blog.mySection.sectionTitle && (
                            <>
                              {" • Section: "}
                              <span className="section-badge">
                                {blog.mySection.sectionTitle}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/collab-edit/${blog._id}/${blog.mySection?.sectionId}`,
                          );
                        }}
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
