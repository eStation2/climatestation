Ext.define('climatestation.view.acquisition.editInternetSourceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-editinternetsource',

    requires: [
        'Ext.data.StoreManager'
    ],
    onSaveClick: function () {
        // Save the changes pending in the dialog's child session back to the parent session.
        let me = this.getView(),
            form = me.lookupReference('internetsourceform'),
            user = climatestation.getUser(),
            updatedRecords = Ext.data.StoreManager.lookup('InternetSourceStore').getUpdatedRecords();

        if (form.isValid()) {
            if (updatedRecords !== []){
                if ((climatestation.Utils.objectExists(user) && user.userlevel !== 1)) {
                    // console.info(updatedRecords);
                    updatedRecords[0].set('modified_by', 'USER');
                }
                Ext.data.StoreManager.lookup('InternetSourceStore').sync();
                me.changes_saved = true;
                //Ext.toast({html: climatestation.Utils.getTranslation('saved'), title: climatestation.Utils.getTranslation('saved'), width: 200, align: 't'});
            }
        }
    }
});
