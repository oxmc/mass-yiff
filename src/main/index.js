/* Import node modules */
const { app, BrowserWindow, Tray, Menu, ipcMain, ipcRenderer, protocol } = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const notifier = require('node-notifier');
const log4js = require("log4js");
require('v8-compile-cache');

/* Info about app */
var appdir = app.getAppPath();
var appname = app.getName();
var appversion = app.getVersion();
const config = require(`${appdir}/src/data/config.json`);
const userDataPath = app.getPath('userData');

/*MYIFF Data Dir*/
//console.log(userDataPath);
fs.mkdir(path.join(userDataPath, 'MYIFF'), (err) => {
    if (err) {
        if (err.code == "EEXIST") {
            console.log('MYIFF Directory already exists!');
        };
    } else {
        console.log('MYIFF Directory created successfully!');
    };
});

/* Functions */
function checkInternet(cb) {
    require('dns').lookup('google.com', function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
};

async function notification(mode, arg1) {
    if (mode == "1") {
        notifier.notify({
            title: 'Update availible.',
            message: 'An update is availible, Downloading now....',
            icon: `${appdir}/src/renderer/assets/download.png`,
            sound: true,
            wait: true
        });
    } else if (mode == "2") {
        notifier.notify({
                title: 'Update downloaded.',
                message: 'An update has been downloaded, Restarting app...',
                icon: `${appdir}/src/renderer/assets/tray-small.png`,
                sound: true,
                wait: true
            },
            function(err, response2) {
                if (response2 == "activate") {
                    console.log("An update has been downloaded.");
                    app.quit();
                }
            }
        );
    } else if (mode == "3") {
        notifier.notify({
                title: 'Not connected.',
                message: `You are not connected to the internet, unable to check for updates without internet.`,
                icon: `${appdir}/src/renderer/assets/warning.png`,
                sound: true,
                wait: true
            },
            function(err, response3) {
                console.log(err);
                if (response3 == "activate") {
                    console.log("User clicked on no wifi notification.");
                }
            }
        );
    } else if (mode == "4") {
        notifier.notify({
                title: 'Error downloading.',
                message: `Unable to download latest update file: '${arg1}'`,
                icon: `${appdir}/src/renderer/assets/warning.png`,
                sound: true,
                wait: true
            },
            function(err, response4) {
                if (response4 == "activate") {
                    console.log("User clicked on unable to download notification.");
                } else {
                    notifier.on('timeout', function(notifierObject, options) {
                        // Triggers if notification closes
                        console.log("User did not click on unable to download notification.");
                    });
                }
            }
        );
    } else if (mode == "5") {
        notifier.notify({
                title: 'Error extracting files.',
                message: 'There was an error extracting some files.',
                icon: `${appdir}/src/renderer/assets/warning.png`,
                sound: true,
                wait: true
            },
            function(err, response5) {
                if (response5 == "activate") {
                    console.log("User clicked on unable to extract notification.");
                } else {
                    notifier.on('timeout', function(notifierObject, options) {
                        // Triggers if notification closes
                        console.log("User did not click on unable to extract notification.");
                    });
                }
            }
        );
    } else if (mode == "6") {
        notifier.notify({
                title: 'Error checking for update.',
                message: 'There was an error checking for updates, continuing as normal.',
                icon: `${appdir}/src/renderer/assets/warning.png`,
                sound: true,
                wait: true
            },
            function(err, response6) {
                if (response6 == "activate") {
                    console.log("User clicked on unable to check for update notification.");
                } else {
                    notifier.on('timeout', function(notifierObject, options) {
                        // Triggers if notification closes
                        console.log("User did not click on unable to check for update notification.");
                    });
                }
            }
        );
    }
};

/* Logging */
log4js.configure({
    appenders: {
        myiffinit: {
            type: "file",
            filename: "MYIFF-INIT.log"
        }
    },
    categories: {
        default: {
            appenders: ["myiffinit"],
            level: "error"
        }
    }
});
const logger = log4js.getLogger("myiffinit");
if (fs.existsSync(`${appdir}/.dev`) || fs.existsSync(`${appdir}/.debug`) || fs.existsSync(`${appdir}/debug.txt`)) {
    logger.level = "debug";
};
logger.debug("Starting");

/* Import custom functions */
logger.debug("Loading shortcuts");
require("./shortcut");
logger.debug("Loading MainWindow script");
const { createMainWindow } = require("./window");

logger.debug("Disabling transparent visuals if not on win32 or darwin");
/* Disable gpu and transparent visuals if not win32 or darwin */
if (process.platform !== "win32" && process.platform !== "darwin") {
    app.commandLine.appendSwitch("enable-transparent-visuals");
    app.commandLine.appendSwitch("disable-gpu");
    app.disableHardwareAcceleration();
}
logger.debug("Loading package.json and contriubutors.json");
logger.debug("Creating Tray");
/* Menu tray and about window */
var packageJson = require(`${appdir}/package.json`); /* Read package.json */
var contrib = require(`${appdir}/src/data/contributors.json`); /* Read contributors.json */
var appAuthor = packageJson.author.name;
if (Array.isArray(contrib.contributors) && contrib.contributors.length) {
    var appContributors = contrib.contributors;
    var stringContributors = appContributors.join(', ');
} else {
    var stringContributors = appAuthor;
};
var appYear = '2021'; /* The year since this app exists */
var currentYear = new Date().getFullYear();
/* Year format for copyright */
if (appYear == currentYear) {
    var copyYear = appYear;
} else {
    var copyYear = `${appYear}-${currentYear}`;
};
/* Tray Menu */
const createTray = () => {
    var creditText = stringContributors
    var trayMenuTemplate = [
        { label: appname, enabled: false },
        { type: 'separator' },
        { label: "Open source on github!", enabled: false },
        { type: 'separator' },
        { label: 'About', role: 'about', click: function() { app.showAboutPanel(); } },
        { label: 'Quit', role: 'quit', click: function() { app.quit(); } }
    ];
    tray = new Tray(`${appdir}/src/view/img/app.png`)
    let trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
    tray.setContextMenu(trayMenu)
    const aboutWindow = app.setAboutPanelOptions({
        applicationName: appname,
        iconPath: `${appdir}/src/view/img/app.png`,
        applicationVersion: 'Version: ' + appversion,
        authors: appContributors,
        website: config.url,
        credits: 'Credits: ' + creditText,
        copyright: 'Copyright © ' + copyYear + ' ' + appAuthor
    })
    tray.on('click', function(e) {
        global.mainWindow && global.mainWindow.focus();
    });
    return aboutWindow
};
require('@electron/remote/main').initialize();
/* When app ready, check for internet, then register MYIFF:// */
logger.debug("Enabling MYIFF://");
let deeplinkingUrl;
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('MYIFF', process.execPath, [path.resolve(process.argv[1])]);
    };
} else {
    app.setAsDefaultProtocolClient('MYIFF');
};
logger.debug("Second instance");
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        deeplinkingUrl = commandLine;
        logger.debug(deeplinkingUrl);
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        };
    });

    function devToolsLog(s) {
        console.log(s)
        if (PageView && PageView.webContents) {
            PageView.webContents.executeJavaScript(`console.log("${s}")`)
        }
    }
    // Create mainWindow, load the rest of the app, etc...
    logger.debug("Checking for internet and getting updates");
    app.whenReady().then(async() => {
        require("@electron/remote/main").enable(PageView.webContents);
        /* Check for internet */
        checkInternet(function(isConnected) {
            if (isConnected) {
                logger.debug("Show splash");
                SplashWindow.webContents.on("did-finish-load", () => {
                    /* Get latest version from GitHub */
                    console.log("Initilize Updater:");
                    axios.get(config.json).then(function(response) {
                        //console.log(response);
                        if (response.status == 200) {
                            const ver = response.data.version;
                            const onlineversion = ver.replace(/"([^"]+)":/g, '$1:');
                            console.log(`Online version: '${onlineversion}'`);
                            console.log(`Local version: '${appversion}'`);
                            /* If Online version is greater than local version, show update dialog */
                            if (onlineversion > appversion) {
                                logger.debug("Updating app");
                                mainWindow.close();
                                console.log("\x1b[1m", "\x1b[31m", "Version is not up to date!", "\x1b[0m");
                                SplashWindow.webContents.send('SplashWindow', 'Update');
                            } else {
                                logger.debug("Loading normaly");
                                console.log("\x1b[1m", "\x1b[32m", "Version is up to date!", "\x1b[0m");
                                SplashWindow.webContents.send('SplashWindow', 'Latest');
                            };
                        } else if (response.status == 404) {
                            logger.error("Server error, id: 1");
                            console.log("\x1b[1m", "\x1b[31m", "Unable to check latest version from main server!\nIt may be because the server is down, moved, or does not exist.", "\x1b[0m");
                            notification("6");
                            SplashWindow.webContents.send('SplashWindow', 'Unknown');
                        };
                    }).catch(function(error) {
                        // handle error
                        logger.error("Server error, id: 2");
                        console.log(error);
                        console.log("\x1b[1m", "\x1b[31m", "Unable to check latest version from main server!\nIt may be because the server is down, moved, or does not exist.", "\x1b[0m");
                        notification("6");
                        SplashWindow.webContents.send('SplashWindow', 'Unknown');
                    });
                });
                ipcMain.on('FromSplashWindow', function(event, arg) {
                    //console.log(arg);
                    if (arg == "Restart") {
                        if (os.platform() == "win32") {
                            execute(`${app.getPath('home')}/${appname}.exe`);
                        } else if (os.platform() == "darwin") {
                            execute(`open -a ${app.getPath('home')}/${appname}.app`);
                        } else if (os.platform() == "linux") {
                            execute(`chmod +x ${app.getPath('home')}/${appname}.appimage`);
                            execute(`${app.getPath('home')}/${appname}.appimage`);
                        };
                    } else if (arg == "ShowMainWindow") {
                        //PageView.webContents.on("did-finish-load", () => {
                        //  console.log("Page loaded");
                        //});
                        console.log("Loading complete, Showing main window.");
                        mainWindow.show();
                        SplashWindow.close();
                        mainWindow.center();
                    };
                });
            } else {
                /* User not connected */
                console.log("\x1b[1m", "\x1b[31m", "ERROR: User is not connected to internet, showing NotConnectedNotification", "\x1b[0m");
                notification("3");
                SplashWindow.webContents.on("did-finish-load", () => {
                    SplashWindow.webContents.send('SplashWindow', 'Unknown');
                    ipcMain.on('FromSplashWindow', function(event, arg) {
                        if (arg == "ShowMainWindow") {
                            console.log("Loading complete, Showing main window.");
                            PageView.webContents.loadFile(`${appdir}/src/view/notconnected.html`);
                            mainWindow.show();
                            SplashWindow.close();
                            mainWindow.center();
                        };
                    });
                });
            };
        });
    });
};

/* If all windows are closed, quit app, exept if on darwin */
app.on("window-all-closed", function() {
    if (process.platform !== "darwin") app.quit();
});

/* App ready */
app.on('ready', () => {
    /* Create windows and tray */
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
        createTray();
    } else {
        global.mainWindow && global.mainWindow.focus();
    }
});