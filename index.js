const express = require('express');
const fs  = require('fs');
const app = express();
app.use(express.json());
const mongodb = require('mongodb');
const url = 'mongodb+srv://sukhdev:1234@streams.ploay.mongodb.net/streams?retryWrites=true&w=majority'
app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html');
});
//   adding in mongodb
app.get('/init-video', function (req, res) {
    mongodb.MongoClient.connect(url, function (error, client) {
      if (error) {
        res.json(error);
        return;
      }
      const db = client.db('videos');
      const bucket = new mongodb.GridFSBucket(db);
      const videoUploadStream = bucket.openUploadStream('cartoon');
      const videoReadStream = fs.createReadStream('./cartoon.mp4');
      videoReadStream.pipe(videoUploadStream);
      res.status(200).send("Successful");
    });
  });

// fetching from mongodb
  app.get("/video", function (req, res) {
    mongodb.MongoClient.connect(url, function (error, client) {
      if (error) {
        res.status(500).json(error);
        return;
      }
      const range = req.headers.range;
      if (!range) {
        res.status(400).send("Requires Range header");
      }
      const db = client.db('videos');
      db.collection('fs.files').findOne({}, (err, video) => {
        if (!video) {
          res.status(404).send("No video uploaded!");
          return;
        }
        const videoSize = video.length;
        const start = Number(range);
        const end = videoSize - 1;
  
        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, headers);
      const bucket = new mongodb.GridFSBucket(db);
      const downloadStream = bucket.openDownloadStreamByName('cartoon', {
        start
      });
      downloadStream.pipe(res);
    });
  });
});
app.listen(9090);