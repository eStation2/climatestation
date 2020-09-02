
Ext.define("climatestation.view.system.systemsettings",{
    extend: "Ext.panel.Panel",
    controller: "system-systemsettings",
    viewModel: {
        type: "system-systemsettings"
    },

    xtype  : 'systemsettings',
    name :  'systemsettings',
    id: 'systemsettingsview',

    requires: [
        'Ext.data.StoreManager',
        'Ext.form.FieldSet',
        'Ext.form.field.Number',
        'Ext.tip.ToolTip',
        'climatestation.Utils',
        'climatestation.view.system.PCLogLevelAdmin',
        'climatestation.view.system.PCRoleAdmin',
        'climatestation.view.system.ThemaAdmin',
        'climatestation.view.system.systemsettingsController',
        'climatestation.view.system.systemsettingsModel'
    ],

    // session:true,

    title: '', // 'System settings',
    titleAlign: 'center',
    border: false,
    frame: false,
    //width:850,
    autoWidth: true,
    scrollable: true,
    fieldDefaults: {
        labelWidth: 120,
        labelAlign: 'left'
    },
    bodyPadding:'5 15 5 15',
    viewConfig:{forceFit:true},
    layout:'center',

    initComponent: function () {
        var me = this;
        // me.session = true;
        // me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('systemsettings') + '</span>');

        me.fieldset_title_database_connection_settings = '<b>'+climatestation.Utils.getTranslation('dbconnectionsettings')+'</b>';
        me.form_fieldlabel_dbhost                      = climatestation.Utils.getTranslation('host');   // 'Host';
        me.form_fieldlabel_dbport                      = climatestation.Utils.getTranslation('port');   // 'Port';
        me.form_fieldlabel_dbuser                      = climatestation.Utils.getTranslation('username');   // 'User name';
        me.form_fieldlabel_dbpassword                  = climatestation.Utils.getTranslation('password');   // 'Password';
        me.form_fieldlabel_dbname                      = climatestation.Utils.getTranslation('databasename');   // 'Database name';

        me.fieldset_title_path_settings                = '<b>'+climatestation.Utils.getTranslation('directorypaths')+'</b>';
        me.form_fieldlabel_base_dir                    = climatestation.Utils.getTranslation('basedir');   // 'Base directory';
        me.form_fieldlabel_base_tmp_dir                = climatestation.Utils.getTranslation('basetmpdir');   // 'Base temporary directory';
        me.form_fieldlabel_data_dir                    = climatestation.Utils.getTranslation('datadir');   // 'Data directory';
        me.form_fieldlabel_ingest_dir                  = climatestation.Utils.getTranslation('ingestdir');   // 'Ingest directory';
        me.form_fieldlabel_static_data_dir             = climatestation.Utils.getTranslation('staticdatadir');   // 'Static data directory';
        me.form_fieldlabel_archive_dir                 = climatestation.Utils.getTranslation('archivedir');   // 'Archive directory';
        me.form_fieldlabel_eumetcast_files_dir         = climatestation.Utils.getTranslation('eumetcastfilesdir');   // 'Eumetcast files directory';
        //me.form_fieldlabel_ingest_server_in_dir        = climatestation.Utils.getTranslation('ingestserverindir');   // 'Ingest server in directory';
        me.form_fieldlabel_get_internet_output_dir     = climatestation.Utils.getTranslation('getinternetoutputdir');   // 'Get Eumetcast output directory';
        me.form_fieldlabel_get_eumetcast_output_dir    = climatestation.Utils.getTranslation('geteumetcastoutputdir');   // 'Get Internet output directory';

        me.fieldset_title_system_settings              = '<b>'+climatestation.Utils.getTranslation('systemsettings')+'</b>';
        me.form_fieldlabel_ip_pc1                      = climatestation.Utils.getTranslation('pc1');   // 'PC1';
        me.form_fieldlabel_ip_pc2                      = climatestation.Utils.getTranslation('pc2');   // 'PC2';
        me.form_fieldlabel_ip_pc3                      = climatestation.Utils.getTranslation('pc3');   // 'PC3';
        me.form_fieldlabel_current_mode                = climatestation.Utils.getTranslation('currentmode');   // 'Current mode';
        me.form_fieldlabel_active_verion               = climatestation.Utils.getTranslation('activeversion');   // 'Active version';
        me.form_fieldlabel_type_of_install             = climatestation.Utils.getTranslation('typeofinstall');   // 'Type of Install';
        me.form_fieldlabel_role                        = climatestation.Utils.getTranslation('role');   // 'Role';
        me.form_fieldlabel_thema                       = climatestation.Utils.getTranslation('thema');   // 'Thema';
        me.form_fieldlabel_loglevel                    = climatestation.Utils.getTranslation('loglevel');   // 'Log level';
        me.fieldset_title_ipaddresses                  = '<b>'+climatestation.Utils.getTranslation('ipaddresses')+'</b>';  // '<b>IP addresses</b>';
        me.fieldset_title_proxy_settings               = '<b>'+climatestation.Utils.getTranslation('proxy_settings')+'</b>';   // 'Internet proxy settings';
        me.form_fieldlabel_proxy_host                  = climatestation.Utils.getTranslation('proxy_host');   // 'Proxy host';
        me.form_fieldlabel_proxy_port                  = climatestation.Utils.getTranslation('proxy_port');   // 'Proxy port';
        me.form_fieldlabel_proxy_user                  = climatestation.Utils.getTranslation('proxy_user');   // 'Proxy user';
        me.form_fieldlabel_proxy_userpwd               = climatestation.Utils.getTranslation('proxy_userpwd');   // 'Proxy user password';

        var hiddenForWindowsVersion = false;
        if (climatestation.globals['typeinstallation'] === 'windows'){
            hiddenForWindowsVersion = true;
        }

        me.tbar = [
        '->', {
            xtype: 'button',
            iconCls: 'far fa-redo-alt',
            style: { color: 'gray' },
            enableToggle: false,
            scale: 'medium',
            tooltip: climatestation.Utils.getTranslation('reloadsystemparams'),   // 'Reload system parameters.',
            callback: function (formpanel) {
                var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
                var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
                    scope: formpanel,
                    loadmask: true,
                    failure: function(record, operation) {
                        //console.info('failure');
                    },
                    success: function(record, operation) {
                        if (operation.success){
                            formpanel.loadRecord(systemsettingsrecord);
                            formpanel.updateRecord();

                            // IN WINDOWS VERSION THEMA MUST BE CHANGEABLE!
                            if (climatestation.globals['typeinstallation'] === 'windows'){
                                Ext.getCmp('modify-thema-btn').show();
                            }
                            else {
                                if (record.data.thema != ''){
                                    Ext.getCmp('modify-thema-btn').hide();
                                }
                                else {
                                    Ext.getCmp('modify-thema-btn').show();
                                }
                            }

                            Ext.toast({ html: climatestation.Utils.getTranslation('systemsettingsrefreshed'), title: climatestation.Utils.getTranslation('systemsettingsrefreshed'), width: 200, align: 't' });
                        }
                    }
                });
            }
        }];

        var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
        // var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
        //     scope: me,
        //     failure: function(record, operation) {
        //         //console.info('failure');
        //     },
        //     success: function(record, operation) {
        //         me.type_install = record.data.type_installation;
        //         me.pcrole = record.data.role;
        //         me.thema = record.data.thema;
        //
        //         if (me.pcrole == ''){
        //             //console.info(Ext.getCmp('modify-role-btn'));
        //             Ext.getCmp('modify-role-btn').show();
        //             Ext.getCmp('modify-role-btn').fireHandler();
        //         }
        //
        //         // IN WINDOWS VERSION THEMA MUST BE CHANGEABLE!
        //         if (climatestation.globals['typeinstallation'] != 'windows'){
        //             if (me.thema != ''){
        //                 Ext.getCmp('modify-thema-btn').hide();
        //             }
        //         }
        //     }
        // });

        var dockedItems =  [{
            dock: 'bottom',
            xtype: 'toolbar',
            items : [{
                text: climatestation.Utils.getTranslation('createsystemreport'), // 'Create System Report',
                scope: me,
                hidden:  hiddenForWindowsVersion,
                iconCls: 'far fa-download royalblue',
                style: { color: 'royalblue' },
                scale: 'medium',
                disabled: false,
                handler: function () {
                    // if (!Ext.fly('app-upload-frame')) {
                    //     var body = Ext.getBody();
                    //     var downloadFrame = body.createChild({
                    //         tag: 'iframe',
                    //         cls: 'x-hidden',
                    //         id: 'app-upload-frame',
                    //         name: 'uploadframe'
                    //     });
                    //
                    //     var downloadForm = body.createChild({
                    //         tag: 'form',
                    //         cls: 'x-hidden',
                    //         id: 'app-upload-form',
                    //         target: 'app-upload-frame'
                    //     });
                    // }

                    if (!Ext.fly('frmExportDummy')) {
                        var frm = document.createElement('form');
                        frm.id = 'frmExportDummy';
                        frm.name = frm.id;
                        frm.className = 'x-hidden';
                        document.body.appendChild(frm);
                    }

                    Ext.Ajax.request({
                        method: 'POST',
                        url: 'systemsettings/systemreport',
                        isUpload: true,
                        form: Ext.fly('frmExportDummy'),
                        success: function(response, opts){
                            var result = Ext.JSON.decode(response.responseText);
                            if (!result.success){
                                console.info(response.status);
                               // Ext.toast({ html: 'Download system report', title: 'System report', width: 200, align: 't' });
                            }
                        },
                        failure: function(response, opts) {
                            console.info(response.status);
                        }
                    });
                }
            },{
                text: climatestation.Utils.getTranslation('createinstallreport'), // 'Create Install Report',
                scope:me,
                hidden:  hiddenForWindowsVersion,
                iconCls: 'far fa-download royalblue',
                style: { color: 'royalblue' },
                scale: 'medium',
                disabled: false,
                handler: function(){
                    if (!Ext.fly('frmExportDummy')) {
                        var frm = document.createElement('form');
                        frm.id = 'frmExportDummy';
                        frm.name = id;
                        frm.className = 'x-hidden';
                        document.body.appendChild(frm);
                    }
                   Ext.Ajax.request({
                        method: 'GET',
                        url: 'systemsettings/installreport',
                        isUpload: true,
                        form: Ext.fly('frmExportDummy'),
                        success: function(response, opts){
                            //var result = Ext.JSON.decode(response.responseText);
                            //if (result.success){
                            //    Ext.toast({ html: 'Download install report', title: 'Install report', width: 200, align: 't' });
                            //}
                        },
                        failure: function(response, opts) {
                            console.info(response.status);
                        }
                    });
                }
            },'->',{
                text: climatestation.Utils.getTranslation('resettofactorysettings'), // 'Reset to factory settings',
                scope:me,
                iconCls: 'far fa-undo orange',    // 'apply_globals-icon',
                style: { color: 'orange' },
                scale: 'medium',
                disabled: false,
                handler: function(){
                    // me.onHandleAction('Reset','reset');
                   Ext.Ajax.request({
                        method: 'GET',
                        url: 'systemsettings/reset',
                        success: function(response, opts){
                            var result = Ext.JSON.decode(response.responseText);
                            if (result.success){
                                Ext.toast({ html: climatestation.Utils.getTranslation('resettofactorysettingstext'), title: climatestation.Utils.getTranslation('resettofactorysettings'), width: 200, align: 't' });
                            }
                            var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
                            var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
                                scope: me,
                                failure: function(record, operation) {
                                    //console.info('failure');
                                },
                                success: function(record, operation) {
                                    me.loadRecord(systemsettingsrecord);
                                    me.updateRecord();
                                    Ext.getCmp('datamanagementmain').setDirtyStore(true);
                                    Ext.getCmp('acquisitionmain').setDirtyStore(true);
                                }
                            });
                        },
                        failure: function(response, opts) {
                            console.info(response.status);
                        }
                    });
                }
            },{
                text: climatestation.Utils.getTranslation('save'), // 'Save',
                scope:me,
                iconCls: 'far fa-save lightblue',    // 'icon-disk',
                style: { color: 'lightblue' },
                scale: 'medium',
                disabled: false,
                handler: function(){
                    // me.onHandleAction('Save','save');
                    var SystemSettingChanges = me.getSession().getChanges();
                    if (SystemSettingChanges != null){
                        // console.info(me.getSession().getChanges());
                        me.getSession().getSaveBatch().start();
                        Ext.toast({ html: climatestation.Utils.getTranslation('systemsettingssaved'), title: climatestation.Utils.getTranslation('systemsettingssaved'), width: 200, align: 't' });

                        // console.info(SystemSettingChanges.SystemSetting.U[0].hasOwnProperty('data_dir'));
                        if (SystemSettingChanges.SystemSetting.U[0].hasOwnProperty('data_dir')){
                            Ext.getCmp('datamanagementmain').setDirtyStore(true);
                            Ext.getCmp('acquisitionmain').setDirtyStore(true);
                        }

                        // var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
                        // if (datasetsstore.isStore) {
                        //     // datasetsstore.proxy.extraParams = {force: true};
                        //     // datasetsstore.load();
                        // }
                    }
                }
            }]
        }];

        me.formItems = [{
            margin:'0 15 5 0',
            items: [{
                xtype: 'fieldset',
                title: me.fieldset_title_system_settings,
                collapsible:false,
                height:'800',
                defaults: {
                    width: 350,
                    labelWidth: 100
                },
                items: [{
                    xtype: 'fieldset',
                    hidden:  hiddenForWindowsVersion,
                    title: '',
                    collapsible:false,
                    padding: 5,
                    defaults: {
                        labelWidth: 100,
                        layout: 'hbox'
                    },
                    items:[{
                        xtype: 'container',
                        items: [{
                            id: 'type_of_install',
                            name: 'type_of_install',
                            bind: '{system_setting.type_installation}',
                            xtype: 'displayfield',
                            fieldLabel: me.form_fieldlabel_type_of_install,
                            fieldStyle: 'font-weight: bold;'
                        }]
                    },{
                        xtype: 'container',
                        items: [{
                            id: 'role',
                            name: 'role',
                            bind: '{system_setting.role}',
                            xtype: 'displayfield',
                            fieldLabel: me.form_fieldlabel_role,
                            fieldStyle: 'font-weight: bold;',
                            flex: 2.2
                        },{
                            xtype: 'button',
                            id: 'modify-role-btn',
                            hidden: true,
                            text: climatestation.Utils.getTranslation('modify'),    // 'Modify',
                            flex: 0.8,
                            iconCls: 'far fa-pencil-square-o',
                            style: { color: 'white' },
                            // glyph: 'xf055@FontAwesome',
                            //scale: 'medium',
                            scope:me,
                            handler: function(){
                                var PCRoleAdminWin = new climatestation.view.system.PCRoleAdmin({
                                    params: {
                                        currentrole: Ext.getCmp('role').getValue()
                                    }
                                });
                                PCRoleAdminWin.show();
                            }
                        }]
                    }]
                },{
                    xtype: 'fieldset',
                    title: '',
                    collapsible:false,
                    padding: 10,
                    defaults: {
                        labelWidth: 100,
                        layout: 'hbox'
                    },
                    items:[{
                        xtype: 'container',
                       items:[{
                           id: 'current_mode',
                           hidden:  hiddenForWindowsVersion,
                           name: 'current_mode',
                           bind: '{system_setting.current_mode}',
                           xtype: 'displayfield',
                           fieldLabel: me.form_fieldlabel_current_mode,
                           fieldStyle:'font-weight: bold;',
                           flex: 2.2
                        //},{
                        //    xtype: 'button',
                        //    text: climatestation.Utils.getTranslation('modify'),    // 'Modify',
                        //    flex: 0.8,
                        //    iconCls: 'far fa-pencil-square-o',
                        //    style: { color: 'white' },
                        //    // glyph: 'xf055@FontAwesome',
                        //    //scale: 'medium',
                        //    scope:me,
                        //    handler: function(){
                        //        var PCModeAdminWin = new climatestation.view.system.PCModeAdmin({
                        //            params: {
                        //                currentmode: Ext.getCmp('current_mode').getValue().toLowerCase()
                        //            }
                        //        });
                        //        PCModeAdminWin.show();
                        //    }
                        }]
                    },{
                       xtype: 'container',
                        items:[{
                           id: 'active_version',
                           name: 'active_version',
                           hidden:  hiddenForWindowsVersion,
                           bind: '{system_setting.active_version}',
                           xtype: 'displayfield',
                           fieldLabel: me.form_fieldlabel_active_verion,
                           fieldStyle:'font-weight: bold;',
                           flex: 2
                        },{
                            xtype: 'button',
                            hidden:  hiddenForWindowsVersion,
                            text: climatestation.Utils.getTranslation('modify'),    // 'Modify',
                            flex: 1,
                            iconCls: 'far fa-edit',
                            style: { color: 'white' },
                            //scale: 'medium',
                            scope:me,
                            handler: function(){
                                Ext.Msg.alert('Active version change disabled',
                                    'The active version change has been disabled<BR>' +
                                    'In the Administration Manual it is explained how to change the version manually.');

                                // var PCVersionAdminWin = new climatestation.view.system.PCVersionAdmin({
                                //     params: {
                                //         currentversion: Ext.getCmp('active_version').getValue()
                                //     }
                                // });
                                // PCVersionAdminWin.show();
                            }
                        }]
                    },{
                        xtype: 'container',
                       items:[{
                            id: 'thema',
                            name: 'thema',
                            bind: '{system_setting.thema}',
                            xtype: 'displayfield',
                            fieldLabel: me.form_fieldlabel_thema,
                            fieldStyle:'font-weight: bold;',
                            flex: 2
                       },{
                            xtype: 'button',
                            id: 'modify-thema-btn',
                            text: climatestation.Utils.getTranslation('modify'),    // 'Modify',
                            flex: 1,
                            iconCls: 'far fa-edit',
                            style: { color: 'white' },
                            //scale: 'medium',
                            scope:me,
                            handler: function(){
                                var ThemaAdminWin = new climatestation.view.system.ThemaAdmin({
                                    params: {
                                        currentthema: Ext.getCmp('thema').getValue()
                                    }
                                });
                                ThemaAdminWin.show();
                            }
                        }]
                    },{
                        xtype: 'container',
                       items:[{
                           id: 'loglevel',
                           name: 'loglevel',
                           bind: '{system_setting.loglevel}',
                           xtype: 'displayfield',
                           fieldLabel: me.form_fieldlabel_loglevel,
                           fieldStyle:'font-weight: bold;',
                           flex: 2
                        },{
                            xtype: 'button',
                            text: climatestation.Utils.getTranslation('modify'),    // 'Modify',
                            flex: 1,
                            iconCls: 'far fa-edit',
                            style: { color: 'white' },
                            //scale: 'medium',
                            scope:me,
                            handler: function(){
                                var LogLevelAdminWin = new climatestation.view.system.PCLogLevelAdmin({
                                    params: {
                                        currentloglevel: Ext.getCmp('loglevel').getValue()
                                    }
                                });
                                LogLevelAdminWin.show();
                            }
                        }]
                    }]
                //},{
                //    xtype: 'fieldset',
                //    title: me.fieldset_title_ipaddresses,  // '<b>IP addresses</b>',
                //    id: 'ipaddresses',
                //    name: 'ipaddresses',
                //    collapsible:false,
                //    padding: 10,
                //    defaults: {
                //        labelWidth: 100,
                //        layout: 'hbox'
                //    }
                }]
            },{
                xtype: 'fieldset',
                title: me.fieldset_title_proxy_settings,
                collapsible:false,
                defaults: {
                    width: 350,
                    labelWidth: 120
                },
                items:[{
                   id: 'proxyhost',
                   name: 'proxyhost',
                   bind: '{system_setting.proxy_host}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_proxy_host,
                   style:'font-weight: bold;',
                   allowBlank: true,
                   disabled: false
                },{
                   id: 'proxyport',
                   name: 'proxyport',
                   bind: '{system_setting.proxy_port}',
                   xtype: 'numberfield',
                   fieldLabel: me.form_fieldlabel_proxy_port,
                   style:'font-weight: bold;',
                   width: 250,
                   allowBlank: true,
                   disabled: false
                },{
                   id: 'proxyuser',
                   name: 'proxyuser',
                   bind: '{system_setting.proxy_user}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_proxy_user,
                   style:'font-weight: bold;',
                   allowBlank: true,
                   disabled: false
                },{
                   id: 'proxyuserpwd',
                   name: 'proxyuserpwd',
                   bind: '{system_setting.proxy_userpwd}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_proxy_userpwd,
                   style:'font-weight: bold;',
                   allowBlank: true,
                   disabled: false
                }]
            }]
        },{
            items: [{
                xtype: 'fieldset',
                title: me.fieldset_title_path_settings,
                collapsible: false,
                defaults: {
                    width: 450,
                    labelWidth: 120,
                    layout: 'hbox',
                    margin: '5 10 5 10'
                },
                items:[{
                   id: 'base_dir',
                   name: 'base_dir',
                   bind: '{system_setting.base_dir}',
                   xtype: 'displayfield',
                   fieldLabel: me.form_fieldlabel_base_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'base_tmp_dir',
                   name: 'base_tmp_dir',
                   bind: '{system_setting.base_tmp_dir}',
                   xtype: 'displayfield',
                   fieldLabel: me.form_fieldlabel_base_tmp_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'data_dir',
                   name: 'data_dir',
                   bind: '{system_setting.data_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_data_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'ingest_dir',
                   name: 'ingest_dir',
                   hidden:  hiddenForWindowsVersion,
                   bind: '{system_setting.ingest_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_ingest_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'static_data_dir',
                   name: 'static_data_dir',
                   hidden:  hiddenForWindowsVersion,
                   bind: '{system_setting.static_data_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_static_data_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                    xtype: 'container',
                    width: 600,
                    defaults: {
                       margin: '0 5 5 0'
                   },
                   items:[{
                        id: 'archive_dir',
                        name: 'archive_dir',
                        disabled:  hiddenForWindowsVersion,
                        bind: '{system_setting.archive_dir}',
                        xtype: 'textfield',
                        vtype: 'directory',
                        fieldLabel: me.form_fieldlabel_archive_dir,
                        style:'font-weight: bold;',
                        allowBlank: false,
                        labelWidth: 120,
                        width: 450
                        //,listeners: {
                        //    change: function (cmp, value) {
                        //        console.info(cmp);
                        //        console.info(value);
                        //
                        //    }
                        //}
                    //},{
                    //    id: 'choose_archive_dir',
                    //    xtype: 'fileuploadfield',       // <input type="file" webkitdirectory directory multiple mozdirectory msdirectory odirectory/>
                    //    buttonText: climatestation.Utils.getTranslation('...'),
                    //    width: 30,
                    //    buttonOnly: true,
                    //    hideLabel: true,
                    //    vtype: 'directory',
                    //    listeners: {
                    //        change: function (fld, value, x, y) {
                    //            //console.log(fld.files[0].mozFullPath);
                    //
                    //            console.info(fld);
                    //            console.info(value);
                    //            console.info(x);
                    //            console.info(y);
                    //            Ext.getCmp('archive_dir').setValue(value);
                    //        }
                    //        //,afterrender:function(cmp){
                    //        //    cmp.fileInputEl.set({
                    //        //        'webkitdirectory': '',
                    //        //        'directory': '',
                    //        //        'mozdirectory': '',
                    //        //        'msdirectory': '',
                    //        //        'odirectory': ''
                    //        //    });
                    //        //}
                    //    },
                    //    //iconCls: 'far fa-pencil-square-o',
                    //    //style: { color: 'white' },
                    //    //scale: 'medium',
                    //    scope:me,
                    //    handler: function(){
                    //
                    //    }
                    },{
                        xtype: 'splitbutton',
                        text: climatestation.Utils.getTranslation('ingest_archive'),
                        disabled:  hiddenForWindowsVersion,
                        width: 140,
                        iconCls: '',    // 'far fa-spinner',
                        style: { color: 'white'},
                        //scale: 'medium',
                        //scope:me,
                        formBind: false,
                        name: 'ingestarchivebtn',
                        service: 'ingestarchive',
                        task: 'status',
                        menu: {
                            disabled:  hiddenForWindowsVersion,
                            width: 150,
                            margin: '0 0 10 0',
                            floating: true,  // usually you want this set to True (default)
                            collapseDirection: 'right',
                            defaults: {
                                disabled:  hiddenForWindowsVersion,
                                align: 'right'
                            },
                            items: [
                                // these will render as dropdown menu items when the arrow is clicked:
                                {   text: climatestation.Utils.getTranslation('run'),    // 'Run',
                                    name: 'run_ingestarchive',
                                    service: 'ingestarchive',
                                    task: 'run',
                                    // iconCls: 'fa-play-circle-o', // xf01d   // fa-play xf04b
                                    glyph: "xf04b@'Font Awesome 5 Free'",
                                    cls:'menu-glyph-color-green',
                                    // style: { color: 'green' },
                                    handler: 'execServiceTask'
                                },
                                {   text: climatestation.Utils.getTranslation('stop'),    // 'Stop',
                                    name: 'stop_ingestarchive',
                                    service: 'ingestarchive',
                                    task: 'stop',
                                    // iconCls: 'far fa-stop',
                                    glyph: "xf04d@'Font Awesome 5 Free'",
                                    cls:'menu-glyph-color-red',
                                    // style: { color: 'red' },
                                    handler: 'execServiceTask'
                                },
                                {   text: climatestation.Utils.getTranslation('restart')+'          ',    // 'Restart          ',
                                    name: 'restart_ingestarchive',
                                    service: 'ingestarchive',
                                    task: 'restart',
                                    // iconCls: 'far fa-redo-alt',
                                    glyph: "xf021@'Font Awesome 5 Free'",
                                    cls:'menu-glyph-color-orange',
                                    // style: { color: 'orange' },
                                    handler: 'execServiceTask'
                                },
                                {
                                    text: climatestation.Utils.getTranslation('viewlogfile'),    // 'View log file',
                                    name: 'view_logfile_ingestarchive',
                                    service: 'ingestarchive',
                                    task: 'logfile',
                                    iconCls:'log-icon-small',
                                    handler: 'viewLogFile'
                                }
                            ]
                        },
                        listeners: {
                            beforerender: 'execServiceTask'
                        }
                        ,handler: 'execServiceTask'
                    }]
                },{
                   id: 'eumetcast_files_dir',
                   name: 'eumetcast_files_dir',
                   hidden:  hiddenForWindowsVersion,
                   bind: '{system_setting.eumetcast_files_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_eumetcast_files_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'get_eumetcast_output_dir',
                   name: 'get_eumetcast_output_dir',
                   hidden:  hiddenForWindowsVersion,
                   bind: '{system_setting.get_eumetcast_output_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_get_eumetcast_output_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                },{
                   id: 'get_internet_output_dir',
                   name: 'get_internet_output_dir',
                   hidden:  hiddenForWindowsVersion,
                   bind: '{system_setting.get_internet_output_dir}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_get_internet_output_dir,
                   style:'font-weight: bold;',
                   allowBlank: false
                }]
            },{
                xtype: 'fieldset',
                title: me.fieldset_title_database_connection_settings,
                collapsible:false,
                defaults: {
                    width: 350,
                    labelWidth: 120
                },
                items:[{
                   id: 'dbhost',
                   name: 'dbhost',
                   bind: '{system_setting.host}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_dbhost,
                   style:'font-weight: bold;',
                   allowBlank: false,
                   disabled: true
                },{
                   id: 'dbport',
                   name: 'dbport',
                   bind: '{system_setting.port}',
                   xtype: 'numberfield',
                   fieldLabel: me.form_fieldlabel_dbport,
                   style:'font-weight: bold;',
                   width: 250,
                   allowBlank: false,
                   disabled: true
                },{
                   id: 'dbuser',
                   name: 'dbuser',
                   bind: '{system_setting.dbuser}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_dbuser,
                   style:'font-weight: bold;',
                   allowBlank: false,
                   disabled: true
                },{
                   id: 'dbpassword',
                   name: 'dbpassword',
                   bind: '{system_setting.dbpass}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_dbpassword,
                   style:'font-weight: bold;',
                   allowBlank: false,
                   disabled: true
                },{
                   id: 'dbname',
                   name: 'dbname',
                   bind: '{system_setting.dbname}',
                   xtype: 'textfield',
                   fieldLabel: me.form_fieldlabel_dbname,
                   style:'font-weight: bold;',
                   allowBlank: false,
                   disabled: true
                }]
            }]
        }];

        me.items = [{
            xtype: 'form',
            layout:'hbox',
            dockedItems: dockedItems,
            items: me.formItems
        }]
        me.callParent();
    }

});
