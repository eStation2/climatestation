
Ext.define("climatestation.view.system.PCLogLevelAdmin",{
    extend: "Ext.window.Window",
    controller: "system-pclogleveladmin",
    viewModel: {
        type: "system-pclogleveladmin"
    },
    xtype: "logleveladmin",

    requires: [
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.system.PCLogLevelAdminController',
        'climatestation.view.system.PCLogLevelAdminModel'
    ],

    title: climatestation.Utils.getTranslation('changeloglevel'),    // 'Change Log level',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },
    modal: true,
    closable: true,
    closeAction: 'destroy', // 'hide',
    resizable:false,
    maximizable: false,
    width:225,
    layout: 'fit',
    border:true,
    frame:true,
    bodyStyle: 'padding:5px 5px 0',
    scrollable: true,
    defaultAlign: 'b-c',

    store: 'loglevels',

    params: {
       currentloglevel: null
    },

    initComponent: function () {
        var me = this;

        me.title = climatestation.Utils.getTranslation('changeloglevel');    // 'Change Log level',

        me.bbar = ['->',
            {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('save'),    // 'Save',
                id: 'changeloglevelbtn',
                iconCls: 'far fa-save',
                style: { color: 'lightblue' },
                scale: 'medium',
                disabled: true,
                handler: 'changeLogLevel'
            }
        ];

        me.items = [{
            xtype: 'fieldset',
            defaultType: 'radio',
            padding: 5,
            layout: 'anchor',
            defaults: {
                anchor: '100%',
                hideEmptyLabel: true
            },
            fieldDefaults: {
                labelWidth: 90,
                labelAlign: 'left',
                labelSeparator: ' '
            },
            items: [{
                xtype: 'radiogroup',
                id: 'loglevelsradiogroup',
                text: climatestation.Utils.getTranslation('availableloglevels'),    // "Available loglevel's",
                columns: 1,
                vertical: true,
                listeners: {
                    change: function(loglevelsradiogrp, newvalue){
                        var changeloglevelbtn = Ext.getCmp('changeloglevelbtn');
                        if (me.params.currentloglevel == newvalue.loglevel)
                            changeloglevelbtn.disable();
                        else changeloglevelbtn.enable();
                    }
                }
            }]
        }];

        me.callParent();

        me.controller.setupLogLevels();
    }
});
