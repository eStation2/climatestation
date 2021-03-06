
Ext.define("climatestation.view.system.PCModeAdmin",{
    extend: "Ext.window.Window",
    controller: "system-pcmodeadmin",
    viewModel: {
        type: "system-pcmodeadmin"
    },
    xtype: "pcmodeadmin",

    requires: [
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.system.PCModeAdminController',
        'climatestation.view.system.PCModeAdminModel'
    ],

    title: climatestation.Utils.getTranslation('changemode'),    // 'Change Mode',
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
    height:190,
    border:true,
    frame:true,
    bodyStyle: 'padding:5px 5px 0',
    scrollable: true,

    params: {
       currentmode: null
    },

    initComponent: function () {
        var me = this,
            nominal = false,
            recovery = false,
            maintenance = false;

        me.title = climatestation.Utils.getTranslation('changemode');    // 'Change Mode',

        if (me.params.currentmode == 'nominal') nominal = true;
        else if (me.params.currentmode == 'recovery') recovery = true;
        else if (me.params.currentmode == 'maintenance') maintenance = true;

        me.bbar = ['->',
            {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('save'),    // 'Save',
                id: 'changemodebtn',
                iconCls: 'far fa-save',
                style: { color: 'lightblue' },
                scale: 'medium',
                disabled: true,
                handler: 'changeMode'
            }
        ];

        me.items = [{
            xtype: 'fieldset',
            defaultType: 'radio',
            padding: 5,
            //margin: 5,
            layout: 'anchor',
            defaults: {
                anchor: '100%',
                hideEmptyLabel: true
            },
            items: [{
                xtype: 'radiogroup',
                id: 'modesradiogroup',
                columns: 1,
                vertical: true,
                items: [{
                    boxLabel: '<b>'+climatestation.Utils.getTranslation('nominalmode')+'</b>',
                    id: 'nominalradio',
                    name: 'mode',
                    inputValue: 'nominal',
                    checked: nominal
                }, {
                    boxLabel: '<b>'+climatestation.Utils.getTranslation('recoverymode')+'</b>',
                    id: 'recoveryradio',
                    name: 'mode',
                    inputValue: 'recovery',
                    checked: recovery
                }, {
                    boxLabel: '<b>'+climatestation.Utils.getTranslation('maintenancemode')+'</b>',
                    id: 'maintenanceradio',
                    name: 'mode',
                    inputValue: 'maintenance',
                    checked: maintenance
                }],
                listeners: {
                    change: function(){
                        var nominalradio = Ext.getCmp('nominalradio'),
                            recoveryradio = Ext.getCmp('recoveryradio'),
                            maintenanceradio = Ext.getCmp('maintenanceradio'),
                            changemodebtn = Ext.getCmp('changemodebtn');

                        if (me.params.currentmode == 'nominal' && (recoveryradio.getValue() || maintenanceradio.getValue()))
                            changemodebtn.enable();
                        else if (me.params.currentmode == 'recovery' && (nominalradio.getValue() || maintenanceradio.getValue()))
                            changemodebtn.enable();
                        else if (me.params.currentmode == 'maintenance' && (nominalradio.getValue() || recoveryradio.getValue()))
                            changemodebtn.enable();
                        else changemodebtn.disable();
                    }
                }
            }]
        }];

        me.callParent();

    }
});
