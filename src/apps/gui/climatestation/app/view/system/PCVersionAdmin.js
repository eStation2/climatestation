
Ext.define("climatestation.view.system.PCVersionAdmin",{
    extend: "Ext.window.Window",
    controller: "system-pcversionadmin",
    viewModel: {
        type: "system-pcversionadmin"
    },
    xtype: "pcversionadmin",

    requires: [
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.system.PCVersionAdminController',
        'climatestation.view.system.PCVersionAdminModel'
    ],

    title: climatestation.Utils.getTranslation('changeversion'),    // 'Change version',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },
    modal: true,
    closable: true,
    closeAction: 'destroy', // 'hide',
    resizable:false,
    maximizable: false,
    width:200,
    layout: 'fit',
    border:true,
    frame:true,
    bodyStyle: 'padding:5px 5px 0',
    scrollable: true,

    store: 'versions',

    params: {
       currentversion: null
    },

    initComponent: function () {
        var me = this;

        me.title = climatestation.Utils.getTranslation('changeversion');    // 'Change version';

        me.bbar = ['->',
            {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('save'),    // 'Save',
                id: 'changeversionbtn',
                iconCls: 'far fa-save',
                style: { color: 'lightblue' },
                scale: 'medium',
                disabled: true,
                handler: 'changeVersion'
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
                labelWidth: 85,
                labelAlign: 'left',
                labelSeparator: ' '
            },
            items: [{
                xtype: 'radiogroup',
                id: 'versionsradiogroup',
                text: climatestation.Utils.getTranslation('availableversions'),    // 'Available versions',
                columns: 1,
                vertical: true,
                listeners: {
                    change: function(versionsradiogrp, newvalue){
                        var changeversionbtn = Ext.getCmp('changeversionbtn');
                        if (me.params.currentversion == newvalue.version)
                            changeversionbtn.disable();
                        else changeversionbtn.enable();
                    }
                }
            }]
        }];

        me.controller.setupVersions();

        me.callParent();

    }
});
