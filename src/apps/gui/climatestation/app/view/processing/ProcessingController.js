Ext.define('climatestation.view.processing.ProcessingController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.processing-processing',

    checkStatusServices: function(splitbtn, ev){
        var me = this.getView();
        // AJAX call to check the status of all 3 services
        Ext.Ajax.request({
            method: 'POST',
            url: 'services/checkstatusall',
            success: function(response, opts){
                let services = Ext.JSON.decode(response.responseText);
                let processingbtn = me.down('button[name=processingbtn]');

                if (services.processing){
                    // processingbtn.setStyle('color','green');
                    processingbtn.setIconCls('green');
                    processingbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    processingbtn.down('menuitem[name=runprocessing]').setDisabled(true);
                    processingbtn.down('menuitem[name=stopprocessing]').setDisabled(false);
                    processingbtn.down('menuitem[name=restartprocessing]').setDisabled(false);
                } else {
                    // processingbtn.setStyle('color','red');
                    processingbtn.setIconCls('red');
                    processingbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    processingbtn.down('menuitem[name=runprocessing]').setDisabled(false);
                    processingbtn.down('menuitem[name=stopprocessing]').setDisabled(true);
                    processingbtn.down('menuitem[name=restartprocessing]').setDisabled(true);
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },

    loadstore: function() {
        var me = this.getView();
        var processingstore  = Ext.data.StoreManager.lookup('ProcessingStore');

        if (me.forceStoreLoad || !processingstore.isLoaded()) {
            // var myLoadMask = new Ext.LoadMask({
            //     msg    : climatestation.Utils.getTranslation('loading'), // 'Loading...',
            //     target : me
            // });
            // myLoadMask.show();

            me.getView().getFeature('processprodcat').collapseAll();

            processingstore.proxy.extraParams = {force: true};
            if (processingstore.isStore) {
                processingstore.load({
                    callback: function(records, options, success) {
                        // myLoadMask.hide();
                    }
                });
            }

            me.forceStoreLoad = false;
        }
        this.checkStatusServices();
    }
});
