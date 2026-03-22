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
  Send,
  Loader,
  ChevronLeft,
} from "lucide-react";
import { blogAPI } from "../../utils/api";
import "./CollaboratorEditPage.css";

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

export default function CollaboratorEditPage() {
  const { blogId, sectionId } = useParams();
  const navigate = useNavigate();
  const limit = 2000;

  const [blog, setBlog] = useState(null);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [askingForApproval, setAskingForApproval] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  const [sectionContent, setSectionContent] = useState({
    content: null,
  });

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
        placeholder: "Write your section content here...",
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
      setSectionContent({ content: editor.getJSON() });
    },
  });

  // Fetch blog and find section
  useEffect(() => {
    const fetchBlogAndSection = async () => {
      try {
        setLoading(true);
        const response = await blogAPI.getForEdit(blogId);
        if (response.data.success) {
          const fetchedBlog = response.data.blog;
          setBlog(fetchedBlog);

          // Find the section with matching sectionId
          const foundSection = fetchedBlog.sections?.find(
            (s) => s.sectionId === sectionId,
          );

          if (!foundSection) {
            setError("Section not found");
            return;
          }

          setSection(foundSection);
          setSectionContent({
            content: foundSection.content || null,
          });
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError(err.response?.data?.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    if (blogId && sectionId) {
      fetchBlogAndSection();
    }
  }, [blogId, sectionId]);

  // Load section content into editor when section is loaded
  useEffect(() => {
    if (blogEditor && section && section.content) {
      blogEditor.commands.setContent(section.content);
    }
  }, [section, blogEditor]);

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

  const handleSaveDraft = async () => {
    if (!sectionContent.content) {
      setError("Please write some content");
      return;
    }

    setSavingDraft(true);
    setError("");

    let finalContent = sectionContent.content;

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
          setSavingDraft(false);
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
          setSectionContent({ content: contentJson });
        }

        setPendingImages([]);
      } catch (err) {
        setError("Failed to upload images. Please try again.");
        setSavingDraft(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
    }

    try {
      const response = await blogAPI.updateSectionContent(blogId, sectionId, {
        content: finalContent,
        status: "in-progress",
      });

      if (response.data.success) {
        setSuccessMessage("Draft saved successfully!");
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleAskForApproval = async () => {
    if (!sectionContent.content) {
      setError("Please write some content");
      return;
    }

    setAskingForApproval(true);
    setError("");

    let finalContent = sectionContent.content;

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
          setAskingForApproval(false);
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
          setSectionContent({ content: contentJson });
        }

        setPendingImages([]);
      } catch (err) {
        setError("Failed to upload images. Please try again.");
        setAskingForApproval(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
    }

    try {
      const response = await blogAPI.requestSectionApproval(blogId, sectionId, {
        content: finalContent,
        status: "pending",
      });

      if (response.data.success) {
        setSuccessMessage("Approval request sent!");
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (err) {
      console.error("Error requesting approval:", err);
      setError(err.response?.data?.message || "Failed to request approval");
    } finally {
      setAskingForApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="collab-edit-container">
        <div className="loading-container">
          <Loader className="loading-spinner" />
          <p>Loading section...</p>
        </div>
      </div>
    );
  }

  if (!blog || !section) {
    return (
      <div className="collab-edit-container">
        <p className="error-message">{error || "Section not found"}</p>
      </div>
    );
  }

  return (
    <div className="collab-edit-container">
      <div className="collab-edit-header">
        <button
          className="btn-back"
          onClick={() => navigate("/profile")}
          title="Back to Profile"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="header-content">
          <h1>Edit Section</h1>
          <p className="section-info">
            <span className="blog-name">{blog.title}</span>
            {" • "}
            <span className="section-name">{section.title}</span>
          </p>
        </div>
        <div className="header-status">
          <span className={`status-badge status-${section.status}`}>
            {section.status}
          </span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <div className="collab-edit-content">
        {/* Section Title */}
        <div className="section-title-box">
          <h2>{section.title}</h2>
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
            onClick={() => blogEditor.chain().focus().toggleUnderline().run()}
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
            onClick={() => blogEditor.chain().focus().toggleBulletList().run()}
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

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-draft"
            onClick={handleSaveDraft}
            disabled={savingDraft || askingForApproval}
          >
            <Save size={16} />
            {savingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button
            className="btn-approval"
            onClick={handleAskForApproval}
            disabled={savingDraft || askingForApproval}
          >
            <Send size={16} />
            {askingForApproval ? "Sending..." : "Ask for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
