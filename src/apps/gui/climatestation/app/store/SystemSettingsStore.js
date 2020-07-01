Ext.define('climatestation.store.SystemSettingsStore', {
     extend  : 'Ext.data.Store'
    ,alias: 'store.systemsettings'

    ,requires : [
        'climatestation.model.SystemSetting'
    ]
    ,model: 'climatestation.model.SystemSetting'

    ,storeId : 'SystemSettingsStore'

});
