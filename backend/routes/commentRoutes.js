const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const { checkTokenMw } = require("../middleWares/authMw");

// Get comments for a blog
router.get("/blog/:blogId", async (req, res) => {
  try {
    const comments = await Comment.find({
      blog: req.params.blogId,
      parentComment: null,
    })
      .populate("author", "name profilePic")
      .sort("-createdAt");

    // Also fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("author", "name profilePic")
          .sort("createdAt");
        return {
          ...comment.toObject(),
          replies,
        };
      }),
    );

    res.json({ success: true, comments: commentsWithReplies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create comment
router.post("/", checkTokenMw, async (req, res) => {
  try {
    const { content, blogId, parentCommentId } = req.body;

    if (!content || !blogId) {
      return res.status(400).json({
        success: false,
        message: "Content and blogId are required",
      });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      blog: blogId,
      parentComment: parentCommentId || null,
    });

    await comment.save();
    await comment.populate("author", "name profilePic");

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete comment
router.delete("/:id", checkTokenMw, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Also delete replies to this comment
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Like/unlike comment
router.post("/:id/like", checkTokenMw, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    res.json({
      success: true,
      likes: comment.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
