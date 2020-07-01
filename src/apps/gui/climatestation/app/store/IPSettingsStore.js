Ext.define('climatestation.store.IPSettingsStore', {
     extend  : 'Ext.data.Store'
    ,alias: 'store.ipsettings'

    ,requires : [
        'climatestation.model.IPSetting'
    ]
    ,model: 'climatestation.model.IPSetting'

    ,storeId : 'IPSettingsStore'

});
