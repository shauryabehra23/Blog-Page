const User = require("../models/User");
const Blog = require("../models/Blog");

// Create a new blog
const createBlog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const newBlog = new Blog({
      author: userId,
      title,
      content,
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

// Get a single blog by ID
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

// Seed sample blogs (for testing)
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

    // Sample blogs data
    const sampleBlogs = [
      {
        author: demoUser._id,
        title: "Getting Started with React Hooks",
        content:
          "<h2>Introduction to React Hooks</h2><p>React Hooks are a powerful feature that allows you to use state and other React features without writing a class component. They provide a more direct API to the React concepts you already know.</p><p>In this guide, we'll explore the useState hook and see how it can simplify your code.</p>",
        category: "technology",
        tags: ["react", "javascript", "hooks"],
        likesCount: 145,
        views: 892,
      },
      {
        author: demoUser._id,
        title: "The Art of Minimalist Web Design",
        content:
          "<h2>Less is More</h2><p>Minimalist design focuses on simplicity and functionality. By removing unnecessary elements, we create cleaner, faster, and more user-friendly interfaces.</p><p>This article explores principles of minimalist design and how to apply them to your projects.</p>",
        category: "design",
        tags: ["design", "web", "ux"],
        likesCount: 203,
        views: 1250,
      },
      {
        author: demoUser._id,
        title: "Node.js Best Practices for Production",
        content:
          "<h2>Building Scalable Node Applications</h2><p>Node.js has become a popular choice for backend development. This guide covers best practices for building production-ready Node.js applications.</p><p>Topics include error handling, logging, security, and performance optimization.</p>",
        category: "technology",
        tags: ["nodejs", "backend", "javascript"],
        likesCount: 178,
        views: 756,
      },
      {
        author: demoUser._id,
        title: "Travel Diaries: Japan Adventure",
        content:
          "<h2>Exploring the Land of Cherry Blossoms</h2><p>Japan is a country where tradition meets modernity. From ancient temples to futuristic cities, there's so much to discover.</p><p>Join me as I share my experiences traveling through Tokyo, Kyoto, and beyond.</p>",
        category: "travel",
        tags: ["japan", "adventure", "travel"],
        likesCount: 267,
        views: 1890,
      },
      {
        author: demoUser._id,
        title: "CSS Grid Deep Dive",
        content:
          "<h2>Mastering CSS Grid Layout</h2><p>CSS Grid is a powerful layout tool that allows you to create complex, responsive designs with minimal code.</p><p>This comprehensive guide covers everything from basic concepts to advanced techniques.</p>",
        category: "technology",
        tags: ["css", "web", "frontend"],
        likesCount: 198,
        views: 945,
      },
      {
        author: demoUser._id,
        title: "Healthy Eating: Mediterranean Diet",
        content:
          "<h2>Food for Health and Happiness</h2><p>The Mediterranean diet is known for its health benefits and delicious flavors. It emphasizes fresh vegetables, whole grains, and healthy fats.</p><p>Learn about the foods that make this diet so special and how to incorporate them into your meals.</p>",
        category: "food",
        tags: ["health", "diet", "cooking"],
        likesCount: 312,
        views: 2103,
      },
      {
        author: demoUser._id,
        title: "JavaScript Async/Await Explained",
        content:
          "<h2>Master Asynchronous JavaScript</h2><p>Async/await is a modern way to handle asynchronous operations in JavaScript. It makes your code more readable and easier to debug.</p><p>This tutorial walks through practical examples and common pitfalls to avoid.</p>",
        category: "technology",
        tags: ["javascript", "async", "programming"],
        likesCount: 234,
        views: 1567,
      },
      {
        author: demoUser._id,
        title: "A Day in the Life of a Developer",
        content:
          "<h2>Inside the Developer's Mind</h2><p>Software development is a creative and challenging profession. We juggle deadlines, debugging, and continuous learning.</p><p>This article gives a peek into what a typical day looks like for many developers in the industry.</p>",
        category: "technology",
        tags: ["development", "career", "lifestyle"],
        likesCount: 156,
        views: 723,
      },
      {
        author: demoUser._id,
        title: "Exploring the Mountains",
        content:
          "<h2>Adventure in the Peaks</h2><p>Mountains are nature's monuments, offering breathtaking views and thrilling adventures. Whether you're hiking or mountaineering, there's something magical about reaching new heights.</p><p>Discover my favorite mountain destinations and tips for safe trekking.</p>",
        category: "travel",
        tags: ["mountains", "hiking", "adventure"],
        likesCount: 289,
        views: 1834,
      },
      {
        author: demoUser._id,
        title: "Understanding Web Performance",
        content:
          "<h2>Speed Matters</h2><p>Web performance directly impacts user experience and conversion rates. Modern tools and techniques allow us to measure and optimize performance effectively.</p><p>This guide covers key metrics and practical optimization strategies.</p>",
        category: "technology",
        tags: ["performance", "web", "optimization"],
        likesCount: 221,
        views: 1456,
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

module.exports = { createBlog, getNextBlogs, getBlog, seedBlogs };
