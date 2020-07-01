Ext.define('climatestation.view.analysis.logoAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-logoadmin',
    stores: {
        logos: {
            source:'LogosStore'
        }
    }
});
