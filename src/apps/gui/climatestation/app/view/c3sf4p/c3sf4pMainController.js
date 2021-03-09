Ext.define('climatestation.view.c3sf4p.c3sf4pMainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.c3sf4p-c3sf4pmain',

    requires: [
        'Ext.util.DelayedTask'
    ],
    showUserWorkspaceAdmin: function(btn){
        // console.info(btn);
        btn.userWorkspaceAdminPanel.show();
    }

    ,showRefWorkspaceAdmin: function(btn){
        // console.info(btn);
        btn.refWorkspaceAdminPanel.show();
    }

});
