Ext.define('climatestation.view.system.systemsettingsModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.system-systemsettings'

    ,requires: [
        'climatestation.model.SystemSetting'
    ]
    ,links: {
        system_setting: {
            reference: 'climatestation.model.SystemSetting',
            //type: 'SystemSetting',
            id: 0
            ,listeners: {
                update: function () {
                    //Ext.Msg.alert('Message', 'Path settings updated!');
                }
            }
        }
    }
});
