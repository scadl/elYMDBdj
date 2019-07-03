 //handle setupevents as quickly as possible
 const setupEvents = require('./setupEvent')
 if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
 } else {

     /* main Electron working code */
     const {app, BrowserWindow, Menu, Tray, nativeImage} = require('electron');
     let win;

     function createWindow() {

         win = new BrowserWindow({
             width: 1280,
             height: 800,
             minWidth: 320,
             minHeight: 240,
             acceptFirstMouse: true,
             titleBarStyle: "hidden",
             autoHideMenuBar: true,
             frame: true,
             backgroundColor: '#343a40',
             icon: 'res/site_icon_x32.png'
         });

         /*
         new BrowserWindow({
             transparent:true
             frame: false,
             backgroundColor: '#00FFFFFF'
         });*/

         //win.webContents.openDevTools();

         win.loadURL('file://' + __dirname + '/src/myLoaderView.html');
         win.show();

         var port = 9183;

        // This twisted CWD argument is required to correctly drive django's Model.ImageFile path
         var djangoSpawn = require('child_process').spawn;
         var djangoWin = djangoSpawn(__dirname+'/djYMDB/venv/Scripts/python', ['-u', __dirname+'/djYMDB/manage.py', 'runserver', 'localhost:'+port], {cwd:__dirname+'/djYMDB'});
         djangoWin.stdout.on('data', function (data) {
             console.log(data.toString());
         });

         let myTray = null;
         const nImage = nativeImage.createFromPath(__dirname+'/res/site_icon_x32.png');
         const trayMeu = Menu.buildFromTemplate([
             {label:'Добавить запись', type:"normal", click:function () {
                     win.restore();
                     win.loadURL('http://localhost:'+port+'/add/0');
                     win.show();
                 }},
             {label:'Изменить колллекции', type:"normal", click:function () {
                     win.restore();
                     win.loadURL('http://localhost:'+port+'/prop/1');
                     win.show();
                 }},
             {label:'Изменить жанры', type:"normal", click:function () {
                     win.restore();
                     win.loadURL('http://localhost:'+port+'/prop/2');
                     win.show();
                 }},
             {label:'sep', type:"separator"},
             {label:'Покинуть программу', type:"normal", click:function () {
                     app.exit(0);
                 }}
         ]);

         var procsPIDS = new Array();
         var redirs = 0;
         win.webContents.on('did-finish-load', function () {

             redirs += 1;
             if (redirs == 2) {

                 // We have loaded main server.
                 // Now can collect python PIDs
                 const tasklist = require('tasklist');
                 tasklist({verbose: true, filter: ['Imagename eq python.exe']}).then(tasks => {
                     //console.log(tasks);
                     tasks.forEach(function (t) {
                         procsPIDS.push(t.pid);
                     });
                     console.log(procsPIDS);
                 });

                 // Also tray icon
                 myTray = new Tray(nImage);
                 myTray.setContextMenu(trayMeu);
                 myTray.setToolTip('YMDB - Ваша База Художественных Произведений');
                 myTray.on('click', function () {
                     win.restore();
                     win.show();
                     win.focus();
                 });

             }

         });

         win.on('closed', function() {

             procsPIDS.forEach(function (pypid) {
                 process.kill(pypid);
             })

         });

         win.on('minimize', function() {
             win.hide();
             if (myTray){
                 myTray.displayBalloon({icon:'res/site_icon_x32.png',title:'YMDB',
                     content:'Программа продолжает работать.\nЩелкните чтобы отбразить окно.\nИли воспользутесь меню'})
             }
         })


     }

     app.on('ready', createWindow);
     app.on('window-all-closed', () => {
         if (process.platform !== 'darwin') {
             app.quit();
         }

     });
     app.on('activate', () => {
         if (win === null) {
             createWindow();
         }
     });
 }