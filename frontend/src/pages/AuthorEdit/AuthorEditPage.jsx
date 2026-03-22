import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Upload,
  X,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Save,
  Loader,
  ChevronLeft,
} from "lucide-react";
import { blogAPI } from "../../utils/api";
import "./AuthorEditPage.css";

// Custom Image extension that preserves all attributes including data-id
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-id": {
        default: null,
        parseHTML: (element) => {
          const id = element.getAttribute("data-id");
          return id;
        },
        renderHTML: (attributes) => {
          if (!attributes["data-id"]) return {};
          return { "data-id": attributes["data-id"] };
        },
      },
    };
  },
});

export default function AuthorEditPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const limit = 2000;
  const frontPicInputRef = useRef(null);

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    category: "technology",
    tags: "",
  });

  const [frontPic, setFrontPic] = useState(null);
  const [frontPicPreview, setFrontPicPreview] = useState(null);

  // Initialize editor FIRST (before effects)
  const blogEditor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "blog-image",
          loading: "lazy",
        },
      }),
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
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(
          (item) => item.type.indexOf("image") === 0,
        );

        if (imageItems.length > 0) {
          event.preventDefault();
          imageItems.forEach(async (item) => {
            const file = item.getAsFile();
            await handleImageUpload(file);
          });
          return true;
        }
        return false;
      },
      handleDrop: async (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter(
          (file) => file.type.indexOf("image") === 0,
        );

        if (imageFiles.length > 0) {
          event.preventDefault();

          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (coordinates) {
            const { TextSelection } = await import("prosemirror-state");
            const transaction = view.state.tr.setSelection(
              new TextSelection(view.state.doc.resolve(coordinates.pos)),
            );
            view.dispatch(transaction);
          }

          for (const file of imageFiles) {
            await handleImageUpload(file);
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setFormData((form) => ({ ...form, content: editor.getJSON() }));
    },
  });

  // Fetch blog data
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await blogAPI.getForEdit(blogId);
        if (response.data.success) {
          const fetchedBlog = response.data.blog;
          setBlog(fetchedBlog);
          setFormData({
            title: fetchedBlog.title || "",
            category: fetchedBlog.category || "technology",
            tags: fetchedBlog.tags?.join(", ") || "",
          });
          if (fetchedBlog.frontPic) {
            setFrontPicPreview(fetchedBlog.frontPic);
          }
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError(err.response?.data?.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  // Load blog content into editor when blog is loaded
  useEffect(() => {
    if (blogEditor && blog && blog.content) {
      blogEditor.commands.setContent(blog.content);
    }
  }, [blog, blogEditor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFrontPicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontPic(file);
      const previewUrl = URL.createObjectURL(file);
      setFrontPicPreview(previewUrl);
    }
  };

  const handleRemoveFrontPic = () => {
    setFrontPic(null);
    if (frontPicPreview && !blog?.frontPic) {
      URL.revokeObjectURL(frontPicPreview);
    }
    setFrontPicPreview(null);
    if (frontPicInputRef.current) {
      frontPicInputRef.current.value = "";
    }
  };

  const uploadImage = async (file) => {
    const formDataObj = new FormData();
    formDataObj.append("image", file);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/upload/image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataObj,
      },
    );

    const data = await response.json();

    if (data.success) {
      const secureUrl = data.secure_url || data.url;
      return secureUrl;
    } else {
      throw new Error(data.error || data.message || "Upload failed");
    }
  };

  const handleImageUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      const localUrl = URL.createObjectURL(file);
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setPendingImages((prev) => [...prev, { id: imageId, file, localUrl }]);

      blogEditor
        .chain()
        .focus()
        .setImage({
          src: localUrl,
          alt: file.name || "Image",
          title: file.name || "Image",
          "data-id": imageId,
        })
        .run();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageButtonClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async () => {
      if (input.files) {
        const files = Array.from(input.files);
        for (const file of files) {
          await handleImageUpload(file);
        }
      }
    };

    input.click();
  };

  const handleSave = async (blogStatus = "draft") => {
    if (!formData.title || !formData.content) {
      setError("Please fill title and write content");
      return;
    }

    if (uploadingImages) {
      setError("Please wait for images to finish uploading");
      return;
    }

    setIsSaving(true);
    setError("");

    let finalContent = formData.content;

    if (pendingImages.length > 0) {
      setUploadingImages(true);
      try {
        const imageIdToUrlMap = {};
        let uploadFailed = false;

        for (const img of pendingImages) {
          try {
            const cloudinaryUrl = await uploadImage(img.file);
            imageIdToUrlMap[img.id] = cloudinaryUrl;
            URL.revokeObjectURL(img.localUrl);
          } catch (uploadErr) {
            uploadFailed = true;
          }
        }

        if (uploadFailed) {
          setError("Some images failed to upload. Please try again.");
          setUploadingImages(false);
          setIsSaving(false);
          return;
        }

        if (Object.keys(imageIdToUrlMap).length > 0) {
          let contentJson = JSON.parse(JSON.stringify(blogEditor.getJSON()));

          const replaceUrlsInJson = (node) => {
            if (node.type === "image") {
              const imageId = node.attrs?.["data-id"];
              if (imageId && imageIdToUrlMap[imageId]) {
                node.attrs.src = imageIdToUrlMap[imageId];
                delete node.attrs["data-id"];
              }
            }
            if (node.content) {
              node.content.forEach(replaceUrlsInJson);
            }
          };

          if (contentJson.content) {
            contentJson.content.forEach(replaceUrlsInJson);
          }

          blogEditor.commands.setContent(contentJson);
          finalContent = contentJson;
          setFormData((prev) => ({ ...prev, content: contentJson }));
        }

        setPendingImages([]);
      } catch (err) {
        setError("Failed to upload images. Please try again.");
        setIsSaving(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
    }

    try {
      const updateData = new FormData();
      updateData.append("title", formData.title);
      updateData.append("category", formData.category);
      updateData.append("tags", formData.tags);
      updateData.append("status", blogStatus);
      updateData.append("content", JSON.stringify(finalContent));

      if (frontPic) {
        updateData.append("coverImage", frontPic);
      }

      const response = await blogAPI.updateBlog(blogId, updateData);

      if (response.data.success) {
        setSuccessMessage("Blog saved successfully!");
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving blog:", err);
      setError(err.response?.data?.message || "Failed to save blog");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="author-edit-container">
        <div className="loading-container">
          <Loader className="loading-spinner" />
          <p>Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="author-edit-container">
        <p className="error-message">{error || "Blog not found"}</p>
      </div>
    );
  }

  return (
    <div className="author-edit-container">
      <div className="author-edit-header">
        <button
          className="btn-back"
          onClick={() => navigate("/profile")}
          title="Back to Profile"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div>
          <h1>Edit Blog</h1>
          <p className="blog-title-preview">{formData.title || "Untitled"}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-save"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            className="btn-publish"
            onClick={() => handleSave("published")}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <div className="author-edit-layout">
        {/* Left Column - Editor */}
        <div className="editor-column">
          <div className="editor-section">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Blog title"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="technology">Technology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="business">Business</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="health">Health</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., tech, innovation"
                  className="form-input"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="form-group">
              <label>Cover Image</label>
              {frontPicPreview ? (
                <div className="cover-preview">
                  <img src={frontPicPreview} alt="Cover" />
                  <button
                    type="button"
                    className="btn-remove-cover"
                    onClick={handleRemoveFrontPic}
                  >
                    <X size={16} />
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cover-upload">
                  <Upload size={32} />
                  <span>Click to upload cover image</span>
                  <input
                    type="file"
                    ref={frontPicInputRef}
                    onChange={handleFrontPicChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* Editor Toolbar */}
            <div className="editor-toolbar">
              <button
                onClick={() => blogEditor.chain().focus().toggleBold().run()}
                className={`toolbar-btn ${blogEditor.isActive("bold") ? "active" : ""}`}
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button
                onClick={() => blogEditor.chain().focus().toggleItalic().run()}
                className={`toolbar-btn ${blogEditor.isActive("italic") ? "active" : ""}`}
                title="Italic"
              >
                <Italic size={18} />
              </button>
              <button
                onClick={() =>
                  blogEditor.chain().focus().toggleUnderline().run()
                }
                className={`toolbar-btn ${blogEditor.isActive("underline") ? "active" : ""}`}
                title="Underline"
              >
                <UnderlineIcon size={18} />
              </button>
              <div className="toolbar-divider" />
              <button
                onClick={() =>
                  blogEditor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`toolbar-btn ${blogEditor.isActive("heading", { level: 2 }) ? "active" : ""}`}
                title="Heading 2"
              >
                <Heading2 size={18} />
              </button>
              <button
                onClick={() =>
                  blogEditor.chain().focus().toggleBulletList().run()
                }
                className={`toolbar-btn ${blogEditor.isActive("bulletList") ? "active" : ""}`}
                title="Bullet List"
              >
                <div style={{ fontSize: "18px" }}>•••</div>
              </button>
              <div className="toolbar-divider" />
              <button
                onClick={handleImageButtonClick}
                className="toolbar-btn"
                title="Upload Image"
              >
                <ImageIcon size={18} />
              </button>
            </div>

            {/* TipTap Editor */}
            <div className="editor-wrapper">
              <EditorContent editor={blogEditor} />
              {blogEditor && (
                <div className="character-count">
                  {blogEditor.storage.characterCount.characters()} /{limit}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Unapproved Content */}
        <div className="unapproved-column">
          <div className="unapproved-section">
            <h2>Unapproved Content</h2>
            <div className="unapproved-content">
              {/* Placeholder - to be filled with section approval status */}
              <p className="placeholder-text">
                No pending approvals at this time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
