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

const sendCollaborationInvites = async (blogId, collabInvites, blogOwner) => {
  console.log(
    "\n========= [COLLAB - sendCollaborationInvites] START =========",
  );
  console.log("[COLLAB] Blog ID:", blogId);
  console.log("[COLLAB] Blog Owner:", blogOwner?.email);
  console.log("[COLLAB] Received invites count:", collabInvites?.length || 0);

  try {
    const blog = await Blog.findById(blogId).populate("author", "name email");
    if (!blog) {
      console.error("[COLLAB] ❌ Blog not found:", blogId);
      throw new Error("Blog not found");
    }

    console.log("[COLLAB] ✅ Blog loaded:", blog.title);

    const results = [];

    // ✅ FIX: Using 'invite' as the iterator
    for (const invite of collabInvites) {
      // Destructure everything we need from the object
      const { email: rawEmail, sectionId, sectionTitle, seqNo } = invite;

      // Define 'email' clearly at the top of the loop
      const email = rawEmail?.trim() || "";

      console.log(`\n[COLLAB] >>> Processing invite for: ${email}`);
      console.log(
        `  Section: "${sectionTitle}" (ID: ${sectionId}, Seq: ${seqNo})`,
      );

      // 1. Validation Checks
      if (!email) {
        console.warn("[COLLAB] ⚠️  SKIP: Empty email");
        results.push({ email: "missing", status: "skipped_empty" });
        continue;
      }

      if (email === blogOwner.email) {
        console.warn("[COLLAB] ⚠️  SKIP: Email matches blog owner");
        results.push({ email, status: "skipped_self" });
        continue;
      }

      // 2. Check for existing invite
      const existing = await CollaboratorBlog.findOne({
        blog: blogId,
        collaboratorEmail: email,
      });

      if (existing) {
        console.warn("[COLLAB] ⚠️  SKIP: Already invited", existing._id);
        results.push({
          email,
          status: "already_invited",
          inviteId: existing._id,
        });
        continue;
      }

      // 3. Find collaborator user by email (if exists) and Generate Token
      const collaboratorUser = await User.findOne({ email });
      console.log(
        "[COLLAB] Collaborator user lookup:",
        collaboratorUser ? "✅ Found" : "⚠️  Not registered yet",
      );

      const inviteToken = crypto.randomBytes(32).toString("hex");
      const collab = new CollaboratorBlog({
        blog: blogId,
        blogTitle: blog.title,
        collaboratorEmail: email,
        sectionId,
        sectionTitle,
        seqNo,
        // ✅ CORRECT: Store the AUTHOR's ID (who is inviting), not collaborator's ID
        user: blog.author._id,
        inviteToken,
        status: "pending",
      });

      await collab.save();
      console.log("[COLLAB] ✅ CollaboratorBlog entry created:", collab._id);

      // 4. Send Email
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

      try {
        console.log("[COLLAB] Sending email to:", email);
        await transporter.sendMail({
          from: `"Quillr Invites" <${process.env.EMAIL_USER}>`,
          replyTo: blogOwner.email,
          to: email, // Use 'email' here
          subject: `Collaboration Invite: ${blog.title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Hello!</h2>
              <p><strong>${blogOwner.name}</strong> invited you to edit the section: <strong>"${sectionTitle}"</strong></p>
              <p>Blog Title: ${blog.title}</p>
              <a href="${acceptUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invite</a>
            </div>
          `,
        });
        console.log("[COLLAB] ✅ Email sent successfully to:", email);
        results.push({ email, status: "sent", inviteId: collab._id });
      } catch (emailError) {
        console.error(
          "[COLLAB] ❌ Email failed for:",
          email,
          emailError.message,
        );
        results.push({
          email,
          status: "email_failed",
          error: emailError.message,
        });
      }
    }

    console.log("\n[COLLAB] ========= FINAL RESULTS =========");
    console.log("[COLLAB] Total processed:", results.length);
    results.forEach((r) => {
      console.log(`  ${r.email}: ${r.status}`);
    });

    return results;
  } catch (error) {
    console.error("\n[COLLAB] ❌ FATAL ERROR:", error.message);
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
      message: `Collaboration accepted! You are now editor for "${collab.sectionTitle}"`,
      blogId: collab.blog,
      sectionId: collab.sectionId,
      sectionTitle: collab.sectionTitle,
      seqNo: collab.seqNo,
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
