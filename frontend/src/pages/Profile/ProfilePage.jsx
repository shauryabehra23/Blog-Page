import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import "./ProfilePage.css";
import { AuthContext } from "../../context/AuthContext";
import { userAPI } from "../../utils/api";

export default function ProfilePage() {
  const { user: authUser } = useContext(AuthContext);
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p className="email">{user.email}</p>
          </div>
        </div>
        {isOwnProfile && (
          <div className="profile-header-actions">
            <button className="btn-edit">Edit Profile</button>
            <button className="btn-edit">Settings</button>
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
