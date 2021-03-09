Ext.define('climatestation.view.impact.impactMainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.impact-impactmain',

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
