const {contextBridge, ipcRenderer} = require("electron");
const path = require("path");
const fs = require("fs");

function exposeInMainWorld(send, invoke, receive, dirname) {
    exposeApi(send, invoke, receive);
    exposeAssets(dirname);
}

module.exports = { exposeInMainWorld };

function exposeApi(send, invoke, receive) {
    send = send.concat(['close', 'maximize', 'minimize', 'exit']);
    invoke = invoke.concat(['maximizeStatus']);

    contextBridge.exposeInMainWorld('api', {
        send: (channel, ...data) => {
            if (send.includes(channel)) {
                ipcRenderer.send(channel, ...data);
            }
        },
        invoke: (channel, ...data) => {
            if (invoke.includes(channel)) {
                return ipcRenderer.invoke(channel, ...data);
            }
        },
        receive: (channel, func) => {
            if (receive.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
    })
}

function exposeAssets(dirname) {
    const templatePath = dirname;
    const assetsPath = path.join(__dirname, '/assets');

    contextBridge.exposeInMainWorld('assets', {
        templatePath: () => {
            return templatePath;
        },
        assetsPath: () => {
            return assetsPath;
        },

        addCss: (name) => {
            let absPath = path.join(templatePath, name);

            if (!fs.existsSync(absPath)) {
                absPath = path.join(assetsPath, 'css', name);
            }

            if (!fs.existsSync(absPath)) {
                console.error(`css file ${name} not found!`);
                return;
            }

            if (document.getElementById(name)) {
                return;
            }

            const head = document.querySelector('head');
            const link = document.createElement('link');
            link.id   = name;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = absPath;
            link.media = 'all';

            head.appendChild(link);
        }
    });
}