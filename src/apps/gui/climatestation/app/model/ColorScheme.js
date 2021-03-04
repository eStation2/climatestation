
Ext.define('climatestation.model.ColorScheme', {
    extend : 'climatestation.model.Base',

    fields: [
        {name: 'legend_id', mapping: 'legend_id'},
        {name: 'legend_name', mapping: 'legend_name'},
        {name: 'colorschemeHTML', mapping: 'colorschemeHTML'},
        {name: 'legendHTML', mapping: 'legendHTML'},
        {name: 'legendHTMLVertical', mapping: 'legendHTMLVertical'}
    ]
});