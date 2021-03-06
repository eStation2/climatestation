
Ext.define("climatestation.view.analysis.mapLogoObject",{
    extend: "Ext.container.Container",

    requires: [
        "climatestation.view.analysis.mapLogoObjectController",
        "climatestation.view.analysis.mapLogoObjectModel",
        'Ext.data.Store',
        'Ext.data.StoreManager',
        'Ext.util.DelayedTask',
        'climatestation.Utils',
        'climatestation.model.Logo'
        // "Ext.layout.container.Center"
    ],

    controller: "analysis-maplogoobject",
    viewModel: {
        type: "analysis-maplogoobject"
    },

    xtype: 'maplogoobject',

    // id: 'logo_obj',
    // reference: 'logo_obj',
    autoWidth: true,
    // autoHeight: true,
    // minWidth: 200,
    minHeight: 60,
    maxHeight: 65,
    layout: {
        type: 'fit'
        // ,align: 'stretch'
    },
    hidden: true,
    floating: true,
    defaultAlign: 'br-br',
    closable: false,
    closeAction: 'hide',
    draggable: true,
    constrain: true,
    alwaysOnTop: false,
    autoShow: false,
    resizable: false,
    frame: false,
    frameHeader : false,
    border: false,
    shadow: false,
    cls: 'rounded-box',
    //style: 'background: white; cursor:url(resources/img/pencil_cursor.png),auto;',
    style: 'background: white; cursor:move;',
    //bodyStyle:  'background:transparent;',
    margin: 0,
    padding: 0,

    config: {
        logoData: [],
        html: '',
        logos_ImageObj: new Image(),
        logoPosition: [185,521],
        changesmade: false
    },

    // bind: {
    //    data: {
    //        bindTo: '{logoData}'
    //        // deep: true
    //    }
    // },

    bind:{
        logoData:'{logoData}'
    },
    publishes: ['logoData'],

    initComponent: function () {
        var me = this;

        me.logos_ImageObj = new Image();

        me.listeners = {
            //element  : 'el',
            el: {
                dblclick: function () {
                    var editorpanel = me.lookupReference('map_logo_editor' + me.id);
                    // var editorpanel = me.map_logo_editor;
                    // editorpanel.constrainTo = me.constrainTo;       // this.component
                    //editorpanel.currentLogoData = this.component.getLogoData();
                    //editorpanel.down('dataview').setData(this.component.getLogoData());
                    editorpanel.down('#logo-editor-view-' + me.id).getStore().removeAll();
                    editorpanel.down('#logo-editor-view-' + me.id).getStore().add(me.getLogoData());
                    editorpanel.show();
                }
            }
            ,render: function () {
                Ext.tip.QuickTipManager.register({
                    target: this.id,
                    trackMouse: true,
                    title: climatestation.Utils.getTranslation('logo_object'), // 'Logo object',
                    text: '<img src="resources/img/pencil_cursor.png" alt="" height="18" width="18">' + climatestation.Utils.getTranslation('doubleclick_to_edit') // 'Double click to edit.'
                });

                if (me.getLogoData().length == 0){
                    if (me.getViewModel().getStore('defaultlogos').getRange().length != 0){
                        me.setLogoData(Ext.Array.pluck(me.getViewModel().getStore('defaultlogos').getRange(), 'data'));
                    }
                    else {
                        me.setLogoData(me.getViewModel().data.logoDefaultData);
                    }
                }
                me.getViewModel().data.logoData = me.getLogoData();
                me.changesmade = true;
                // me.fireEvent('refreshimage');
                // me.setPosition(me.logoPosition);
                // me.down().refresh();
                // me.down().updateLayout();
                // me.updateLayout();

                // me.mon(me, {
                //     move: function() {
                //        me.logoPosition = me.getPosition(true);
                //     }
                // });
            }
            ,show: function(){
                me.setPosition(me.logoPosition);
                me.updateLayout();
            }
            ,refreshimage: function(){
                if(!me.hidden) {
                    //var logosObjDomClone = Ext.clone(me.getEl().dom);
                    var logosObjDom = me.getEl().dom;
                    var task = new Ext.util.DelayedTask(function() {
                        climatestation.Utils.removeClass(logosObjDom, 'rounded-box');
                        //logosObjDomClone.style.width = me.getWidth();
                        html2canvas(logosObjDom, {
                            width: me.getWidth(),
                            height: me.getHeight(),
                            onrendered: function (canvas) {
                                me.logos_ImageObj.src = canvas.toDataURL("image/png");
                                climatestation.Utils.addClass(logosObjDom, 'rounded-box');
                                me.changesmade = false;
                            }
                        });
                    });

                    // if ((me.getViewModel().data.logoData != null && me.getViewModel().data.logoData.length > 0) && (me.changesmade || me.logos_ImageObj.src == '')){
                    if ((me.getViewModel().data.logoData != null && me.getViewModel().data.logoData.length > 0)){
                        // console.info('refresh the logo image');
                        task.delay(50);
                    }
                    // else {
                    //     me.logos_ImageObj = new Image();
                    // }
                }
            }
            // ,move: function(){
            //     me.logoPosition = me.getPosition();
            // }
            // ,beforedestroy: function(){
            //     // To fix the error: mapView.js?_dc=1506608907564:56 Uncaught TypeError: binding.destroy is not a function
            //     me.bind = null;
            // }
        };

        me.items = [{
            xtype: 'dataview',
            itemSelector: 'img',
            bind: {
                data: '{logoData}'
            },
            // maxHeight: 65,
            // minHeight: 60,
            // loadingHeight: 65,
            // shrinkWrap: true,
            emptyText: climatestation.Utils.getTranslation('noimagesavailable'),  // 'No images available'
            tpl:  new Ext.XTemplate(
                '<div class="maplogos">',
                '<tpl for=".">',
                    '<span style="vertical-align: middle;"></span>',
                    '<img src="{src}" height="{height}"  style="vertical-align: middle; padding: 0px 5px 0px 5px;"/>',
                '</tpl>',
                '</div>'
            )
            // ,listeners: {
            //     beforerender: function (dataview) {
            //         console.info(dataview);
            //         Ext.util.Observable.capture(dataview, function(e){console.log('logoobj dataview: ' + e);});
            //     }
            //     ,viewready: function(dataview){
            //         // dataview.render();
            //         dataview.updateLayout();
            //     }
            // }
        }];


        var map_logo_editor = Ext.create('Ext.window.Window', {        // Ext.panel.Panel
            id: 'map_logo_editor' + me.id,
            reference: 'map_logo_editor' + me.id,
            autoWidth: true,
            autoHeight: true,
            scrollable: false,
            // width: 600,
            minHeight: 530,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            modal: true,
            hidden: true,
            floating: true,
            defaultAlign: 'l-c',  // 'br-br',
            closable: true,
            closeAction: 'hide',
            draggable: true,
            // constrain: true,
            // constrainTo: me.constrainTo,
            // constrainHeader: true,
            alwaysOnTop: true,
            autoShow: false,
            resizable: false,
            frame: false,
            frameHeader : false,
            border: false,
            bodyBorder: false,
            bodyStyle: "background-color: white !important;",
            shadow: false,
            cls: 'rounded-box',
            //headerOverCls: 'grayheader',
            header: {
                title: climatestation.Utils.getTranslation('logo_object'), // 'Logo object',
                titleAlign: 'left',
                //cls: 'transparentheader',
                hidden: false,
                padding: '6px 16px 6px 16px'
            },
            //config: {
            //    currentLogoData: null
            //},
            //bind:{
            //    currentLogoData:'{currentLogoData}'
            //},
            items: [{
                xtype: 'panel',
                header: {
                    title: climatestation.Utils.getTranslation('selected_logos'),    // 'Selected logos',
                    cls: 'rounded-box-gray-header',
                    padding: '1px 16px 1px 16px',
                    items: [{
                        xtype:'button',
                        itemId: 'stopedit_tool_' + me.id,
                        tooltip: climatestation.Utils.getTranslation('save_changes'), // 'Save changes',
                        iconCls: 'far fa-save lightblue',
                        // glyph:0xf0c7,
                        // cls: 'btntransparent',
                        cls: 'header-btn',
                        scale: 'medium',
                        hidden: false,
                        margin: '0 0 0 0',
                        handler: function (btn) {
                            var window = btn.up().up().up();
                            var mapLogoEditor = window.down('#logo-editor-view-' + me.id);
                            //var jsonData = Ext.encode(Ext.pluck(store.data.items, 'data'));

                            var selectedlogos = [];
                            mapLogoEditor.store.getRange().forEach(function(logo){
                                // console.info(logo.getData())
                                selectedlogos.push(logo.getData());
                            });
                            // console.info(selectedlogos);
                            me.setLogoData(selectedlogos);
                            // me.setLogoData(Ext.Array.pluck(mapLogoEditor.store.getRange(), 'data'));
                            console.info(me.getLogoData());
                            me.getViewModel().data.logoData = me.getLogoData();
                            me.updateLayout();
                            me.changesmade = true;
                            me.fireEvent('render');
                            me.fireEvent('refreshimage');
                            window.hide();
                        }
                    }]
                },
                // region: 'center',
                layout: 'fit',
                cls: 'rounded-box',
                width: 570,
                height: 130,
                // autoHeight: true,
                // scrollable: true,
                // scrollable: 'vertical',
                reserveScrollbar: true,
                margin: 5,
                // flex: 1,
                items: [{
                    xtype: 'dataview',
                    id: 'logo-editor-view-' + me.id,
                    singleSelect: true,
                    overItemCls: 'x-view-over',
                    itemSelector: 'div.maplogo-wrap',
                    listeners: {
                        // scope: this,
                        // selectionchange: this.onIconSelect,
                        itemdblclick: function (view, rec, itemEl) {
                            view.store.remove(rec);
                            //if (selectedImage) {
                            //    this.fireEvent('selected', selectedImage);
                            //    this.hide();
                            //}
                        }
                    },
                    //bind: {
                    //    data: '{currentLogoData}'
                    //},
                    store: Ext.create('Ext.data.Store', {
                        autoLoad: false,
                        model: 'climatestation.model.Logo'   // 'climatestation.model.LogosMapView'
                    }),
                    emptyText: climatestation.Utils.getTranslation('noimagesavailable'),  // 'No images available'
                    tpl: new Ext.XTemplate(
                        //'<div id="maplogoseditview">',
                        '<tpl for=".">',
                            '<div class="maplogo-wrap" style="cursor: pointer;">',
                                '<div class="maplogo" data-qtip="'+climatestation.Utils.getTranslation('doubleclick_to_remove_from_selected_logos')+'">',
                                    // '<img src="{src}" width="{width}" height="{height}" style="padding: 0px 5px 0px 0px;"/>',
                                    '<img src="{src}" height="{height}" style="vertical-align: middle; padding: 0px 5px 0px 0px;"/>',
                                '</div>',
                            '</div>',
                        '</tpl>'
                        //'</div>'
                    )
                }]
            },{
                xtype: 'panel',
                header: {
                    title: climatestation.Utils.getTranslation('available_logos'),    // 'Available logos',
                    cls: 'rounded-box-gray-header',
                    padding: '1px 16px 1px 16px',
                    items: [{
                        xtype:'button',
                        // itemId: 'stopedit_tool_' + me.id,
                        tooltip: climatestation.Utils.getTranslation('refresh_logos_from_server'), // 'Refresh logos from server',
                        iconCls: 'far fa-redo-alt lightblue',
                        // glyph:0xf01e,
                        // cls: 'btn-refresh-transparent',
                        cls: 'header-btn',
                        hidden: false,
                        margin: '0 0 0 0',
                        handler: function (btn) {
                            Ext.data.StoreManager.lookup('LogosStore').load();
                        }
                    }]
                },
                // region: 'south',
                layout: 'fit',
                cls: 'rounded-box',
                margin: 5,
                width: 570,
                height: 335,
                // scrollable: true,
                scrollable: 'y',
                reserveScrollbar: true,
                // flex: 2,
                // tools: [{
                //     type:'refresh',
                //     tooltip: 'Refresh logos',
                //     handler: function(event, toolEl, panelHeader) {
                //         Ext.data.StoreManager.lookup('LogosStore').load();
                //     }
                // }],
                items: [{
                    xtype: 'dataview',
                    id: 'logo-chooser-view-' + me.id,
                    listeners: {
                        // scope: this,
                        // selectionchange: this.onIconSelect,
                        itemdblclick: function(view, rec, itemEl) {
                            view.up().up().down('#logo-editor-view-' + me.id).getStore().add(rec);
                            // view.up().up().down('dataview').store.add(rec);
                        }
                    },
                    singleSelect: true,
                    overItemCls: 'x-view-over',
                    itemSelector: 'div.maplogo-wrap',
                    store: me.getViewModel().getStore('logos'),    // "LogosStore",  // "LogosMapView",
                    // bind: '{logos}',
                    tpl: new Ext.XTemplate(
                        '<tpl for=".">',
                            // '<tpl if="active">',
                            '<div class="maplogo-wrap" style="cursor: pointer;">',
                                '<div class="maplogo" data-qtip="'+climatestation.Utils.getTranslation('doubleclick_to_add_to_selected_logos')+'">',
                                    '<img src="{src}" width="110" />',
                                '</div>',
                            '</div>',
                            '<tpl if="xindex % 4 === 0"><div class="x-clear"></div></tpl>',
                            // '</tpl>',
                        '</tpl>'
                        // ,'<div class="x-clear"></div>'
                    )
                }]
            }]
        });
        me.add(map_logo_editor);

        me.callParent();

    }

    /**
     * Called whenever the user clicks on an item in the DataView. This tells the info panel in the east region to
     * display the details of the image that was clicked on
     */
    // ,onIconSelect: function(dataview, selections) {
    //     //console.info(dataview);
    //     //console.info(selections);
    //     //Ext.toast({html: "Item selected", title: "Item selected", width: 300, align: 't'});
    //     //var selected = selections[0];
    //     //
    //     //if (selected) {
    //     //    this.down('infopanel').loadRecord(selected);
    //     //}
    // },

    /**
     * Fires the 'selected' event, informing other components that an image has been selected
     */
    // fireImageSelected: function() {
    //     //Ext.toast({html: "fireImageSelected", title: "fireImageSelected", width: 300, align: 't'});
    //     //var selectedImage = this.down('iconbrowser').selModel.getSelection()[0];
    //     //
    //     //if (selectedImage) {
    //     //    this.fireEvent('selected', selectedImage);
    //     //    this.hide();
    //     //}
    // }
});
