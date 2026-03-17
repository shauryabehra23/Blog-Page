const mongoose = require("mongoose");

const CollaboratorBlogSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    blogTitle: {
      type: String,
      required: true,
    },
    collaboratorEmail: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    inviteToken: {
      type: String,
      required: true,
      unique: true, // This already creates an index - no need for additional index
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// REMOVE this line - it's creating a duplicate index
// CollaboratorBlogSchema.index({ inviteToken: 1 });

// Keep this compound index - it's useful for querying by blog + email
CollaboratorBlogSchema.index({ blog: 1, collaboratorEmail: 1 });

module.exports = mongoose.model("CollaboratorBlog", CollaboratorBlogSchema);
