Ext.define('climatestation.view.system.PCRoleAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.system-pcroleadmin',

    requires: [
        'Ext.data.StoreManager',
        'climatestation.Utils'
    ],
    changeRole: function() {
        var me = this,
            newrole = Ext.getCmp('rolesradiogroup').getValue();

        Ext.Ajax.request({
            method: 'GET',
            url: 'systemsettings/changerole',
            params: {
                role: newrole.role
            },
            success: function(response, opts){
                var result = Ext.JSON.decode(response.responseText);
                if (result.success){
                    Ext.toast({ html: climatestation.Utils.getTranslation('systemrolesetto') + " " + newrole.role,
                                title: climatestation.Utils.getTranslation('rolechanged'),
                                width: 200, align: 't' });
                }
                var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
                var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
                    scope: me,
                    failure: function(record, operation) {
                        //console.info('failure');
                    },
                    success: function(record, operation) {
                        var systemsettingview = Ext.getCmp('systemsettingsview');

                        systemsettingview.loadRecord(systemsettingsrecord);
                        systemsettingview.updateRecord();
                        if (result.success) {
                            Ext.getCmp('modify-role-btn').hide();
                        }
                        Ext.getCmp('dashboard-panel').getController().setupDashboard();

                        me.closeView();
                    }
                });
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    }
});
