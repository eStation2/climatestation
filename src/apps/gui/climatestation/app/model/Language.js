Ext.define('climatestation.model.Language', {
    extend : 'climatestation.model.Base',

    fields: [
       {name: 'langcode'},
       {name: 'langdescription'},
       {name: 'selected', type: 'boolean'}
    ]

});