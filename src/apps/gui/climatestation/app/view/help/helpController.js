Ext.define('climatestation.view.help.helpController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.help-help',

    onDocumentClick: function(dv, record, item, idx, e, eOpts) {
        window.open(record.get('url'), '_helpdoc');
    },

    loadstore: function() {
        var me = this.getView();
        var documentationstore  = me.getViewModel().getStore('documentation');
        if (documentationstore.isStore) {
            documentationstore.proxy.extraParams = {type: 'docs', lang : climatestation.globals['selectedLanguage']};
            documentationstore.load();
        }
        var weblinksstore  = me.getViewModel().getStore('weblinks');
        if (weblinksstore.isStore) {
            weblinksstore.proxy.extraParams = {type: 'links', lang : climatestation.globals['selectedLanguage']};
            weblinksstore.load();
        }
        var notesstore  = me.getViewModel().getStore('notes');
        if (notesstore.isStore) {
            notesstore.proxy.extraParams = {type: 'notes', lang : climatestation.globals['selectedLanguage']};
            notesstore.load();
        }
    }
    
});
