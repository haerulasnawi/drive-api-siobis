const stream = require('stream')
const auth = require('../lib/googleAuth');
module.exports = {

    //get touch file from fileId
    touch: async (req, res) => {
        try {
            const fileId = await req.params.fileId
            let query = {
                fileId: fileId,
                fields: 'id, name, mimeType, iconLink,hasThumbnail,thumbnailLink,webViewLink,contentHints,parents',
            }
            const data = await auth.drive.files.update(query);
            return res.json(data.data)
        } catch (e) {
            res.json(e.message)
        }
    },

    //get list file from folderId
    list: async (req, res) => {
        try {
            const parentsId = await req.params.folderId
            const files = [];
            let query = {
                q: '\'' + parentsId + '\' in parents and trashed = false',
                fields: 'nextPageToken, files(id, name, mimeType, iconLink,hasThumbnail,thumbnailLink,webViewLink,contentHints)',
                spaces: 'drive',
                orderBy: 'folder',
                // trashed: true
            }
            if (Object.keys(req.query).length > 0) {
                query = {
                    q: `name contains '` + req.query.name + `'`,
                    fields: 'nextPageToken, files(id, name, mimeType, iconLink,hasThumbnail,thumbnailLink,webViewLink,contentHints)',
                    spaces: 'drive',
                    orderBy: 'folder',
                    // trashed: false
                }
            }
            const data = await auth.drive.files.list(query);
            Array.prototype.push.apply(files, data.data.files);
            return res.json(files)
        } catch (e) {
            res.json(e.message)
        }
    },

    //upload file
    uploadFile: async (req, res) => {
        try {
            const fileObject = await req.file
            const parentsId = await req.params.folderId

            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileObject.buffer);
            // console.log(bufferStream)
            const { data } = await auth.drive.files.create({
                // uploadType:'resumable',
                media: {
                    mimeType: fileObject.mimeType,
                    body: bufferStream,
                },
                requestBody: {
                    name: fileObject.originalname,
                    parents: parentsId ? [parentsId] : [],
                },
                fields: 'id,name,mimeType,iconLink,hasThumbnail,thumbnailLink,webViewLink',
            });
            const fileId = data.id
            auth.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            })
            res.json({
                'status': 200,
                'data': data,
            })
        } catch (e) {
            res.json(e.message)
        }
    },

    //create folder
    createFolder: async (req, res) => {
        try {
            const name = await req.body.name
            const parentsId = await req.params.folderId
            const data = await auth.drive.files.create({
                requestBody: {
                    mimeType: 'application/vnd.google-apps.folder',
                    name: name,
                    parents: parentsId ? [parentsId] : [],
                },
                fields: 'id,name,mimeType,iconLink,hasThumbnail,thumbnailLink,webViewLink',
            });
            const folderId = data.data.id
            auth.drive.permissions.create({
                fileId: folderId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            })
            res.json({
                'status': 200,
                'data': data.data,
            })
        } catch (e) {
            res.json(e.message)
        }
    },

    deleteFile: async (req, res) => {
        const fileId = await req.body.id
        const data = await auth.drive.files.delete({
            fileId: fileId
        }).then(async function (response) {
            res.json({
                status: 200,
                message: 'Ok'
            })
        }, function (err) {
            return res.status(400).json({
                error: { msg: 'Deletion Failed for some reason' }
            })
        })

    },

    getLocation: async (req, res) => {
        const accessToken = await auth.token
        const r = await req.body
        let headersList = {
            "Authorization": "Bearer " + accessToken.token,
            "Content-Type": "application/json;Charset=UTF-8",
        }
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`, {
            method: 'POST',
            body: JSON.stringify(r),
            headers: headersList
        })
        // console.log(response)
        if (response.status==200) {
            const location = response.headers.get('location')
            return res.json({ location: location })
        }else{
            return response
        }
    },

    uploadChunk: async (req, res) => {
        const r = await req
        const option = {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json;Charset=UTF-8",
                "Content-Length": r.file.size,
                "Content-Range": `bytes ${r.body.start}-${r.body.end}/${r.body.contentLength}`,
            },
            body: r.file.buffer
        }
        const response = await fetch(r.body.url, option)
        if (response.status == 200) {
            const data = await response.json()
            return res.json({ status: response.status, message: response.statusText, data: data })
        }
        return res.json({ status: response.status, message: response.statusText })
    }
}
