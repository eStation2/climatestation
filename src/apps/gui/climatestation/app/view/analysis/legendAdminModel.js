Ext.define('climatestation.view.analysis.legendAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-legendadmin',

    stores: {
        legends: {
            source:'LegendsStore'
        }
    }
});
