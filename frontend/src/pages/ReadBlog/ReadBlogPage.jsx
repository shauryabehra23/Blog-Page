// import { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import { blogAPI } from "../../utils/api";

// // Mock comments data - using mock data as requested
// const commentsData = [
//   {
//     id: 1,
//     author: "Alex Rivera",
//     avatar: "AR",
//     time: "2 hours ago",
//     text: "Great article! The chaos engineering section really resonated with me. We started doing game days at our company and it's been transformative.",
//   },
//   {
//     id: 2,
//     author: "Priya Sharma",
//     avatar: "PS",
//     time: "4 hours ago",
//     text: "The human element part is so underrated. We had a major outage last year and the blameless postmortem culture saved us.",
//   },
//   {
//     id: 3,
//     author: "Jordan Lee",
//     avatar: "JL",
//     time: "6 hours ago",
//     text: "Would love to see a follow-up on specific tooling recommendations for observability. What do you use for distributed tracing?",
//   },
//   {
//     id: 4,
//     author: "Emma Watson",
//     avatar: "EW",
//     time: "1 day ago",
//     text: "Circuit breakers changed our microservices architecture completely. Highly recommend Resilience4j for JVM-based systems.",
//   },
//   {
//     id: 5,
//     author: "Marcus Cole",
//     avatar: "MC",
//     time: "1 day ago",
//     text: "Fascinating read. I'd add that contract testing between services is another crucial piece of the resilience puzzle.",
//   },
//   {
//     id: 6,
//     author: "Yuki Tanaka",
//     avatar: "YT",
//     time: "2 days ago",
//     text: "The ship bulkhead analogy is perfect. Makes it so much easier to explain to stakeholders why we need service isolation.",
//   },
// ];

// const ReadBlogPage = () => {
//   const { blogId } = useParams();
//   const [blog, setBlog] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [newComment, setNewComment] = useState("");
//   const [comments, setComments] = useState(commentsData);

//   // Fetch blog data by ID
//   useEffect(() => {
//     const fetchBlog = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
//         const response = await blogAPI.getById(blogId);
//         if (response.data.success) {
//           setBlog(response.data.blog);
//         } else {
//           setError("Blog not found");
//         }
//       } catch (err) {
//         console.error("Error fetching blog:", err);
//         setError("Failed to load blog. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (blogId) {
//       fetchBlog();
//     }
//   }, [blogId]);

//   const formatDate = (dateString) => {
//     const options = { year: "numeric", month: "long", day: "numeric" };
//     return new Date(dateString).toLocaleDateString("en-US", options);
//   };

//   const calculateReadTime = (content) => {
//     if (!content) return "1 min read";
//     // Estimate 200 words per minute
//     const text =
//       typeof content === "string" ? content : JSON.stringify(content);
//     const wordCount = text.split(/\s+/).length;
//     const minutes = Math.ceil(wordCount / 200);
//     return `${minutes} min read`;
//   };

//   const handleAddComment = () => {
//     if (!newComment.trim()) return;
//     setComments([
//       {
//         id: Date.now(),
//         author: "You",
//         avatar: "YO",
//         time: "Just now",
//         text: newComment,
//       },
//       ...comments,
//     ]);
//     setNewComment("");
//   };

//   // Get author name from blog data
//   const getAuthorName = () => {
//     if (!blog?.author) return "Unknown Author";
//     if (typeof blog.author === "string") return blog.author;
//     return blog.author.name || "Unknown Author";
//   };

//   // Get author initials for avatar
//   const getAuthorInitials = () => {
//     const name = getAuthorName();
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   // Parse blog content
//   const getContentArray = () => {
//     if (!blog?.content) return [];
//     if (Array.isArray(blog.content)) return blog.content;
//     if (typeof blog.content === "string") {
//       // If it's HTML, split by paragraphs or headers
//       return blog.content.split(/(?=<h[1-6]>)|(?=<p>)/).filter(Boolean);
//     }
//     // If it's an object with blocks/ops, try to extract text
//     return [JSON.stringify(blog.content)];
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background font-body">
//         <main className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//             <p className="text-muted-foreground">Loading blog...</p>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background font-body">
//         <main className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
//             <p className="text-muted-foreground mb-4">{error}</p>
//             <Link to="/explore" className="text-primary hover:underline">
//               Browse other blogs →
//             </Link>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-background font-body">
//       <main className="flex-1 container mx-auto px-4 py-8">
//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Blog Content */}
//           <article className="flex-1 min-w-0">
//             <div className="prose max-w-none">
//               {/* Render content based on type */}
//               {typeof blog.content === "string" ? (
//                 <div dangerouslySetInnerHTML={{ __html: blog.content }} />
//               ) : Array.isArray(blog.content) ? (
//                 blog.content.map((para, i) => {
//                   if (typeof para === "string" && para.startsWith("## ")) {
//                     return (
//                       <h2
//                         key={i}
//                         className="font-display text-xl font-bold mt-8 mb-3 text-foreground"
//                       >
//                         {para.replace("## ", "")}
//                       </h2>
//                     );
//                   }
//                   return (
//                     <p
//                       key={i}
//                       className="text-foreground/80 leading-relaxed mb-4 text-[15px]"
//                     >
//                       {typeof para === "string" ? para : JSON.stringify(para)}
//                     </p>
//                   );
//                 })
//               ) : (
//                 <p className="text-foreground/80 leading-relaxed mb-4 text-[15px]">
//                   {JSON.stringify(blog.content)}
//                 </p>
//               )}
//             </div>

//             <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
//               <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
//                 <span>♥</span>
//                 <span className="text-sm">{blog.likesCount || 0}</span>
//               </button>
//               <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
//                 <span>💬</span>
//                 <span className="text-sm">{comments.length}</span>
//               </button>
//               <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
//                 <span>🔗</span> <span className="text-sm">Share</span>
//               </button>
//             </div>
//           </article>

//           {/* Blog Sidebar - Sticky */}
//           <aside className="w-full lg:w-[380px] lg:flex-shrink-0">
//             <div className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] flex flex-col gap-6">
//               {/* Blog Info Card */}
//               <div className="bg-card rounded-lg border border-border p-6">
//                 <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-4 text-foreground">
//                   {blog.title}
//                 </h1>

//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
//                     {getAuthorInitials()}
//                   </div>
//                   <div>
//                     <p className="font-semibold text-sm">{getAuthorName()}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {formatDate(blog.createdAt)} ·{" "}
//                       {calculateReadTime(blog.content)}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {blog.tags?.map((tag, i) => (
//                     <span
//                       key={i}
//                       className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
//                     >
//                       {tag}
//                     </span>
//                   ))}
//                   {blog.category && (
//                     <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full capitalize">
//                       {blog.category}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* Comments Section */}
//               <div className="flex flex-col bg-comment rounded-lg border border-border">
//                 <div className="p-4 border-b border-border">
//                   <h3 className="font-display text-lg font-bold">
//                     Comments ({comments.length})
//                   </h3>
//                 </div>

//                 {/* Scrollable comments */}
//                 <div
//                   className="flex-1 overflow-y-auto p-4 space-y-4"
//                   style={{ maxHeight: "calc(100vh - 400px)" }}
//                 >
//                   {comments.map((comment) => (
//                     <div key={comment.id} className="flex gap-3">
//                       <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-semibold text-secondary-foreground">
//                         {comment.avatar}
//                       </div>
//                       <div className="min-w-0">
//                         <div className="flex items-baseline gap-2">
//                           <span className="font-semibold text-sm">
//                             {comment.author}
//                           </span>
//                           <span className="text-xs text-muted-foreground">
//                             {comment.time}
//                           </span>
//                         </div>
//                         <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
//                           {comment.text}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Write comment input */}
//                 <div className="p-4 border-t border-border">
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       value={newComment}
//                       onChange={(e) => setNewComment(e.target.value)}
//                       onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
//                       placeholder="Write a comment..."
//                       className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
//                     />
//                     <button
//                       onClick={handleAddComment}
//                       className="bg-primary text-primary-foreground rounded-md px-3 py-2 hover:opacity-90 transition-opacity"
//                     >
//                       ➤
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </aside>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default ReadBlogPage;
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Bookmark,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/badge";

const blogData = {
  title: "The Art of Building Resilient Software Systems",
  author: "Sarah Chen",
  date: "March 2, 2026",
  readTime: "8 min read",
  coverImage:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  tags: ["Software Engineering", "Distributed Systems", "DevOps"],
  category: "Technology",
  content: [
    "Software engineering is as much about anticipating failure as it is about building features. In a world where distributed systems span continents and serve millions of users simultaneously, resilience isn't a luxury — it's a necessity.",
    "When we talk about resilient systems, we're really talking about systems that can absorb shocks. A server goes down. A database becomes unreachable. A third-party API starts returning errors. In each case, a resilient system doesn't just crash — it degrades gracefully, retries intelligently, and recovers automatically.",
    "## Circuit Breakers and Bulkheads",
    'Two patterns from Michael Nygard\'s "Release It!" stand out as foundational. The circuit breaker pattern prevents cascading failures by stopping calls to a failing service once a threshold is reached. Like an electrical circuit breaker, it trips to protect the rest of the system.',
    "The bulkhead pattern isolates components so that if one fails, it doesn't take down everything else. Think of it like the compartments in a ship — if one floods, the others keep the vessel afloat.",
    "## Observability Over Monitoring",
    "Traditional monitoring tells you when something is wrong. Observability tells you why. By instrumenting your code with structured logs, distributed traces, and meaningful metrics, you create a system that can be interrogated in ways you didn't anticipate when you wrote it.",
    "The three pillars of observability — logs, metrics, and traces — work together to give you a comprehensive view. But the real power comes from correlation: being able to follow a single request across dozens of services and see exactly where things went wrong.",
    "## Chaos Engineering",
    "Netflix popularized chaos engineering with their Chaos Monkey, which randomly terminates instances in production. The idea is simple but powerful: if you want to build confidence in your system's resilience, test it by breaking things on purpose.",
    "Start small. Inject latency into a single service. Kill a database replica. Simulate a network partition. Each experiment teaches you something about your system's actual behavior under stress, as opposed to its theoretical behavior.",
    "## The Human Element",
    "No discussion of resilience is complete without acknowledging the human element. Runbooks, incident response procedures, blameless postmortems — these are the social technologies that make technical resilience possible. A system is only as resilient as the team that operates it.",
    "Building resilient software is a journey, not a destination. Every incident is a learning opportunity, every failure a chance to improve. The goal isn't to eliminate failure — it's to ensure that when failure happens, it's boring.",
  ],
  likes: 142,
};

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
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(commentsData);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(blogData.likes);
  const [saved, setSaved] = useState(false);

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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

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
            {/* Cover image */}
            <div className="relative rounded-xl overflow-hidden mb-8">
              <img
                src={blogData.coverImage}
                alt="Blog cover"
                className="w-full h-64 md:h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
            </div>

            {/* Author row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
                  SC
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {blogData.author}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{blogData.date}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {blogData.readTime}
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

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-4 text-foreground">
              {blogData.title}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {blogData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="font-body text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
              <Badge className="font-body text-xs font-normal bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                {blogData.category}
              </Badge>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              {blogData.content.map((para, i) => {
                if (para.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="font-display text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-full"
                    >
                      {para.replace("## ", "")}
                    </h2>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-foreground/80 leading-[1.8] mb-5 text-[15px]"
                  >
                    {para}
                  </p>
                );
              })}
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
