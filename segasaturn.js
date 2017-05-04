var express = require('express');
var http = require('http');
var fs = require('fs-extra');
var request = require('request');
var unzip  = require('cross-unzip');
var app = express();
var Promises = require('promises');
var Repository = require('git-cli').Repository;
var working = false;


app.post('/updater', function(req, res){
    if(!working){
        working = true;
        var store = {};
        var binario;
        var datos;

        req.on('data', function(data){
            store = data;
            binario=(store.toString('utf8'));
            datos=JSON.parse(binario);
        }); 
        req.on('end',function(){       
            download(datos);
        })
    }
});

function download(data) {
    fs.ensureDir('temp/' + data.repo);
    console.log("Start cloning");
    Repository.clone('https://github.com/rikumax25/3SDSetup', '3SDSetup').then(repo => {
        console.log("finished cloning")
        download_repo(data,repo);
    });
}

function download_repo(data,repo){        
    
       switch(data.repo){
            case "Luma3DS":
                data.name = "luma";
                break;
        }
    
        console.log(data.repo + "Downloading");
        request(data.url).pipe(fs.createWriteStream('temp/' + '/' + data.name + ".7z")).on('finish',function(){
            console.log(data.repo + " Download finished");
            
            console.log("Extract started")
            unzip('temp/' + data.name + ".7z", 'uncompressed/' + data.repo, err => {
                    console.log("Extract finished");
                
                    var options = {
                        excludeParentFolder: true, 
                    };

                    //zip a folder and change folder destination name
                    var FolderZip = require('folder-zip');
                    var zip = new FolderZip();
                    console.log("Compressing started");
                    zip.zipFolder('uncompressed/' + data.repo, options, function(){
                        zip.writeToFile('3SDSetup/7zfiles/' + data.author + '_' + data.repo + '/' + data.name + '.zip');
                        fs.writeFile('3SDSetup/7zfiles/' + data.author + '_' + data.repo + '/name.txt', data.new_text);
                        console.log("Compressing finished");
                        
                        require('simple-git')(__dirname + '/3SDSetup/')
                             .add('./*')
                             .commit("Updated " + data.repo + " (message by Okabe Updater)")
                             .push('origin', 'master',cleanup(data));
                    })
                    
                        
            })
        })
}

function cleanup(data){
    console.log("Cleanup");
    fs.emptyDir(__dirname + '/uncompressed');
    fs.emptyDir(__dirname + '/temp');
    fs.remove(__dirname + '/3SDSetup');
    working = false;
}


 /* serves main page */
 app.get("/", function(req, res) {
    res.sendFile(__dirname + '/index.html')
 });

 /* serves all the static files */
 app.get(/^(.+)$/, function(req, res){ 
     console.log('static file request : ' + req.params);
     res.sendFile( __dirname + req.params[0]); 
 });

 var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });