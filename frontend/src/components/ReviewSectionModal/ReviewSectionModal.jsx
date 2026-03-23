import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  X,
  ThumbsUp,
  ThumbsDown,
  Loader,
  AlertCircle,
  Save,
} from "lucide-react";
import { blogAPI } from "../../utils/api";
import "./ReviewSectionModal.css";

// Custom Image extension that preserves all attributes
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes["data-id"]) return {};
          return { "data-id": attributes["data-id"] };
        },
      },
    };
  },
});

export default function ReviewSectionModal({
  section,
  blogId,
  onClose,
  onUpdate,
  isLoading = false,
}) {
  const [authorFeedback, setAuthorFeedback] = useState(section?.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const limit = 2000;

  /**
   * MASTER EDITOR (Left Panel)
   * Purpose: Displays approved live content, always editable by author
   * Initialize with: section.approvedContent
   */
  const masterEditor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "review-image", loading: "lazy" },
      }),
      Placeholder.configure({ placeholder: "Edit master content..." }),
      CharacterCount.configure({ limit }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-4 max-w-none border border-gray-300 rounded-md",
      },
    },
  });

  /**
   * DRAFT EDITOR (Right Panel)
   * Purpose: Displays collaborator draft, always editable by author
   * Initialize with: section.draftContent
   * On Approve: Right editor content → both approvedContent and draftContent
   * On Reject: Right editor content → draftContent (author's tweaks sent back)
   */
  const draftEditor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "review-image", loading: "lazy" },
      }),
      Placeholder.configure({ placeholder: "Collaborator draft..." }),
      CharacterCount.configure({ limit }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-4 max-w-none border border-gray-300 rounded-md",
      },
    },
  });

  // Initialize master editor with approvedContent
  useEffect(() => {
    if (masterEditor && section?.approvedContent) {
      const timer = setTimeout(() => {
        masterEditor.commands.setContent(section.approvedContent);
      }, 100);
      return () => clearTimeout(timer);
    } else if (masterEditor) {
      const timer = setTimeout(() => {
        masterEditor.commands.setContent("");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [section, masterEditor]);

  // Initialize draft editor with draftContent
  useEffect(() => {
    if (draftEditor && section?.draftContent) {
      const timer = setTimeout(() => {
        draftEditor.commands.setContent(section.draftContent);
      }, 100);
      return () => clearTimeout(timer);
    } else if (draftEditor) {
      const timer = setTimeout(() => {
        draftEditor.commands.setContent("");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [section, draftEditor]);

  /**
   * ACTION 1: APPROVE DRAFT
   * Workflow:
   * 1. Grab current JSON from RIGHT Editor (may contain author's tweaks)
   * 2. Send PUT with: { approvedContent, draftContent (same as approvedContent), status: 'approved', feedback: '' }
   * 3. Result: Draft goes live AND becomes the new baseline for collaborator's next edit
   */
  const handleApprove = async () => {
    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const rightEditorContent = draftEditor?.getJSON();

      await blogAPI.updateSectionContent(blogId, section.sectionId, {
        approvedContent: rightEditorContent,
        draftContent: rightEditorContent,
        status: "approved",
        feedback: authorFeedback,
      });

      setSuccess("Section approved successfully!");

      setTimeout(() => {
        onClose();
        onUpdate();
      }, 300);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve section");
      setIsSubmitting(false);
    }
  };

  /**
   * ACTION 2: REJECT / REQUEST CHANGES
   * Workflow:
   * 1. Grab current JSON from RIGHT Editor (author's fixes to the collaborator's work)
   * 2. Grab feedback text
   * 3. Send PUT with: { draftContent (author's tweaked version), status: 'rejected', feedback }
   * 4. Result: Author's fixes become the new draft for collaborator; they see exact edits
   */
  const handleReject = async () => {
    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const rightEditorContent = draftEditor?.getJSON();

      await blogAPI.updateSectionContent(blogId, section.sectionId, {
        draftContent: rightEditorContent,
        status: "rejected",
        feedback: authorFeedback,
      });

      setSuccess("Feedback sent to collaborator!");

      setTimeout(() => {
        onClose();
        onUpdate();
      }, 300);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send feedback");
      setIsSubmitting(false);
    }
  };
  /**
   * ACTION 3: SAVE MASTER EDITS (Silent Update)
   * Workflow:
   * 1. Grab current JSON from LEFT Editor (master version)
   * 2. Send PUT with ONLY: { approvedContent }
   * 3. Do NOT include status, draftContent, or feedback
   * 4. Result: Master version updates silently, collaborator workflow state preserved
   */
  const handleSaveMasterEdits = async () => {
    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const leftEditorContent = masterEditor?.getJSON();

      // Send ONLY approvedContent using the dedicated save-master endpoint
      await blogAPI.saveMasterContent(blogId, section.sectionId, {
        approvedContent: leftEditorContent,
      });

      setSuccess("Master version updated successfully!");

      // Don't close modal - just show success toast and refresh
      setIsSubmitting(false);
      // Optionally refresh parent to sync state
      setTimeout(() => {
        onUpdate();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save master edits");
      setIsSubmitting(false);
    }
  };
  const masterCharCount =
    masterEditor?.storage.characterCount.characters() || 0;
  const draftCharCount = draftEditor?.storage.characterCount.characters() || 0;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div
        className="review-modal-container two-way-editor"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="review-modal-header">
          <div>
            <h2 className="modal-title">{section?.title}</h2>
            <p className="modal-status">
              Status:{" "}
              <span className={`status-badge status-${section?.status}`}>
                {section?.status}
              </span>
            </p>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        {/* Main Content - Two Editors Side by Side, Always Visible & Editable */}
        <div className="review-modal-body two-way-body">
          {/* LEFT: Master Version (Approved Live Content) */}
          <div className="review-panel master-panel">
            <div className="panel-header">
              <h3>Master Version</h3>
              <span className="char-count">
                {masterCharCount}/{limit}
              </span>
            </div>
            <div className="editor-container">
              <EditorContent editor={masterEditor} />
            </div>
            {/* Save Master Edits Button - Silent Update */}
          </div>

          {/* RIGHT: Collaborator Draft (Always Visible & Editable by Author) */}
          <div className="review-panel draft-panel">
            <div className="panel-header">
              <h3>Collaborator Draft</h3>
              <span className="char-count">
                {draftCharCount}/{limit}
              </span>
            </div>
            <div className="editor-container">
              <EditorContent editor={draftEditor} />
            </div>
          </div>
        </div>

        {/* Bottom Section: Feedback & Action Buttons */}
        <div className="review-modal-actions">
          {/* Feedback textarea - always visible */}
          <div className="feedback-section">
            <label htmlFor="feedback" className="feedback-label">
              Feedback for Collaborator
            </label>
            <textarea
              id="feedback"
              className="feedback-textarea"
              value={authorFeedback}
              onChange={(e) => setAuthorFeedback(e.target.value)}
              placeholder="Leave constructive feedback or specific instructions for the collaborator..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <button
            className="save-master-btn"
            onClick={handleSaveMasterEdits}
            disabled={isSubmitting}
            title="Save master version edits directly (does not affect collaborator workflow)"
          >
            {isSubmitting ? <Loader size={16} /> : <Save size={16} />}
            {isSubmitting ? "Saving..." : "Save Master Edits"}
          </button>
          {/* Action Buttons */}
          <div className="action-buttons">
            <div>
              <button
                className="btn btn-success approve-btn"
                onClick={handleApprove}
                disabled={isSubmitting}
                title="Approve: Saves right editor content to both approvedContent and draftContent"
              >
                {isSubmitting ? <Loader size={18} /> : <ThumbsUp size={18} />}
                Approve Draft
              </button>
              <button
                className="btn btn-danger reject-btn"
                onClick={handleReject}
                disabled={isSubmitting}
                title="Reject: Saves right editor content to draftContent with feedback; author's tweaks become new draft"
              >
                {isSubmitting ? <Loader size={18} /> : <ThumbsDown size={18} />}
                Reject / Request Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
