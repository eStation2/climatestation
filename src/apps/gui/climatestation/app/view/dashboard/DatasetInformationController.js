Ext.define('climatestation.view.dashboard.DatasetInformationController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.dashboard-datasetinfo',

    requires: [
        'climatestation.view.acquisition.logviewer.LogView'
    ],

    onSeriesTooltipRender: function(tooltip, record, item) {
        tooltip.setHtml(record.get('completeness') + ': ' + record.get('value') + '%');
    },

    onSeriesTooltipRender2: function(tooltip, record, item) {
        tooltip.setHtml(record.get('category') + ': ' + record.get('value') + '% - ' + record.get('products') + ' Products');
    }
});
