Ext.define('climatestation.view.analysis.logoAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.analysis-logoadmin',

    requires: [
        'Ext.data.StoreManager',
        'climatestation.Utils',
        'climatestation.model.Logo',
        'climatestation.view.analysis.addEditLayer'
    ],

    // ,onClose: function(win, ev) {
        // Ext.getCmp('analysismain').lookupReference('analysismain_layersbtn').enable();
    // }

    loadLogosStore: function(win, ev) {
        var me = this.getView();
        var logosgridstore  = Ext.data.StoreManager.lookup('LogosStore');
        // var logosgridstore  = me.lookupReference('logosGrid').getStore('logos');
        if (logosgridstore.isStore) {
            logosgridstore.load({
                callback: function(records, options, success) {
                    me.lookupReference('logosGrid').updateLayout();
                    me.updateLayout();
                }
            });
        }
    }

    ,addLogo: function(){
        // Create a new layer record and pass it. With the bind the store will automaticaly saved (through CRUD) on the server!
        var logosgridstore  = Ext.data.StoreManager.lookup('LogosStore');
        var newLogoRecord = new climatestation.model.Logo({
                'logo_id': 'newlogo',
                'logo_filename': '',
                'logo_description': '',
                'active': false,
                'deletable': true,
                'defined_by': 'USER',
                'isdefault': false,
                'orderindex_defaults': 0,
                'src': '',
                'width': '',
                'height': ''
        });
        //layersgridstore.add(newLayerRecord);

        var fileUploadWin = new Ext.Window({
             id:'logofileupload-win'
            ,layout:'fit'
            ,autoWidth: true
            ,plain: true
            ,modal:true
            ,stateful :false
            ,closable:true
            ,loadMask:true
            ,title:climatestation.Utils.getTranslation('importlogo') // 'Import logo'
            ,items:[{
                xtype: 'form',
                fileUpload: true,
                width: 400,
                frame: false,
                title: '',
                autoHeight: true,
                bodyStyle: 'padding: 10px 10px 10px 10px;',
                defaults: {
                    anchor: '90%',
                    allowBlank: false,
                    msgTarget: 'side'
                },
                columnCount: 1,
                labelAlign :'top',
                items: [{
                     xtype: 'hidden'
                    ,name:'logofilename'
                    ,id:'logofilename'
                    ,value: ''
                },{
                    xtype: 'filefield'
                    ,id: 'logofile'
                    ,name: 'logofile'
                    ,emptyText: climatestation.Utils.getTranslation('select_logo file') // 'Select a logo file'
                    //,fieldLabel: climatestation.Utils.getTranslation('import_logo_file') // 'Logo file'
                    ,width: 200
                    ,vtype:'imagefile'
                    //,labelWidth: 150
                    ,msgTarget: 'side'
                    ,allowBlank: false
                    ,anchor: '100%'
                    ,buttonText: ' '
                    ,buttonConfig: {
                        iconCls: 'far fa-folder-open'
                    }
                }],
                buttons: [{
                    text: climatestation.Utils.getTranslation('btn_import'), // 'Import',
                    handler: function(){
                        if(this.up().up().getForm().isValid()){
                            Ext.getCmp('logofilename').setValue(Ext.getCmp('logofile').lastValue);
                            this.up().up().getForm().submit({
                                url:'logos/import',
                                //scope:this,
                                waitMsg: climatestation.Utils.getTranslation('msg_wait_importing_logo'), // 'Importing logo...',
                                success: function(fp, o, x){
                                    var tpl = new Ext.XTemplate(
                                        climatestation.Utils.getTranslation('logo_file_saved_on_the_server')+'<br />',   // Logo file saved on the server.
                                        climatestation.Utils.getTranslation('name') + ': {filename}<br />'
                                    );
                                    Ext.Msg.alert('Success', tpl.apply(o.result));

                                    // Insert a new logo record in LogosStore
                                    logosgridstore.suspendAutoSync();
                                    newLogoRecord.set('logo_filename', o.result.filename);
                                    logosgridstore.insert(0, newLogoRecord);
                                    logosgridstore.resumeAutoSync(true);

                                    logosgridstore.load();

                                    fileUploadWin.close();
                                },
                                failure: function(fp, operation) {
                                    //console.info('failure');
                                },
                            });
                        }
                        else {
                            Ext.Msg.alert(climatestation.Utils.getTranslation('warning'), climatestation.Utils.getTranslation('vtype_imagefile'));
                        }
                    }
                },{
                    text: climatestation.Utils.getTranslation('btn_txt_reset'), // 'Reset',
                    handler: function(){
                        this.up().up().getForm().reset();
                    }
                // },{
                //     text: climatestation.Utils.getTranslation('close'), // 'Close',
                //     handler: function(){
                //         fileUploadWin.close();
                //     }
                }
                ]
            }]
        });

        fileUploadWin.show();
    }

    ,editLayer: function(grid, rowIndex, row){
        var record = grid.getStore().getAt(rowIndex);
        //if (record.get('defined_by') != 'JRC') {
            var editLayerWin = new climatestation.view.analysis.addEditLayer({
                params: {
                    edit: true,
                    layerrecord: record
                }
            });
            editLayerWin.show();
        //}
    }

    ,deleteLogo: function(grid, rowIndex, row){
        var record = grid.getStore().getAt(rowIndex);
        var user = climatestation.getUser();
        if ((record.get('deletable')) || (climatestation.Utils.objectExists(user) && user.userlevel === 1)){
            Ext.Msg.show({
                title: climatestation.Utils.getTranslation('deletelogoquestion'),     // 'Delete logo?',
                message: climatestation.Utils.getTranslation('deletelogoquestion2') + ' "' + record.get('logo_filename') + '"?',     // Are you sure you want to delete the logo?
                buttons: Ext.Msg.OKCANCEL,
                icon: Ext.Msg.QUESTION,
                fn: function(btn) {
                    if (btn === 'ok') {
                        grid.getStore().remove(record);
                    }
                }
            });
        }
    }

});
