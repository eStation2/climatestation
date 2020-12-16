
Ext.define("climatestation.view.analysis.mapTitleObject",{
    extend: "Ext.container.Container",

    requires: [
        "Ext.form.field.HtmlEditor",
        "climatestation.view.analysis.mapTitleObjectController",
        "climatestation.view.analysis.mapTitleObjectModel",
        'Ext.util.DelayedTask',
        'climatestation.Utils'
    ],

    controller: "analysis-maptitleobject",
    viewModel: {
        type: "analysis-maptitleobject"
    },

    xtype: 'maptitleobject',

    // id: 'title_obj',
    // reference: 'title_obj',
    minWidth: 150,
    minHeight: 50,
    layout: 'fit',
    // liquidLayout: false,
    hidden: true,
    floating: true,
    defaultAlign: 'tl-tl',
    closable: false,
    closeAction: 'hide',
    draggable: true,
    constrain: true,
    alwaysOnTop: false,
    autoShow: false,
    resizable: true,
    frame: false,
    frameHeader : false,
    border: false,
    shadow: false,
    cls: 'rounded-box',
    //style: 'background: white; cursor:url(resources/img/pencil_cursor.png),auto;',
    style: 'background: white; cursor:move; line-height:24px;',
    //bodyStyle:  'background:transparent;',
    margin: 0,
    padding: 3,

    config: {
        tpl: ['<div><span style="color:rgb(0,0,0); font-size: 20px; font-weight: bold;">{selected_area}</span></div><div><span style="color:rgb(0,0,0); font-size: 20px;">{product_name}</span></div><div><span style="color:rgb(51,102,255); font-size: 20px;">{product_date}</span></div>'],
        titleData: [],
        html: '<div><span style="color:rgb(0,0,0); font-size: 20px; font-weight: bold;">{selected_area}</span></div><div><span style="color:rgb(0,0,0); font-size: 20px;">{product_name}</span></div><div><span style="color:rgb(51,102,255); font-size: 20px;">{product_date}</span></div>',
        title_ImageObj: new Image(),
        titlePosition: [0,0],
        changesmade: false
    },

    bind:{
        data:'{titleData}'
    },
    publishes: ['titleData'],
    bubbleEvents: null,

    initComponent: function () {
        var me = this;
        me.title_ImageObj = new Image();

        me.items = [];  // needed to be able to add items!

        me.listeners = {
            //element  : 'el',
            el: {
                dblclick: function () {
                    var editorpanel = me.lookupReference('map_title_editor' + me.id);
                    // var editorpanel = this.component.map_title_editor_panel;
                    //editorpanel.down('htmleditor').setValue(this.component.down().tpl.html);
                    editorpanel.down('htmleditor').setValue(this.component.tpl.html);
                    editorpanel.constrainTo = this.component.constrainTo;
                    editorpanel.show();

                    //this.component.up().down('#stopedit_tool_' + me.id).show();
                    //this.component.up().down('htmleditor').setValue(this.component.tpl.html);
                    //this.component.up().down('htmleditor').show();
                    //this.component.hide();
                }
            },
            afterrender: function () {
                Ext.tip.QuickTipManager.register({
                    target: this.id,
                    trackMouse: true,
                    title: climatestation.Utils.getTranslation('title_object'), // 'Title object',
                    text: '<img src="resources/img/pencil_cursor.png" alt="" height="18" width="18">' + climatestation.Utils.getTranslation('doubleclick_to_edit') // 'Double click to edit.'
                });

                me.getViewModel().data.titleData = me.getTitleData();
                me.changesmade = true;

                // Ext.util.Observable.capture(this, function(e){console.log('titleObj ' + e);});
                //
                // me.mon(me, {
                //     move: function() {
                //         me.titlePosition = me.getPosition(true);
                //     }
                // });
                //
                //me.mon(me.el, 'click', function(){alert('container click');});
                //me.mon(me.el, 'change', function(){alert('container change');});
            },
            show: function(){
                me.setPosition(me.titlePosition);
                me.updateLayout();
                // me.fireEvent('refreshimage');
            },
            refreshimage: function(){
                if(!me.hidden) {
                    //var titleObjDomClone = Ext.clone(me.getEl().dom);
                    var titleObjDom = me.getEl().dom;

                    var task = new Ext.util.DelayedTask(function() {
                        climatestation.Utils.removeClass(titleObjDom, 'rounded-box');
                        //titleObjDomClone.style.width = me.getWidth();
                        html2canvas(titleObjDom, {
                            width: me.getWidth(),
                            height: me.getHeight(),
                            onrendered: function (canvas) {
                                me.title_ImageObj.src = canvas.toDataURL("image/png");
                                climatestation.Utils.addClass(titleObjDom, 'rounded-box');
                            }
                        });
                    });
                    // console.info('refreshimage titleObj');
                    // console.info(me.getContent());
                    if (me.tpl.html != '' && (me.changesmade || me.title_ImageObj.src == '')){
                        task.delay(50);
                    }
                    // else {
                    //     me.title_ImageObj = new Image();
                    // }
                }
            },
            // ,move: function(){
            //     console.info('moving title object');
            //     me.titlePosition = me.getPosition();
            // }
            beforedestroy: function(){
                // To fix the error: mapView.js?_dc=1506608907564:56 Uncaught TypeError: binding.destroy is not a function
                me.bind = null;
            }
            //,single: true  // Remove the listener after first invocation
            //,change: {
            //    element  : 'el',
            //    fn: function(me, x , y , eOpts){
            //        alert('onchange');
            //        //me.on('change', function() {
            //        //    alert('onchange');
            //        //});
            //    }
            //}
        };


        me.map_title_editor = Ext.create('Ext.form.field.HtmlEditor', {
            xtype: 'htmleditor',
            id: 'map_title_editor_' + me.id,
            reference: 'map_title_editor_' + me.id,
            layout: 'fit',
            style: 'background: white;',
            hidden: false,
            enableAlignments: false,
            enableColors: true,
            enableFont: true,
            enableFontSize: true,
            enableFormat: true,
            enableLinks: false,
            enableLists: false,
            enableSourceEdit: true,
            autoWidth: true,
            autoHeight: true,
            minWidth: 250,
            minHeight: 45,
            value: ''
        });

        me.map_title_editor.getToolbar().insert(1,{
            xtype: 'button',
            //text: 'Fields',
            scope: this,
            tooltip: climatestation.Utils.getTranslation('add_dynamic_field'), // 'Add a dynamic field',
            overflowText: climatestation.Utils.getTranslation('add_dynamic_field'), // 'Add a dynamic field',
            hidden: false,
            iconCls: 'far fa-code',
            floating: false,  // usually you want this set to True (default)
            enableToggle: false,
            arrowVisible: false,
            arrowAlign: 'right',
            collapseDirection: 'left',
            menuAlign: 'tl-tr',
            menu: {
                hideOnClick: false,
                iconAlign: '',
                width: 125,
                defaults: {
                    hideOnClick: false,
                    cls: "x-menu-no-icon",
                    padding: 2
                },
                items: [{
                    text: climatestation.Utils.getTranslation('selected_area'), // 'Selected area',
                    handler: function(){
                        me.map_title_editor.insertAtCursor('{selected_area}');
                    }
                },{
                    text: climatestation.Utils.getTranslation('product_name'), // 'Product name',
                    handler: function(){
                        me.map_title_editor.insertAtCursor('{product_name}');
                    }
                },{
                    text: climatestation.Utils.getTranslation('product_date'), // 'Product date',
                    handler: function(){
                        me.map_title_editor.insertAtCursor('{product_date}');
                    }
                }]
            }
        });

        var map_title_editor_panel = Ext.create('Ext.window.Window', {
            id: 'map_title_editor' + me.id,
            reference: 'map_title_editor' + me.id,
            autoWidth: true,
            autoHeight: true,
            layout: 'fit',
            modal: true,
            hidden: true,
            floating: true,
            defaultAlign: 'tl-bc',
            closable: true,
            closeAction: 'hide',
            draggable: true,
            // constrain: true,
            // constrainTo: me.constrainTo,
            alwaysOnTop: true,
            autoShow: false,
            resizable: false,
            frame: false,
            frameHeader : false,
            border: false,
            shadow: true,
            cls: 'rounded-box',
            // headerOverCls: 'grayheader',
            header: {
                title: climatestation.Utils.getTranslation('title_object'), // 'Title object',
                titleAlign: 'left',
                // cls: 'transparentheader',
                padding: '6px 16px 6px 16px',
                hidden: false
            },
            bbar: {
                padding: 0,
                items: ['->', {
                    xtype:'button',
                    itemId: 'stopedit_tool_' + me.id,
                    tooltip: climatestation.Utils.getTranslation('save_changes'), // 'Save changes',
                    iconCls: 'far fa-save lightblue',
                    // glyph:0xf0c7,
                    // cls: 'btntransparent',
                    cls: 'header-btn',
                    scale: 'medium',
                    hidden: false,
                    margin: '3 0 0 5',
                    padding: 2,
                    handler: function (btn) {
                        var panel = btn.up().up(),
                            mapTitleObj = me,
                            mapTitleEditor = panel.down('#map_title_editor_' + me.id),
                            cleanText = mapTitleEditor.getValue().trim().replace(/<\/?[^>]+(>|$)/g, "");

                        // // mapTitleObj.setTpl(mapTitleEditor.getValue());   // .replace(/"/g, '&quot;', true);
                        // mapTitleObj.tpl.set(mapTitleEditor.getValue(), true);   // .replace(/"/g, '&quot;', true);
                        // if (cleanText == ''){
                        //     mapTitleObj.tpl.set('', true);
                        // }
                        console.info(mapTitleEditor.getValue());
                        console.info(mapTitleObj);
                        console.info(mapTitleObj.getData());

                        mapTitleObj.tpl.set(mapTitleEditor.getValue().trim(), true);
                        mapTitleObj.update(mapTitleObj.getData());
                        // mapTitleObj.setHeight('auto');
                        mapTitleObj.updateLayout();
                        mapTitleObj.changesmade = true;
                        // console.info(cleanText);
                        // mapTitleObj.setContent(mapTitleEditor.getValue());
                        // if (mapTitleEditor.getValue().trim() == '' || mapTitleEditor.getValue().trim() == '<br>'){
                        //     mapTitleObj.setContent('');
                        //     // console.info('content: ' + mapTitleObj.getContent());
                        // }
                        mapTitleObj.fireEvent('refreshimage');
                        panel.hide();
                        //mapTitleObj.down().tpl.set(mapTitleEditor.getValue(), true);   // .replace(/"/g, '&quot;', true);
                        //console.info(mapTitleObj.down().getData());
                        //mapTitleObj.down().update(mapTitleObj.down().getData());
                        //mapTitleObj.down().updateLayout();
                        //mapTitleObj.updateLayout();
                        //mapTitleObj.show();
                        //mapTitleObj.down().refresh();
                    }
                }]
            },
            items: me.map_title_editor
        });

        me.add(map_title_editor_panel);

        me.callParent();

        //me.relayEvents(me, ['change']);
    }
});
