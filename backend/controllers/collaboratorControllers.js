const crypto = require("crypto");
const axios = require("axios");
const CollaboratorBlog = require("../models/Collaborator-Blog");
const Blog = require("../models/Blog");
const User = require("../models/User");

// Brevo API helper function
const sendBrevoEmail = async (emailData) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("[BREVO] ✅ Email sent. Message ID:", response.data.messageId);
    return response.data;
  } catch (error) {
    console.error(
      "[BREVO] ❌ Email failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

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

    for (const invite of collabInvites) {
      const { email: rawEmail, sectionId, sectionTitle, seqNo } = invite;
      const email = rawEmail?.trim() || "";

      console.log(`\n[COLLAB] >>> Processing invite for: ${email}`);
      console.log(
        `  Section: "${sectionTitle}" (ID: ${sectionId}, Seq: ${seqNo})`,
      );

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
        user: blog.author._id,
        inviteToken,
        status: "pending",
      });

      await collab.save();
      console.log("[COLLAB] ✅ CollaboratorBlog entry created:", collab._id);

      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

      try {
        console.log("[COLLAB] Sending HTTP email via Brevo to:", email);

        const emailPayload = {
          to: [{ email: email }],
          from: {
            email: process.env.EMAIL_USER || "noreply@quillrblog.com",
            name: "Quill&Ray Blog",
          },
          replyTo: {
            email: blogOwner.email,
            name: blogOwner.name,
          },
          subject: `Collaboration Invite: ${blog.title}`,
          htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 24px;">You're Invited to Collaborate!</h2>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333; margin: 10px 0;">
                Hi there! 👋
              </p>
              
              <p style="font-size: 15px; color: #555; margin: 15px 0; line-height: 1.6;">
                <strong>${blogOwner.name}</strong> has invited you to collaborate on editing the section:
              </p>
              
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px;">
                <p style="margin: 5px 0; color: #667eea; font-weight: 600;">Section:</p>
                <p style="margin: 5px 0; font-size: 16px; color: #333;"><strong>"${sectionTitle}"</strong></p>
                
                <p style="margin: 10px 0; color: #667eea; font-weight: 600;">Blog:</p>
                <p style="margin: 5px 0; font-size: 14px; color: #555;">${blog.title}</p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${acceptUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          display: inline-block; 
                          font-weight: 600;
                          transition: opacity 0.3s ease;">
                  Accept Invite
                </a>
              </div>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                This invite link will expire in 30 days. If you have any questions, reply to this email.
              </p>
            </div>
          </div>
          `,
        };

        await sendBrevoEmail(emailPayload);
        console.log("[COLLAB] ✅ Email sent successfully via Brevo to:", email);
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
        console.log(`[COLLAB API] Sending HTTP email via Brevo to ${email}...`);

        const emailPayload = {
          to: [{ email: email }],
          from: {
            email: process.env.EMAIL_USER || "noreply@quillrblog.com",
            name: "Quill&Ray Blog",
          },
          replyTo: {
            email: blogOwner.email,
            name: blogOwner.name,
          },
          subject: `Collaboration Invite: ${blog.title}`,
          htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 24px;">You're Invited to Collaborate!</h2>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333; margin: 10px 0;">
                Hi there! 👋
              </p>
              
              <p style="font-size: 15px; color: #555; margin: 15px 0; line-height: 1.6;">
                <strong>${blogOwner.name}</strong> has invited you to collaborate on editing the section:
              </p>
              
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px;">
                <p style="margin: 5px 0; color: #667eea; font-weight: 600;">Section:</p>
                <p style="margin: 5px 0; font-size: 16px; color: #333;"><strong>"${blog.title}"</strong></p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${acceptUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          display: inline-block; 
                          font-weight: 600;">
                  Accept Invite
                </a>
              </div>
            </div>
          </div>
          `,
        };

        await sendBrevoEmail(emailPayload);
        console.log(
          `[COLLAB API] Successfully sent HTTP email via Brevo to ${email}`,
        );
        results.push({ email, status: "sent", inviteId: collab._id });
      } catch (emailError) {
        console.error("[COLLAB API] Brevo failed for", email, emailError);
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
