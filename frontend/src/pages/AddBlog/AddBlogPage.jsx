import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useNavigate } from "react-router-dom";
import { blogAPI } from "../../utils/api";
import {
  Upload,
  X,
  Image as ImageIcon,
  List,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
} from "lucide-react";
import "./AddBlogPage.css";

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

export default function AddBlogPage() {
  const limit = 2000;
  const navigate = useNavigate();
  const frontPicInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "technology",
    tags: "",
    collaboratorEmails: "",
  });

  const [frontPic, setFrontPic] = useState(null);
  const [frontPicPreview, setFrontPicPreview] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

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
    if (frontPicPreview) {
      URL.revokeObjectURL(frontPicPreview);
    }
    setFrontPicPreview(null);
    if (frontPicInputRef.current) {
      frontPicInputRef.current.value = "";
    }
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/upload/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        const secureUrl = data.secure_url || data.url;
        return secureUrl;
      } else {
        throw new Error(data.error || data.message || "Upload failed");
      }
    } catch (error) {
      throw error;
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

      setPendingImages((prev) => {
        const updated = [...prev, { id: imageId, file, localUrl }];
        return updated;
      });

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
      // Error handling without logs
    }
  };

  const blogEditor = useEditor({
    extensions: [
      StarterKit,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEditorEmpty = blogEditor?.getText().trim().length === 0;

    if (!formData.title || isEditorEmpty) {
      setError("Please fill in all required fields (Title and Content)");
      return;
    }

    if (uploadingImages) {
      setError("Please wait for images to finish uploading");
      return;
    }

    setError("");
    setIsLoading(true);

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
          setIsLoading(false);
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
        setIsLoading(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", JSON.stringify(finalContent));
      formDataToSend.append("category", formData.category);
      formDataToSend.append("tags", formData.tags);

      if (formData.collaboratorEmails) {
        formDataToSend.append(
          "collaboratorEmails",
          formData.collaboratorEmails,
        );
      }

      if (frontPic) {
        formDataToSend.append("coverImage", frontPic);
      }

      const response = await blogAPI.create(formDataToSend);

      if (response.data.success) {
        setSuccessMessage("Blog published successfully!");
        setTimeout(() => {
          navigate("/explore");
        }, 1500);

        setFormData({
          title: "",
          content: "",
          category: "technology",
          tags: "",
          collaboratorEmails: "",
        });
        blogEditor.commands.setContent("");
        handleRemoveFrontPic();
        setPendingImages([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create blog. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  const clearSuccess = () => {
    setSuccessMessage("");
  };

  if (!blogEditor) {
    return (
      <p className="p-10 text-center text-gray-500 font-medium">
        Loading Editor...
      </p>
    );
  }

  const percentage = Math.round(
    (100 / limit) * blogEditor.storage.characterCount.characters(),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg animate-slide-up flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-4 text-red-500 hover:text-red-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg animate-slide-up flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">{successMessage}</p>
            </div>
            <button
              onClick={clearSuccess}
              className="ml-4 text-green-500 hover:text-green-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {uploadingImages && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-lg animate-slide-up">
            <p className="font-medium">Uploading images... Please wait.</p>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center uppercase tracking-tight">
          Create New Blog
        </h1>

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
            <label className="font-semibold text-gray-700 text-sm italic">
              Cover Image
            </label>
            <input
              type="file"
              ref={frontPicInputRef}
              accept="image/*"
              onChange={handleFrontPicChange}
              className="hidden"
            />
            {frontPicPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={frontPicPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveFrontPic}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  frontPicInputRef.current?.click();
                }}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload cover image
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 1200x630px
                </p>
              </div>
            )}
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
                  onClick={() => {
                    blogEditor
                      .chain()
                      .focus()
                      .toggleHeading({ level: 2 })
                      .run();
                  }}
                  active={blogEditor.isActive("heading", { level: 2 })}
                  icon={<Heading2 size={18} />}
                  label="Heading"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() => {
                    blogEditor.chain().focus().toggleBold().run();
                  }}
                  active={blogEditor.isActive("bold")}
                  icon={<Bold size={18} />}
                  label="Bold"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() => {
                    blogEditor.chain().focus().toggleItalic().run();
                  }}
                  active={blogEditor.isActive("italic")}
                  icon={<Italic size={18} />}
                  label="Italic"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() => {
                    blogEditor.chain().focus().toggleUnderline().run();
                  }}
                  active={blogEditor.isActive("underline")}
                  icon={<UnderlineIcon size={18} />}
                  label="Underline"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={() => {
                    blogEditor.chain().focus().toggleBulletList().run();
                  }}
                  active={blogEditor.isActive("bulletList")}
                  icon={<List size={18} />}
                  label="Bullet List"
                  disabled={isLoading}
                />
                <ToolbarButton
                  onClick={handleImageButtonClick}
                  active={false}
                  icon={<ImageIcon size={18} />}
                  label="Insert Image"
                  disabled={isLoading}
                  title="Click to upload images"
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

            <p className="text-xs text-gray-400 mt-1">
              💡 Tip: You can drag & drop images or paste them directly from
              clipboard (Ctrl+V)
            </p>
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
              placeholder="Tags (use 'incomplete' if unfinished, comma-separated)"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="collaboratorEmails"
              className="font-semibold text-gray-700 text-sm italic"
            >
              Collaborator Emails (comma separated)
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              type="email"
              id="collaboratorEmails"
              name="collaboratorEmails"
              value={formData.collaboratorEmails}
              onChange={handleChange}
              placeholder="user@example.com, friend@example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Emails will receive invite after publish
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-lg shadow-lg transition duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              blogEditor.storage.characterCount.characters() > limit ||
              isLoading ||
              uploadingImages
            }
          >
            {isLoading
              ? "Publishing..."
              : uploadingImages
                ? "Uploading Images..."
                : "Publish Blog"}
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
  title = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 rounded text-sm transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-inner"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
      } ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
