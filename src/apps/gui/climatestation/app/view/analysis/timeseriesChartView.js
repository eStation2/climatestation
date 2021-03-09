
Ext.define("climatestation.view.analysis.timeseriesChartView",{
    extend: "Ext.panel.Panel",
    // extend: "Ext.window.Window",
    controller: "analysis-timeserieschartview",
    viewModel: {
        type: "analysis-timeserieschartview"
    },

    xtype: 'timeserieschart-window',

    requires: [
        "climatestation.view.analysis.mapLogoObject",
        'Ext.toolbar.Toolbar',
        'Ext.window.Window',
        'climatestation.Utils',
        'climatestation.view.analysis.mapDisclaimerObject',
        'climatestation.view.analysis.timeseriesChartViewController',
        'climatestation.view.analysis.timeseriesChartViewModel'
    ],

    // title: '<span class="panel-title-style">'+climatestation.Utils.getTranslation('timeseries')+'</span>',
    header: {
        titlePosition: 2,
        titleAlign: 'left',
        padding: '2px 14px 2px 14px',
        cls: 'graphview-header'
    },

    floating: true,
    draggable: true,

    constrainHeader: true,
    //constrain: true,
    autoShow : false,
    closable: true,
    closeAction: 'destroy', // 'hide',
    maximizable: true,
    collapsible: true,
    resizable: true,
    shadow: false,
    frame: false,
    border: true,
    bodyBorder: false,
    // componentCls: 'rounded-box-win',

    width:700,
    height: Ext.getBody().getViewSize().height < 600 ? Ext.getBody().getViewSize().height-80 : 600,
    minWidth:400,
    minHeight:350,
    // x: 50,
    // y: 5,

    // glyph : 'xf080@FontAwesome',

    margin: '0 0 0 0',
    layout: {
        type: 'fit'
    },

    config: {
        workspace: null,
        isNewTemplate: true,
        isTemplate: false,
        graph_tpl_id: null,
        parent_tpl_id: null,
        graph_tpl_name: '',
        link_region_change: false,

        tsgraph: null,
        selectedTimeseries: null,
        yearTS: null,
        tsFromPeriod: null,
        tsToPeriod: null,
        yearsToCompare: null,
        tsFromSeason: null,
        tsToSeason: null,
        selectedregionname: null,
        wkt_geom: null,
        graphtype: null,
        timeseriesChart: {},
        timeseriesGraph: {},

        // istemplate: false,
        graphviewposition: [50,5],
        graphviewsize: [700,600],
        disclaimerObjPosition: [0,611],
        disclaimerObjContent: '',
        logosObjPosition: [434, 583],
        logosObjContent: null,
        showObjects: false,
        showtoolbar: true,
        auto_open: false,
        floating: true
    },

    listeners: {
        beforerender: function () {
            var me = this;

            // Ext.util.Observable.capture(me, function (e) { console.log('chart - ' + e);});

            if (me.graphtype != 'scatter'){
                var selectedProductsAndTimeFramePanel = me.getController().createSelectedProductsAndTimeFramePanel();
                me.add(selectedProductsAndTimeFramePanel);

                selectedProductsAndTimeFramePanel.down('timeseriesproductselection').fireEvent('beforerender');
            }

            // if (climatestation.Utils.objectExists(me.graphviewposition)){
            //    me.x = me.graphviewposition[0];
            //    me.y = me.graphviewposition[1];
            // }
        },
        deactivate: function(){
            var me = this;
            // console.info(me);
        },

//         drag: function(dragObj){
//             var me = this;
//             console.info(me.getPosition());
//             console.info(dragObj);
//             dragObj.proxy.setPosition(dragObj.startPosition[0], dragObj.startPosition[1]);
// // debugger;
//         },
//         dragstart: function(dragObj){
//             var me = this;
//             me.suspendEvents();
//             console.info(me);
//             console.info(me.getPosition());
//             console.info(dragObj);
//             console.info(dragObj.proxy.getPosition());
//             // dragObj.suspendEvent('drag');
//             dragObj.proxy.setPosition(dragObj.startPosition[0], dragObj.startPosition[1]);
//             dragObj.proxy.x = dragObj.startPosition[0];
//             dragObj.proxy.y = dragObj.startPosition[1];
//             // debugger;
//             // me.setPosition(dragObj.startPosition[0], dragObj.startPosition[1]);
//                 // startPosition
//             // debugger;
//         },
//         move: function (listener, x, y) {
//             var me = this;
//             console.info('moved to');
//             console.info(me.getPosition());
//             // console.info(x);
//             // console.info(y);
//         },


        afterrender: function () {
            var me = this,
                disclaimerObj = me.lookupReference('disclaimer_obj_' + me.id),
                logoObj = me.lookupReference('logo_obj_' + me.id),
                graphObjectToggleBtn = me.lookupReference('objectsbtn_'+me.id.replace(/-/g,'_'));

            // if (me.isTemplate){
                if (climatestation.Utils.objectExists(me.graphviewsize)){
                    me.setSize(me.graphviewsize[0],me.graphviewsize[1]);
                }
                if (climatestation.Utils.objectExists(me.graphviewposition)){
                   me.setPosition(me.graphviewposition);
                }

                me.updateLayout();

                if (climatestation.Utils.objectExists(me.disclaimerObjPosition) && climatestation.Utils.objectExists(me.disclaimerObjContent)) {
                    disclaimerObj.disclaimerPosition = me.disclaimerObjPosition;
                    disclaimerObj.setHtml(me.disclaimerObjContent);
                    disclaimerObj.setContent(me.disclaimerObjContent);
                }

                if (climatestation.Utils.objectExists(me.logosObjPosition)) {
                    logoObj.logoPosition = me.logosObjPosition;
                    if (climatestation.Utils.objectExists(me.logosObjContent)) {
                        logoObj.getViewModel().data.logoData = me.logosObjContent;
                        logoObj.setLogoData(me.logosObjContent);
                    }
                }

                // titleObj.titlePosition = me.titleObjPosition;
                // if (me.titleObjContent != null && me.titleObjContent.trim() != ''){
                //     titleObj.setTpl([]);    // empty template which must be an array
                //     titleObj.setTpl(me.titleObjContent);
                //     // titleObj.tpl.push(me.titleObjContent);
                //     // titleObj.tpl.set(me.titleObjContent, true);
                // }
                // if (me.showObjects){
                //     var taskToggleObjects = new Ext.util.DelayedTask(function() {
                //         graphObjectToggleBtn.toggle(true);
                //         me.getController().toggleObjects(graphObjectToggleBtn);
                //     });
                //     taskToggleObjects.delay(1000);
                // }

                me.getController().generateChart();
            // }
            // else {
            //     me.getController().generateChart();
            // }
        }
        // The resize handle is necessary to set the map!
        ,resize: function () {
            var me = this;
            if( me.tsgraph instanceof Highcharts.Chart){
                me.tsgraph.setSize(document.getElementById(this.id + "-body").offsetWidth, document.getElementById(this.id + "-body").offsetHeight);
                me.tsgraph.redraw();
            }
        }
        // ,move: function () {
        //     var me = this;
        //     if( me.tsgraph instanceof Highcharts.Chart){
        //         me.tsgraph.setSize(document.getElementById(this.id + "-body").offsetWidth, document.getElementById(this.id + "-body").offsetHeight);
        //         me.tsgraph.redraw();
        //     }
        // }
    },

    initComponent: function () {
        var me = this;
        // Ext.util.Observable.capture(me, function(e){console.log('grapview - ' + me.id + ': ' + e);});

        // me.title = '<span class="panel-title-style">'+climatestation.Utils.getTranslation('timeseries')+'</span>';
        me.title = '<span id="graphview_title_' + me.id + '">'+climatestation.Utils.getTranslation('timeseries')+'</span>' +
                   '<span id="graphview_title_templatename_' + me.id + '" class="graph-templatename"></span>';

        //me.height = Ext.getBody().getViewSize().height-80;

        me.link_region_change = false;
        me.wkt_geom = this.wkt_geom;

        me.tools = [
        {
            type: 'gear',
            tooltip: climatestation.Utils.getTranslation('graphshowhidetools'),  // 'Show/hide graph tools menu',
            callback: function (tswin) {
                // toggle hide/show toolbar and adjust map size.
                var winBodyWidth = tswin.getWidth()-5;
                var winBodyHeight = tswin.getHeight()-45;
                var tsToolbar = tswin.getDockedItems('toolbar[dock="top"]')[0];
                var widthToolbar = tsToolbar.getWidth();
                var heightToolbar = tsToolbar.getHeight();
                if (tsToolbar.hidden == false) {
                    tsToolbar.setHidden(true);
                    winBodyWidth = document.getElementById(tswin.id + "-body").offsetWidth;
                    winBodyHeight =  document.getElementById(tswin.id + "-body").offsetHeight; //+heightToolbar;
                }
                else {
                    tsToolbar.setHidden(false);
                    winBodyWidth = document.getElementById(tswin.id + "-body").offsetWidth;
                    winBodyHeight = document.getElementById(tswin.id + "-body").offsetHeight-heightToolbar;
                }
                tswin.tsgraph.setSize(winBodyWidth, winBodyHeight);
                tswin.tsgraph.redraw();
            }
        }];

        me.tbar = {
            id: 'tbar_'+me.id,
            reference: 'tbar_'+me.id,
            dock: 'top',
            autoShow: true,
            alwaysOnTop: true,
            floating: false,
            hidden: false,
            border: false,
            shadow: false,
            padding:0,
            defaults: {
                margin: 2,
                padding: 4
                // width: 34,
                // height: 34
            },
            items: [{
                text: '<div style="font-size: 11px;">' + climatestation.Utils.getTranslation('PRODUCTS').toUpperCase() + '</div>',   // 'Products',
                reference: 'changeSelectedProductsAndTimeframe_'+me.id.replace(/-/g,'_'),
                // tooltip: climatestation.Utils.getTranslation('change_selected_products'), //  'Change Selected products',
                // iconCls: 'far fa-calendar',
                // style: {color: '#748FFC'},
                scale: 'medium',
                width: 70,
                height: 34,
                padding: 0,
                cls: 'nopadding-btn',
                disabled: (me.graphtype == 'scatter'),
                // hidden:  ((climatestation.getUser() == 'undefined' || climatestation.getUser() == null) || !me.isTemplate ? true : false),
                handler: 'changeSelectedProductsAndTimeFrame',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnInnerEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('change_selected_products') // Tip content
                        });

                    },
                    destroy: function(btn) {
                     Ext.tip.QuickTipManager.unregister(btn.getId());
                    }
                }
            // }, {
            //     xtype: 'button',
            //     tooltip: climatestation.Utils.getTranslation('change_timeframe'),   //  'Change Time frame',
            //     iconCls: 'far fa-calendar',
            //     style: {color: '#748FFC'},
            //     enableToggle: false,
            //     scale: 'medium',
            //     hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
            //     handler: 'changeSelectedProductsAndTimeFrame'
            },{
                // text: climatestation.Utils.getTranslation('properties'),    // 'Graph properties',
                // tooltip: climatestation.Utils.getTranslation('graph_edit_properties'), //  'Edit graph properties',
                iconCls: 'chart-curve_edit',
                scale: 'medium',
                disabled: (me.graphtype == 'scatter'),
                handler: 'openChartProperties',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            // delegate: btn.btnInnerEl.el,   // btnIconEl  btnInnerEl btnWrap
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('graph_edit_properties') // Tip content
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            }, ' ', {
                // text: climatestation.Utils.getTranslation('values'),    // downloadtimeseries = 'Download timeseries',
                // tooltip: climatestation.Utils.getTranslation('graph_download_values'),   //  'Download time series values',
                iconCls: 'far fa-file-excel green',    // 'download-values_excel',  'far fa-download',
                // style: { color: 'green' },
                scale: 'medium',
                padding: '6px 4px 2px 4px',
                handler: 'tsDownload',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('graph_download_values') // Tip content
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            },{
                // text: climatestation.Utils.getTranslation('savechart'),    // 'Save graph',
                // tooltip: climatestation.Utils.getTranslation('graph_download_png'),   //  'Download graph as PNG',
                iconCls: 'download_png',    // 'far fa-floppy-o',
                scale: 'medium',
                handler: 'saveChartAsPNG',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('graph_download_png') // Tip content
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            },{
                xtype: 'splitbutton',
                reference: 'saveGraphTemplate_'+me.id.replace(/-/g,'_'),
                // tooltip: climatestation.Utils.getTranslation('graph_save_graph_tpl'),   //  'Save graph as template',
                iconCls: 'far fa-save lightblue',
                cls: 'nopadding-splitbtn',
                scale: 'medium',
                padding: '6px 4px 2px 4px',
                hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
                arrowVisible: (!me.isNewTemplate ? true : false),
                handler: 'setGraphTemplateName',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('graph_save_graph_tpl') //  'Save graph as template',
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                },
                menu: {
                    hideOnClick: false,
                    alwaysOnTop: true,
                    //iconAlign: '',
                    width: 165,
                    defaults: {
                        hideOnClick: true,
                        //cls: "x-menu-no-icon",
                        padding: 2
                    },
                    items: [{
                        text: climatestation.Utils.getTranslation('save_as'),    // 'Save as...',
                        tooltip: climatestation.Utils.getTranslation('graph_tpl_save_as'),   //  'Save graph as template',
                        iconCls: 'far fa-save fa-lg lightblue',
                        //cls: 'x-menu-no-icon button-gray',
                        width: 165,
                        handler: function(){
                            me.isNewTemplate = true;
                            me.getController().setGraphTemplateName();
                        }
                    }]
                }
            },
            '->',
            {
                reference: 'objectsbtn_'+me.id.replace(/-/g,'_'),
                hidden: false,
                iconCls: 'far fa-object-group',
                style: {
                    "font-size": '1.70em'
                },
                scale: 'medium',
                padding: '6px 4px 2px 4px',
                enableToggle: true,
                // tooltip: climatestation.Utils.getTranslation('show_hide_title_logo_discalaimer_objects'),
                handler: 'toggleObjects',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('show_hide_title_logo_discalaimer_objects')
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            },{
                xtype: 'button',
                // tooltip: climatestation.Utils.getTranslation('change_selected_region'),   //  'Change selected region',
                iconCls: 'change-region-unlink',
                // style: {color: '#748FFC'},
                enableToggle: true,
                pressed: false,
                scale: 'medium',
                margin: 1,
                handler: 'toggleRegionLink',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('change_selected_region')
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            },
            ' ',
            {
                xtype: 'button',
                // tooltip: climatestation.Utils.getTranslation('graph_refresh'),   //  'Refresh graph',
                iconCls: 'far fa-redo-alt',
                hidden: false,
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                padding: '6px 4px 2px 4px',
                handler: 'refreshChart',
                listeners: {
                    afterrender: function(btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title : '',  // QuickTip Header
                            text  : climatestation.Utils.getTranslation('graph_refresh')
                        });

                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            }]
        };


        me.name ='tsgraphwindow_' + me.id;

        me.items = [{
            xtype: 'container',
            layout:'fit',
            reference:'tsgraph_'+me.id,
            id: 'tsgraph_' + me.id
        }, {
            xtype: 'mapdisclaimerobject',
            id: 'disclaimer_obj_' + me.id,
            reference: 'disclaimer_obj_' + me.id,
            alwaysOnTop: false
        }, {
            xtype: 'maplogoobject',
            id: 'logo_obj_' + me.id,
            reference: 'logo_obj_' + me.id,
            alwaysOnTop: false
        }];

        me.callParent();
    }
});
