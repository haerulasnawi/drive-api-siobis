const express = require('express')
const router = express.Router()
const multer = require('multer')
var upload = multer()

const controller = require('../controllers')

router.route('/touch/:fileId?')
    .get(controller.touch)

router.route('/:folderId?')
    .get(controller.list)

router.route('/:folderId?')
    .post(controller.getLocation)

router.route('/upload/chunk')
    .post(upload.single('blob'), controller.uploadChunk)

router.route('/file/:folderId?')
    .post(upload.single('file'), controller.uploadFile)

router.route('/folder/:folderId?')
    .post(controller.createFolder)

router.route('/file/delete')
    .delete(controller.deleteFile)

module.exports = router