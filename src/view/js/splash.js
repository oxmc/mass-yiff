/* Node modules */
const { ipcRenderer, ipcMain } = require('electron');
var os = require('os');
const path = require('path');
const fs = require('fs');
var rimraf = require("rimraf");
const decompress = require("decompress");
const axios = require('axios');

/* Variables */
var packageJson = require(path.join(__dirname, '../../package.json'));
var appname = packageJson.name;
var config = require(path.join(__dirname, '../data/config.json'));
var appfile, ltg;

/*Elements*/
var progressText = document.getElementById("progress-text");
var downloadProgressText = document.getElementById("download-progress-text");
var progbar = document.getElementById("progbar");
var progbarText = document.getElementById("progbar-text");

/*Check for updates*/
ipcRenderer.on('SplashWindow', async function (event, arg) {
  //console.log(arg);
  if (arg == "Latest") {
    progressText.innerHTML = "Loading..."
    setTimeout(async function () {
      ipcRenderer.send('FromSplashWindow', 'ShowMainWindow');
    }, 2000)
  } else if (arg == "Update") {
    progressText.innerHTML = "New update availible, opening in browser..."
    switch (os.platform()) {
      case "win32":
        ltg = "win";
        break;
      case "linux":
        ltg = "linux";
        break;
      case "darwin":
        ltg = "mac";
        break;
    };
    console.log(`${config.latest}`); //-${ltg}
    require("electron").shell.openExternal(`${config.latest}-${ltg}`);
    app.quit();
    /*
    progressText.innerHTML = "Downloading updates..."
    if (os.platform() == "win32") {
      appfile = `${appname}.exe`;
    } else if (os.platform() == "darwin") {
      appfile = `${appname}.app`;
    } else if (os.platform() == "linux") {
      appfile = `${appname}.appimage`;
    };
    console.log("Downloading latest version...");
    progressText.innerHTML = 'Downloading files...';
    progbardiv.style.display = "block";
    console.log(`OS type is: ${os.platform()}`);
    console.log(`Downloading '${appfile}' from '${config.Latest}'`);
    const { data, headers } = await axios.get({
      latest,
      responseType: 'stream'
    });
    const totalLength = headers['content-length']
    var outStream = fs.createWriteStream(appfile);
    data.on('data', (chunk) => {
      var percentage = ((received_bytes * 100) / total_bytes).toFixed(2).split('.')[0].trim();
      console.log(percentage);
      downloadProgressText.innerHTML = `${percentage}% of ${received_bytes} bytes downloaded out of ${total_bytes} bytes.`
      progbar.style = `width: ${percentage}%;`;
      progbar.innerHTML = `${percentage}%`;
      if (percentage == "100") {
        console.log("Successfully downloaded new update!");
        progressText.innerHTML = 'Download Complete!';
        setTimeout(async function () {
          progressText.innerHTML = 'Restarting...';
          ipcRenderer.send('FromSplashWindow', 'Restart');
        }, 2000)
      };
    });
    data.pipe(outStream);*/
  } else if (arg == "Unknown") {
    progressText.innerHTML = "Unable to get latest version"
    downloadProgressText.innerHTML = "Loading..."
    setTimeout(function(){
      ipcRenderer.send('FromSplashWindow', 'ShowMainWindow');
    }, 3000);
  }
})
