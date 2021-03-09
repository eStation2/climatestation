
Ext.define("climatestation.view.analysis.workspace",{
    extend: "Ext.panel.Panel",
 
    requires: [
        "climatestation.view.analysis.workspaceController",
        "climatestation.view.analysis.workspaceModel",
        'Ext.util.DelayedTask',
        'climatestation.TabTitleEditor',
        'climatestation.Utils',
        'climatestation.view.analysis.graphTemplateAdmin',
        'climatestation.view.analysis.mapTemplateAdmin',
        'climatestation.view.analysis.timeseriesChartSelection'
    ],
    
    controller: "analysis-workspace",
    viewModel: {
        type: "analysis-workspace"
    },
    xtype: 'analysisworkspace',

    name: 'analysisworkspace',

    layout: {
        type: 'fit',
        padding: 0
    },
    // layout: {
    //     type: 'card',
    //     anchor: '100%'
    // },
    frame: false,
    border: false,
    bodyPadding: '1 0 0 0',
    scrollable: true,
    closable: false,
    closeAction: 'destroy', // 'hide'
    plugins: ['tabtitleedit'],

    config:{
        workspaceid: null,
        workspacename: '',
        isNewWorkspace: true,
        isrefworkspace: false,
        title: '',
        titleEditable: false,
        closable: false,
        pinable: false,
        pinned: false,
        maps: [],
        graphs: [],
        tabConfig: {
            padding: '0 10 0 10',
            style: {
                color: 'black'
            }
        }
    },

    initComponent: function () {
        var me = this;

        // Ext.util.Observable.capture(me, function (e) { console.log('analysismain - ' + e);});
        me.gridstackElementID = 'grid-stack-'+me.id;
        me.html = '<div class="grid-stack grid-stack-6" id="'+me.gridstackElementID+'"></div>'; // Place gridstack grid here.
        // me.html = '<div class="grid-stack grid-stack-6">HALLOOO</div>',    // Place gridstack grid here.

        me.listeners = {
            afterrender: function() {
                // let options = {
                //   column: 6,
                //   minRow: 1, // don't collapse when empty
                //   cellHeight: 70,
                //   disableOneColumnMode: true,
                //   float: false,
                //   // dragIn: '.sidebar .grid-stack-item', // class that can be dragged from outside
                //   // dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' }, // clone
                //   // removable: '.trash', // drag-out delete class
                //   // removeTimeout: 100,
                //   acceptWidgets: function(el) { return true; } // function example, else can be simple: true | false | '.someClass' value
                // };
                // var grid = GridStack.init(options, me.gridstackElementID);
                // let items = [
                //   {x: 0, y: 0, width: 2, height: 2, content: 'widget1'},
                //   {x: 3, y: 1, width: 1, height: 2, content: 'widget2'},
                //   {x: 4, y: 1, width: 1, content: 'widget3'},
                //   {x: 2, y: 3, width: 3, maxWidth: 3, id: 'special', content: 'has maxWidth=3'},
                //   {x: 2, y: 5, width: 1, content: 'widget4'}
                // ];
                // grid.load(items);
                // var count = 0;
                // grid.addWidget('<div><div class="grid-stack-item-content">' + count++ + '</div></div>', {x: 0, y: 0, width: 2, height: 2});
                // grid.addWidget('<div><div class="grid-stack-item-content">' + count++ + '</div></div>', {x: 2, y: 3, width: 3, height: 1});
                // grid.addWidget('<div><div class="grid-stack-item-content">' + count++ + '</div></div>', {x: 1, y: 3, width: 1, height: 1});


                //if (window.navigator.onLine){
                // me.backgroundLayers = [];
                // me.backgroundLayers.push(
                //   new ol.layer.Tile({
                //       visible: false,
                //       projection: 'EPSG:4326',
                //       source: new ol.source.TileWMS({
                //           url: 'analysis/getbackgroundlayer',   // 'http://demo.boundlessgeo.com/geoserver/wms',
                //           params: {
                //               layername:'naturalearth',
                //               'LAYERS': 'HYP_HR_SR_OB_DR'       // 'ne:NE1_HR_LC_SR_W_DR'
                //           },
                //           wrapX: false,
                //           noWrap: true
                //     })
                //   })
                // );

                me.mousePositionControl = new ol.control.MousePosition({
                  coordinateFormat: ol.coordinate.createStringXY(4),
                  projection: 'EPSG:4326',
                  undefinedHTML: '&nbsp;'
                });

                me.scaleline = new ol.control.ScaleLine({
                  units: 'metric'       // 'degrees'  'nautical mile'
                });

                // var timeseriesChartSelectionWindow = me.lookupReference('timeserieschartselection'+me.id);
                // timeseriesChartSelectionWindow.hide();

                // var taskOpenMapsAndGraphs = new Ext.util.DelayedTask(function() {
                // console.info(me.maps);
                // console.info(me.graphs);
                if (me.maps.length > 0) {
                    me.getController().openWorkspaceMaps(me.maps);
                }
                if (me.graphs.length > 0) {
                    me.getController().openWorkspaceGraphs(me.graphs);
                }
                // });
                // taskOpenMapsAndGraphs.delay(50);

                // Wait 5 seconds so that the workspace maps and graphs are openend and loaded and then make the
                // workspace tab closable.
                var taskMakeTabCloseable = new Ext.util.DelayedTask(function() {
                    if (me.workspaceid != "defaultworkspace"){
                        me.tab.setClosable(true);
                        me.updateLayout();
                    }
                });
                taskMakeTabCloseable.delay(5000);

                //me.map = new ol.Map({
                //    layers: me.backgroundLayers,
                //    // renderer: _getRendererFromQueryString(),
                //    projection:"EPSG:4326",
                //    displayProjection:"EPSG:4326",
                //    target: 'backgroundmap_'+ me.id,
                //    //overlays: [overlay],
                //    view: me.commonMapView,
                //    controls: ol.control.defaults({
                //        zoom: false,
                //        attribution:false,
                //        attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                //          collapsible: true // false to show always without the icon.
                //        })
                //    }).extend([me.scaleline])   // me.mousePositionControl,
                //});
                //
                // http://services.arcgisonline.com/arcgis/rest/services/ESRI_StreetMap_World_2D/MapServer
                // http://services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer
                //
                //me.bingStyles = [
                //  'Road',
                //  'Aerial',
                //  'AerialWithLabels'
                //];
                //
                //var i, ii;
                //for (i = 0, ii = me.bingStyles.length; i < ii; ++i) {
                //    me.backgroundLayers.push(new ol.layer.Tile({
                //        visible: false,
                //        preload: Infinity,
                //        projection: 'EPSG:4326',
                //        source: new ol.source.BingMaps({
                //            // My personal key jurvtk@gmail.com for http://h05-dev-vm19.ies.jrc.it/climatestation/ created on www.bingmapsportal.com
                //            key: 'Alp8PmGAclkgN_QJQTjgrkPlyRdkFfTnayMuMobAxMha_QF1ikefhdMlUQPdxNS3',
                //            imagerySet: me.bingStyles[i]
                //        })
                //    }));
                //}
                //for (i = 0, ii = me.backgroundLayers.length; i < ii; ++i) {
                //   me.backgroundLayers[i].setVisible(me.bingStyles[i] == 'Road');
                //}
                //
                //var _getRendererFromQueryString = function() {
                //  var obj = {}, queryString = location.search.slice(1),
                //      re = /([^&=]+)=([^&]*)/g, m;
                //
                //  while (m = re.exec(queryString)) {
                //    obj[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
                //  }
                //  if ('renderers' in obj) {
                //    return obj['renderers'].split(',');
                //  } else if ('renderer' in obj) {
                //    return [obj['renderer']];
                //  } else {
                //    return undefined;
                //  }
                //};
                //
                //me.backgroundLayers.push(
                //    new ol.layer.Image({
                //        title: climatestation.Utils.getTranslation('backgroundlayer'),  // 'Background layer',
                //        layer_id: 'backgroundlayer',
                //        layerorderidx: 0,
                //        type: 'base',
                //        visible: false,
                //        source: new ol.source.ImageWMS({
                //            url: 'analysis/getbackgroundlayer',
                //            crossOrigin: 'anonymous',
                //            params: {
                //                layername:'naturalearth',
                //                'FORMAT': 'image/png'
                //            },
                //            serverType: 'mapserver' /** @type {ol.source.wms.ServerType}  ('mapserver') */
                //        })
                //    })
                //);
                //
                //layer = new ol.layer.XYZ(
                //    "ESRI",
                //    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
                //    {sphericalMercator: true}
                //);
                //
                //me.backgroundLayers.push(
                //  new ol.layer.Tile({
                //      visible: true,
                //      projection: 'EPSG:4326',
                //      source: new ol.source.TileWMS({
                //          url: 'http://services.arcgisonline.com/arcgis/rest/services/ESRI_StreetMap_World_2D/MapServer',
                //          params: {
                //            LAYERS: '0,1,2',
                //            FORMAT:"image/png"
                //          }
                //    })
                //  })
                //);
            //}
            },

            // The resize handle is necessary to set the map!
            // resize: function () {
            //     //var size = [document.getElementById(this.id + "-body").offsetWidth, document.getElementById(this.id + "-body").offsetHeight];
            //     var size = [document.getElementById('backgroundmap_'+ me.id).offsetWidth, document.getElementById('backgroundmap_'+ me.id).offsetHeight];
            //     if (climatestation.Utils.objectExists(me.map)) {
            //         me.map.setSize(size);
            //     }
            //     // console.info('analysis tab resized!');
            //     // var timeseriesChartSelectionWindow = this.lookupReference('timeserieschartselection'+me.id);
            //     // timeseriesChartSelectionWindow.fireEvent('align');
            // },
            close: function(){
                // console.info('closing and destroying workspace');
                this.lookupReference('timeserieschartselection'+me.id).destroy();
                this.destroy();
            }
        };

        if (me.isrefworkspace){
            me.pinable = false;
            me.titleEditable = false;
        }
        else{
            me.tooltip = me.workspaceid != 'defaultworkspace' ? climatestation.Utils.getTranslation('edit_workspace_name') : '';     // 'Doubleclick to edit workspace name';
        }

        if (!me.pinned && me.pinable) {
            me.setIconCls('far fa-map-pin pin_red');

        }
        else if (me.pinned && me.pinable){
            me.setIconCls('far fa-map-pin pin_green');
        }

        // if (me.workspaceid == 'defaultworkspace'){
        //     me.tabConfig.tabIndex = 2;
        // }

        if (me.pinable) {
            me.tabConfig = {
                // cls: me.isNewWorkspace ? 'newworkspacetab' : '',
                listeners: {
                    render: {
                        fn: function(e) {
                            if (!me.isrefworkspace) {
                                Ext.tip.QuickTipManager.register({
                                    target: e.btnIconEl.id,
                                    trackMouse: true,
                                    title: climatestation.Utils.getTranslation('pin_unpin'),     // Pin/unpin
                                    text: climatestation.Utils.getTranslation('pin_unpin_workspace')     // Click to pin or unpin workspace
                                });
                            }
                            e.btnIconEl.on('dblclick', function(e) {
                                // alert('click');
                                if (!me.pinned && me.pinable) {
                                    me.setIconCls('far fa-map-pin pin_green');
                                    // me.setIconCls('far fa-thumbtack pin_green');
                                    me.pinned = true;
                                    if (!me.isNewWorkspace){
                                        me.getController().savePin();
                                    }
                                }
                                else if (me.pinned && me.pinable){
                                    me.setIconCls('far fa-map-pin pin_red');
                                    // me.setIconCls('far fa-thumbtack pin_red');
                                    me.pinned = false;
                                    if (!me.isNewWorkspace){
                                        me.getController().savePin();
                                    }
                                }
                            });
                            // e.btnIconEl.on('mouseover', function(e) {
                            //     console.info('mouseover');
                            //
                            // });
                            e.ownerCt.updateLayout();
                        }
                    }
                }
            };
        }

        me.reorderable = true;
        if (me.isrefworkspace){
            me.tabConfig.cls = 'refworkspacetab';
        }
        else if (me.isNewWorkspace){
            me.tabConfig.cls = 'newworkspacetab';
        }
        else if (me.workspaceid == 'defaultworkspace'){
             me.tabConfig.cls = 'defaultworkspacetab';
             me.reorderable = false;
        }

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            padding: 1,
            // border: '0px 0px 1px 0px',
            style: {
                backgroundColor:'#fff',      // '#ADD2ED'
                borderColor: 'lightgray',
                borderStyle: 'solid',
                "border-bottom-width": '1px !important'
            },
            defaults: {
                padding: 3
            },
            items: [' ', {
                xtype: 'button',
                name: 'newmapbtn',
                text: climatestation.Utils.getTranslation('newmap'),  // 'MAPS',
                iconCls: 'map_add',
                style: { color: 'gray' },
                scale: 'small',
                handler: 'newMapView'
            }, {
                xtype: 'button',
                // id: 'analysismain_maptemplatebtn',
                name: 'maptemplateadminbtn_'+me.id.replace(/-/g,'_'),
                reference: 'maptemplateadminbtn_'+me.id.replace(/-/g,'_'),
                text: climatestation.Utils.getTranslation('map_template'), // 'MY MAPS'
                iconCls: 'map_tpl',
                style: {color: 'gray'},
                scale: 'small',
                hidden: (climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
                // floating: false,  // usually you want this set to True (default)
                handler: 'showUserMaptemplates',
                listeners: {
                    afterrender: function (btn) {
                        btn.mapTemplateAdminPanel = new climatestation.view.analysis.mapTemplateAdmin({owner:btn});
                    }
                }
                // enableToggle: false,
                // arrowVisible: false,
                // arrowAlign: 'right',
                // collapseDirection: 'bottom',
                // menuAlign: 'tl-bc',
                // menu: {
                //     // hideOnClick: true,
                //     defaults: {
                //         cls: "x-menu-no-icon",
                //         padding: 0
                //     },
                //     listeners: {
                //        // afterrender: function(menu , y , x ){
                //        //     Ext.util.Observable.capture(menu, function(e){console.log('mapTemplateMenu - ' + menu.id + ': ' + e);});
                //        // },
                //        activate: function(menu , y , x ){
                //             // menu.down().fireEvent('loadstore');
                //             // menu.down().show();
                //        }
                //     },
                //     items: [{
                //         xtype: 'usermaptpl'
                //         // ,hidden: false
                //     }]
                // }
            },{ xtype: 'tbseparator'
            },{
                xtype: 'button',
                name: 'analysismain_timeseriesbtn',
                reference: 'analysismain_timeseriesbtn',
                text: climatestation.Utils.getTranslation('graphs'),  // 'GRAPHS',
                iconCls: 'chart-curve_medium',
                scale: 'small',
                handler: 'showTimeseriesChartSelection'
            },{
                xtype: 'button',
                // id: 'analysismain_graph_templatebtn',
                name: 'graphtemplateadminbtn_'+me.id.replace(/-/g,'_'),
                reference: 'graphtemplateadminbtn_'+me.id.replace(/-/g,'_'),
                text: climatestation.Utils.getTranslation('my_graphs'), // 'MY GRAPHS'
                iconCls: 'graph_tpl',
                style: { color: 'gray' },
                scale: 'small',
                hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
                // floating: false,  // usually you want this set to True (default)
                handler: 'showUserGraphTemplates',
                listeners: {
                    afterrender: function (btn) {
                        btn.graphTemplateAdminPanel = new climatestation.view.analysis.graphTemplateAdmin({owner:btn});
                    }
                }
            },{ xtype: 'tbspacer'
            },{ xtype: 'tbspacer'
            },{ xtype: 'tbspacer'
            },{ xtype: 'tbspacer'
            // },{
            //     xtype: 'button',
            //     name: 'analysismain_legendsbtn_'+me.id.replace(/-/g,'_'),
            //     reference: 'analysismain_legendsbtn_'+me.id.replace(/-/g,'_'),
            //     text: climatestation.Utils.getTranslation('legends'),  // 'LEGENDS',
            //     iconCls: 'legends',
            //     style: { color: 'gray' },
            //     scale: 'small',
            //     hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null || climatestation.globals['typeinstallation'] == 'jrc_online' ? true : false),
            //     handler: 'legendAdmin'
            // },{
            //     xtype: 'button',
            //     name: 'analysismain_layersbtn_'+me.id.replace(/-/g,'_'),
            //     reference: 'analysismain_layersbtn_'+me.id.replace(/-/g,'_'),
            //     text: climatestation.Utils.getTranslation('layers'),  // 'LAYERS',
            //     iconCls: 'layers',
            //     style: { color: 'gray' },
            //     scale: 'small',
            //     // hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
            //     hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null || climatestation.globals['typeinstallation'] == 'jrc_online' ? true : false),
            //     handler: 'layerAdmin'
            // },{
            //     xtype: 'button',
            //     name: 'analysismain_logosbtn_'+me.id.replace(/-/g,'_'),
            //     reference: 'analysismain_logosbtn_'+me.id.replace(/-/g,'_'),
            //     text: climatestation.Utils.getTranslation('logos'),  // 'LOGOS',
            //     iconCls: 'far fa-globe-africa',
            //     style: { color: 'gray' },
            //     scale: 'small',
            //     hidden:  (climatestation.getUser() == 'undefined' || climatestation.getUser() == null || climatestation.globals['typeinstallation'] == 'jrc_online' ? true : false),
            //     handler: 'logosAdmin'
            // },
            //     { xtype: 'tbspacer'
            // },
            //     { xtype: 'tbspacer'
            // },
            //     { xtype: 'tbspacer'
            },{
                xtype: 'button',
                name: 'saveDefaultWorkspaceAsBtn',
                reference: 'saveDefaultWorkspaceAsBtn',
                text: climatestation.Utils.getTranslation('save_as'),  // 'Save as',
                iconCls: 'far fa-save fa-lg lightblue',
                // style: {color: 'lightblue'},
                scale: 'small',
                hidden: (!me.isrefworkspace && me.workspaceid != 'defaultworkspace') || climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false,
                listeners: {
                    afterrender: function (me) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: me.getId(), // Target button's ID
                            title: '',
                            text: climatestation.Utils.getTranslation('save_workspace_as')
                        });
                    }
                },
                handler: 'setWorkspaceName'
            }, {
                xtype: 'splitbutton',
                name: 'saveWorkspaceBtn',
                reference: 'saveWorkspaceBtn',
                iconCls: 'far fa-save fa-lg lightblue',
                // style: {color: 'lightblue'},
                cls: 'nopadding-splitbtn',
                scale: 'small',
                hidden: me.isrefworkspace || (me.workspaceid == 'defaultworkspace' || climatestation.getUser() == 'undefined' || climatestation.getUser() == null ? true : false),
                arrowVisible: (!me.isNewWorkspace ? true : false),
                tooltip: climatestation.Utils.getTranslation('save_workspace'),
                // listeners: {
                //     afterrender: function (me) {
                //         // Register the new tip with an element's ID
                //         Ext.tip.QuickTipManager.register({
                //             target: me.getId(), // Target button's ID
                //             title: '',
                //             text: climatestation.Utils.getTranslation('save_workspace')
                //         });
                //     }
                // },
                handler: 'saveWorkspace',
                menu: {
                    hideOnClick: false,
                    // hidden: (!me.isNewWorkspace ? true : false),
                    // alwaysOnTop: true,
                    width: 165,
                    defaults: {
                        hideOnClick: true
                        // hidden: (!me.isNewWorkspace ? true : false)
                    },
                    items: [{
                        //xtype: 'button',
                        text: climatestation.Utils.getTranslation('save_as'),    // 'Save as...',
                        // glyph: 'xf0c7@FontAwesome',
                        // cls:'lightblue',
                        iconCls: 'far fa-save lightblue',
                        // style: { color: 'lightblue' },
                        width: 165,
                        handler: 'setWorkspaceName'
                    }]
                }
            }, '->', {
                xtype: 'button',
                name: 'togglegridview',
                tooltip: climatestation.Utils.getTranslation('Grid view'),
                iconCls: 'fas fa-th',
                scale: 'small',
                enableToggle: true,
                toggleHandler: 'toggleGridView',
                listeners: {
                    afterrender: function (btn) {
                        // Register the new tip with an element's ID
                        Ext.tip.QuickTipManager.register({
                            target: btn.btnIconEl.el, // Target button's ID
                            title: '',
                            text: climatestation.Utils.getTranslation('Toggle grid view')
                        });
                    },
                    destroy: function(btn) {
                        Ext.tip.QuickTipManager.unregister(btn.btnIconEl.el);
                    }
                }
            // {
            //     xtype: 'button',
            //     name: 'togglebackgroundlayer',
            //     //text: climatestation.Utils.getTranslation('hidebackgroundlayer'),  // 'Hide Background layer',
            //     text: climatestation.Utils.getTranslation('showbackgroundlayer'),  // 'Show Background layer',
            //     enableToggle: true,
            //     // iconCls: 'far fa-cog', // fa-spin 'icon-play', // icomoon fonts
            //     // style: { color: 'gray' },
            //     // glyph: 'xf0c7@FontAwesome',
            //     scale: 'small',
            //     handler: 'toggleBackgroundlayer'
            }]
        });

        me.defaults = {
            titleAlign: 'center',
            frame: false,
            border: false,
            bodyPadding: 0
        };
        me.items = [{
        //     xtype: 'dashboard',
        //     reference: 'gridview',
        //     hidden: true,
        //     stateful: !1,
        //     columnWidths: [0.25, 0.25, 0.25],
        //     parts: {
        //         mapView: {
        //             viewTemplate: {
        //                 // title: 'Map',
        //                 // items: []
        //                 items: [{
        //                     xtype: 'mapview-window'
        //                 }]
        //             }
        //         },
        //         graphView: {
        //             viewTemplate: {
        //                 // title: 'Graph',
        //                 // items: []
        //                 items: [{
        //                     xtype: 'timeserieschart-window'
        //                 }]
        //             }
        //         }
        //     },
        //     defaultContent: [{
        //         type: 'mapView',
        //         columnIndex: 0,
        //         rowIndex: 0
        //     },{
        //         type: 'mapView',
        //         columnIndex: 1,
        //         rowIndex: 0
        //     },{
        //         type: 'graphView',
        //         columnIndex: 1,
        //         rowIndex: 0
        //     }]
        // }, {
            xtype: 'timeserieschartselection',
            // id: 'timeserieschartselection'+me.id,
            reference: 'timeserieschartselection'+me.id,
            workspace: me
        }];

        //     // region: 'center',
        //     xtype: 'container',
        //     id: 'backgroundmap_'+me.id,
        //     reference: 'backgroundmap_'+me.id,
        //     scrollable: 'y',
        //     closable: false,
        //     autoWidth: true,
        //     height: 700
        //     // flex: 1,
        //     // layout: {
        //     //     type: 'fit'
        //     // }
        //     // style: { "background-color": 'white' },
        //     // html : '<div id="backgroundmap_' + me.id + '" style="width: 100%; height: 100%;"></div>'

        me.commonMapView = new ol.View({
            projection:"EPSG:4326",
            center: [16.4, -0.5],   // [15, 2]   [20, -4.7],   // ol.proj.transform([20, 4.5], 'EPSG:3857', 'EPSG:4326'),
            resolution: 0.1,
            minResolution: 0.0001,
            maxResolution: 0.25,
            zoomFactor: 1.1+0.1*5   // (cioe' nel range 1.1 -> 2.1)
            // ,zoom: 3
            // minZoom: 4,
            // maxZoom: 100,
            // zoomFactor: 1.5 // 1.0+(0.075*1)
        });
        me.commonMapView.setZoom(1.5);
        me.zoomFactorSliderValue = 5;

        me.callParent();
    }
});
