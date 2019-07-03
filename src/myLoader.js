'use strict'

//window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');

(function () {

    const remote = require('electron').remote;

    function serverExpose() {
        let win = remote.getCurrentWindow();
        win.loadURL('http://localhost:' + 9183);
    }

    function PyInstall() {
        document.querySelector('#appStatus').innerHTML = '<span class="text-warning">Настройка Python 3.7</span>'
        document.querySelector("#pynote").innerHTML = 'N/A';
        document.querySelector("#djnote").innerHTML = 'N/A'

        var pyInstSpawn = require('child_process').spawn;
        var pyInst = pyInstSpawn(__dirname + '/dist/python-3.7.1-amd64.exe', ['/uninstall', '/quiet']);
        pyInst.on('exit', function (dataP) {
            var pyInst2 = pyInstSpawn(__dirname + '/dist/python-3.7.1-amd64.exe', ['/quiet', 'PrependPath=1']);
            pyInst2.on('exit', function (dataP2) {
                remote.dialog.showMessageBox({
                    type: 'warning', icon: remote.nativeImage.createFromPath(__dirname + '/res/Python-logo.png'),
                    title: 'Внимание', message: 'Были внесены изменения в систему.\nПерезапустите программу.'
                });
                remote.app.exit(0);
            });
        });
    }

    document.onreadystatechange = function () {
        if (document.readyState == "complete") {

            document.querySelector('#appStatus').innerHTML = '<span class="text-white-50">Загрузка...</span>';

            //exec('setx path "%path%;'+__dirname + '/../djYMDB/venv/Scripts/"');

            var pyVer = 'N/A';
            const {exec} = require('child_process');
            exec('python -V', (err, stdout, stderr) => {
                if (err) {
                    PyInstall();
                    return;
                }

                if (stderr != '') {
                    remote.dialog.showMessageBox({
                        type: 'error',
                        title: 'Ошибка запуска',
                        message: 'Чтото пошло не так:\n' + stderr
                    });
                    remote.app.exit(0);
                } else {

                    var pyVer = '';
                    pyVer = stdout.split(' ');
                    if (pyVer[1].indexOf('3.') != -1) {

                        document.querySelector("#pynote").innerHTML = pyVer[1];

                        var djVSpawn = require('child_process').spawn;
                        var djV = djVSpawn(__dirname + '/../djYMDB/venv/Scripts/python', [__dirname + '/../djYMDB/manage.py', 'version']);
                        djV.stdout.on('data', function (dataD) {
                            document.querySelector("#djnote").innerHTML = dataD.toString();
                            setTimeout(serverExpose(), 5);
                        });

                    } else {
                        PyInstall();
                    }

                }

            });

        }
    };

})();