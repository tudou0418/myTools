const { app, BrowserWindow,ipcMain,dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process');
// const http = require('http');
// const socketIo = require('socket.io');

const DEV_ENV = app.isPackaged;
// 拿到bin目录 区分生成和开发环境

const resourcesPath = process.resourcesPath;
const binPath = DEV_ENV?path.join(resourcesPath, 'bin'):path.join(__dirname, 'bin');

  // 加载本地应用程序
  let winURL = !DEV_ENV
  ? 'http://localhost:5173'
  : `file://${__dirname}/dist/index.html`
  console.log('winURL',winURL)
function createWindow() {
    console.log('__dirname',__dirname)
  const win = new BrowserWindow({
    width: 700,
    height: 600,
    frame:false,
    title:'todoList',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadURL(winURL)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// 打开文件
ipcMain.on('open-file-dialog', (event) => {
   dialog.showOpenDialog({
    message: '选择需要转换的文件!!!',
    properties: ['openFile'],
    filters: [
      { name: 'videos', extensions: ['mkv','avi','flv','wmv','mp4','mov'] }
    ]
  }).then(result => {
    if(!result.canceled){
      // const fileObj = utils.getFileObj(result.filePaths[0])
        event.sender.send('selected-file', result.filePaths[0])
    }
  }).catch(err =>{
    console.log('err-----',err)
  })
})

// 选择文件下载路径
ipcMain.on('choose-download-path', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if(!result.canceled){
      event.sender.send('download-path', result.filePaths[0])
    }
  }).catch(err =>{
    console.log('err-----',err)
  })
})

// 打开新的窗口
ipcMain.on('open-window', (event,route) => {
  let modalWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame:false,
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js'),
        devTools: true,
        title:"新窗口"
    }
  });
  const urlWithRoute = winURL + '/#' + route; // 将路由信息附加到URL中
  console.log('urlWithRoute-----', urlWithRoute);

  modalWindow.loadURL(urlWithRoute);

  // modalWindow.loadURL(winURL + '#' + route) 

  
  modalWindow.webContents.on('did-finish-load', () => {
    // modalWindow.openDevTools();
  });
  modalWindow.on('closed', () => { modalWindow = null })
})
// 关闭当前窗口
ipcMain.on('close-Window', (event) => {
  // 拿到当前的窗口并关闭
  const win = BrowserWindow.getFocusedWindow();
  win.close();
})
// 最小化窗口
ipcMain.on('minimize-Window', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  win.minimize();
})
//测试
const ffmpegPath =  path.join(binPath, 'ffmpeg.exe');
console.log('ffmpegPath:', ffmpegPath);
// convert
ipcMain.on('convert', (event, options) => {
  console.log('event:', event);
  console.log('baseUrl:', options.baseUrl);
  console.log('exportName:', options.exportName);
  console.log('exportFormat:', options.exportFormat);

  const outputFilePath = path.join(options.baseUrl, options.exportName+'.'+options.exportFormat);
  console.log('outputFilePath',outputFilePath)
  const ffmpeg = spawn(ffmpegPath, [
    '-i', options.filePath,
    outputFilePath
    // Additional ffmpeg arguments can go here
  ]);
  ffmpeg.stdout.on('data', (data) => {
    event.sender.send('conversion-progress', data);
    console.log(`stdout: ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    event.sender.send('convert-error', data.toString());
    console.error(`stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      console.log(`sucess：${outputFilePath}`);
      // 在这里处理转换成功的情况
      event.reply('conversion-complete', outputFilePath);
    } else {

      console.error(`err123：${code}`);
      // 在这里处理转换失败的情况
      event.reply('conversion-error', code);
    }
  });
})