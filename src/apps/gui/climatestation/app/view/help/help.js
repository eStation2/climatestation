
Ext.define("climatestation.view.help.help",{
    extend: "Ext.panel.Panel",
    controller: "help-help",
    viewModel: {
       type: "help-help"
    },

    xtype  : 'help',

    requires: [
        'Ext.layout.container.Center',
        'Ext.layout.container.HBox',
        'Ext.layout.container.VBox',
        'climatestation.Utils',
        'climatestation.view.help.helpController',
        'climatestation.view.help.helpModel'
    ],

    title: '<span class="dashboard-header-title-style">'+climatestation.Utils.getTranslation('helptitle')+'</span>',
    titleAlign: 'center',
    header: {
        cls: 'dashboard-header-style'
    },

    width: 1150,
    //height: 650,
    autoHeight: true,

    layout: {
        type: 'vbox',
        pack: 'start'
        ,align: 'stretch'
    },
    frame: false,
    border: false,
    bodyPadding: '20 30 30 30',

    bodyCls: 'help-main',

    initComponent: function () {
        var me = this;

        me.listeners = {
            beforerender: function(){
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
        };

        // me.setViewModel({
        //     type: "help-help"
        // });

        me.title = '<span class="dashboard-header-title-style">'+climatestation.Utils.getTranslation('helptitle')+'</span>';

        me.items = [{
            xtype: 'dataview',
            cls: 'help-dataview',

            bind: '{documentation}',

            itemSelector: 'div.thumb-wrap',

            listeners: {
                //itemclick: 'onDocumentClick'
            },

            tpl: [
                '<tpl for=".">',
                // Break every four dataviews
                '<tpl if="xindex % 10 === 1">',
                '<div class="statement-type">{type}</div>',
                '</tpl>',
                '<div class="thumb-wrap">',
                '<a class="thumb" href="{url}" target="_blank">',
                '<div class="thumb-{thumb}"></div>',
                '<div class="thumb-title-container">',
                '<div class="thumb-title">{title}</div>',
                '<div class="thumb-title-small">'+climatestation.Utils.getTranslation('uploaded')+': {uploaded}</div>',
                '</div>',
                '<div class="thumb-download"></div>',
                '</a>',
                '</div>',
                '</tpl>'
            ]
        },{
            xtype: 'dataview',
            cls: 'help-dataview',

            bind: '{weblinks}',

            itemSelector: 'div.thumb-wrap',

            listeners: {
                //itemclick: 'onDocumentClick'
            },

            tpl: [
                '<tpl for=".">',
                // Break every four dataviews
                '<tpl if="xindex % 10 === 1">',
                '<div class="statement-type">{type}</div>',
                '</tpl>',
                '<div class="thumb-wrap">',
                '<a class="thumb" href="{url}" target="_blank">',
                '<div class="thumb-{thumb}"></div>',
                '<div class="thumb-title-container">',
                '<div class="thumb-title">{title}</div>',
                '<div class="thumb-title-small">'+climatestation.Utils.getTranslation('description')+': {description}</div>',
                '</div>',
                '<div class="thumb-gotolink"></div>',
                '</a>',
                '</div>',
                '</tpl>'
            ]
        },{
            xtype: 'dataview',
            cls: 'help-dataview',

            bind: '{notes}',

            itemSelector: 'div.thumb-wrap',

            listeners: {
                //itemclick: 'onDocumentClick'
            },

            tpl: [
                '<tpl for=".">',
                // Break every four dataviews
                '<tpl if="xindex % 10 === 1">',
                '<div class="statement-type">{type}</div>',
                '</tpl>',
                '<div class="thumb-wrap">',
                '<a class="thumb" href="{url}" target="_blank">',
                '<div class="thumb-{thumb}"></div>',
                '<div class="thumb-title-container">',
                '<div class="thumb-title">{title}</div>',
                '<div class="thumb-title-small">'+climatestation.Utils.getTranslation('uploaded')+': {uploaded}</div>',
                '</div>',
                '<div class="thumb-download"></div>',
                '</a>',
                '</div>',
                '</tpl>'
            ]
        }];

        me.callParent();
    }
});
