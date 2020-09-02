Ext.define('climatestation.view.dashboard.PC2Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.dashboard-pc2',

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
    },

    execEnableDisableAutoSync: function(chkbox, ev) {
        var me = this;
        //console.info(chkbox);
        Ext.Ajax.request({
            method: 'POST',
            url: 'dashboard/setdataautosync',
            params:{
                dataautosync: chkbox.checked
            },
            success: function(response, opts){
                var responseText = Ext.JSON.decode(response.responseText);
                // ToDO: Set checkbox text to enable or disable and show a toast message!
//                console.info(responseText);
            },
            failure: function(response, opts) {
//                console.info(response.status);
            }
        });
    },
    execManualDataSync: function(menuitem, ev) {
        var me = this;
        Ext.Ajax.request({
            method: 'POST',
            url: 'dashboard/rundatasync',
            success: function(response, opts){
                var responseText = Ext.JSON.decode(response.responseText);
                // ToDO: Show a toast message with the result of the manual data sync!
//                console.info(responseText);
            },
            failure: function(response, opts) {
//                console.info(response.status);
            }
        });
    },
    execEnableDisableAutoDBSync: function(chkbox, ev) {
        var me = this;
//        console.info(chkbox);
        Ext.Ajax.request({
            method: 'POST',
            url: 'dashboard/setdbautosync',
            params:{
                dbautosync: chkbox.checked
            },
            success: function(response, opts){
                var responseText = Ext.JSON.decode(response.responseText);
                // ToDO: Set checkbox text to enable or disable and show a toast message!
//                console.info(responseText);
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },
    execManualDBSync: function(menuitem, ev) {
        var me = this;
        Ext.Ajax.request({
            method: 'POST',
            url: 'dashboard/rundbsync',
            success: function(response, opts){
                var responseText = Ext.JSON.decode(response.responseText);
                // ToDO: Show a toast message with the result of the manual DB sync!
//                console.info(responseText);
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },
    checkStatusServices: function(splitbtn, ev){
        var me = this.getView();
        //console.info('Start checkStatusServices for PC2');

        // Ext.toast({ html: 'checkStatusServices', title: 'checkStatusServices', width: 200, align: 't' });
        // AJAX call to check the status of all 3 services
        Ext.Ajax.request({
            method: 'POST',
            url: 'services/checkstatusall',
            success: function(response, opts){
                let services = Ext.JSON.decode(response.responseText);
                let eumetcastbtn = me.down('button[name=eumetcastbtn]');
                let internetbtn = me.down('button[name=internetbtn]');
                let ingestbtn = me.down('button[name=ingestbtn]');
                let processingbtn = me.down('button[name=processingbtn]');
                let systembtn = me.down('button[name=systembtn]');

                if (services.eumetcast){
                    // eumetcastbtn.setStyle('color','green');
                    eumetcastbtn.setIconCls('green');
                    eumetcastbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    eumetcastbtn.down('menuitem[name=runeumetcast]').setDisabled(true);
                    eumetcastbtn.down('menuitem[name=stopeumetcast]').setDisabled(false);
                    eumetcastbtn.down('menuitem[name=restarteumetcast]').setDisabled(false);
                } else {
                    // eumetcastbtn.setStyle('color','red');
                    eumetcastbtn.setIconCls('red');
                    eumetcastbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    eumetcastbtn.down('menuitem[name=runeumetcast]').setDisabled(false);
                    eumetcastbtn.down('menuitem[name=stopeumetcast]').setDisabled(true);
                    eumetcastbtn.down('menuitem[name=restarteumetcast]').setDisabled(true);
                }
                if (services.internet){
                    // internetbtn.setStyle('color','green');
                    internetbtn.setIconCls('green');
                    internetbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    internetbtn.down('menuitem[name=runinternet]').setDisabled(true);
                    internetbtn.down('menuitem[name=stopinternet]').setDisabled(false);
                    internetbtn.down('menuitem[name=restartinternet]').setDisabled(false);
                } else {
                    // internetbtn.setStyle('color','red');
                    internetbtn.setIconCls('red');
                    internetbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    internetbtn.down('menuitem[name=runinternet]').setDisabled(false);
                    internetbtn.down('menuitem[name=stopinternet]').setDisabled(true);
                    internetbtn.down('menuitem[name=restartinternet]').setDisabled(true);
                }
                if (services.ingest){
                    // ingestbtn.setStyle('color','green');
                    ingestbtn.setIconCls('green');
                    ingestbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    ingestbtn.down('menuitem[name=runingest]').setDisabled(true);
                    ingestbtn.down('menuitem[name=stopingest]').setDisabled(false);
                    ingestbtn.down('menuitem[name=restartingest]').setDisabled(false);
                } else {
                    // ingestbtn.setStyle('color','red');
                    ingestbtn.setIconCls('red');
                    ingestbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    ingestbtn.down('menuitem[name=runingest]').setDisabled(false);
                    ingestbtn.down('menuitem[name=stopingest]').setDisabled(true);
                    ingestbtn.down('menuitem[name=restartingest]').setDisabled(true);
                }
                if (services.processing){
                    // processingbtn.setStyle('color','green');
                    processingbtn.setIconCls('green');
                    processingbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    processingbtn.down('menuitem[name=runprocessing]').setDisabled(true);
                    processingbtn.down('menuitem[name=stopprocessing]').setDisabled(false);
                    processingbtn.down('menuitem[name=restartprocessing]').setDisabled(false);
                } else {
                    // processingbtn.setStyle('color','red');
                    processingbtn.setIconCls('red');
                    processingbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    processingbtn.down('menuitem[name=runprocessing]').setDisabled(false);
                    processingbtn.down('menuitem[name=stopprocessing]').setDisabled(true);
                    processingbtn.down('menuitem[name=restartprocessing]').setDisabled(true);
                }
                if (services.system){
                    // systembtn.setStyle('color','green');
                    systembtn.setIconCls('green');
                    systembtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    systembtn.down('menuitem[name=runsystem]').setDisabled(true);
                    systembtn.down('menuitem[name=stopsystem]').setDisabled(false);
                    systembtn.down('menuitem[name=restartsystem]').setDisabled(false);
                } else {
                    // systembtn.setStyle('color','red');
                    systembtn.setIconCls('red');
                    systembtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    systembtn.down('menuitem[name=runsystem]').setDisabled(false);
                    systembtn.down('menuitem[name=stopsystem]').setDisabled(true);
                    systembtn.down('menuitem[name=restartsystem]').setDisabled(true);
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    }
    
});
