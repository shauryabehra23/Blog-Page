const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }, // For replies
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index for efficient querying of comments by blog
CommentSchema.index({ blog: 1, createdAt: -1 });

// Index for efficient querying of replies
CommentSchema.index({ parentComment: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);
