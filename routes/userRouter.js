const router = require("express").Router();
const {
  memberLogin,
  memberAuth,
  checkRole,
} = require("../controller/authFunctions.js");
const {
  sendVerificationEmail,
  verifyAndCreateUser,
  sendPasswordResetEmail,
  resetPasswordWithCode,
} = require("../controller/emailVerification.js");

router.post("/register-member", async (req, res) => {
  await sendVerificationEmail(req.body, "member", res);
});

router.post("/register-president", async (req, res) => {
  await sendVerificationEmail(req.body, "president", res);
});

router.post("/register-treasurer", async (req, res) => {
  await sendVerificationEmail(req.body, "treasurer", res);
});

router.post("/register-secretary", async (req, res) => {
  await sendVerificationEmail(req.body, "secretary", res);
});

router.post("/verify-email", async (req, res) => {
  await verifyAndCreateUser(req, res);
});

router.post("/request-password-reset", async (req, res) => {
  await sendPasswordResetEmail(req, res);
});

router.post("/reset-password", async (req, res) => {
  await resetPasswordWithCode(req, res);
});

router.post("/login-member", async (req, res) => {
  await memberLogin(req.body, "member", res);
});

router.post("/login-president", async (req, res) => {
  await memberLogin(req.body, "president", res);
});

router.post("/login-treasurer", async (req, res) => {
  await memberLogin(req.body, "treasurer", res);
});

router.post("/login-secretary", async (req, res) => {
  await memberLogin(req.body, "secretary", res);
});

router.get("/public", (req, res) => {
  return res.status(200).json("Public Domain");
});

router.get(
  "/member-protected",
  memberAuth,
  checkRole(["member"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  },
);

router.get(
  "/president-protected",
  memberAuth,
  checkRole(["president"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  },
);

router.get(
  "/treasurer-protected",
  memberAuth,
  checkRole(["treasurer"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  },
);

router.get(
  "/secretary-protected",
  memberAuth,
  checkRole(["secretary"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  },
);

module.exports = router;
