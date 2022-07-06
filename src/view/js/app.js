/*NodeJS Modules*/
var path = require('path');
const fs = require('fs');
const log4js = require("log4js");
const logger = log4js.getLogger("myiff");
const { ipcMain, ipcRenderer } = require('electron');
const { app } = require('@electron/remote');

/* Info about app */
var appdir = path.join(__dirname, "..", "..");
var dir = path.join(process.env.APPDATA, "mass-yiff", "MYIFF");
const config = require(path.join(__dirname, "..", "/data/config.json"));

/* Set DiscordRPC client up */
var DiscordRPC = false;
const { Client } = require("discord-rpc");
var rpc, pt, kc;
if (process.platform == "linux") {
    kc = "Ctl-";
    /*pt = process.env.HOME;*/
} else if (process.platform == "darwin") {
    kc = "Command-";
    pt = "/Applications/Discord.app";
} else if (process.platform == "win32") {
    kc = "Ctl-";
    pt = path.join(process.env.APPDATA, '../Local/Discord/Update.exe');
};
try {
    if (fs.existsSync(pt) && DiscordRPC == true) {
        console.log("Discord installed, enabling rpc.");
        var showrpc = true;
        rpc = new Client({
            transport: "ipc",
        });
        rpc.login({
            clientId: "938129164089851914"
        });
    } else {
        console.log("Discord not installed, disabling rpc.");
    }
} catch (e) {
    console.log("An error occurred, disabling rpc.");
};

/*Get date*/
var sdate = new Date();

/*Set audio*/
const error = new Audio(path.join(__dirname, 'sound/error.mp3'));
const success = new Audio(path.join(__dirname, 'sound/success.mp3'));

var dlfolder = path.join(process.env.APPDATA, "mass-yiff", "MYIFF");

if (DiscordRPC == "true") {
    /* Set activity */
    /* Just started */
    rpc.on("ready", () => {
        console.log("DiscordRPC is ready now!");
        rpc.setActivity({
            details: "Mass Yiff",
            state: `Just started`,
            startTimestamp: sdate,
            largeImageKey: `logo`,
            largeImageText: `Just opened Mass Yiff downloader`,
            //smallImageKey: `${filetypeimg}`,
            /*buttons: [
              {
                label: "Install Griphitor",
                url: "https://griphitor.xyz"
              }
            ]*/
        });
    });
};

const execFile = require('child_process').execFile;

$(document).ready(function() {
    $(document).on("keydown", "form", function(event) {
        if (event.key == "Enter") {
            error.play();
            iziToast.show({
                id: 'enterkey',
                theme: 'dark',
                title: 'Enter key',
                displayMode: 2,
                message: `Please press download instead of the enter key.`,
                position: 'center',
                transitionIn: 'flipInX',
                transitionOut: 'flipOutX',
                progressBarColor: 'rgb(0, 255, 184)',
                image: 'img/error.png',
                imageWidth: 70,
                layout: 2,
                onClosed: function(instance, toast, closedBy) {
                    console.log("Closedby: " + closedBy);
                }
            });
        };
        return event.key != "Enter";
    });
    $("#yiff-download").on('submit', async function(e) {
        e.preventDefault();
        var tag = document.getElementById("yiff-download-tag").value;
        var e621url = `https://e621.net/posts?tags=${encodeURI(tag)}`;
        if (!$("#yiff-download-tag").val()) {
            error.play();
            iziToast.show({
                id: 'dlstart',
                theme: 'dark',
                title: 'No tag',
                displayMode: 2,
                message: `No tag was provided, please type the tag you want to download.`,
                position: 'center',
                transitionIn: 'flipInX',
                transitionOut: 'flipOutX',
                progressBarColor: 'rgb(0, 255, 184)',
                image: 'img/error.png',
                imageWidth: 70,
                layout: 2,
                onClosed: function(instance, toast, closedBy) {
                    console.log("Closedby: " + closedBy);
                }
            });
        } else {
            success.play();
            iziToast.show({
                id: 'dlstart',
                theme: 'dark',
                title: 'Downloading',
                displayMode: 2,
                message: `Downloading tag: '${tag}'`,
                position: 'center',
                transitionIn: 'flipInX',
                transitionOut: 'flipOutX',
                progressBarColor: 'rgb(0, 255, 184)',
                image: 'img/check.png',
                imageWidth: 70,
                layout: 2,
                onClosed: function(instance, toast, closedBy) {
                    console.log("Closedby: " + closedBy);
                }
            });
            document.getElementById("yiff-download-cancel").style.display = "block";
            const child = execFile(path.join(__dirname, "..", "..", "..", "lib", "download.bat"), [path.join(__dirname, "..", "..", "..", "lib", "gallery-dl.exe"), '-d', dlfolder, e621url], (err, stdout, stderr) => {
                if (err) {
                    throw err;
                };
                console.log(stdout);
            });
            $("#yiff-download-cancel").on('submit', function(e) {
                e.preventDefault();
                console.log("Canceling download");
                child.kill('SIGINT');
                window.location.href = window.location.href;
            });
        };
    });
    $("#yiff-download-folder").on('submit', function(e) {
        e.preventDefault();
        console.log("Showing downloads");
        execFile("explorer.exe", [dlfolder]);
    });
});