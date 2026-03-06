import { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import "./ProfilePage.css";
import { AuthContext } from "../../context/AuthContext";
import { userAPI } from "../../utils/api";

export default function ProfilePage() {
  const { user: authUser, updateUser } = useContext(AuthContext);
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isOwnProfile = !userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        let response;
        if (isOwnProfile) {
          // Fetch current user's profile
          response = await userAPI.getProfile();
        } else {
          // Fetch another user's profile
          response = await userAPI.getById(userId);
        }
        setUser(response.data);
        console.log(user.profilePic);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
        // Fallback to auth user data if API fails for own profile
        if (isOwnProfile && authUser) {
          setUser({
            name: authUser.name,
            email: authUser.email,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, isOwnProfile, authUser]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.",
      );
      return;
    }

    // Validate file size (5MB max)
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
        // Update local user state with new profile pic
        setUser((prev) => ({
          ...prev,
          profilePic: response.data.profilePic,
        }));

        // Update AuthContext with new profile pic
        if (authUser && isOwnProfile) {
          updateUser({ profilePic: response.data.profilePic });
        }

        // Re-fetch user data to ensure we have the latest data
        if (isOwnProfile) {
          const profileResponse = await userAPI.getProfile();
          setUser(profileResponse.data);
          updateUser(profileResponse.data);
        }
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError(
        err.response?.data?.message || "Failed to upload profile picture",
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
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

  return (
    <div className="profile-container">
      <div className="profile-header">
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
          <div className="profile-header-actions">
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

      <div className="profile-stats">
        <div className="stat">
          <h3>{user.followerCount || 0}</h3>
          <p>Followers</p>
        </div>
        <div className="stat">
          <h3>{user.followingCount || 0}</h3>
          <p>Following</p>
        </div>
        <div className="stat">
          <h3>{user.totalLikesReceived || 0}</h3>
          <p>Likes Received</p>
        </div>
      </div>

      <div className="profile-section">
        <h2>{isOwnProfile ? "My Blogs" : `${user.name}'s Blogs`}</h2>
        <div className="blogs-placeholder">
          <p>No blogs yet</p>
        </div>
      </div>
    </div>
  );
}
