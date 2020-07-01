Ext.define('climatestation.view.system.IPAddressAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.system-ipaddressadmin',

    requires: [
        'climatestation.Utils'
    ],
    changeIPSettings: function() {
        var me = this;
        var form = Ext.getCmp('ipsettingsform').getForm();

        //if (form.isDirty()) {
            if (form.isValid()) {
                if (me.getSession().getChanges() != null) {
                    me.getSession().getSaveBatch().start();
                    Ext.toast({html: climatestation.Utils.getTranslation('ipsettingssaved'), title: climatestation.Utils.getTranslation('ipsettingssaved'), width: 200, align: 't'});
                    me.closeView();
                }
            }
        //}
        //else Ext.toast({html: 'No changes given to IP Settings!', title: 'No changes given!', width: 200, align: 't'});
    }
});
