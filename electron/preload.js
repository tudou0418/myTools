const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDialog: () =>{
    console.log('我要打开文件了')
    ipcRenderer.send('open-file-dialog');
  },
  onSelectedItems: (callback) => {
    ipcRenderer.on('selected-file', callback);
  },
  // 打开新的窗口
  openWindow: (route) => {
    console.log('打开新的窗口222',route)
    ipcRenderer.send('open-window',route);
  },
  // 调用dll
  convert: (options) => {
    ipcRenderer.send('convert',options);
  },
  // 关闭窗口
  closeWindow:()=>{
    ipcRenderer.send('close-Window');
  },
  // 文件下载路径
  downloadPath: () => {
    ipcRenderer.send('choose-download-path');
  },
  // 下载路径回调
  onDownloadPath: (baseUrl) => {
    ipcRenderer.on('download-path', baseUrl);
  },
  onConvertError: (callback) => {
    ipcRenderer.on('convert-error', callback);
  },
  onConversionProgress: (callback) => {
    ipcRenderer.on('conversion-progress', callback);
  },
  // 最小化窗口
  minimizeWindow: () => {
    ipcRenderer.send('minimize-Window');
  },
  // 关闭窗口
  closeWindow: () => {
    ipcRenderer.send('close-Window');
  }
});