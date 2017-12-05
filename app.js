const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    fs = require('fs'),
    xlsxj = require("xlsx-to-json-lc");


let professional = require('./app/professional');


let env = process.env.NODE_ENV || "development";
global.config = require('./config/config.json')[env];
global.logger = require('./app/helpers/logger');

app.use(bodyParser.json());

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

let storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        let datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

let upload = multer({ //multer settings
        storage: storage,
        fileFilter : function(req, file, callback) { //file filter
            if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                return callback(new Error('Wrong extension type'));
            }
            callback(null, true);
        }
    }).single('file');


getJsonData = (file) => {
    return new Promise((resolve, reject) => {
        xlsxj({
            input:file,
            output: "output.json",
            lowerCaseHeaders: true //converts excel header rows into lowercase as json keys
        }, function(err, result) {
            if (err) {
                reject(err)
            } else {
                fs.unlink(file, (err) => {console.log(err)});
                resolve({data: result});
            }
        });
    });
}

/** API path that will upload the files */
app.post('/upload', function(req, res) {
    upload(req,res,function(err){
        if(err){
             res.json({success:false,error:err});
             return;
        }
        /** Multer gives us file info in req.file object */
        if(!req.file){
            res.json({success:false,error:"No file passed"});
            return;
        }
        getJsonData(req.file.path)
        .then((result) => {
            professional.hydrateMissingPhone(result.data)
                .then((data) => {
                    res.json({success:true,data:data});
                })
                .catch((err) => {
                    console.log(err)
                    res.json({success:false,error:err});
                });
        })
        .catch((error) =>{
            res.json({success:false,error:error});
        });
    })
});

app.get('/',function(req,res){
	res.sendFile(__dirname + "/index.html");
});

app.listen('3000', function(){
    console.log('running on 3000...');
});