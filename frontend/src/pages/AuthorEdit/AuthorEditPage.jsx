import { useState, useRef, useEffect, useCallback } from "react";
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
  Save,
  Loader,
  ChevronLeft,
  Edit2,
  AlertCircle,
  CheckCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
} from "lucide-react";
import { blogAPI } from "../../utils/api";
import ReviewSectionModal from "../../components/ReviewSectionModal/ReviewSectionModal";
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
  const [selectedSection, setSelectedSection] = useState(null);

  // Simplified state - title is a separate variable for strict binding
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("technology");
  const [blogTags, setBlogTags] = useState("");
  const [authorMainContent, setAuthorMainContent] = useState(null);

  const [frontPic, setFrontPic] = useState(null);
  const [frontPicPreview, setFrontPicPreview] = useState(null);

  // Author content editor (for content field)
  const authorEditor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "blog-image", loading: "lazy" },
      }),
      Placeholder.configure({
        placeholder: "Write your main content here...",
      }),
      CharacterCount.configure({ limit }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-4 max-w-none",
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
          for (const file of imageFiles) {
            await handleImageUpload(file);
          }
          return true;
        }
        return false;
      },
      onUpdate: ({ editor }) => {
        setAuthorMainContent(editor.getJSON());
      },
    },
  });

  // Fetch blog data - Helper function (wrapped in useCallback to prevent re-renders)
  const fetchBlogData = useCallback(async () => {
    try {
      const response = await blogAPI.getForEdit(blogId);
      if (response.data.success) {
        console.log("[FETCH BLOG] Full response:", response.data);
        console.log("[FETCH BLOG] Content field:", response.data.blog.content);
        return response.data.blog;
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError(err.response?.data?.message || "Failed to load blog");
    }
    return null;
  }, [blogId]);

  // Fetch blog data on component mount
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const fetchedBlog = await fetchBlogData();
        if (fetchedBlog) {
          setBlog(fetchedBlog);
          setBlogTitle(fetchedBlog.title || "");
          setBlogCategory(fetchedBlog.category || "technology");
          setBlogTags(fetchedBlog.tags?.join(", ") || "");
          if (fetchedBlog.content) {
            setAuthorMainContent(fetchedBlog.content);
          }
          if (fetchedBlog.frontPic) {
            setFrontPicPreview(fetchedBlog.frontPic);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      fetchBlog();
    }
  }, [blogId, fetchBlogData]);

  // Load blog author content into editor when blog is loaded
  useEffect(() => {
    if (authorEditor && blog && blog.content) {
      // Wrap in setTimeout to ensure TipTap editor is fully initialized
      const timer = setTimeout(() => {
        authorEditor.commands.setContent(blog.content);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [blog, authorEditor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") setBlogTitle(value);
    else if (name === "category") setBlogCategory(value);
    else if (name === "tags") setBlogTags(value);
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

      authorEditor
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

  /**
   * Compiles final master content: authorMainContent + approved sections
   * Returns { htmlString, contentJson, hasContent }
   */
  const compileFinalMasterContent = () => {
    let compiledNodes = [];

    // Add author main content
    if (authorMainContent && authorMainContent.content) {
      compiledNodes = [...authorMainContent.content];
    }

    // Add approved sections
    const approvedSections = (blog?.sections || [])
      .filter((section) => section.status === "approved")
      .sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));

    approvedSections.forEach((section) => {
      if (section.title) {
        compiledNodes.push({
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: section.title }],
        });
      }
      if (section.approvedContent && section.approvedContent.content) {
        compiledNodes = [...compiledNodes, ...section.approvedContent.content];
      }
      compiledNodes.push({ type: "horizontalRule" });
    });

    const compiledContent = {
      type: "doc",
      content: compiledNodes,
    };

    // Helper to convert TipTap JSON to plain text
    const extractPlainText = (node) => {
      if (node.type === "text") return node.text || "";
      if (node.content) return node.content.map(extractPlainText).join("");
      return "";
    };

    const plainText = extractPlainText(compiledContent);

    return {
      htmlString: plainText,
      contentJson: compiledContent,
      hasContent: plainText.trim().length > 0 && plainText !== "<p></p>",
    };
  };

  // Save as draft - saves content field
  const handleSaveDraft = async () => {
    // NEW VALIDATION: Check title first
    if (!blogTitle.trim()) {
      setError("Blog title is required");
      return;
    }

    // NEW VALIDATION: Check final master content
    const { htmlString: finalMasterContent } = compileFinalMasterContent();
    if (!finalMasterContent.trim() || finalMasterContent === "<p></p>") {
      setError("Please write content for the blog");
      return;
    }

    if (uploadingImages) {
      setError("Please wait for images to finish uploading");
      return;
    }

    setIsSaving(true);
    setError("");

    // Always get current content from editor, not from state
    let finalContent = authorEditor?.getJSON() || authorMainContent;

    console.log("[SAVE DRAFT] Editor current JSON:", finalContent);

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
          let contentJson = JSON.parse(JSON.stringify(authorEditor.getJSON()));

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

          authorEditor.commands.setContent(contentJson);
          finalContent = contentJson;
          setAuthorMainContent(contentJson);
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
      updateData.append("title", blogTitle);
      updateData.append("category", blogCategory);
      updateData.append("tags", blogTags);
      updateData.append("status", "draft");

      console.log("[SAVE DRAFT] finalContent to be saved:", finalContent);
      console.log(
        "[SAVE DRAFT] authorMainContent from state:",
        authorMainContent,
      );
      updateData.append("content", JSON.stringify(finalContent));

      if (frontPic) {
        updateData.append("coverImage", frontPic);
      }

      const response = await blogAPI.updateBlog(blogId, updateData);

      if (response.data.success) {
        setSuccessMessage("Blog saved as draft successfully!");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish blog - compiles content with approved sections
  const handlePublish = async () => {
    // NEW VALIDATION: Check title first
    if (!blogTitle.trim()) {
      setError("Blog title is required");
      return;
    }

    // NEW VALIDATION: Check final master content
    const { contentJson: compiledContent } = compileFinalMasterContent();
    if (
      !compiledContent ||
      !compiledContent.content ||
      compiledContent.content.length === 0
    ) {
      setError("Please write content for the blog");
      return;
    }

    if (uploadingImages) {
      setError("Please wait for images to finish uploading");
      return;
    }

    setIsSaving(true);
    setError("");

    // Always get current content from editor, not from state
    let finalContent = authorEditor?.getJSON() || authorMainContent;

    console.log("[PUBLISH] Editor current JSON:", finalContent);

    // Upload pending images
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
          let contentJson = JSON.parse(JSON.stringify(authorEditor.getJSON()));

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

          authorEditor.commands.setContent(contentJson);
          finalContent = contentJson;
          setAuthorMainContent(contentJson);
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
      // Get the compiled content with approved sections
      const { contentJson: fullCompiledContent } = compileFinalMasterContent();

      // Send PUT request with compiled content
      const updateData = new FormData();
      updateData.append("title", blogTitle);
      updateData.append("category", blogCategory);
      updateData.append("tags", blogTags);
      updateData.append("status", "published");
      updateData.append("content", JSON.stringify(fullCompiledContent));

      if (frontPic) {
        updateData.append("coverImage", frontPic);
      }

      const response = await blogAPI.updateBlog(blogId, updateData);

      if (response.data.success) {
        setSuccessMessage("Blog published successfully!");
      }
    } catch (err) {
      console.error("Error publishing blog:", err);
      setError(err.response?.data?.message || "Failed to publish blog");
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
          onClick={() => window.history.back()}
          title="Back to Profile"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div>
          <h1>Edit Blog</h1>
          <p className="blog-title-preview">{blogTitle || "Untitled"}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-save"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            className="btn-publish"
            onClick={handlePublish}
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
                value={blogTitle}
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
                  value={blogCategory}
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
                  value={blogTags}
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
                onClick={() => authorEditor.chain().focus().toggleBold().run()}
                className={`toolbar-btn ${authorEditor.isActive("bold") ? "active" : ""}`}
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button
                onClick={() =>
                  authorEditor.chain().focus().toggleItalic().run()
                }
                className={`toolbar-btn ${authorEditor.isActive("italic") ? "active" : ""}`}
                title="Italic"
              >
                <Italic size={18} />
              </button>
              <button
                onClick={() =>
                  authorEditor.chain().focus().toggleUnderline().run()
                }
                className={`toolbar-btn ${authorEditor.isActive("underline") ? "active" : ""}`}
                title="Underline"
              >
                <UnderlineIcon size={18} />
              </button>
              <div className="toolbar-divider" />
              <button
                onClick={() =>
                  authorEditor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`toolbar-btn ${authorEditor.isActive("heading", { level: 2 }) ? "active" : ""}`}
                title="Heading 2"
              >
                <Heading2 size={18} />
              </button>
              <button
                onClick={() =>
                  authorEditor.chain().focus().toggleBulletList().run()
                }
                className={`toolbar-btn ${authorEditor.isActive("bulletList") ? "active" : ""}`}
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
              <EditorContent editor={authorEditor} />
              {authorEditor && (
                <div className="character-count">
                  {authorEditor.storage.characterCount.characters()} /{limit}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sections List */}
        <div className="sections-column">
          <div className="sections-section">
            <h2>Blog Sections</h2>
            <div className="sections-content">
              {!blog?.sections || blog.sections.length === 0 ? (
                <p className="placeholder-text">No sections in this blog.</p>
              ) : (
                <div className="sections-list">
                  {blog.sections.map((section) => (
                    <div
                      key={section.sectionId}
                      className={`section-card section-status-${section.status}`}
                    >
                      <div className="section-header">
                        <div className="section-info">
                          <h3 className="section-title">{section.title}</h3>
                          <p className="section-meta">
                            By:{" "}
                            <span className="section-assignee">
                              {section.assignedTo || "Unassigned"}
                            </span>
                          </p>
                        </div>
                        <span className={`status-badge ${section.status}`}>
                          {section.status}
                        </span>
                      </div>

                      <button
                        className="btn-review-section"
                        onClick={() => setSelectedSection(section)}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Section Modal */}
      {selectedSection && (
        <ReviewSectionModal
          section={selectedSection}
          blogId={blogId}
          onClose={() => setSelectedSection(null)}
          onUpdate={fetchBlogData}
        />
      )}
    </div>
  );
}
