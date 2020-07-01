Ext.define('climatestation.view.acquisition.editInternetSourceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-editinternetsource',

    requires: [
        'Ext.data.StoreManager'
    ],
    onSaveClick: function () {
        // Save the changes pending in the dialog's child session back to the parent session.
        var me = this.getView(),
            form = me.lookupReference('internetsourceform');

        //console.info(this.getStore('internetsources'));
        if (form.isValid()) {
            // console.info(Ext.data.StoreManager.lookup('InternetSourceStore').getUpdatedRecords());

            if (Ext.data.StoreManager.lookup('InternetSourceStore').getUpdatedRecords() !== []){
                Ext.data.StoreManager.lookup('InternetSourceStore').sync();
                //Ext.toast({html: climatestation.Utils.getTranslation('saved'), title: climatestation.Utils.getTranslation('saved'), width: 200, align: 't'});
            }
        }
    }
});
