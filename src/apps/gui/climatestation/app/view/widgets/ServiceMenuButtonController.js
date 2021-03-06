Ext.define('climatestation.view.widgets.ServiceMenuButtonController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.widgets-servicemenubutton',

    requires: [
        'climatestation.Utils',
        'climatestation.view.acquisition.logviewer.LogView'
    ],

    execServiceTask: function(menuitem, ev){
        var me = this.getView();

        // AJAX call to run/start a specified service (specified through the menuitem name).
        // Ext.Ajax.extraParams = {task: menuitem.name};
        Ext.Ajax.request({
            method: 'POST',
            url: 'services/execservicetask',
            // extraParams: {task: menuitem.name},
            params: {
                service: menuitem.service,
                task: menuitem.task
            },
            success: function(response, opts){
                var runresult = Ext.JSON.decode(response.responseText);
                if (runresult.success){
                    if (menuitem.task=='restart') {
                        var message = climatestation.Utils.getTranslation(menuitem.service) + ' ' + climatestation.Utils.getTranslation('restarted');
                        Ext.toast({
                            html: message,
                            title: message,
                            width: 200,
                            align: 't'
                        });
                    }
                    // menuitem.up().up().fireEvent('click', this);
                    // menuitem.up().up().up().getController().checkStatusServices(menuitem.up().up());
                if (runresult.status){
                    me.setIconCls('green');
                    me.setGlyph("xf013@'Font Awesome 5 Free'");
                    me.down('menuitem[name=rundatastore]').setDisabled(true);
                    me.down('menuitem[name=stopdatastore]').setDisabled(false);
                    me.down('menuitem[name=restartdatastore]').setDisabled(false);
                } else {
                    me.setIconCls('red');
                    me.setGlyph("xf013@'Font Awesome 5 Free'");
                    me.down('menuitem[name=rundatastore]').setDisabled(false);
                    me.down('menuitem[name=stopdatastore]').setDisabled(true);
                    me.down('menuitem[name=restartdatastore]').setDisabled(true);
                }
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },

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
