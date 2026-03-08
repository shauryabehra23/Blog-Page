import { useState, useEffect, useMemo, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { blogAPI } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Clock, ChevronLeft } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Heart, MessageCircle, Share2, Send, Bookmark } from "lucide-react";

const commentsData = [
  {
    id: 1,
    author: "Alex Rivera",
    avatar: "AR",
    time: "2 hours ago",
    text: "Great article! The chaos engineering section really resonated with me. We started doing game days at our company and it's been transformative.",
  },
  {
    id: 2,
    author: "Priya Sharma",
    avatar: "PS",
    time: "4 hours ago",
    text: "The human element part is so underrated. We had a major outage last year and the blameless postmortem culture saved us.",
  },
  {
    id: 3,
    author: "Jordan Lee",
    avatar: "JL",
    time: "6 hours ago",
    text: "Would love to see a follow-up on specific tooling recommendations for observability. What do you use for distributed tracing?",
  },
  {
    id: 4,
    author: "Emma Watson",
    avatar: "EW",
    time: "1 day ago",
    text: "Circuit breakers changed our microservices architecture completely. Highly recommend Resilience4j for JVM-based systems.",
  },
  {
    id: 5,
    author: "Marcus Cole",
    avatar: "MC",
    time: "1 day ago",
    text: "Fascinating read. I'd add that contract testing between services is another crucial piece of the resilience puzzle.",
  },
  {
    id: 6,
    author: "Yuki Tanaka",
    avatar: "YT",
    time: "2 days ago",
    text: "The ship bulkhead analogy is perfect. Makes it so much easier to explain to stakeholders why we need service isolation.",
  },
];

const ReadBlog = () => {
  const { blogId } = useParams();
  const { isAuthenticated } = useContext(AuthContext);
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(commentsData);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);

  // Fetch blog data by ID
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await blogAPI.getById(blogId);
        if (response.data.success) {
          setBlog(response.data.blog);
          setLikeCount(response.data.blog.likesCount || 0);
        } else {
          setError("Blog not found");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load blog. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  // Fetch like status when blog loads and user is authenticated
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!isAuthenticated || !blogId) {
        return;
      }
      try {
        const response = await blogAPI.getLikeStatus(blogId);
        if (response.data.success) {
          setLiked(response.data.liked);
        }
      } catch (err) {
        console.error("Error fetching like status:", err);
        // Don't show error to user - just keep like as false
      }
    };

    fetchLikeStatus();
  }, [blogId, isAuthenticated]);

  // Convert JSON content to HTML using TipTap's generateHTML
  // Also handles plain string content (e.g., from Postman with Cloudinary URL)
  const contentHtml = useMemo(() => {
    if (!blog?.content) {
      return "";
    }

    // Handle plain string content (e.g., when using Postman with Cloudinary URL)
    if (typeof blog.content === "string") {
      // Check if it's a URL (image URL or general URL)
      const isUrl = blog.content.match(/^https?:\/\//);

      if (isUrl) {
        // Check if it's an image URL
        const imageExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".svg",
          "cloudinary",
          "imgix",
        ];
        const isImageUrl = imageExtensions.some((ext) =>
          blog.content.toLowerCase().includes(ext),
        );

        if (isImageUrl) {
          // Return as an image tag
          return `<img src="${blog.content}" alt="Blog image" class="max-w-full h-auto rounded-lg" />`;
        } else {
          // Return as a link
          return `<a href="${blog.content}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${blog.content}</a>`;
        }
      }

      // Otherwise, return as plain text (escaped for HTML)
      return `<p>${blog.content.replace(/</g, "<").replace(/>/g, ">")}</p>`;
    }

    let contentObj = blog.content;

    // If content is a string, parse it as JSON
    if (typeof blog.content === "string") {
      try {
        contentObj = JSON.parse(blog.content);
      } catch (err) {
        // Try unescaping if direct parsing fails
        try {
          const unescaped = blog.content.replace(/\\"/g, '"');
          contentObj = JSON.parse(unescaped);
        } catch (err2) {
          console.error("Failed to parse content:", err2);
          return "";
        }
      }
    }

    // Verify it's a valid TipTap document structure
    if (!contentObj || typeof contentObj !== "object" || !contentObj.type) {
      console.error("Content is not a valid TipTap document");
      return "";
    }

    // If content is an object (JSON), convert to HTML
    // IMPORTANT: Add Image extension to handle image nodes in TipTap JSON
    try {
      const extensions = [StarterKit, Underline, Image];
      return generateHTML(contentObj, extensions);
    } catch (err) {
      console.error("Error converting JSON to HTML:", err);
      return "";
    }
  }, [blog?.content]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const calculateReadTime = (content) => {
    if (!content) return "1 min read";
    // Estimate 200 words per minute
    const text =
      typeof content === "string" ? content : JSON.stringify(content);
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  const getAuthorName = () => {
    if (!blog?.author) return "Unknown Author";
    if (typeof blog.author === "string") return blog.author;
    return blog.author.name || "Unknown Author";
  };

  const getAuthorInitials = () => {
    const name = getAuthorName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now(),
        author: "You",
        avatar: "YO",
        time: "Just now",
        text: newComment,
      },
      ...comments,
    ]);
    setNewComment("");
  };

  const handleLike = async () => {
    // If not authenticated, prompt to login (or just toggle locally for demo)
    if (!isAuthenticated) {
      // For non-authenticated users, just toggle locally (optional: could redirect to login)
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
      return;
    }

    // Optimistic update for better UX
    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const response = await blogAPI.likeBlog(blogId);
      if (response.data.success) {
        // API call succeeded, state is already updated optimistically
        // Optionally fetch the latest blog to get accurate count
        const blogResponse = await blogAPI.getById(blogId);
        if (blogResponse.data.success) {
          setLikeCount(blogResponse.data.blog.likesCount || 0);
        }
      } else {
        // Revert on failure
        setLiked(previousLiked);
        setLikeCount(previousCount);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-body">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading blog...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-body">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">
              {error || "Blog not found"}
            </p>
            <Link to="/explore" className="text-primary hover:underline">
              Browse other blogs →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-body">
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back to feed
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Blog Content */}
          <article className="flex-1 min-w-0">
            {/* Hero Image - Front Pic - Displayed ABOVE the title */}
            {blog.frontPic && (
              <div className="w-full aspect-video mb-6 rounded-xl overflow-hidden">
                <img
                  src={blog.frontPic}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-4 text-foreground">
              {blog.title}
            </h1>

            {/* Author row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
                  {getAuthorInitials()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {getAuthorName()}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(blog.createdAt)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {calculateReadTime(blog.content)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSaved(!saved)}
                className={`p-2 rounded-full transition-colors ${
                  saved
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags?.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="font-body text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {blog.category && (
                <Badge className="font-body text-xs font-normal bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                  {blog.category}
                </Badge>
              )}
            </div>

            {/* Content - Render JSON as HTML */}
            <div className="prose max-w-none">
              {contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
              ) : (
                <p className="text-muted-foreground">No content available</p>
              )}
            </div>

            {/* Engagement bar */}
            <div className="flex items-center gap-5 mt-10 pt-6 border-t border-border">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  liked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle size={20} />
                <span className="text-sm font-medium">{comments.length}</span>
              </button>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Share2 size={20} />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-[400px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] flex flex-col bg-comment rounded-xl border border-border shadow-sm">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">
                  Comments
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    ({comments.length})
                  </span>
                </h3>
              </div>

              {/* Scrollable comments */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-5"
                style={{ maxHeight: "calc(100vh - 240px)" }}
              >
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold text-secondary-foreground">
                      {comment.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground">
                          {comment.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/75 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Write comment */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
                    YO
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      placeholder="Write a comment..."
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ReadBlog;
