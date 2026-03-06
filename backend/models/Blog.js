const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    // Link the blog to the author's User document
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: Object }, // JSON is stored as Object in Mongoose
    category: { type: String, default: "other" },
    tags: [{ type: String }],

    // Metrics used to calculate "Trending"
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }, // Gives us 'createdAt', which is vital for the Trending algorithm
);

// Optional: Add an index to speed up querying for trending posts
BlogSchema.index({ createdAt: -1, likesCount: -1, views: -1 });

module.exports = mongoose.model("Blog", BlogSchema);
