/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('climatestation.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.app-main',
    impactWindow: 'ciao',
    itemId:'MainController',

    initComponent: function(){
        var me = this;

    },

    doCardNavigation: function(cardid) {
        let me = this.getView(),
        contentlayout = me.getComponent('maincontentPanel').getLayout();
        contentlayout.setActiveItem(cardid);
    },

    launchImpact: function(impactWindow) {

                if(impactWindow !== null && impactWindow.closed == false ) {
                    alert("Window already open");
                    impactWindow.focus();
                    return impactWindow

                } else {
                     return window.open('http://localhost:8899/IMPACT', "IMPACT Toolbox");
                }
                // url and port should be taken from configuration file
                //window.open('http://localhost:8899/IMPACT', "IMPACT Toolbox");
    }
});
