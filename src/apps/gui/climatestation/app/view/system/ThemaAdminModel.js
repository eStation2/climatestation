Ext.define('climatestation.view.system.ThemaAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.system-themaadmin',

    requires: [
        'climatestation.model.Themas'
    ],

    stores: {
        themas: {
            model: 'climatestation.model.Themas',
            session: true
        }
    }

});
