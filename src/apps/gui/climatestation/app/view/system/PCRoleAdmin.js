
Ext.define("climatestation.view.system.PCRoleAdmin",{
    extend: "Ext.window.Window",
    controller: "system-pcroleadmin",
    viewModel: {
        type: "system-pcroleadmin"
    },
    xtype: "pcroleadmin",

    requires: [
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.system.PCRoleAdminController',
        'climatestation.view.system.PCRoleAdminModel'
    ],

    title: climatestation.Utils.getTranslation('assignrole'),    // 'Assign Role',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },
    modal: true,
    closable: false,
    closeAction: 'destroy', // 'hide',
    resizable:false,
    maximizable: false,
    width:140,
    height:160,
    border:true,
    frame:true,
    bodyStyle: 'padding:5px 5px 0',
    scrollable: true,

    params: {
       currentrole: null
    },

    initComponent: function () {
        var me = this,
            pc2checked = false,
            pc3checked = false;

        me.title = climatestation.Utils.getTranslation('assignrole');    // 'Assign Role',

        if (me.params.currentrole == 'PC2') pc2checked = true;
        else if (me.params.currentrole == 'PC3') pc3checked = true;

        me.bbar = ['->',
            {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('save'),    // 'Save',
                id: 'changerolebtn',
                iconCls: 'far fa-save',
                style: { color: 'lightblue' },
                scale: 'medium',
                disabled: false,
                handler: 'changeRole'
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
                id: 'rolesradiogroup',
                columns: 1,
                vertical: true,
                items: [{
                    boxLabel: '<b>PC2</b>',
                    id: 'pc2radio',
                    name: 'role',
                    inputValue: 'PC2',
                    checked: pc2checked
                }, {
                    boxLabel: '<b>PC3</b>',
                    id: 'pc3radio',
                    name: 'role',
                    inputValue: 'PC3',
                    checked: pc3checked
                }]
            }]
        }];

        me.callParent();

    }
});
