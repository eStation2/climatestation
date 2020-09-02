/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('climatestation.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.app-main',

    doCardNavigation: function(cardid) {
        let me = this.getView(),
        contentlayout = me.getComponent('maincontentPanel').getLayout();
        contentlayout.setActiveItem(cardid);
    }
});
