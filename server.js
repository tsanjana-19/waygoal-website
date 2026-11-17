const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"].includes(ext));
  }
});

app.post("/api/profile", (req, res) => {
  const profile = req.body;
  if (!profile.name || !profile.goal || !profile.hoursPerDay) {
    return res.status(400).json({ error: "Please provide name, goal and available study hours." });
  }
  fs.writeFileSync(path.join(DATA_DIR, "profile.json"), JSON.stringify(profile, null, 2));
  res.json({ message: "Profile saved", profile });
});

app.post("/api/uploads", upload.array("documents", 10), (req, res) => {
  const uploaded = (req.files || []).map(f => ({
    originalName: f.originalname,
    storedName: f.filename,
    size: f.size,
    type: f.mimetype
  }));
  const indexPath = path.join(DATA_DIR, "uploads.json");
  const previous = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : [];
  fs.writeFileSync(indexPath, JSON.stringify(previous.concat(uploaded), null, 2));
  res.json({ message: "Documents uploaded", files: uploaded });
});

app.get("/api/health", (_, res) => res.json({ status: "ok", app: "WayGoal" }));

app.listen(PORT, () => console.log(`WayGoal is running at http://localhost:${PORT}`));
