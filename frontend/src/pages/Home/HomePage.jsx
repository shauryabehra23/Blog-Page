import { Link } from "react-router-dom";
import { PenLine, Compass, Sparkles, ChevronDown } from "lucide-react";
import BlogCard from "../../components/BlogCard/BlogCard";
import heroBg from "../../assets/images/hero-bg.jpg";
import blog1Img from "../../assets/images/blog-1.jpg";
import blog2Img from "../../assets/images/blog-2.jpg";

const featuredBlogs = [
  {
    id: 1,
    title: "Welcome to My Blog",
    author: "You",
    excerpt:
      "Share your thoughts and ideas with the world. Start your journey of creative expression today.",
    date: "2024-01-20",
    image: blog1Img,
  },
  {
    id: 2,
    title: "Building with Modern Tech",
    author: "You",
    excerpt:
      "Explore the latest technologies and frameworks shaping the future of web development.",
    date: "2024-01-19",
    image: blog2Img,
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[93vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover "
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div className="absolute inset-0 bg-[hsl(var(--hero-overlay)/0.7)]" />

        <div
          className="relative z-10 text-center px-6 max-w-3xl mx-auto"
          style={{ animation: "slide-up 0.8s ease-out both" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles size={14} />
            Your Creative Space
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="text-[hsl(210_40%_98%)]">Stories that</span>
            <br />
            <span className="text-gradient-gold">Inspire</span>
          </h1>

          <p className="text-lg text-[hsl(210_40%_98%/0.7)] max-w-xl mx-auto mb-10 leading-relaxed font-light">
            Share your stories, ideas, and insights with a community that
            listens.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/add-blog"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:shadow-gold transition-all duration-300 hover:scale-105"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              <PenLine size={16} />
              Start Writing
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[hsl(210_40%_98%/0.2)] text-[hsl(210_40%_98%/0.8)] font-medium text-sm hover:bg-[hsl(210_40%_98%/0.1)] transition-all duration-300"
            >
              <Compass size={16} />
              Explore Blogs
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce text-[hsl(210_40%_98%/0.4)]">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div
          className="text-center mb-14"
          style={{ animation: "slide-up 0.6s ease-out 0.2s both" }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Curated for you
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Featured Blogs
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-5" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {featuredBlogs.map((blog, i) => (
            <BlogCard key={blog.id} blog={blog} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-secondary" />
        <div
          className="relative z-10 max-w-2xl mx-auto text-center px-6"
          style={{ animation: "slide-up 0.6s ease-out both" }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-foreground mb-4">
            Discover More Stories
          </h2>
          <p className="text-secondary-foreground/60 mb-10 text-lg font-light">
            Dive into a world of perspectives from our community
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:shadow-gold transition-all duration-300 hover:scale-105"
          >
            <Compass size={16} />
            Browse All Blogs
          </Link>
        </div>
      </section>
    </div>
  );
}
