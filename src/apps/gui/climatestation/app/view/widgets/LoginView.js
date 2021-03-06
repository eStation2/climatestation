Ext.define("climatestation.view.widgets.LoginView", {
    extend: "Ext.container.Container",

    requires: [
        "climatestation.view.widgets.LoginViewController",
        "climatestation.view.widgets.LoginViewModel",
        'Ext.data.StoreManager',
        'Ext.layout.container.Fit',
        'Ext.util.Cookies',
        'climatestation.LoginSetup',
        'climatestation.Utils',
        'climatestation.view.widgets.Register'
    ],

    controller: 'widgets-loginview',
    viewModel: 'widgets-loginview',

    alias: 'widget.loginview',

    layout: 'fit',
    padding: 0,
    margin: 0,
    style: {
        'background-color': '#0065a2' // '#5FA2DD'   //'#157FCC'
    },

    // fire all listeners in the scope of this window
    defaultListenerScope: true,

    // hold references here
    referenceHolder: true,

    initComponent: function () {
        var me = this, SetupLogin = climatestation.LoginSetup;

        // install listeners on Setup
        SetupLogin.on({
            scope: me,
            setupready: me.setupLogout,
            setupfail: me.failLogin
        });

        me.listeners = {
            beforerender: function () {
                if (Ext.util.Cookies.get('estation2_username') != null) {
                    // Get userid from sessionid
                    // climatestation.loginSession()
                    // let userid = 'adminuser'
                    let userinfo = {
                        userid: Ext.util.Cookies.get('estation2_userid'),
                        // userid: userid,
                        username: Ext.util.Cookies.get('estation2_username'),
                        // email: Ext.util.Cookies.get('estation2_useremail'),
                        userlevel: parseInt(Ext.util.Cookies.get('estation2_userlevel')),
                        prefered_language: Ext.util.Cookies.get('estation2_userlanguage')
                    };

                    climatestation.setUser(userinfo);
                    me.setupLogout();
                } else {
                    me.toggleUserFunctionality();
                }
            }
        };

        me.loginPanel = {
            xtype: 'panel',
            closable: true,
            draggable: false,
            resizable: false,

            header: {
                titleAlign: 'center',
                height: 40
            },

            layout: {
                type: 'fit',
                align: 'center',
                pack: 'center'
            },
            height: 250,
            width: 425,
            items: [{
                xtype: 'form',
                // padding: 5,
                reference: 'loginForm',
                bodyStyle: {
                    'background-color': '#0065a2'   // '#5FA2DD'   //'#157FCC'
                },
                defaults: {
                    anchor: '100%',
                    allowBlank: false,
                    enableKeyEvents: true,
                    xtype: 'textfield',
                    listeners: {
                        keypress: 'onKeyPress'
                    }
                },
                layout: 'vbox',
                items: [{
                    bind: '{username}',
                    // needed for defaultButton
                    itemId: 'username',
                    hideLabel: true,
                    fieldLabel: climatestation.Utils.getTranslation('username'),  // 'User Name'
                    emptyText: climatestation.Utils.getTranslation('username'),
                    padding: '10px 10px 10px 0',
                    width: 100
                }, {
                    bind: '{password}',
                    hideLabel: true,
                    fieldLabel: climatestation.Utils.getTranslation('password'),    // 'Password'
                    emptyText: climatestation.Utils.getTranslation('password'),
                    inputType: 'password',
                    padding: '10px 0 10px 0',
                    width: 100
                }, {
                    xtype: 'button',
                    text: climatestation.Utils.getTranslation('login'),  // 'Login'
                    // margin: '4 10 0 5',
                    formBind: false,
                    ui: 'headerbtn',
                    scale   : 'medium',
                    iconCls: 'far fa-sign-in-alt',
                    handler: 'onLoginClick'
                    // , menu: {
                    //     items: [{
                    //         text: climatestation.Utils.getTranslation('forgot_password')   // 'Forgot password?'
                    //         //, iconCls: 'far fa-lock'
                    //         , glyph: 'xf023@FontAwesome'
                    //         , cls:'menu-glyph-color-red'
                    //         // style: { color: 'orange' },
                    //         , handler: 'resetPassword'
                    //     }]
                    // }
                }, {
                    xtype: 'box',
                    html: climatestation.Utils.getTranslation('or'),   // 'or'
                    cls: 'text-white',
                    padding: '10px 0 10px 0'
                }, {
                    xtype: 'button',
                    text: climatestation.Utils.getTranslation('register'),   // 'Register'
                    // margin: '4 45 0 5',
                    formBind: false,
                    ui: 'headerbtn',
                    scale   : 'medium',
                    handler: 'onRegisterClick'
                }]
            }]
        };

        me.loginItems = [{
            xtype: 'button',
            text: climatestation.Utils.getTranslation('login'),  // 'Login'
            margin: '0 0 0 0',
            height: 75,
            // width: 75,
            // formBind: false,
            ui: 'headerbtn',
            scale   : 'medium',
            iconCls: 'far fa-sign-in-alt',
            arrowVisible: false,
            // handler: 'onLoginClick',
            menu: {
                items: [{
                    xtype: 'form',
                    width: 250,
                    padding: 10,
                    reference: 'loginForm',
                    // bodyStyle: {
                    //     'background-color': '#0065a2'   // '#5FA2DD'   //'#157FCC'
                    // },
                    defaults: {
                        // anchor: '100%',
                        allowBlank: false,
                        enableKeyEvents: true,
                        xtype: 'textfield',
                        labelAlign: 'top',
                        listeners: {
                            keypress: 'onKeyPress'
                        }
                    },
                    layout: 'vbox',
                    bbar: [{
                        xtype: 'button',
                        text: climatestation.Utils.getTranslation('register'),   // 'Register'
                        margin: 0,
                        formBind: false,
                        scale   : 'small',
                        iconCls: 'far fa-user-plus',
                        handler: 'onRegisterClick'
                    }, '->', {
                        xtype: 'button',
                        text: climatestation.Utils.getTranslation('login'),  // 'Login'
                        margin: 10,
                        formBind: false,
                        scale   : 'medium',
                        iconCls: 'far fa-sign-in-alt',
                        handler: 'onLoginClick'
                        // , menu: {
                        //     items: [{
                        //         text: climatestation.Utils.getTranslation('forgot_password')   // 'Forgot password?'
                        //         //, iconCls: 'far fa-lock'
                        //         , glyph: 'xf023@FontAwesome'
                        //         , cls:'menu-glyph-color-red'
                        //         // style: { color: 'orange' },
                        //         , handler: 'resetPassword'
                        //     }]
                        // }
                    }],
                    items: [{
                        bind: '{username}',
                        // needed for defaultButton
                        itemId: 'username',
                        hideLabel: false,
                        labelWidth: 80,
                        fieldLabel: climatestation.Utils.getTranslation('username'),  // 'User Name'
                        emptyText: climatestation.Utils.getTranslation('username'),
                        // padding: '10px 10px 10px 0',
                        width: 220
                    }, {
                        bind: '{password}',
                        hideLabel: false,
                        labelWidth: 80,
                        fieldLabel: climatestation.Utils.getTranslation('password'),    // 'Password'
                        emptyText: climatestation.Utils.getTranslation('password'),
                        inputType: 'password',
                        // padding: '10px 0 10px 0',
                        width: 220
                    }]
                }]
            }
        }];

        me.logoutItems = [{
            xtype: 'container',
            padding: 5,
            reference: 'logoutForm',
            // bodyStyle: {
            //     'background-color': '#5FA2DD'   //'#157FCC'
            // },
            // defaults: {
            //     anchor: '100%'
            // },
            layout: 'hbox',
            items: [{
                xtype: 'box',
                reference: 'UserLoggedIn',
                html: '',
                // html: climatestation.Utils.getTranslation('hello') + ' '   // 'Hello ',
                cls: 'text-white',
                // margin: '8 10 0 0',
                padding: '18 10 0 16'
            // },{
            //     xtype: 'image',
            //     cls: 'header-right-profile-image',
            //     height: 40,
            //     width: 35,
            //     alt:'current user image',
            //     // glyph: "xf007@'Font Awesome 5 Pro'",
            //     src: 'resources/jur.png',
            //     href: '#profile',
            //     hrefTarget: '_self',
            //     tooltip: 'See your profile'
            }, {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('logout'),   // 'Logout'
                padding: '16px 16px 16px 0px',
                iconCls: 'far fa-power-off icon-margin',
                textAlign: 'left',
                ui: 'headerbtn',
                scale   : 'medium',
                handler: 'onLogoutClick'
            }]
        }];

        me.items = me.loginItems;

        me.callParent();
    }

    // auto-focus username
    , defaultButton: 'username'

    /**
     * Login button click handler
     * @private
     */
    , onLoginClick: function () {
        var me = this, data = me.getViewModel().getData();
        // data.password = SparkMD5.hash(data.password);
        // console.info(me.getViewModel());
        climatestation.login(data);

    } // eo function onLoginClick

    /**
     * Login button click handler
     * @private
     */
    , onLogoutClick: function () {
        var me = this;

        climatestation.logout();

        me.removeAll();
        me.add(me.loginItems);
        //climatestation.setUser(null);
        me.toggleUserFunctionality();

    } // eo function onLoginClick

    /**
     * Handles login success and shows logout button
     * @private
     * @param responce
     */
    , setupLogout: function () {
        var me = this;
        me.removeAll();
        me.add(me.logoutItems);
        // me.lookupReference('UserLoggedIn').setHtml(climatestation.Utils.getTranslation('hello') + ' ' + climatestation.getUser().username);
        me.lookupReference('UserLoggedIn').setHtml(climatestation.getUser().username);
        me.toggleUserFunctionality();

    } // eo function setupLogout


    /**
     * Register button click handler
     * @private
     */
    , onRegisterClick: function () {
        new climatestation.view.widgets.Register();
    } // eo function onRegisterClick

    /**
     * Handles login fail and shows message
     * @private
     * @param responce
     */
    , failLogin: function () {
        var me = this;
        Ext.Msg.show({
            title: 'Error'
            , msg: climatestation.Utils.getTranslation('username_password_incorrect')    // Username or password incorrect!
            , icon: Ext.Msg.ERROR
            , buttons: Ext.Msg.OK
        });

    } // eo function failLogin

    /**
     * Handles Enter press
     * @private
     * @param {Ext.form.field.Field} field
     * @param {Ext.EventObject} e
     */
    , onKeyPress: function (field, e) {
        var me = this
            , form = me.lookupReference('loginForm')
        ;
        if (form.isValid() && Ext.EventObject.ENTER === e.getKey()) {
            me.onLoginClick();
        }

    } // eo function onKeyPress

    , toggleUserFunctionality: function () {
        // var me = this;
        var user = climatestation.getUser();
        var analysisWorkspaces = Ext.ComponentQuery.query('analysisworkspace');
        var mapViewWindows = Ext.ComponentQuery.query('mapview-window');
        var tsChartWindows = Ext.ComponentQuery.query('timeserieschart-window');
        var addWorkspaceBtn = Ext.getCmp('analysismain').lookupReference('analysismain_addworkspacebtn');
        var acquisitionLockBtn = Ext.getCmp('lockunlock');
        // var productAdminAcquisitionBtn = Ext.getCmp('productadmin-acquisition-btn');
        // var mapTemplateBtn = Ext.getCmp('analysismain').lookupReference('analysismain_maptemplatebtn');
        // var tsChartTemplateBtn = Ext.getCmp('analysismain').lookupReference('analysismain_graph_templatebtn');
        // var tsDrawPropertiesStore  = Ext.data.StoreManager.lookup('TSDrawPropertiesStore');

        if (user != null && user != 'undefined') {
            // tsDrawPropertiesStore.proxy.extraParams = {userid: user.userid, graph_tpl_name: 'default'};
            // tsDrawPropertiesStore.load();

            if (user.userlevel < 2) {
                if (acquisitionLockBtn != null) {
                    acquisitionLockBtn.show();
                }
                // if (productAdminAcquisitionBtn != null){
                //     productAdminAcquisitionBtn.show();
                // }
            }

            if (addWorkspaceBtn != null) {
                addWorkspaceBtn.show();
            }
            var UserWorkspacesStore = Ext.StoreManager.lookup('UserWorkspacesStore');
            UserWorkspacesStore.proxy.extraParams = {userid: climatestation.getUser().userid};
            UserWorkspacesStore.load({
                callback: function (records, options, success) {
                    var activateTab = false;
                    records.forEach(function (workspace, id) {
                        if (workspace.get('pinned')) {
                            // open workspace
                            Ext.getCmp('analysismain').getController().openWorkspace(workspace, activateTab);
                        }
                    });
                }
            });
            // UserWorkspacesStore.each(function(workspace,id){
            //     console.info(workspace);
            // });

            if (analysisWorkspaces != []) {
                Ext.Object.each(analysisWorkspaces, function (id, workspace, thisObj) {
                    workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).show();
                    workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).show();

                    // TODO: show new top left menu with items legend, layers and logos.
                    // workspace.lookupReference('analysismain_legendsbtn_' + workspace.id.replace(/-/g, '_')).show();
                    // workspace.lookupReference('analysismain_layersbtn_' + workspace.id.replace(/-/g, '_')).show();
                    // workspace.lookupReference('analysismain_logosbtn_' + workspace.id.replace(/-/g, '_')).show();

                    if (workspace.workspaceid != 'defaultworkspace') {
                        workspace.lookupReference('saveWorkspaceBtn').show();
                    } else {
                        workspace.lookupReference('saveDefaultWorkspaceAsBtn').show();
                    }

                    if (Ext.isObject(workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).mapTemplateAdminPanel)) {
                        workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).mapTemplateAdminPanel.setDirtyStore(true);
                    }
                    if (Ext.isObject(workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).graphTemplateAdminPanel)) {
                        workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).graphTemplateAdminPanel.setDirtyStore(true);
                    }
                });
            }
            // mapTemplateBtn.show();
            if (mapViewWindows != []) {
                Ext.Object.each(mapViewWindows, function (id, mapview_window, thisObj) {
                    if (mapview_window.templatename != '') {
                        mapview_window.isTemplate = true;
                        if (Ext.isObject(Ext.fly('mapview_title_templatename_' + mapview_window.id))) {
                            Ext.fly('mapview_title_templatename_' + mapview_window.id).dom.innerHTML = mapview_window.templatename;
                        }
                    }
                    mapview_window.lookupReference('saveMapTemplate_' + mapview_window.id.replace(/-/g, '_')).show();
                });
            }

            // Ext.getCmp('userMapTemplates').setDirtyStore(true);

            // tsChartTemplateBtn.show();
            if (tsChartWindows != []) {
                Ext.Object.each(tsChartWindows, function (id, tschart_window, thisObj) {
                    if (tschart_window.graph_tpl_name != '' && tschart_window.graph_tpl_name != 'default') {
                        tschart_window.isTemplate = true;

                        if (Ext.isObject(Ext.fly('graphview_title_templatename_' + tschart_window.id))) {
                            Ext.fly('graphview_title_templatename_' + tschart_window.id).dom.innerHTML = tschart_window.graph_tpl_name;
                        }
                    }
                    tschart_window.lookupReference('changeSelectedProductsAndTimeframe_' + tschart_window.id.replace(/-/g, '_')).show();
                    tschart_window.lookupReference('saveGraphTemplate_' + tschart_window.id.replace(/-/g, '_')).show();
                });
            }
            // Ext.getCmp('userGraphTemplates').setDirtyStore(true);
        } else {
            // tsDrawPropertiesStore.proxy.extraParams = {};
            // tsDrawPropertiesStore.load();

            if (acquisitionLockBtn != null) {
                if (acquisitionLockBtn.pressed) {
                    acquisitionLockBtn.toggle();
                    acquisitionLockBtn.handler(acquisitionLockBtn);
                    acquisitionLockBtn.hide();
                } else {
                    acquisitionLockBtn.hide();
                }
            }

            if (addWorkspaceBtn != null) {
                addWorkspaceBtn.hide();
            }
            if (analysisWorkspaces != []) {
                Ext.Object.each(analysisWorkspaces, function (id, workspace, thisObj) {
                    if (workspace.workspaceid != 'defaultworkspace') {
                        workspace.close();
                    } else {
                        // mapTemplateBtn.hide();
                        if (mapViewWindows != []) {
                            Ext.Object.each(mapViewWindows, function (id, mapview_window, thisObj) {
                                if (mapview_window.isTemplate) {
                                    mapview_window.isTemplate = false;
                                    if (Ext.isObject(Ext.fly('mapview_title_templatename_' + mapview_window.id))) {
                                        Ext.fly('mapview_title_templatename_' + mapview_window.id).dom.innerHTML = '';
                                    }
                                }
                                mapview_window.lookupReference('saveMapTemplate_' + mapview_window.id.replace(/-/g, '_')).hide();
                            });
                        }
                        // Ext.getCmp('userMapTemplates').hide();

                        // tsChartTemplateBtn.hide();
                        if (tsChartWindows != []) {
                            Ext.Object.each(tsChartWindows, function (id, tschart_window, thisObj) {
                                if (tschart_window.isTemplate) {
                                    tschart_window.isTemplate = false;
                                    if (Ext.isObject(Ext.fly('graphview_title_templatename_' + tschart_window.id))) {
                                        Ext.fly('graphview_title_templatename_' + tschart_window.id).dom.innerHTML = '';
                                    }
                                }
                                tschart_window.lookupReference('changeSelectedProductsAndTimeframe_' + tschart_window.id.replace(/-/g, '_')).hide();
                                tschart_window.lookupReference('saveGraphTemplate_' + tschart_window.id.replace(/-/g, '_')).hide();
                            });
                        }
                        // Ext.getCmp('userGraphTemplates').hide();

                        workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).hide();
                        workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).hide();

                        // TODO: hide new top left menu with items legend, layers and logos.
                        // workspace.lookupReference('analysismain_legendsbtn_' + workspace.id.replace(/-/g, '_')).hide();
                        // workspace.lookupReference('analysismain_layersbtn_' + workspace.id.replace(/-/g, '_')).hide();
                        // workspace.lookupReference('analysismain_logosbtn_' + workspace.id.replace(/-/g, '_')).hide();

                        workspace.lookupReference('saveDefaultWorkspaceAsBtn').hide();
                        if (Ext.isObject(workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).mapTemplateAdminPanel)) {
                            workspace.lookupReference('maptemplateadminbtn_' + workspace.id.replace(/-/g, '_')).mapTemplateAdminPanel.hide();
                        }
                        if (Ext.isObject(workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).graphTemplateAdminPanel)) {
                            workspace.lookupReference('graphtemplateadminbtn_' + workspace.id.replace(/-/g, '_')).graphTemplateAdminPanel.hide();
                        }
                    }
                });
            }
        }
    } // eo function failLogin
});