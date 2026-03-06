import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useNavigate } from "react-router-dom";
import { blogAPI } from "../../utils/api";
import "./AddBlogPage.css";

export default function AddBlogPage() {
  const limit = 2000;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "technology",
    tags: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const blogEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Write your story here...",
      }),
      CharacterCount.configure({
        limit: limit,
      }),
    ],
    content: ``,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[300px] p-4 max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      setFormData((form) => ({ ...form, content: editor.getHTML() }));
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditorEmpty = blogEditor?.getText().trim().length === 0;

    if (!formData.title || isEditorEmpty) {
      setError("Please fill in all required fields (Title and Content)");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await blogAPI.create(formData);

      if (response.data.success) {
        setSuccessMessage("Blog published successfully!");
        setTimeout(() => {
          navigate("/");
        }, 1500);

        setFormData({
          title: "",
          content: "",
          category: "technology",
          tags: "",
        });
        blogEditor.commands.setContent("");
      }
    } catch (err) {
      console.error("Error creating blog:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create blog. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!blogEditor)
    return (
      <p className="p-10 text-center text-gray-500 font-medium">
        Loading Editor...
      </p>
    );

  const percentage = Math.round(
    (100 / limit) * blogEditor.storage.characterCount.characters(),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center uppercase tracking-tight">
          Create New Blog
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded animate-pulse">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded animate-pulse">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="title"
              className="font-semibold text-gray-700 text-sm italic"
            >
              Blog Title *
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a catchy title"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="category"
              className="font-semibold text-gray-700 text-sm italic"
            >
              Category
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="technology">Technology</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 text-sm italic">
              Content *
            </label>

            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
                <ToolbarButton
                  onClick={() =>
                    blogEditor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  active={blogEditor.isActive("heading", { level: 2 })}
                  label="H2"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() => blogEditor.chain().focus().toggleBold().run()}
                  active={blogEditor.isActive("bold")}
                  label="B"
                  className="font-bold"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() =>
                    blogEditor.chain().focus().toggleItalic().run()
                  }
                  active={blogEditor.isActive("italic")}
                  label="I"
                  className="italic"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() =>
                    blogEditor.chain().focus().toggleUnderline().run()
                  }
                  active={blogEditor.isActive("underline")}
                  label="U"
                  className="underline"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() =>
                    blogEditor.chain().focus().toggleBulletList().run()
                  }
                  active={blogEditor.isActive("bulletList")}
                  label="List"
                  disabled={isLoading}
                />
              </div>

              <EditorContent editor={blogEditor} />

              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs font-medium text-gray-500">
                <div className="flex gap-4">
                  <span>{blogEditor.storage.characterCount.words()} words</span>
                  <span
                    className={
                      percentage === 100 ? "text-red-500 font-bold" : ""
                    }
                  >
                    {blogEditor.storage.characterCount.characters()} / {limit}{" "}
                    characters
                  </span>
                </div>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${percentage === 100 ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="tags"
              className="font-semibold text-gray-700 text-sm italic"
            >
              Tags
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. react, web, coding"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-lg shadow-lg transition duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              blogEditor.storage.characterCount.characters() > limit ||
              isLoading
            }
          >
            {isLoading ? "Publishing..." : "Publish Blog"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded text-sm transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-inner"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
      } ${className} disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
