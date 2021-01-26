Ext.define('climatestation.view.dashboard.ServerStatusInfoController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.dashboard-server-status-info',

    requires: [
        'climatestation.view.acquisition.logviewer.LogView'
    ],

    viewLogFile: function (menuitem) {
        var logViewWin = new climatestation.view.acquisition.logviewer.LogView({
            params: {
                logtype: 'service',
                record: menuitem.service
            }
        });
        logViewWin.show();
    }
    
});
