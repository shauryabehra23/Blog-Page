const User = require("../models/User");
const Blog = require("../models/Blog");
const Like = require("../models/Likes");

// Create a new blog - FIXED VERSION
const createBlog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, content, category, tags } = req.body;
    console.log("Received content type:", typeof content);
    console.log("Content preview:", content?.substring?.(0, 100) || content);

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    // Handle uploaded file - coverImage is sent as single file
    let frontPic = "";
    if (req.file) {
      // Single cover image file
      frontPic = req.file.secure_url || req.file.path || "";
    }

    // ✅ PARSE the content from string to object!
    // Frontend sends content as JSON.stringify(editor.getJSON())
    let parsedContent;
    try {
      parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;
      console.log("Successfully parsed content to object");
    } catch (parseError) {
      console.error("Error parsing content:", parseError);
      return res.status(400).json({
        success: false,
        message: "Invalid content format",
        error: parseError.message,
      });
    }

    // ✅ Extract image URLs from parsed content for contentImages array
    const contentImages = [];
    const extractImagesFromNode = (node) => {
      if (node.type === "image" && node.attrs?.src) {
        contentImages.push(node.attrs.src);
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractImagesFromNode);
      }
    };

    if (parsedContent.content && Array.isArray(parsedContent.content)) {
      parsedContent.content.forEach(extractImagesFromNode);
    }

    // Create new blog with PARSED content
    const newBlog = new Blog({
      author: userId,
      title,
      frontPic,
      content: parsedContent, // 👈 Now it's an object, not a string!
      contentImages: contentImages, // 👈 Store extracted image URLs
      category,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    });

    await newBlog.save();

    // Populate author details before returning
    await newBlog.populate("author", "name email");

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
  }
};

// Get blogs with pagination and sorting
const getNextBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // 8 blogs per page
    const sortBy = req.query.sortBy || "newest"; // "newest" or "mostLiked"

    const skip = (page - 1) * limit;

    // Determine sort order
    let sortObj = {};
    if (sortBy === "mostLiked") {
      sortObj = { likesCount: -1, createdAt: -1 };
    } else {
      // Default: newest first
      sortObj = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments();

    // Fetch blogs with pagination
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(totalBlogs / limit);

    return res.status(200).json({
      success: true,
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

// Get a single blog by ID - FIXED to handle both string and object content
const getBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // Increment views
      { new: true },
    ).populate("author", "name email");

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Ensure content is properly formatted for frontend
    // If content is a string (old format), parse it
    if (typeof blog.content === "string") {
      try {
        blog.content = JSON.parse(blog.content);
      } catch (e) {
        console.log("Content is already a string, keeping as is");
      }
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};

// Toggle like on a blog (add or remove like)
const toggleLike = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user._id;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Check if user already liked this blog
    const existingLike = await Like.findOne({ userId, blogId });

    if (existingLike) {
      // User already liked - remove the like (unlike)
      await Like.findByIdAndDelete(existingLike._id);

      // Decrement likesCount in blog
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: -1 } });

      return res.status(200).json({
        success: true,
        liked: false,
        message: "Like removed successfully",
      });
    } else {
      // User hasn't liked yet - add the like
      const newLike = new Like({ userId, blogId });
      await newLike.save();

      // Increment likesCount in blog
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: 1 } });

      return res.status(200).json({
        success: true,
        liked: true,
        message: "Like added successfully",
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to toggle like",
      error: error.message,
    });
  }
};

// Get like status for current user on a blog
const getLikeStatus = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user._id;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Check if user has liked this blog
    const existingLike = await Like.findOne({ userId, blogId });

    return res.status(200).json({
      success: true,
      liked: !!existingLike,
    });
  } catch (error) {
    console.error("Error getting like status:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to get like status",
      error: error.message,
    });
  }
};

// Seed sample blogs (for testing) - FIXED to use proper format
const seedBlogs = async (req, res) => {
  try {
    // First, check and create a demo user if it doesn't exist
    let demoUser = await User.findOne({ email: "demo@example.com" });
    if (!demoUser) {
      demoUser = new User({
        name: "Demo Author",
        email: "demo@example.com",
        password: "hashedpassword123",
      });
      await demoUser.save();
    }

    // Sample blogs data - using TipTap JSON format (as objects, not strings)
    const sampleBlogs = [
      {
        author: demoUser._id,
        title: "Getting Started with React Hooks",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Introduction to React Hooks" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "React Hooks are a powerful feature that allows you to use state and other React features without writing a class component. They provide a more direct API to the React concepts you already know.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "In this guide, we'll explore the useState hook and see how it can simplify your code.",
                },
              ],
            },
          ],
        },
        contentImages: [], // Will be populated if there were images
        category: "technology",
        tags: ["react", "javascript", "hooks"],
        likesCount: 145,
        views: 892,
      },
      {
        author: demoUser._id,
        title: "The Art of Minimalist Web Design",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Less is More" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Minimalist design focuses on simplicity and functionality. By removing unnecessary elements, we create cleaner, faster, and more user-friendly interfaces.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This article explores principles of minimalist design and how to apply them to your projects.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "design",
        tags: ["design", "web", "ux"],
        likesCount: 203,
        views: 1250,
      },
      {
        author: demoUser._id,
        title: "Node.js Best Practices for Production",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [
                { type: "text", text: "Building Scalable Node Applications" },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Node.js has become a popular choice for backend development. This guide covers best practices for building production-ready Node.js applications.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Topics include error handling, logging, security, and performance optimization.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "technology",
        tags: ["nodejs", "backend", "javascript"],
        likesCount: 178,
        views: 756,
      },
      {
        author: demoUser._id,
        title: "Travel Diaries: Japan Adventure",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [
                { type: "text", text: "Exploring the Land of Cherry Blossoms" },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Japan is a country where tradition meets modernity. From ancient temples to futuristic cities, there's so much to discover.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Join me as I share my experiences traveling through Tokyo, Kyoto, and beyond.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "travel",
        tags: ["japan", "adventure", "travel"],
        likesCount: 267,
        views: 1890,
      },
      {
        author: demoUser._id,
        title: "CSS Grid Deep Dive",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Mastering CSS Grid Layout" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "CSS Grid is a powerful layout tool that allows you to create complex, responsive designs with minimal code.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This comprehensive guide covers everything from basic concepts to advanced techniques.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "technology",
        tags: ["css", "web", "frontend"],
        likesCount: 198,
        views: 945,
      },
    ];

    // Clear existing blogs (optional - comment out if you want to keep existing data)
    // await Blog.deleteMany({});

    // Insert sample blogs
    const createdBlogs = await Blog.insertMany(sampleBlogs);

    return res.status(201).json({
      success: true,
      message: `Successfully seeded ${createdBlogs.length} sample blogs`,
      count: createdBlogs.length,
    });
  } catch (error) {
    console.error("Error seeding blogs:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to seed blogs",
      error: error.message,
    });
  }
};

module.exports = {
  createBlog,
  getNextBlogs,
  getBlog,
  seedBlogs,
  toggleLike,
  getLikeStatus,
};
