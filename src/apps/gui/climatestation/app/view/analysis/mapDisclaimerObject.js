
Ext.define("climatestation.view.analysis.mapDisclaimerObject",{
    extend: "Ext.container.Container",

    requires: [
        "Ext.form.field.HtmlEditor",
        "climatestation.view.analysis.mapDisclaimerObjectController",
        "climatestation.view.analysis.mapDisclaimerObjectModel",
        'Ext.util.DelayedTask',
        'climatestation.Utils'
    ],

    controller: "analysis-mapdisclaimerobject",
    viewModel: {
        type: "analysis-mapdisclaimerobject"
    },

    xtype: 'mapdisclaimerobject',

    // id: 'disclaimer_obj',
    // reference: 'disclaimer_obj',
    autoWidth: true,
    autoHeight: true,
    minWidth: 150,
    minHeight: 30,
    layout: 'fit',
    hidden: true,
    floating: true,
    defaultAlign: 'bl-bl',
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
        content: '',
        disclaimer_ImageObj: new Image(),
        disclaimerPosition: [2,548],
        changesmade: false
    },

    initComponent: function () {
        var me = this;
        me.disclaimer_ImageObj = new Image();
        // me.disclaimerPosition = [0,611];

        //me.defaultContent = '<font size="1">​Geographical map, WGS 84 - Resolution 5km</font><div><font size="1">Sources: 1) Image NDVI &nbsp;2) Vectors FAO GAUL 2015</font></div>';
        //me.html = me.defaultContent;
        //me.setHtml(me.defaultContent);

        me.items = [];  // needed to be able to add items!

        me.listeners = {
            //element  : 'el',
            el: {
                dblclick: function () {
                    var editorpanel = me.lookupReference('map_disclaimer_editor' + me.id);
                    // var editorpanel = this.component.map_disclaimer_editor;
                    editorpanel.down('htmleditor').setValue(this.component.getContent());
                    editorpanel.constrainTo = this.component.constrainTo;
                    editorpanel.show();
                }
            },
            afterrender: function () {
                Ext.tip.QuickTipManager.register({
                    target: this.id,
                    trackMouse: true,
                    title: climatestation.Utils.getTranslation('disclaimer_object'), // 'Disclaimer object',
                    text: '<img src="resources/img/pencil_cursor.png" alt="" height="18" width="18">' + climatestation.Utils.getTranslation('doubleclick_to_edit') // 'Double click to edit.'
                });

                // me.mon(me, {
                //     move: function() {
                //        me.disclaimerPosition = me.getPosition(true);
                //        // console.info(me.disclaimerPosition);
                //     }
                // });
            },
            refreshimage: function(){
                if(!me.hidden) {
                    //var disclaimerObjDomClone = Ext.clone(me.getEl().dom);
                    var disclaimerObjDom = me.getEl().dom;
                    var task = new Ext.util.DelayedTask(function() {
                        climatestation.Utils.removeClass(disclaimerObjDom, 'rounded-box');
                        //disclaimerObjDomClone.style.width = me.getWidth();
                        // console.info(disclaimerObjDom);
                        html2canvas(disclaimerObjDom, {
                            width: me.getWidth(),
                            height: me.getHeight(),
                            onrendered: function (canvas) {
                                me.disclaimer_ImageObj.src = canvas.toDataURL("image/png");
                                climatestation.Utils.addClass(disclaimerObjDom, 'rounded-box');
                                me.changesmade = false;
                            }
                        });
                    });
                    // console.info('refreshimage disclaimerObj');

                    if ( me.getContent().trim() != '' || me.changesmade ){
                        // console.info('refresh the disclaimer image');
                        task.delay(50);
                    }
                    // if ( (me.disclaimer_ImageObj.src == '' && me.getContent().trim() != '') || (me.getContent().trim() != '' && me.changesmade) ){
                    //     task.delay(250);
                    // }
                    // else {
                    //     me.disclaimer_ImageObj = new Image();
                    // }
                }
            },
            show: function(){
                me.setPosition(me.disclaimerPosition);
                // me.fireEvent('refreshimage');
            }
        };

        var map_disclaimer_editor = Ext.create('Ext.window.Window', {
            id: 'map_disclaimer_editor' + me.id,
            reference: 'map_disclaimer_editor' + me.id,
            autoWidth: true,
            autoHeight: false,
            scrollable: false,
            // width: 250,
            height: 200,
            // layout: 'fit',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            modal: true,
            hidden: true,
            floating: true,
            defaultAlign: 'l-c',
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
            bodyBorder: false,
            shadow: false,
            cls: 'rounded-box',
            // headerOverCls: 'grayheader',
            header: {
                title: climatestation.Utils.getTranslation('disclaimer_object'), // 'Disclaimer object',
                titleAlign: 'left',
                // cls: 'transparentheader',
                padding: '6px 16px 6px 16px',
                hidden: false
                // items: [{
                //     xtype:'button',
                //     itemId: 'stopedit_tool_' + me.id,
                //     tooltip: climatestation.Utils.getTranslation('save_changes'), // 'Save changes',
                //     iconCls: 'far fa-save white',
                //     // glyph:0xf0c7,
                //     // cls: 'btntransparent',
                //     cls: 'header-btn',
                //     scale: 'medium',
                //     hidden: false,
                //     margin: '3 0 0 5',
                //     handler: function (btn) {
                //         var panel = btn.up().up();
                //         var mapDisclaimerObj = me,
                //             mapDisclaimerEditor = panel.down('#map_disclaimer_editor_' + me.id);
                //
                //         mapDisclaimerObj.update(mapDisclaimerEditor.getValue());
                //         mapDisclaimerObj.setContent(mapDisclaimerEditor.getValue());
                //         mapDisclaimerObj.changesmade = true;
                //         //mapDisclaimerObj.show();  // Show event not triggered because the object is not hidden!
                //         mapDisclaimerObj.fireEvent('refreshimage');
                //         panel.hide();
                //     }
                // }]
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
                        var panel = btn.up().up();
                        var mapDisclaimerObj = me,
                            mapDisclaimerEditor = panel.down('#map_disclaimer_editor_' + me.id);

                        mapDisclaimerObj.update(mapDisclaimerEditor.getValue());
                        mapDisclaimerObj.setContent(mapDisclaimerEditor.getValue());
                        mapDisclaimerObj.changesmade = true;
                        //mapDisclaimerObj.show();  // Show event not triggered because the object is not hidden!
                        mapDisclaimerObj.fireEvent('refreshimage');
                        panel.hide();
                    }
                }]
            },
            items: [{
                xtype: 'htmleditor',
                id: 'map_disclaimer_editor_' + me.id,
                reference: 'map_disclaimer_editor_' + me.id,
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
                minHeight: 150,
                value: ''
            }]
        });

        me.add(map_disclaimer_editor);

        me.callParent();

    }
});
