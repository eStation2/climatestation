Ext.define('climatestation.view.acquisition.editEumetcastSourceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-editeumetcastsource',

    requires: [
        'Ext.data.StoreManager'
    ],
    onSaveClick: function () {
        // Save the changes pending in the dialog's child session back to the parent session.
        var me = this.getView(),
            form = this.lookupReference('eumetcastsourceform'),
            user = climatestation.getUser(),
            updatedRecords = Ext.data.StoreManager.lookup('EumetcastSourceStore').getUpdatedRecords();

        if (form.isValid()) {
            if (updatedRecords !== []){
                if ((climatestation.Utils.objectExists(user) && user.userlevel !== 1)) {
                    // console.info(updatedRecords);
                    updatedRecords[0].set('modified_by', 'USER');
                }
                Ext.data.StoreManager.lookup('EumetcastSourceStore').sync();
                me.changes_saved = true;
            }
        }
    }
});
