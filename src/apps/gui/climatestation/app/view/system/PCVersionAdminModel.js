Ext.define('climatestation.view.system.PCVersionAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.system-pcversionadmin',

    requires: [
        'climatestation.model.Version'
    ],

    stores: {
        versions: {
            model: 'climatestation.model.Version',
            session: true
        }
    }
});
