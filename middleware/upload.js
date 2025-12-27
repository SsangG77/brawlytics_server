const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/brawlers');

// 파일명을 아이템 이름으로 저장하는 storage 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 브롤러 이름으로 폴더 생성
        const brawlerName = req.body.name;
        const brawlerDir = path.join(uploadDir, brawlerName);

        if (!fs.existsSync(brawlerDir)) {
            fs.mkdirSync(brawlerDir, { recursive: true });
        }

        cb(null, brawlerDir);
    },
    filename: (req, file, cb) => {
        // file.fieldname: 'brawler_image', 'first_gadget_image' 등
        // req.body에서 해당하는 name 필드 가져오기

        let itemName = '';

        if (file.fieldname === 'brawler_image') {
            itemName = req.body.name; // 브롤러 이름
        } else if (file.fieldname === 'first_gadget_image') {
            itemName = req.body.first_gadget_name;
        } else if (file.fieldname === 'second_gadget_image') {
            itemName = req.body.second_gadget_name;
        } else if (file.fieldname === 'first_star_power_image') {
            itemName = req.body.first_star_power_name;
        } else if (file.fieldname === 'second_star_power_image') {
            itemName = req.body.second_star_power_name;
        } else if (file.fieldname === 'hypercharge_image') {
            itemName = req.body.hypercharge_name;
        } else if (file.fieldname === 'gadget_buff_image') {
            itemName = req.body.gadget_buff_name;
        } else if (file.fieldname === 'star_power_buff_image') {
            itemName = req.body.star_power_buff_name;
        } else if (file.fieldname === 'hypercharge_buff_image') {
            itemName = req.body.hypercharge_buff_name;
        }

        // 파일명에 위험한 문자만 제거: < > : " / \ | ? *
        const safeName = itemName.replace(/[<>:"/\\|?*]/g, '');
        const ext = path.extname(file.originalname);

        cb(null, `${safeName}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
    }
});

module.exports = upload;
