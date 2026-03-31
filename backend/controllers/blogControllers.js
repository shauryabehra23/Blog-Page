const User = require("../models/User");
const Blog = require("../models/Blog");
const Like = require("../models/Likes");
const { sendCollaborationInvites } = require("./collaboratorControllers"); // Add this import at the top

const createBlog = async (req, res) => {
  console.log("\n=========================================");
  console.log("    [BLOG CONTROLLER - createBlog] HIT     ");
  console.log("=========================================");

  try {
    const userId = req.user._id;
    const { title, content, sections, category, tags, status } = req.body;

    console.log("\n[BLOG CREATE] Payload Received:");
    console.log(" -> Title:", title);
    console.log(" -> Content exists:", !!content);
    console.log(" -> Status:", status || "draft");
    console.log(" -> User ID:", userId);

    if (!title || !content) {
      console.warn("[BLOG CREATE] Validation failed: Missing title or content");
      return res
        .status(400)
        .json({ success: false, message: "Title and content are required" });
    }

    let frontPic = "";
    if (req.file) {
      frontPic = req.file.secure_url || req.file.path || "";
      console.log("[BLOG CREATE] Front pic processed:", frontPic);
    }

    // Parse content
    let parsedContent = content;
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
        console.log("[BLOG CREATE] ✅ Content parsed successfully");
      } catch (parseError) {
        console.error("[BLOG CREATE] Content Parse Error:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
          error: parseError.message,
        });
      }
    }

    // Parse sections
    let parsedSections = [];
    if (sections) {
      try {
        parsedSections =
          typeof sections === "string" ? JSON.parse(sections) : sections;
        console.log(
          "[BLOG CREATE] ✅ Sections parsed, count:",
          parsedSections.length,
        );
      } catch (parseError) {
        console.error("[BLOG CREATE] Sections Parse Error:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid sections format",
          error: parseError.message,
        });
      }
    }

    const contentImages = [];
    const extractImagesFromNode = (node) => {
      if (node.type === "image" && node.attrs?.src)
        contentImages.push(node.attrs.src);
      if (node.content && Array.isArray(node.content))
        node.content.forEach(extractImagesFromNode);
    };

    // Extract emails from sections
    let emails = parsedSections
      .map((section) => section.collaboratorEmail)
      .filter(Boolean)
      .map((email) => email.trim());

    // Build collaboration invites - only if email exists
    const collabInvites = parsedSections
      .filter(
        (section) =>
          section.collaboratorEmail && section.sectionId && section.title,
      )
      .map((section, index) => {
        const invite = {
          email: section.collaboratorEmail.trim(),
          sectionId: section.sectionId,
          sectionTitle: section.title,
          seqNo: section.seqNo !== undefined ? section.seqNo : index,
        };
        console.log(
          "[BLOG CREATE] Invite prepared:",
          invite.email,
          "→",
          invite.sectionTitle,
        );
        return invite;
      });
    console.log("[BLOG CREATE] Total invites:", collabInvites.length);

    // Extract images from content
    if (
      parsedContent &&
      parsedContent.content &&
      Array.isArray(parsedContent.content)
    ) {
      parsedContent.content.forEach(extractImagesFromNode);
      console.log("[BLOG CREATE] Images found:", contentImages.length);
    }

    // Prepare sections for storage
    const sectionsData = parsedSections.map((section, idx) => ({
      sectionId: section.sectionId || `section_${idx}`,
      title: section.title || "Untitled",
      assignedTo: section.collaboratorEmail || null,
      seqNo: section.seqNo !== undefined ? section.seqNo : idx,
      status: "pending",
    }));

    console.log("[BLOG CREATE] Saving blog to DB...");
    const newBlog = new Blog({
      author: userId,
      title,
      content: parsedContent,
      frontPic,
      sections: sectionsData,
      category: category || "other",
      tags: tags
        ? (Array.isArray(tags) ? tags : tags.split(",")).map((tag) =>
            tag.trim(),
          )
        : [],
      status: status || "draft",
    });

    console.log("[BLOG CREATE] Blog object created:");
    console.log("  Title:", newBlog.title);
    console.log("  Content:", newBlog.content ? "✅" : "❌");
    console.log("  Sections:", newBlog.sections.length);
    console.log("  Cover:", newBlog.frontPic ? "✅" : "❌");

    await newBlog.save();
    console.log("[BLOG CREATE] ✅ Blog saved successfully! ID:", newBlog._id);

    await newBlog.populate("author", "name email");

    // ✅ ADDED: Create a variable to hold the invite results
    let invitationResults = null;

    if (emails.length > 0) {
      console.log("\n[BLOG CREATE] >>> Initiating Collaborator Flow <<<");
      console.log("[BLOG CREATE] Emails ready for handoff:", emails);

      try {
        console.log("[BLOG CREATE] Awaiting sendCollaborationInvites()...");

        // ✅ ADDED: Capture the returned results here
        invitationResults = await sendCollaborationInvites(
          newBlog._id,
          collabInvites,
          req.user,
        );

        console.log(
          "[BLOG CREATE] sendCollaborationInvites() finished successfully. Results returned to Blog Controller.",
        );
      } catch (err) {
        console.error(
          "\n[BLOG CREATE] ERROR CAUGHT FROM sendCollaborationInvites():",
          err.message,
        );
        console.error(err);
        // We set invitationResults to reflect the error so the frontend knows it failed
        invitationResults = {
          error: "Failed to process invites",
          details: err.message,
        };
      }
    } else {
      console.log(
        "[BLOG CREATE] No collaborator emails provided. Skipping collab flow.",
      );
    }

    console.log("[BLOG CREATE] Sending 201 Success Response to Frontend.\n");

    // ✅ ADDED: Include invitationResults in the final JSON response
    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog: newBlog,
      invites: invitationResults, // The frontend can now access response.data.invites
    });
  } catch (error) {
    console.error("\n[BLOG CREATE] FATAL ERROR:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
  }
};
// ... (Keep the rest of your getNextBlogs, getBlog, toggleLike functions exactly as they were) ...

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
// ⚠️ TEMPORARY: Delete all blogs (admin use only)
const deleteAllBlogs = async (req, res) => {
  try {
    const result = await Blog.deleteMany({});
    console.log(`[DEBUG] Deleted ${result.deletedCount} blogs`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} blogs`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting blogs:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to delete blogs",
      error: error.message,
    });
  }
};

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
      {
        author: demoUser._id,
        title: "The Future of Web Development",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "AI and Web Technologies" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Artificial intelligence is reshaping how we build web applications. From automated testing to intelligent design systems, AI is everywhere.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "In this article, we explore emerging technologies and what they mean for web developers.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "technology",
        tags: ["ai", "web", "future"],
        likesCount: 312,
        views: 2100,
      },
      {
        author: demoUser._id,
        title: "Python for Data Science",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Data Analysis with Python" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Python has become the go-to language for data science. Learn how to use pandas, numpy, and matplotlib for powerful data analysis.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This guide covers data cleaning, visualization, and statistical analysis techniques.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "programming",
        tags: ["python", "data", "analysis"],
        likesCount: 256,
        views: 1678,
      },
      {
        author: demoUser._id,
        title: "Building Mobile Apps with React Native",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [
                { type: "text", text: "Cross-Platform Mobile Development" },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "React Native allows you to build mobile apps using JavaScript. Learn how to create iOS and Android apps from a single codebase.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "We'll cover navigation, state management, and deployment best practices.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "technology",
        tags: ["react-native", "mobile", "javascript"],
        likesCount: 289,
        views: 1567,
      },
      {
        author: demoUser._id,
        title: "Productivity Tips for Remote Workers",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [
                { type: "text", text: "Working From Home Effectively" },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Remote work has become the new normal. Here are practical tips to maximize your productivity while working from home.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Topics include time management, workspace setup, and maintaining work-life balance.",
                },
              ],
            },
          ],
        },
        contentImages: [],
        category: "lifestyle",
        tags: ["productivity", "remote", "work"],
        likesCount: 180,
        views: 892,
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

// Get blog for editing with role-based access control
const getBlogForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log("\n[BLOG EDIT] Getting blog for edit access");
    console.log("[BLOG EDIT] Blog ID:", id);
    console.log("[BLOG EDIT] User ID:", userId);

    const blog = await Blog.findById(id).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user is the author
    if (blog.author._id.toString() === userId.toString()) {
      console.log("[BLOG EDIT] ✅ User is author - granting full access");
      console.log(
        "[BLOG EDIT] Returning blog with content:",
        blog.content ? "EXISTS" : "MISSING",
      );
      return res.status(200).json({
        success: true,
        blog,
        role: "author",
      });
    }

    // Check if user is a collaborator with accepted status
    const Collaborator = require("../models/Collaborator-Blog");
    const collaboratorRecords = await Collaborator.find({
      blog: id,
      user: userId,
      status: "accepted",
    });

    if (collaboratorRecords.length === 0) {
      console.log("[BLOG EDIT] ❌ User lacks permissions");
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this blog",
      });
    }

    // Get the sectionIds that this collaborator is assigned to
    const assignedSectionIds = collaboratorRecords.map(
      (record) => record.sectionId,
    );

    // Filter blog to show only assigned sections for collaborator
    const assignedSections = blog.sections.filter((section) =>
      assignedSectionIds.includes(section.sectionId),
    );

    const filteredBlog = {
      ...blog.toObject(),
      sections: assignedSections,
      _restrictedTo: "assigned-sections-only",
    };

    console.log(
      "[BLOG EDIT] ✅ Collaborator access granted for",
      assignedSections.length,
      "sections",
    );
    return res.status(200).json({
      success: true,
      blog: filteredBlog,
      role: "collaborator",
    });
  } catch (error) {
    console.error("[BLOG EDIT] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch blog for editing",
      error: error.message,
    });
  }
};

// ✅ NEW: Get all blogs authored by a specific user
const getUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // 8 blogs per page
    const skip = (page - 1) * limit;

    console.log(
      "[GET USER BLOGS] Fetching blogs for author:",
      userId,
      "page:",
      page,
    );

    // Get total count for user's blogs
    const totalBlogs = await Blog.countDocuments({ author: userId });

    // Fetch paginated blogs
    const blogs = await Blog.find({ author: userId })
      .populate("author", "name email profilePic")
      .sort({ createdAt: -1 })
      .select("-content") // Exclude heavy content field for list view
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(totalBlogs / limit);

    console.log(
      "[GET USER BLOGS] Found:",
      blogs.length,
      "blogs (page",
      page,
      "of",
      totalPages,
      ")",
    );

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
    console.error("[GET USER BLOGS] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch user blogs",
      error: error.message,
    });
  }
};

// ✅ NEW: Get all blogs the user is collaborating on (with pagination)
const getUserCollaboratingBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // 8 blogs per page
    const skip = (page - 1) * limit;

    console.log(
      "[GET COLLAB BLOGS] Fetching collaborating blogs for user:",
      userId,
      "page:",
      page,
    );

    const Collaborator = require("../models/Collaborator-Blog");
    const User = require("../models/User");

    // ✅ CORRECT: Get the user's email (they are the COLLABORATOR being invited)
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "[GET COLLAB BLOGS] Searching by collaborator email:",
      currentUser.email,
    );

    // Get total count for user's collaborating blogs
    const totalCollaborations = await Collaborator.countDocuments({
      collaboratorEmail: currentUser.email,
      status: "accepted",
    });

    // ✅ CORRECT: Search where current user is the COLLABORATOR (in collaboratorEmail field)
    // user field stores the author/blog owner's ID
    const collaborations = await Collaborator.find({
      collaboratorEmail: currentUser.email,
      status: "accepted",
    })
      .populate({
        path: "blog",
        populate: { path: "author", select: "name email profilePic" },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(totalCollaborations / limit);

    console.log(
      "[GET COLLAB BLOGS] Found:",
      collaborations.length,
      "collaborations (page",
      page,
      "of",
      totalPages,
      ")",
    );

    // Extract unique blogs and map collaboration details
    // Filter out null blogs (deleted blogs) and map remaining collaborations
    const blogsWithCollabInfo = collaborations
      .filter((collab) => collab.blog !== null)
      .map((collab) => ({
        ...collab.blog.toObject(),
        mySection: {
          sectionId: collab.sectionId,
          sectionTitle: collab.sectionTitle,
          seqNo: collab.seqNo,
          status: collab.status,
        },
      }));

    return res.status(200).json({
      success: true,
      blogs: blogsWithCollabInfo,
      pagination: {
        currentPage: page,
        totalPages,
        totalCollaborations,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("[GET COLLAB BLOGS] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch collaborating blogs",
      error: error.message,
    });
  }
};

// ✅ UPDATE: Update blog (for authors - draft or publish)
const updateBlog = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user._id;
    const { title, content, category, tags, status } = req.body;

    console.log("\n[BLOG UPDATE] Updating blog");
    console.log("[BLOG UPDATE] Blog ID:", blogId);
    console.log("[BLOG UPDATE] User ID:", userId);
    console.log("[BLOG UPDATE] Status:", status || "draft");
    console.log(
      "[BLOG UPDATE] Content received:",
      content ? `${JSON.stringify(content).substring(0, 100)}...` : "EMPTY",
    );

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        message: "At least title or content is required",
      });
    }

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user is the blog author
    if (blog.author.toString() !== userId.toString()) {
      console.log("[BLOG UPDATE] ❌ User is not the blog author");
      return res.status(403).json({
        success: false,
        message: "Only the blog author can update this blog",
      });
    }

    // Parse content if it's a string
    let parsedContent = content;
    if (content && typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
        console.log("[BLOG UPDATE] ✅ Content parsed successfully");
      } catch (parseError) {
        console.error("[BLOG UPDATE] Content Parse Error:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
          error: parseError.message,
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (tags && typeof tags === "string") {
      parsedTags = tags.split(",").map((tag) => tag.trim());
    }

    // Handle cover image upload
    let frontPic = blog.frontPic;
    if (req.file) {
      frontPic = req.file.secure_url || req.file.path || "";
      console.log("[BLOG UPDATE] Front pic uploaded:", frontPic);
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (parsedContent) updateData.content = parsedContent;
    if (category) updateData.category = category;
    if (parsedTags) updateData.tags = parsedTags;
    if (status) updateData.status = status;
    if (frontPic) updateData.frontPic = frontPic;

    console.log("[BLOG UPDATE] updateData keys:", Object.keys(updateData));
    console.log("[BLOG UPDATE] Will save content?:", !!updateData.content);

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, {
      new: true,
    }).populate("author", "name email profilePic");

    console.log("[BLOG UPDATE] ✅ Blog updated successfully");
    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("[BLOG UPDATE] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

// ✅ NEW: Update section content and status (collaborators editing their sections)
const updateSectionContent = async (req, res) => {
  try {
    const { blogId, sectionId } = req.params;
    const userId = req.user._id;
    const { approvedContent, draftContent, status, feedback } = req.body;

    console.log("\n[SECTION UPDATE - DUAL WORKFLOW]");
    console.log("[SECTION UPDATE] Blog ID:", blogId);
    console.log("[SECTION UPDATE] Section ID:", sectionId);
    console.log("[SECTION UPDATE] User ID:", userId);
    console.log("[SECTION UPDATE] Action:", status);
    console.log("[SECTION UPDATE] Has approvedContent:", !!approvedContent);
    console.log("[SECTION UPDATE] Has draftContent:", !!draftContent);
    console.log("[SECTION UPDATE] Has feedback:", !!feedback);

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // DETERMINE REQUEST TYPE & AUTHORIZATION
    // If approvedContent or feedback is present → AUTHOR workflow (approve/reject)
    // Otherwise → COLLABORATOR workflow (save draft)
    const isAuthorWorkflow =
      !!approvedContent ||
      !!feedback ||
      status === "approved" ||
      status === "rejected";

    if (isAuthorWorkflow) {
      // AUTHOR WORKFLOW: Only blog author can use approve/reject
      if (blog.author.toString() !== userId.toString()) {
        console.log(
          "[SECTION UPDATE] ❌ User is not the blog author (author workflow)",
        );
        return res.status(403).json({
          success: false,
          message: "Only the blog author can approve or reject sections",
        });
      }
    } else {
      // COLLABORATOR WORKFLOW: Only collaborator with accepted status can save draft
      const Collaborator = require("../models/Collaborator-Blog");
      const collaborator = await Collaborator.findOne({
        blog: blogId,
        user: userId,
        sectionId: sectionId,
        status: "accepted",
      });

      if (!collaborator) {
        console.log(
          "[SECTION UPDATE] ❌ User is not an accepted collaborator on this section",
        );
        return res.status(403).json({
          success: false,
          message: "You don't have permission to edit this section",
        });
      }
    }

    // Find the section
    const section = blog.sections.find((sec) => sec.sectionId === sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Parse content if it's a string
    let parsedApprovedContent = approvedContent;
    let parsedDraftContent = draftContent;

    if (approvedContent && typeof approvedContent === "string") {
      try {
        parsedApprovedContent = JSON.parse(approvedContent);
      } catch (parseError) {
        console.error(
          "[SECTION UPDATE] Approved content parse error:",
          parseError,
        );
        return res.status(400).json({
          success: false,
          message: "Invalid approved content format",
          error: parseError.message,
        });
      }
    }

    if (draftContent && typeof draftContent === "string") {
      try {
        parsedDraftContent = JSON.parse(draftContent);
      } catch (parseError) {
        console.error(
          "[SECTION UPDATE] Draft content parse error:",
          parseError,
        );
        return res.status(400).json({
          success: false,
          message: "Invalid draft content format",
          error: parseError.message,
        });
      }
    }

    // Build update object based on action
    const updateData = {
      "sections.$.updatedAt": new Date(),
    };

    // APPROVE ACTION: Sync both content and save feedback
    if (status === "approved") {
      console.log(
        "[SECTION UPDATE] ACTION: APPROVE - syncing both content states with feedback",
      );
      updateData["sections.$.approvedContent"] =
        parsedDraftContent || section.draftContent;
      updateData["sections.$.draftContent"] =
        parsedDraftContent || section.draftContent;
      updateData["sections.$.status"] = "approved";
      updateData["sections.$.feedback"] = feedback || "";
    }
    // REJECT ACTION: Update draft and feedback, leave approvedContent intact
    else if (status === "rejected") {
      console.log(
        "[SECTION UPDATE] ACTION: REJECT - sending tweaked draft back to collaborator",
      );
      updateData["sections.$.draftContent"] =
        parsedDraftContent || section.draftContent;
      updateData["sections.$.status"] = "rejected";
      updateData["sections.$.feedback"] = feedback || "";
    }
    // GENERAL UPDATE: Handle individual field updates
    else {
      console.log("[SECTION UPDATE] ACTION: GENERAL UPDATE");
      if (approvedContent !== undefined) {
        updateData["sections.$.approvedContent"] = parsedApprovedContent;
      }
      if (draftContent !== undefined) {
        updateData["sections.$.draftContent"] = parsedDraftContent;
      }
      if (status !== undefined) {
        updateData["sections.$.status"] = status;
      }
      if (feedback !== undefined) {
        updateData["sections.$.feedback"] = feedback;
      }
    }

    // Perform the update
    const updateResult = await Blog.updateOne(
      {
        _id: blogId,
        "sections.sectionId": sectionId,
      },
      {
        $set: updateData,
      },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Fetch updated section to return
    const updatedBlog = await Blog.findById(blogId);
    const updatedSection = updatedBlog.sections.find(
      (sec) => sec.sectionId === sectionId,
    );

    console.log(
      "[SECTION UPDATE] ✅ Section updated successfully - Status:",
      updatedSection.status,
    );
    return res.status(200).json({
      success: true,
      message: `Section ${status} successfully`,
      section: updatedSection,
    });
  } catch (error) {
    console.error("[SECTION UPDATE] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to update section",
      error: error.message,
    });
  }
};

// Approve section content (Author approves collaborator's pending draft)
const approveSectionContent = async (req, res) => {
  try {
    const { blogId, sectionId } = req.params;
    const userId = req.user._id;

    console.log("\n[SECTION APPROVE] Approving section draft");
    console.log("[SECTION APPROVE] Blog ID:", blogId);
    console.log("[SECTION APPROVE] Section ID:", sectionId);
    console.log("[SECTION APPROVE] User ID:", userId);

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user is the blog author
    if (blog.author.toString() !== userId.toString()) {
      console.log("[SECTION APPROVE] ❌ User is not the blog author");
      return res.status(403).json({
        success: false,
        message: "Only the blog author can approve sections",
      });
    }

    // Find the section
    const section = blog.sections.find((sec) => sec.sectionId === sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check if section is in pending status
    if (section.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Section must be in 'pending' status to approve. Current status: ${section.status}`,
      });
    }

    // Move draftContent to approvedContent and clear draftContent
    const updateResult = await Blog.updateOne(
      {
        _id: blogId,
        "sections.sectionId": sectionId,
      },
      {
        $set: {
          "sections.$.approvedContent": section.draftContent,
          "sections.$.draftContent": null,
          "sections.$.status": "approved",
          "sections.$.feedback": "",
          "sections.$.updatedAt": new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Fetch updated section to return
    const updatedBlog = await Blog.findById(blogId);
    const updatedSection = updatedBlog.sections.find(
      (sec) => sec.sectionId === sectionId,
    );

    console.log("[SECTION APPROVE] ✅ Section approved successfully");
    return res.status(200).json({
      success: true,
      message: "Section approved successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("[SECTION APPROVE] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to approve section",
      error: error.message,
    });
  }
};

// Reject section draft (Author rejects collaborator's pending draft)
const rejectSectionContent = async (req, res) => {
  try {
    const { blogId, sectionId } = req.params;
    const userId = req.user._id;
    const { authorFeedback } = req.body;

    console.log("\n[SECTION REJECT] Rejecting section draft");
    console.log("[SECTION REJECT] Blog ID:", blogId);
    console.log("[SECTION REJECT] Section ID:", sectionId);
    console.log("[SECTION REJECT] User ID:", userId);
    console.log("[SECTION REJECT] Feedback:", authorFeedback || "(none)");

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user is the blog author
    if (blog.author.toString() !== userId.toString()) {
      console.log("[SECTION REJECT] ❌ User is not the blog author");
      return res.status(403).json({
        success: false,
        message: "Only the blog author can reject sections",
      });
    }

    // Find the section
    const section = blog.sections.find((sec) => sec.sectionId === sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check if section is in pending status
    if (section.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Section must be in 'pending' status to reject. Current status: ${section.status}`,
      });
    }

    // Update section: set status to "rejected" and update feedback
    const updateResult = await Blog.updateOne(
      {
        _id: blogId,
        "sections.sectionId": sectionId,
      },
      {
        $set: {
          "sections.$.status": "rejected",
          "sections.$.feedback": authorFeedback || "",
          "sections.$.updatedAt": new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Fetch updated section to return
    const updatedBlog = await Blog.findById(blogId);
    const updatedSection = updatedBlog.sections.find(
      (sec) => sec.sectionId === sectionId,
    );

    console.log("[SECTION REJECT] ✅ Section rejected successfully");
    return res.status(200).json({
      success: true,
      message: "Section rejected successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("[SECTION REJECT] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to reject section",
      error: error.message,
    });
  }
};

// Save master edits (Author directly edits and saves approvedContent)
const saveMasterContent = async (req, res) => {
  try {
    const { blogId, sectionId } = req.params;
    const userId = req.user._id;
    const { approvedContent } = req.body;

    console.log("\n[SECTION SAVE-MASTER] Saving master content");
    console.log("[SECTION SAVE-MASTER] Blog ID:", blogId);
    console.log("[SECTION SAVE-MASTER] Section ID:", sectionId);
    console.log("[SECTION SAVE-MASTER] User ID:", userId);

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check if user is the blog author
    if (blog.author.toString() !== userId.toString()) {
      console.log("[SECTION SAVE-MASTER] ❌ User is not the blog author");
      return res.status(403).json({
        success: false,
        message: "Only the blog author can edit master content",
      });
    }

    // Find the section
    const section = blog.sections.find((sec) => sec.sectionId === sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Parse approvedContent if it's a string
    let parsedApprovedContent = approvedContent;
    if (typeof approvedContent === "string") {
      try {
        parsedApprovedContent = JSON.parse(approvedContent);
      } catch (parseError) {
        console.error("[SECTION SAVE-MASTER] Content Parse Error:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
          error: parseError.message,
        });
      }
    }

    // Update section: save directly to approvedContent without changing status
    const updateResult = await Blog.updateOne(
      {
        _id: blogId,
        "sections.sectionId": sectionId,
      },
      {
        $set: {
          "sections.$.approvedContent": parsedApprovedContent,
          "sections.$.updatedAt": new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Fetch updated section to return
    const updatedBlog = await Blog.findById(blogId);
    const updatedSection = updatedBlog.sections.find(
      (sec) => sec.sectionId === sectionId,
    );

    console.log("[SECTION SAVE-MASTER] ✅ Master content saved successfully");
    return res.status(200).json({
      success: true,
      message: "Master content saved successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("[SECTION SAVE-MASTER] Error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to save master content",
      error: error.message,
    });
  }
};

module.exports = {
  createBlog,
  getNextBlogs,
  getBlog,
  getBlogForEdit,
  updateBlog,
  getUserBlogs,
  getUserCollaboratingBlogs,
  updateSectionContent,
  approveSectionContent,
  rejectSectionContent,
  saveMasterContent,
  deleteAllBlogs,
  seedBlogs,
  toggleLike,
  getLikeStatus,
};
