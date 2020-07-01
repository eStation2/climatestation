Ext.define('climatestation.view.acquisition.DataAcquisitionModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.dataacquisition'

    ,stores: {
        productdatasources: {
             source:'DataAcquisitionsStore'
        }
    }
});
