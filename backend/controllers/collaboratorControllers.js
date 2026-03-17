const crypto = require("crypto");
const CollaboratorBlog = require("../models/Collaborator-Blog");
const Blog = require("../models/Blog");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCollaborationInvites = async (blogId, emailsArray, blogOwner) => {
  console.log("\n--- [COLLAB - sendCollaborationInvites] START ---");
  console.log("[COLLAB] blogId:", blogId);
  console.log("[COLLAB] emailsArray received:", emailsArray);
  console.log("[COLLAB] blogOwner:", blogOwner?.email || "Unknown");

  try {
    console.log("[COLLAB] Fetching blog from DB...");
    const blog = await Blog.findById(blogId).populate("author", "name email");

    if (!blog) {
      console.error("[COLLAB] ERROR: Blog not found in DB:", blogId);
      throw new Error("Blog not found");
    }

    console.log(
      "[COLLAB] Found blog:",
      blog.title,
      "| Author:",
      blog.author?.name || "Unknown",
    );

    const results = [];

    for (const email of emailsArray) {
      console.log(`\n[COLLAB] --- Processing email: ${email} ---`);

      if (!email || !email.trim()) {
        console.warn("[COLLAB] Skipping empty email string");
        results.push({ email, status: "skipped_empty" });
        continue;
      }

      const trimmedEmail = email.trim();

      if (trimmedEmail === blogOwner.email) {
        console.warn(
          "[COLLAB] Skipping self invite to blog owner:",
          trimmedEmail,
        );
        results.push({ email: trimmedEmail, status: "skipped_self" });
        continue;
      }

      console.log(
        "[COLLAB] Checking for existing invite in DB for:",
        trimmedEmail,
      );
      const existing = await CollaboratorBlog.findOne({
        blog: blogId,
        collaboratorEmail: trimmedEmail,
      });

      if (existing) {
        console.warn("[COLLAB] Invite already exists for:", trimmedEmail);
        results.push({
          email: trimmedEmail,
          status: "already_invited",
          inviteId: existing._id,
        });
        continue;
      }

      console.log("[COLLAB] No existing invite found. Generating token...");

      const inviteToken = crypto.randomBytes(32).toString("hex");

      console.log("[COLLAB] Creating new CollaboratorBlog record...");
      const collab = new CollaboratorBlog({
        blog: blogId,
        blogTitle: blog.title,
        collaboratorEmail: trimmedEmail,
        user: blog.author._id,
        inviteToken,
        status: "pending",
      });

      await collab.save();
      console.log(
        "[COLLAB] Record saved! inviteToken (first 8):",
        inviteToken.substring(0, 8),
      );

      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;
      console.log("[COLLAB] Generated Accept URL:", acceptUrl);
      console.log(
        `[COLLAB] Handing off to Nodemailer API for: ${trimmedEmail}...`,
      );

      try {
        await transporter.sendMail({
          // ✅ FIX 1: Send FROM your new app email
          from: `"Quillr Invites" <${process.env.EMAIL_USER}>`,
          // ✅ FIX 2: Replies go to the user who sent the invite
          replyTo: blogOwner.email,
          to: trimmedEmail,
          subject: `Collaboration Invite: ${blog.title}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Blog Collaboration Invite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; font-size: 14px; color: #666; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📝 Collaboration Invite</h1>
  </div>
  <div class="content">
    <p>Hi there,</p>
    <p><strong>${blogOwner.name}</strong> has invited you to collaborate on their blog post:</p>
    <h2 style="color: #667eea;">"${blog.title}"</h2>
    <p>Click the button below to accept the invitation and become a collaborator:</p>
    <a href="${acceptUrl}" class="button">Accept Collaboration</a>
    <p>or copy this link: <br><small>${acceptUrl}</small></p>
    <p>This invite will expire if not accepted soon.</p>
  </div>
  <div class="footer">
    <p>This is an automated message from Blog-Page.</p>
  </div>
</body>
</html>`,
        });
        console.log("[COLLAB] Nodemailer API SUCCESS.");
        results.push({
          email: trimmedEmail,
          status: "sent",
          inviteId: collab._id,
        });
      } catch (emailError) {
        console.error(
          "[COLLAB] NODEMAILER API ERROR for",
          trimmedEmail,
          ":",
          emailError,
        );
        results.push({
          email: trimmedEmail,
          status: "email_failed",
          error: emailError.message,
        });
      }
    }

    console.log(
      "\n[COLLAB] All invites processed. Final results array:",
      results,
    );
    console.log("--- [COLLAB - sendCollaborationInvites] END ---\n");
    return results;
  } catch (error) {
    console.error("[COLLAB] FATAL ERROR in sendCollaborationInvites:", error);
    throw error;
  }
};

const sendInvite = async (req, res) => {
  console.log("\n--- [COLLAB API - sendInvite] Route hit ---");
  try {
    const blogOwner = req.user;
    if (!blogOwner?.name || !blogOwner?.email) {
      console.warn("[COLLAB API] Missing user info on req.user");
      return res
        .status(400)
        .json({ success: false, message: "Missing user info" });
    }

    const { id: blogId } = req.params;
    const { collaboratorEmails } = req.body;

    console.log(
      "[COLLAB API] blogId:",
      blogId,
      "| emails:",
      collaboratorEmails,
    );

    if (!collaboratorEmails) {
      return res
        .status(400)
        .json({ success: false, message: "collaboratorEmails required" });
    }

    let emails = [];
    if (typeof collaboratorEmails === "string") {
      emails = collaboratorEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
    } else if (Array.isArray(collaboratorEmails)) {
      emails = collaboratorEmails
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
    }

    console.log("[COLLAB API] Parsed emails:", emails);

    if (emails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid emails provided" });
    }

    const blog = await Blog.findById(blogId).populate("author", "name email");
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const results = [];

    for (const email of emails) {
      console.log(`[COLLAB API] Processing loop for: ${email}`);
      if (email === blogOwner.email) {
        results.push({ email, status: "skipped_self" });
        continue;
      }

      const existing = await CollaboratorBlog.findOne({
        blog: blogId,
        collaboratorEmail: email,
      });
      if (existing) {
        results.push({
          email,
          status: "already_invited",
          inviteId: existing._id,
        });
        continue;
      }

      const inviteToken = crypto.randomBytes(32).toString("hex");
      const collab = new CollaboratorBlog({
        blog: blogId,
        blogTitle: blog.title,
        collaboratorEmail: email,
        user: blogOwner._id,
        inviteToken,
        status: "pending",
      });

      await collab.save();
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

      try {
        console.log(`[COLLAB API] Sending via Nodemailer to ${email}...`);
        await transporter.sendMail({
          // ✅ FIX 1: Send FROM your new app email
          from: `"Quillr Invites" <${process.env.EMAIL_USER}>`,
          // ✅ FIX 2: Replies go to the user who sent the invite
          replyTo: blogOwner.email,
          to: email,
          subject: `Collaboration Invite: ${blog.title}`,
          html: `<p>Click <a href="${acceptUrl}">here</a> to accept</p>`,
        });
        console.log(`[COLLAB API] Successfully sent to ${email}`);
        results.push({ email, status: "sent", inviteId: collab._id });
      } catch (emailError) {
        console.error("[COLLAB API] Nodemailer failed for", email, emailError);
        results.push({
          email,
          status: "email_failed",
          error: emailError.message,
        });
      }
    }

    console.log("[COLLAB API] Finished processing. Sending 200 response.");
    res.json({ success: true, message: "Invites processed", results });
  } catch (error) {
    console.error("[COLLAB API] FATAL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptInvite = async (req, res) => {
  console.log("\n--- [COLLAB API - acceptInvite] Route hit ---");
  try {
    const { token } = req.params;
    console.log("[COLLAB API] Token received:", token);

    const collab = await CollaboratorBlog.findOne({
      inviteToken: token,
      status: "pending",
    });
    if (!collab) {
      console.warn("[COLLAB API] Token invalid or expired.");
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findOne({ email: collab.collaboratorEmail });
    if (!user) {
      console.warn(
        "[COLLAB API] User not found in DB for email:",
        collab.collaboratorEmail,
      );
      await CollaboratorBlog.findByIdAndUpdate(collab._id, {
        status: "rejected",
        reason: "User not found",
      });
      return res.status(404).json({
        success: false,
        message: "User account not found. Please register first.",
      });
    }

    console.log("[COLLAB API] User found, accepting invite...");
    collab.user = user._id;
    collab.status = "accepted";
    collab.acceptedAt = new Date();
    await collab.save();

    console.log("[COLLAB API] Invite successfully accepted!");
    res.json({
      success: true,
      message: "Collaboration accepted successfully!",
      blogTitle: collab.blogTitle,
    });
  } catch (error) {
    console.error("[COLLAB API] Accept invite error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBlogCollaborators = async (req, res) => {
  // Keeping this brief to focus on the creation flow
  try {
    const { blogId } = req.params;
    const collaborators = await CollaboratorBlog.find({
      blog: blogId,
      status: "accepted",
    }).populate("user", "name email profilePic");
    res.json({ success: true, collaborators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendCollaborationInvites,
  sendInvite,
  acceptInvite,
  getBlogCollaborators,
};
