const express = require("express");
const router = express.Router();
const {
  sendInvite,
  acceptInvite,
  getBlogCollaborators,
} = require("../controllers/collaboratorControllers");
const { checkTokenMw } = require("../middleWares/authMw");

// Send collaboration invites to emails for a blog (HTTP endpoint)
router.post("/send-invite/:id", checkTokenMw, sendInvite);

// Accept collaboration invite by token (public)
router.get("/accept-invite/:token", acceptInvite);

// Get collaborators for a blog
router.get("/blog/:blogId/collaborators", checkTokenMw, getBlogCollaborators);

module.exports = router;
