const {contextBridge, ipcRenderer} = require("electron");

function exposeInMainWorld(send, invoke, receive) {

    send = send.concat(['close', 'maximize', 'minimize']);
    invoke = invoke.concat(['maximizeStatus']);

    contextBridge.exposeInMainWorld('api', {
        send: (channel, data) => {
            if (send.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        invoke: (channel, data) => {
            if (invoke.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        },
        receive: (channel, func) => {
            if (receive.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    })
}


module.exports = { exposeInMainWorld };