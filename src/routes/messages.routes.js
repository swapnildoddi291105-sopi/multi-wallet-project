const express = require('express');
const router = express.Router();
const controller = require('../controllers/messages.controller');

router.post('/', controller.ingestMessage);
router.get('/', controller.getMessages); // <-- Make sure this line exists exactly like this!

module.exports = router;