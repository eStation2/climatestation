Ext.define('climatestation.view.analysis.workspaceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.analysis-workspace',

    requires: [
        'climatestation.Utils',
        'climatestation.view.analysis.layerAdmin',
        'climatestation.view.analysis.legendAdmin',
        'climatestation.view.analysis.logoAdmin',
        'climatestation.view.analysis.mapView',
        'climatestation.view.analysis.timeseriesChartView'
    ],

    toggleGridView: function(btn){
        var me = this.getView();
        var mapViewWindows = me.query('mapview-window');
        var tsGraphWindows = me.query('timeserieschart-window');
        var gridview = me.lookupReference('gridview');

        if (btn.pressed) {
            btn.setIconCls('fas fa-th green');
            gridview.show();

            // me.gridoptions = {
            //     column: 8,
            //     minRow: 4, // don't collapse when empty
            //     // cellHeight: 70,
            //     disableOneColumnMode: true,
            //     float: false,
            //     alwaysShowResizeHandle: false,
            //     margin: 5,
            //     minWidth:'613px',
            //     minHeight:'415px',
            //     placeholderClass: 'grid-stack-placeholder', // <- default value
            //     placeholderText: '',
            //   // dragIn: '.sidebar .grid-stack-item', // class that can be dragged from outside
            //   // dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' }, // clone
            //   // removable: '.trash', // drag-out delete class
            //   // removeTimeout: 100,
            //     acceptWidgets: function(el) { return true; } // function example, else can be simple: true | false | '.someClass' value
            // };

            // me.griditems = [
            //     {x: 0, y: 0, width: 2, height: 2, content: '<div id="gridcell_'+me.id+'">adfasd</div>'},
            //     {x: 3, y: 1, width: 1, height: 2, autoPosition: true},
            //     {width: 1, height: 2, autoPosition: true, resizeHandles: 's, se, sw, n, ne, nw, e, w'},
            //     {x: 4, y: 1, width: 1, minWidth: 1, minHeight: 1},
            //     {x: 2, y: 3, width: 3, maxWidth: 3, id: 'special'},
            //     {x: 2, y: 5, width: 1, locker: true, noResize: true, noMove: true}
            // ];

            function addWidget(grid, mapgraphComponent) {
                let gridcellID = 'gridcell_'+mapgraphComponent.id;
                let n = [{
                    // x: 0,
                    // y: 0,
                    autoPosition: true,
                    width: 2,
                    height: 2,
                    id: gridcellID,
                    // width: '613px',
                    // height: '415px',
                    resizeHandles: 'se, sw, ne, nw'
                }];
                grid.load(n);
                // grid.addWidget(grid.el, n);

                //let el = Ext.get("map"+me.id);
                let el = document.querySelector('div[data-gs-id="'+gridcellID+'"]');
                console.info(el);
                el = el.querySelector('div');
                console.info(el);
                //el = el.querySelector('div[class="grid-stack-item-content"]');

                new climatestation.view.analysis.mapView({
                    workspace : me,
                    floating: false,
                    draggable: false,
                    renderTo: el
                });
                // mapgraphComponent.floating = false;
                // mapgraphComponent.draggable = false;
                // mapgraphComponent.renderTo = el;
                // mapgraphComponent.render();
                console.info(mapgraphComponent);
                // new Ext.panel.Panel({title:'MAP 1', layout:'fit', width:500, height:400, renderTo:el});
            }

            function removeWidget(grid, mapgraphComponent) {
                grid.removeWidget(this.parentNode.parentNode)
            }

            // me.grids = GridStack.initAll(me.gridoptions);
            // console.info(me.grids);
            // // me.grids[0].load(me.griditems);
            //
            // me.grids.forEach(function(grid){
            //     console.info(grid.el.id);
            //     if (grid.el.id === me.gridstackElementID){
            //         me.grid = grid
            //         console.info(grid);
            //     }
            // })

            Ext.Object.each(mapViewWindows, function(id, mapview_window, thisObj) {
                // console.info(mapview_window);
                console.info(me.grid);
                // addWidget(me.grid, mapview_window);

                // mapview_window.setFloating(false);
                // mapview_window.setDragable(false);
                // mapview_window.workspace.remove(mapview_window, false);
                // gridview.createView(mapview_window, columnIndex);
                // gridview.createView({
                //     type: 'mapView',
                //     title: 'New Map title',
                //     items: mapview_window
                //     // height: 200
                // }, columnIndex);
                // gridview.addNew('container');
                // gridview.items.items[0].items.items[0].items[i].add(mapview_window);
                // i += 1;
            });

            Ext.Object.each(tsGraphWindows, function(id, tsgraph_window, thisObj) {
                console.info(tsgraph_window);
                // addWidget(me.grid, tsgraph_window);

                // tsgraph_window.setFloating(false);
                // tsgraph_window.setDragable(false);
                // gridview.createView(tsgraph_window, columnIndex);
                // gridview.addView({
                //     type: 'graphView',
                //     title: 'New Graph title',
                //     items: tsgraph_window
                //     // height: 200
                // }, columnIndex);
                // gridview.addNew('container');
                // console.info(gridview.items.items[0].items.items[0].items);
                // gridview.items.items[0].items.items[0].items[i].add(tsgraph_window);
                // i += 1;
            });
        }
        else {
            btn.setIconCls('fas fa-th');
        }
    }

    ,closeAllMapsGraphs: function(){
        var me = this.getView();
        var mapViewWindows = me.query('mapview-window');
        var tsGraphWindows = me.query('timeserieschart-window');

        Ext.Object.each(mapViewWindows, function(id, mapview_window, thisObj) {
            mapview_window.close();
        });

        Ext.Object.each(tsGraphWindows, function(id, tsgraph_window, thisObj) {
            tsgraph_window.close();
        });
    }

    ,openWorkspaceGraphs: function(graphs){
        var me = this.getView();
        me.allGraphsLoaded = false;

        for (var i = 0; i < graphs.length; i++) {
           // console.info(graphs[i]);
            var wsgraph = {
                workspace: me,
                isTemplate: graphs[i].istemplate,
                isNewTemplate: !graphs[i].istemplate,
                workspaceid: graphs[i].workspaceid,
                userid: graphs[i].userid,
                graph_tpl_id: graphs[i].graph_tpl_id,
                parent_tpl_id: graphs[i].parent_tpl_id,
                graph_tpl_name: graphs[i].graph_tpl_name,
                istemplate: graphs[i].istemplate,
                graphviewposition: climatestation.Utils.objectExists(graphs[i].graphviewposition) ? graphs[i].graphviewposition.split(",").map(function(x){return parseInt(x)}) : [50,5],      // .filter(Boolean)
                graphviewsize: climatestation.Utils.objectExists(graphs[i].graphviewsize) ? graphs[i].graphviewsize.split(",").map(function(x){return parseInt(x)}) : [700,600],
                graphtype: graphs[i].graph_type,
                selectedTimeseries: graphs[i].selectedtimeseries,
                yearTS: graphs[i].yearts,
                tsFromPeriod: graphs[i].tsfromperiod,
                tsToPeriod: graphs[i].tstoperiod,
                yearsToCompare: graphs[i].yearstocompare != '' ? Ext.decode(graphs[i].yearstocompare) : '',
                tsFromSeason: graphs[i].tsfromseason,
                tsToSeason: graphs[i].tstoseason,
                wkt_geom: graphs[i].wkt_geom,
                selectedregionname: graphs[i].selectedregionname,
                disclaimerObjPosition: graphs[i].disclaimerobjposition != null ? graphs[i].disclaimerobjposition.split(",").map(function(x){return parseInt(x)}) : [0,611],
                disclaimerObjContent: graphs[i].disclaimerobjcontent,
                logosObjPosition: graphs[i].logosobjposition != null ? graphs[i].logosobjposition.split(",").map(function(x){return parseInt(x)}) : [434, 583],
                logosObjContent: graphs[i].logosobjcontent != '' ? Ext.decode(graphs[i].logosobjcontent) : null,
                showObjects: graphs[i].showobjects,
                showtoolbar: graphs[i].showtoolbar,
                auto_open: graphs[i].auto_open
            };
            var newGraphViewWin = new climatestation.view.analysis.timeseriesChartView(wsgraph);

            me.add(newGraphViewWin);
            newGraphViewWin.show();

            if (i==graphs.length-1){
                me.allGraphsLoaded = true;
            }
        }
    }

    ,openWorkspaceMaps: function(maps){
        var me = this.getView();
        me.allMapsLoaded = false;

        for (var i = 0; i < maps.length; i++) {
            // var mapviewposition = maps[i].mapviewposition.split(",").map(function(x){return parseInt(x)});
            var wsmap = {
                workspace : me,
                isTemplate: maps[i].istemplate,
                isNewTemplate: !maps[i].istemplate,
                userid: maps[i].userid,
                map_tpl_id: maps[i].map_tpl_id,
                parent_tpl_id: maps[i].parent_tpl_id,
                templatename: maps[i].map_tpl_name,
                mapviewPosition: maps[i].mapviewposition.split(",").map(function(x){return parseInt(x)}),      // .filter(Boolean)
                mapviewSize: maps[i].mapviewsize.split(",").map(function(x){return parseInt(x)}),
                productcode: maps[i].productcode,
                subproductcode: maps[i].subproductcode,
                productversion: maps[i].productversion,
                mapsetcode: maps[i].mapsetcode,
                productdate: maps[i].productdate,
                legendid: maps[i].legendid,
                legendlayout: maps[i].legendlayout,
                legendObjPosition: maps[i].legendobjposition.split(",").map(function(x){return parseInt(x)}),
                showlegend: maps[i].showlegend,
                titleObjPosition: maps[i].titleobjposition.split(",").map(function(x){return parseInt(x)}),
                titleObjContent: maps[i].titleobjcontent,
                disclaimerObjPosition: maps[i].disclaimerobjposition.split(",").map(function(x){return parseInt(x)}),
                disclaimerObjContent: maps[i].disclaimerobjcontent,
                logosObjPosition: maps[i].logosobjposition.split(",").map(function(x){return parseInt(x)}),
                logosObjContent: Ext.decode(maps[i].logosobjcontent),
                showObjects: maps[i].showobjects,
                showtoolbar: maps[i].showtoolbar,
                showgraticule: maps[i].showgraticule,
                showtimeline: maps[i].showtimeline,
                scalelineObjPosition: maps[i].scalelineobjposition.split(",").map(function(x){return parseInt(x)}),
                vectorLayers: maps[i].vectorlayers,
                outmask: maps[i].outmask,
                outmaskFeature: maps[i].outmaskfeature,
                zoomextent: maps[i].zoomextent,
                mapsize: maps[i].mapsize,
                mapcenter: maps[i].mapcenter
                // x: mapviewposition[0],
                // y: mapviewposition[1]
            };
            // console.info(wsmap);
            var newMapViewWin = new climatestation.view.analysis.mapView(wsmap);

            me.add(newMapViewWin);
            newMapViewWin.show();
            if (i==maps.length-1){
                me.allMapsLoaded = true;
            }
        }
    }

    ,setWorkspaceName: function(){
        var me = this.getView();
        var newWorkspaceName = '';

        // Open dialog asking to give a workspace name, proposing the name of workspace to copy with in the end " - copy"
        if (climatestation.Utils.objectExists(me.workspacename) && me.workspacename != ''){
            newWorkspaceName = me.workspacename + ' - copy';
        }
        else {
            newWorkspaceName = climatestation.Utils.getTranslation('name_new_workspace_copy');   // 'New workspace - copy';     // Will never be given because the workspace to copy always has a name.
        }

        Ext.MessageBox.prompt(climatestation.Utils.getTranslation('workspace_name'), climatestation.Utils.getTranslation('workspace_name_save_message') + ':', function(btn, text){   // Workspace name'   'Please give a name for the workspace to copy'
            if (btn == 'ok'){
                me.saveasWorkspacename = text;
                me.saveAs = true;
                this.saveWorkspace();
            }
        }, this, false, newWorkspaceName);
    }

    ,saveWorkspaceName: function(){
        var me = this.getView();
        var params = {};

        params.userid = climatestation.getUser().userid;
        params.workspaceid = me.saveAs ? -1 : me.workspaceid;
        params.isNewWorkspace = me.isNewWorkspace;
        params.workspacename = me.workspacename;

        // console.info(params);

        Ext.Ajax.request({
            method: 'POST',
            url: 'analysis/saveworkspacename',
            params: params,
            scope: me,
            success: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);

                if (responseJSON.success){
                    Ext.toast({hideDuration: 2000, html: responseJSON.message, width: 300, align: 't'});

                    if (me.isNewWorkspace){
                        me.isNewWorkspace = false;
                        me.lookupReference('saveWorkspaceBtn').setArrowVisible(true);
                        me.tab.removeCls('newworkspacetab');
                        me.tab.updateLayout();
                        if (!me.saveAs){
                            me.workspaceid = responseJSON.workspaceid;
                        }
                    }

                    me.up().lookupReference('analysismain_addworkspacebtn').userWorkspaceAdminPanel.setDirtyStore(true);
                }
                else {
                    Ext.toast({hideDuration: 2000, html: responseJSON, title: climatestation.Utils.getTranslation('error_save_workspace_name_change'), width: 300, align: 't'});
                    // me.templatename = '';
                }
                me.saveAs = false;
            },
            //callback: function ( callinfo,responseOK,response ) {},
            failure: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);
                Ext.toast({hideDuration: 2000, html: responseJSON, title: climatestation.Utils.getTranslation('error_save_workspace_name_change'), width: 300, align: 't'});
                me.saveAs = false;
            }
        });
    }

    ,savePin: function(){
        var me = this.getView();
        var params = {};

        params.userid = climatestation.getUser().userid;
        params.workspaceid = me.saveAs ? -1 : me.workspaceid;
        params.isNewWorkspace = me.saveAs ? true : me.isNewWorkspace;
        params.workspacename = me.workspacename;
        params.pinned = me.pinned;

        // console.info(params);

        Ext.Ajax.request({
            method: 'POST',
            url: 'analysis/saveworkspacepin',
            params: params,
            scope: me,
            success: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);

                if (responseJSON.success){
                    // Ext.toast({hideDuration: 2000, html: responseJSON.message, width: 300, align: 't'});     // "Save Map template"

                    if (me.isNewWorkspace){
                        me.isNewWorkspace = false;
                        me.lookupReference('saveWorkspaceBtn').setArrowVisible(true);
                        me.tab.removeCls('newworkspacetab');
                        me.tab.updateLayout();
                        if (!me.saveAs){
                            me.workspaceid = responseJSON.workspaceid;
                        }
                    }

                    me.up().lookupReference('analysismain_addworkspacebtn').userWorkspaceAdminPanel.setDirtyStore(true);
                }
                else {
                    Ext.toast({hideDuration: 2000, html: responseJSON, title: climatestation.Utils.getTranslation('error_save_workspace_pin_change'), width: 300, align: 't'});
                    // me.templatename = '';
                }
                me.saveAs = false;
            },
            //callback: function ( callinfo,responseOK,response ) {},
            failure: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);
                Ext.toast({hideDuration: 2000, html: responseJSON, title: climatestation.Utils.getTranslation('error_save_workspace_pin_change'), width: 300, align: 't'});
                me.saveAs = false;
            }
        });
    }

    ,saveWorkspace: function(){
        var me = this.getView();
        var mapViewWindows = me.query('mapview-window');
        var tsGraphWindows = me.query('timeserieschart-window');
        var params = {};
        var openmaps = [];
        var opengraphs = [];

        // me.workspacename = me.title;
        // console.info(me.workspaceid);
        Ext.Object.each(mapViewWindows, function(id, mapview_window, thisObj) {
            openmaps.push(mapview_window.getController().getMapSettings());
        });

        Ext.Object.each(tsGraphWindows, function(id, tsgraph_window, thisObj) {
            opengraphs.push(tsgraph_window.getController().getGraphSettings());
        });

        me.workspacename = me.title;
        params.userid = climatestation.getUser().userid;
        params.workspaceid = me.saveAs ? -1 : me.workspaceid;
        params.workspacename = me.saveAs ? me.saveasWorkspacename : me.workspacename;
        params.isNewWorkspace = me.saveAs ? true : me.isNewWorkspace;
        // params.title = me.title;
        params.pinned = me.saveAs ? false : me.pinned;
        params.maps = Ext.util.JSON.encode(openmaps);
        params.graphs = Ext.util.JSON.encode(opengraphs);
        // console.info(params);

        Ext.Ajax.request({
            method: 'POST',
            url: 'analysis/saveworkspace',
            params: params,
            scope: me,
            success: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);

                if (responseJSON.success){
                    Ext.toast({hideDuration: 2000, html: responseJSON.message, width: 300, align: 't'});     // "Save Map template"

                    if (me.isNewWorkspace){
                        me.isNewWorkspace = false;
                        me.lookupReference('saveWorkspaceBtn').setArrowVisible(true);
                        me.tab.removeCls('newworkspacetab');
                        me.tab.updateLayout();
                        if (!me.saveAs){
                            me.workspaceid = responseJSON.workspaceid;
                        }
                    }

                    // console.info(me.up());
                    me.up().lookupReference('analysismain_addworkspacebtn').userWorkspaceAdminPanel.setDirtyStore(true);
                }
                else {
                    // Ext.toast({hideDuration: 2000, html: responseJSON.message, title: climatestation.Utils.getTranslation('error_save_map_tpl'), width: 300, align: 't'});     // "ERROR saving the Map template"
                    // me.templatename = '';
                }
                me.saveAs = false;
            },
            //callback: function ( callinfo,responseOK,response ) {},
            failure: function (response, request) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);
                // Ext.toast({hideDuration: 2000, html: result.message, title: climatestation.Utils.getTranslation('error_save_map_tpl'), width: 300, align: 't'});     // "ERROR saving the Map template"
                me.saveAs = false;
            }
        });
    }

    ,newMapView: function() {
        var newMapViewWin = new climatestation.view.analysis.mapView({
            workspace : this.getView()
        });
        this.getView().add(newMapViewWin);
        newMapViewWin.show();
    }

    ,layerAdmin: function(){
        var newLayerAdminWin = new climatestation.view.analysis.layerAdmin();
        this.getView().add(newLayerAdminWin);
        newLayerAdminWin.show();
        // this.getView().lookupReference('analysismain_layersbtn').disable();
    }

    ,logosAdmin: function(){
        var newLogosAdminWin = new climatestation.view.analysis.logoAdmin();
        this.getView().add(newLogosAdminWin);
        newLogosAdminWin.show();
        // this.getView().lookupReference('analysismain_logosbtn').disable();
    }

    ,legendAdmin: function(){
        var newLegendAdminWin = new climatestation.view.analysis.legendAdmin();
        this.getView().add(newLegendAdminWin);
        newLegendAdminWin.show();
        // this.getView().lookupReference('analysismain_legendsbtn').disable();
    }

    ,showUserMaptemplates: function(btn){
        btn.mapTemplateAdminPanel.show();
    }

    ,showUserGraphTemplates: function(btn){
        btn.graphTemplateAdminPanel.show();
    }

    ,showTimeseriesChartSelection: function(){
        var timeseriesChartSelectionWindow = this.getView().lookupReference('timeserieschartselection'+this.getView().id);
        timeseriesChartSelectionWindow.show();

        // if (!climatestation.Utils.objectExists(timeseriesChartSelectionWindow)) {
        //     this.getView().add({
        //         xtype: 'timeserieschartselection',
        //         reference: 'timeserieschartselection' + this.getView().id,
        //         workspace: this.getView()
        //     });
        //     timeseriesChartSelectionWindow = this.getView().lookupReference('timeserieschartselection'+this.getView().id);
        //     timeseriesChartSelectionWindow.show();
        //     // this.getView().add(new climatestation.view.analysis.timeseriesChartSelection({
        //     //     reference: 'timeserieschartselection' + this.getView().id,
        //     //     workspace: this.getView()
        //     // }).show());
        // }
        // else{
        //     timeseriesChartSelectionWindow.show();
        // }
    }

    ,toggleBackgroundlayer: function(btn, event) {
        var analysismain = btn.up().up();
        var i, ii;
        var me = this.getView();

        if (!climatestation.Utils.objectExists(analysismain.map)){
            me.map = new ol.Map({
                layers: me.backgroundLayers,
                // renderer: _getRendererFromQueryString(),
                projection:"EPSG:4326",
                displayProjection:"EPSG:4326",
                target: 'backgroundmap_'+ me.id,
                //overlays: [overlay],
                view: me.commonMapView,
                controls: ol.control.defaults({
                    zoom: false,
                    attribution:false,
                    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                      collapsible: true // false to show always without the icon.
                    })
                }).extend([me.scaleline])   // me.mousePositionControl,
            });
            me.map.addInteraction(new ol.interaction.MouseWheelZoom({
              duration: 50
            }));
        }

        if (btn.pressed){
            btn.setText(climatestation.Utils.getTranslation('hidebackgroundlayer'));
            analysismain.map.addControl(analysismain.mousePositionControl);
            for (i = 0, ii = analysismain.backgroundLayers.length; i < ii; ++i) {
                //analysismain.backgroundLayers[i].setVisible(analysismain.bingStyles[i] == 'Road');
                analysismain.backgroundLayers[i].setVisible(true);
            }
        }
        else {
            btn.setText(climatestation.Utils.getTranslation('showbackgroundlayer'));
            analysismain.map.removeControl(analysismain.mousePositionControl);
            for (i = 0, ii = analysismain.backgroundLayers.length; i < ii; ++i) {
                analysismain.backgroundLayers[i].setVisible(false);
            }
        }
    }
});
