Ext.define('climatestation.view.acquisition.IngestionModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ingestion'

    ,stores: {
        productingestions: {
             source:'IngestionsStore'
        }
    }
});
