Ext.define('climatestation.view.analysis.layerAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-layeradmin',
    stores: {
        layers: {
            source:'LayersStore'
            // model: 'climatestation.model.Layer'
           // ,session: true
        }
    }
});
