import { useState } from "react";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [user] = useState({
    name: "John Doe",
    bio: "Passionate blogger and developer",
    email: "john@example.com",
    avatar: "https://via.placeholder.com/150",
    blogs: 5,
    followers: 120,
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={user.avatar} alt={user.name} className="profile-avatar" />
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p className="bio">{user.bio}</p>
          <p className="email">{user.email}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <h3>{user.blogs}</h3>
          <p>Blogs</p>
        </div>
        <div className="stat">
          <h3>{user.followers}</h3>
          <p>Followers</p>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn-secondary">Edit Profile</button>
        <button className="btn-secondary">Settings</button>
      </div>

      <div className="my-blogs">
        <h2>My Blogs</h2>
        <p>Your blogs will appear here</p>
      </div>
    </div>
  );
}
