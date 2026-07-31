import { useState, useEffect, useMemo, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { blogAPI, commentAPI } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  Clock,
  ChevronLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Bookmark,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";

// Helper function to convert TipTap content to HTML
const generateRichTextHtml = (contentData) => {
  if (!contentData) {
    return "";
  }

  // Check if it's already a valid HTML string (contains HTML tags)
  if (typeof contentData === "string") {
    // Check if it contains HTML tags
    const htmlRegex =
      /<(p|h[1-6]|div|span|strong|em|img|a|ul|ol|li|blockquote|code|pre|br)[^>]*>/i;
    if (htmlRegex.test(contentData)) {
      // It's already HTML, return as-is
      return contentData;
    }

    // Check if it's a URL (image or general URL)
    const isUrl = contentData.match(/^https?:\/\//);
    if (isUrl) {
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
        contentData.toLowerCase().includes(ext),
      );

      if (isImageUrl) {
        return `<img src="${contentData}" alt="Blog image" class="max-w-full h-auto rounded-lg" />`;
      } else {
        return `<a href="${contentData}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${contentData}</a>`;
      }
    }

    // Try to parse as JSON (TipTap format)
    try {
      const parsed = JSON.parse(contentData);
      if (parsed && typeof parsed === "object" && parsed.type) {
        const extensions = [StarterKit, Underline, Image];
        return generateHTML(parsed, extensions);
      }
    } catch (err) {
      // Not JSON, treat as plain text
      return `<p>${contentData.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }
  }

  // If it's already an object (TipTap JSON), convert to HTML
  if (typeof contentData === "object" && contentData !== null) {
    if (contentData.type) {
      try {
        const extensions = [StarterKit, Underline, Image];
        return generateHTML(contentData, extensions);
      } catch (err) {
        console.error("Error converting TipTap JSON to HTML:", err);
        return "";
      }
    }
  }

  return "";
};

const ReadBlog = () => {
  const { blogId } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [views, setViews] = useState(0);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

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
          setViews(response.data.blog.views || 0);
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

  // Fetch comments when blogId changes
  useEffect(() => {
    const fetchComments = async () => {
      if (!blogId) return;
      try {
        setCommentsLoading(true);
        const response = await commentAPI.getByBlogId(blogId);
        if (response.data.success) {
          setComments(response.data.comments || []);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
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
      }
    };

    fetchLikeStatus();
  }, [blogId, isAuthenticated]);

  // Convert JSON content to HTML using the helper function
  const mainContentHtml = useMemo(
    () => generateRichTextHtml(blog?.content),
    [blog?.content],
  );

  // Check if we have approved sections to render
  const approvedSections = useMemo(() => {
    if (!blog?.sections) return [];
    return blog.sections
      .filter((section) => section.status === "approved")
      .sort((a, b) => a.seqNo - b.seqNo);
  }, [blog?.sections]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const calculateReadTime = (content) => {
    if (!content) return "1 min read";
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    setCommentError("");
    try {
      const response = await commentAPI.create({
        content: newComment,
        blogId: blogId,
      });

      if (response.data.success) {
        setComments([response.data.comment, ...comments]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setCommentError(
        err.response?.data?.message ||
          "Failed to post comment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const response = await blogAPI.likeBlog(blogId);
      if (response.data.success) {
        const blogResponse = await blogAPI.getById(blogId);
        if (blogResponse.data.success) {
          setLikeCount(blogResponse.data.blog.likesCount || 0);
        }
      } else {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
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
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 bg-none border-none cursor-pointer p-0"
          title="Back"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          <article className="flex-1 min-w-0">
            {blog.frontPic && (
              <div className="w-full aspect-video mb-6 rounded-xl overflow-hidden">
                <img
                  src={blog.frontPic}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-4 text-foreground">
              {blog.title}
            </h1>

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

            {/* CONDITIONAL RENDERING: Either show compiled sections OR fallback to raw blog.content */}
            {/* 1. Render the Author's Main Content Unconditionally */}
            <div className="prose [&_img]:!w-full [&_img]:!max-h-[40vh] [&_img]:!object-contain [&_img]:!bg-gray-400 [&_img]:!rounded-md">
              {mainContentHtml && (
                <div dangerouslySetInnerHTML={{ __html: mainContentHtml }} />
              )}
            </div>

            {/* 2. Render the Approved Sections Below the Main Content */}
            {approvedSections.length > 0 && (
              <div className="article-sections-container mt-10">
                {approvedSections.map((section) => (
                  <div key={section.sectionId} className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 text-foreground">
                      {section.title}
                    </h2>
                    <div className="prose [&_img]:!w-full [&_img]:!max-h-[40vh] [&_img]:!object-contain [&_img]:!bg-gray-400 [&_img]:!rounded-md">
                      {section.approvedContent ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: generateRichTextHtml(
                              section.approvedContent,
                            ),
                          }}
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          No content available for this section
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-5 mt-10 pt-6 border-t border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Eye size={20} />
                <span className="text-sm font-medium">{views}</span>
              </span>
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

            {/* Table of Contents / Status Board at the bottom */}
            {blog.sections && blog.sections.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="font-display text-lg font-bold mb-4">
                  Blog Sections ({blog.sections.length})
                </h3>
                <div className="space-y-3">
                  {blog.sections.map((section, idx) => (
                    <div
                      key={section.sectionId}
                      className="p-3 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-foreground">
                              {section.title || `Section ${idx + 1}`}
                            </h2>
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary capitalize">
                              {section.status}
                            </span>
                          </div>
                          {section.assignedTo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assigned to: <strong>{section.assignedTo}</strong>
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          #{section.seqNo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-[400px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] flex flex-col bg-comment rounded-xl border border-border shadow-sm">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">
                  Comments
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    ({comments.length})
                  </span>
                </h3>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 space-y-5"
                style={{ maxHeight: "calc(100vh - 240px)" }}
              >
                {commentsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold text-secondary-foreground">
                        {comment.author?.profilePic ? (
                          <img
                            src={comment.author.profilePic}
                            alt={comment.author.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          comment.author?.name?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.author?.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/75 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    {commentError && (
                      <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                        {commentError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddComment()
                          }
                          placeholder="Write a comment..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submitting}
                          className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Please{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      login
                    </Link>{" "}
                    to comment
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ReadBlog;
