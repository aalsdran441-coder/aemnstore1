const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());

// تخزين الملف مؤقتاً في ذاكرة السيرفر لرفعه لتيليجرام
const upload = multer({ storage: multer.memoryStorage() });

// 🤖 توكن بوت تيليجرام الخاص بك (مربوط مسبقاً)
const BOT_TOKEN = '8549143434:AAFqOee_MH3qFLF-AFy6dhs5uQlFPVTTCjY'; 

// 📢 معرف قناتك على تيليجرام (مربوط مسبقاً)
const CHANNEL_ID = '@aym_9'; 

app.post('/upload-apk', upload.single('apkFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'لم يتم اختيار أي ملف APK' });
        }

        const formData = new FormData();
        formData.append('chat_id', CHANNEL_ID);
        formData.append('document', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype || 'application/vnd.android.package-archive'
        });

        // 1. رفع الملف إلى قناتك في تيليجرام تلقائياً
        const tgRes = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
            formData,
            { headers: formData.getHeaders() }
        );

        const fileId = tgRes.data.result.document.file_id;

        // 2. استخراج رابط التحميل المباشر للملف من خوادم تيليجرام
        const fileInfoRes = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const filePath = fileInfoRes.data.result.file_path;
        const directDownloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

        res.json({ success: true, apkUrl: directDownloadUrl });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, error: 'حدث خطأ أثناء الرفع إلى تيليجرام' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
