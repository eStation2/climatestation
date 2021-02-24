
Ext.define('climatestation.view.acquisition.Acquisition',{
    extend: "Ext.grid.Panel",

    controller: 'acquisition',

    viewModel: {
        type: 'acquisition'
    },

    xtype  : 'acquisition-main',

    requires: [
        'Ext.XTemplate',
        'Ext.button.Split',
        'Ext.data.StoreManager',
        'Ext.grid.column.Action',
        'Ext.grid.column.Template',
        'Ext.grid.column.Widget',
        'Ext.layout.container.Center',
        'Ext.menu.Menu',
        'Ext.window.Toast',
        'climatestation.Utils',
        'climatestation.store.ProductsActiveStore',
        'climatestation.view.acquisition.AcquisitionController',
        'climatestation.view.acquisition.AcquisitionModel',
        'climatestation.view.acquisition.DataAcquisition',
        'climatestation.view.acquisition.Ingestion',
        'climatestation.view.acquisition.logviewer.LogView',
        'climatestation.view.widgets.ServiceMenuButton'
    ],

    name:'acquisitionmain',

    store: 'ProductsActiveStore',

    viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
        draggable:false,
        markDirty: false,
        resizable:false,
        trackOver:true,
        scrollable: true,
        focusable: false,
        loadMask: false
        //focusOnToFront: false,
        //preserveScrollOnRefresh: false,
        //focusRow: Ext.emptyFn
    },

    // selModel: {listeners:{}},
    // selModel: Ext.create('Ext.selection.Model', { listeners: {} }),
    // titleAlign: 'center',

    bufferedRenderer: true,
    scrollable: true,
    collapsible: false,
    suspendLayout: false,
    disableSelection: true,
    enableColumnMove: false,
    enableColumnResize: false,
    multiColumnSort: false,
    columnLines: false,
    rowLines: true,
    frame: false,
    border: false,
    focusable: false,
    margin: '0 0 10 0',    // (top, right, bottom, left).
    session: true,

    layout: 'fit',

    config: {
        forceStoreLoad: false,
        dirtyStore: false
    },

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();

        // Ext.util.Observable.capture(this, function(e){console.log('Acquisition - ' + this.id + ': ' + e);});

        // me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('acquisition') + '</span>');

        me.mon(me, {
            loadstore: function() {
                var productgridstore  = Ext.data.StoreManager.lookup('ProductsActiveStore');
                var acqgridsstore = Ext.data.StoreManager.lookup('DataAcquisitionsStore');
                var ingestiongridstore = Ext.data.StoreManager.lookup('IngestionsStore');
                var eumetcastsourcestore = Ext.data.StoreManager.lookup('EumetcastSourceStore');
                var internetsourcestore = Ext.data.StoreManager.lookup('InternetSourceStore');

                if (me.forceStoreLoad || me.dirtyStore || !productgridstore.isLoaded() || !acqgridsstore.isLoaded() || !ingestiongridstore.isLoaded()) {
                    var myLoadMask = new Ext.LoadMask({
                        msg    : climatestation.Utils.getTranslation('loading'), // 'Loading...',
                        target : me
                    });
                    myLoadMask.show();

                    me.getView().getFeature('productcategories').collapseAll();
                    if (productgridstore.isStore) {
                        productgridstore.load({
                            callback: function(records, options, success) {
                                if (acqgridsstore.isStore) {
                                    acqgridsstore.load({
                                        callback: function(records, options, success) {
                                            if (ingestiongridstore.isStore) {
                                                ingestiongridstore.proxy.extraParams = {force: true};
                                                ingestiongridstore.load({
                                                    callback: function(records, options, success){
                                                        myLoadMask.hide();
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }

                    eumetcastsourcestore.load();
                    internetsourcestore.load();

                    me.forceStoreLoad = false;
                    me.dirtyStore = false;
                }
                me.getController().checkStatusServices();
            }
        });

        me.listeners = {
            groupcollapse: function(view, node, group) {
                me.hideCompletenessTooltip();
            },
            groupexpand: function(view, node, group){
                me.hideCompletenessTooltip();
                me.view.updateLayout();
                var taskRefresh = new Ext.util.DelayedTask(function() {
                    view.refresh();
                    view.updateLayout();
                });
                taskRefresh.delay(200);
            },
            // groupclick: function(view, node, group) {
            //     var dataacquisitiongrids = Ext.ComponentQuery.query('dataacquisitiongrid');
            //     var ingestiongrids = Ext.ComponentQuery.query('ingestiongrid');
            //     Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
            //        dataacquisitiongrid.updateLayout();
            //     });
            //     Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
            //        ingestiongrid.updateLayout();
            //     });
            //     me.getView().updateLayout();
            // },
            afterrender: function(){
                var scroller = me.view.getScrollable();

                scroller.on('scroll', function(){
                    var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                    Ext.each(completenessTooltips, function(item) {
                       // item.disable();
                       item.hide();
                    });
                }, scroller, {single: false});

                // var lockbtnstate = Ext.getCmp('lockunlock').pressed ? false : true;
                // if (!lockbtnstate){
                //     Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
                //        dataacquisitiongrid.columns[1].show();  // Edit Data Source
                //        dataacquisitiongrid.columns[2].show();  // Store Native
                //        //dataacquisitiongrid.columns[3].hide();
                //        dataacquisitiongrid.updateLayout();
                //     });
                //     Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
                //        ingestiongrid.columns[0].show();    // Add Mapset
                //        ingestiongrid.columns[3].show();    // Delete Mapset
                //        ingestiongrid.updateLayout();
                //     });
                // }
                // else {
                //     Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
                //        dataacquisitiongrid.columns[1].hide();  // Edit Data Source
                //        dataacquisitiongrid.columns[2].hide();  // Store Native
                //        //dataacquisitiongrid.columns[3].hide();
                //        dataacquisitiongrid.updateLayout();
                //     });
                //     Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
                //        ingestiongrid.columns[0].hide();    // Add Mapset
                //        ingestiongrid.columns[3].hide();    // Delete Mapset
                //        ingestiongrid.updateLayout();
                //     });
                // }
            }
        }

        me.features = [{
            id: 'productcategories',
            ftype: 'grouping',
            groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
            hideGroupedHeader: true,
            enableGroupingMenu: false,
            startCollapsed : true,
            groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product categories'
        }];

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            padding: 0,
            items: [{
                xtype: 'button',
                id: 'lockunlock',
                name: 'lockunlock',
                hidden: ((climatestation.Utils.objectExists(user) && user.userlevel < 2) ? false : true),
                iconCls: 'far fa-lock',  // 'fa-unlock' = xf09c  'fa-lock' = xf023
                enableToggle: true,
                scale: 'medium',
                handler:  function(btn) {
                    // Ext.suspendLayouts();
                    //var acq_main = Ext.ComponentQuery.query('panel[name=acquisitionmain]');
                    var dataacquisitiongrids = Ext.ComponentQuery.query('dataacquisitiongrid');
                    var ingestiongrids = Ext.ComponentQuery.query('ingestiongrid');
                    //var addproductbtn = Ext.ComponentQuery.query('panel[name=acquisitionmain] > toolbar > button[name=addproduct]');
                    //var checkColumns = Ext.ComponentQuery.query('panel[name=acquisitionmain] checkcolumn, dataacquisitiongrid checkcolumn, ingestiongrid checkcolumn');
                    //var actionColumns = Ext.ComponentQuery.query('panel[name=acquisitionmain] actioncolumn, dataacquisitiongrid actioncolumn, ingestiongrid actioncolumn');

                    if (btn.pressed){

                        btn.setIconCls('far fa-unlock');
                        Ext.getCmp('productadmin-acquisition-btn').show();
                        me.getView().getFeature('productcategories').collapseAll();

                        me.getColumns()[1].show();    // Activate Product column
                        me.getColumns()[2].setWidth(483);   // GET
                        me.getColumns()[2].setText(' <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable x-column-header-first" style="border-top: 0px; width: 265px; left: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('Source') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 110px; right: auto; left: 201px; margin: 0px; top: 0px;" tabindex="-1">' +
                        //'           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('lastcopied') + '</span>' +
                        //'           </div>' +
                        //'       </div>' +
                        //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 110px; right: auto; left: 311px; margin: 0px; top: 0px;" tabindex="-1">' +
                        //'           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('lastexecuted') + '</span>' +
                        //'           </div>' +
                        //'       </div>' +
                        '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 105px; left: 265px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text smalltext12">' + climatestation.Utils.getTranslation('storenative') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 65px; right: auto; left: 370px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px; left: 435px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                        '           </div>' +
                        '       </div>');

                        me.getColumns()[3].setWidth(712+70);   // INGESTION
                        me.getColumns()[3].setText(' <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 155px; right: auto; left: 0px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproduct') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 180px; right: auto; left: 155px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 380px; right: auto; left: 335px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('completeness') + '</span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 70px; right: auto; left: 715px; margin: 0px; top: 0px;" tabindex="-1">' +
                        '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                        '           </div>' +
                        //'       </div>' +
                        //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px;  left: 695px; margin: 0px; top: 0px;" tabindex="-1">' +
                        //'           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                        //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                        //'           </div>' +
                        '       </div>');

                        Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
                           dataacquisitiongrid.columns[1].show();  // Edit Data Source
                           dataacquisitiongrid.columns[2].show();  // Store Native
                           //dataacquisitiongrid.columns[3].hide();
                           dataacquisitiongrid.updateLayout();
                        });
                        Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
                           ingestiongrid.columns[0].show();    // Add Mapset
                           ingestiongrid.columns[3].show();    // Delete Mapset
                           ingestiongrid.updateLayout();
                        });
                    }
                    else {
                        btn.setIconCls('far fa-lock');
                        Ext.getCmp('productadmin-acquisition-btn').hide();
                        me.getView().getFeature('productcategories').collapseAll();

                        me.getColumns()[1].hide();

                        me.getColumns()[2].setWidth(347);   // GET
                        me.getColumns()[2].setText(' <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable x-column-header-first" style="border-top: 0px; width: 230px; left: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('Source') + '</span>' +
                                '           </div>' +
                                '       </div>' +
                                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 65px; left: 230px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                                '           </div>' +
                                '       </div>' +
                                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px; left: 295px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                                '           </div>' +
                                '       </div>');

                        me.getColumns()[3].setWidth(712);   // INGESTION      CREATES AN ERROR WHEN RESET BACK TO ORIGINAL WIDTH!!!
                        me.getColumns()[3].setText('<div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 120px; right: auto; left: 0px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproduct') + '</span>' +
                                '           </div>' +
                                '       </div>' +
                                '       <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 160px; right: auto; left: 120px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                                '           </div>' +
                                '       </div>' +
                                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 380px; right: auto; left: 280px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('completeness') + '</span>' +
                                '           </div>' +
                                '       </div>' +
                                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 70px; right: auto; left: 660px; margin: 0px; top: 0px;" tabindex="-1">' +
                                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                                '           </div>' +
                                //'       </div>' +
                                //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px;  left: 695px; margin: 0px; top: 0px;" tabindex="-1">' +
                                //'           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                                //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                                //'           </div>' +
                                '       </div>');

                        Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
                           dataacquisitiongrid.columns[1].hide();  // Edit Data Source
                           dataacquisitiongrid.columns[2].hide();  // Store Native
                           //dataacquisitiongrid.columns[3].hide();
                           dataacquisitiongrid.updateLayout();
                        });
                        Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
                           ingestiongrid.columns[0].hide();    // Add Mapset
                           ingestiongrid.columns[3].hide();    // Delete Mapset
                           ingestiongrid.updateLayout();
                        });
                    }
                    me.getView().updateLayout();

                    // me.forceStoreLoad = true;
                    // me.fireEvent('loadstore');
                    //me.getController().renderHiddenColumnsWhenUnlocked();
                    //
                    // Ext.resumeLayouts(true);
                    // acq_main.updateLayout();
                    //var toggleFn = newValue ? 'disable' : 'enable';
                    //Ext.each(this.query('button'), function(item) {
                    //    item[toggleFn]();
                    //});
                }
            }, ' ', {
                tooltip:  climatestation.Utils.getTranslation('expandall'),    // 'Expand All',
                iconCls: 'far fa-blinds-open',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    //Ext.suspendLayouts();
                    view.getFeature('productcategories').expandAll();
                    //Ext.resumeLayouts(true);
                    //me.getController().renderHiddenColumnsWhenUnlocked();
                    //view.refresh();
                    //view.updateLayout();
                }
            }, {
                tooltip:  climatestation.Utils.getTranslation('collapseall'),    // 'Collapse All',
                iconCls: 'far fa-blinds-raised',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    view.getFeature('productcategories').collapseAll();
                }
            }, {
                xtype: 'tbfill'
            }, {
                xtype: 'button',
                text: climatestation.Utils.getTranslation('PRODUCTS'),    // 'PRODUCTS',
                id: 'productadmin-acquisition-btn',
                name: 'productadmin-acquisition-btn',
                iconCls: 'far fa-cog',
                style: { color: 'gray' },
                hidden: true,
                scale: 'medium',
                handler: 'openProductAdmin'
            }, '->',
            {
                xtype: 'servicemenubutton',
                service: 'eumetcast',
                text:  climatestation.Utils.getTranslation('eumetcast'),    // 'Eumetcast',
                handler: 'checkStatusServices'
            },
            // add a vertical separator bar between toolbar items
            '-', // same as {xtype: 'tbseparator'} to create Ext.toolbar.Separator
            {
                xtype: 'servicemenubutton',
                service: 'internet',
                text: climatestation.Utils.getTranslation('internet'),    // 'Internet',
                handler: 'checkStatusServices'
            },
            '-',
            {
                xtype: 'servicemenubutton',
                service: 'ingest',
                text: climatestation.Utils.getTranslation('ingest'),    // 'Ingest',
                handler: 'checkStatusServices'
            },
            {
                xtype: 'checkboxfield',
                boxLabel  : climatestation.Utils.getTranslation('ingest_archives_from_eumetcast'),    // 'Ingest Archives from EUMETCast',
                name      : 'ingest_archives_from_eumetcast',
                inputValue: '1',
                id        : 'ingest_archives_from_eumetcast',
                //listeners: {
                //    boxclick: 'setIngestArchivesFromEumetcast'
                //}
                handler: 'setIngestArchivesFromEumetcast'
            },
            '->', // same as { xtype: 'tbfill' }
            {
                xtype: 'button',
                iconCls: 'far fa-redo-alt',
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                handler:  function(btn) {
                    // var productgridstore  = Ext.data.StoreManager.lookup('ProductsActiveStore');
                    // var acqgridsstore = Ext.data.StoreManager.lookup('DataAcquisitionsStore');
                    // var ingestiongridstore = Ext.data.StoreManager.lookup('IngestionsStore');
                    // var eumetcastsourcestore = Ext.data.StoreManager.lookup('EumetcastSourceStore');
                    // var internetsourcestore = Ext.data.StoreManager.lookup('InternetSourceStore');
                    //var view = btn.up().up().getView();
                    var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');

                    Ext.each(completenessTooltips, function(item) {
                        item.hide();
                    });

                    me.forceStoreLoad = true;
                    me.fireEvent('loadstore');

                    // var myLoadMask = new Ext.LoadMask({
                    //     msg    : climatestation.Utils.getTranslation('loading'), // 'Loading...',
                    //     target : me
                    // });
                    // myLoadMask.show();
                    //
                    // me.getView().getFeature('productcategories').collapseAll();
                    // if (productgridstore.isStore) {
                    //     //Ext.suspendLayouts();
                    //     productgridstore.load({
                    //         callback: function(records, options, success) {
                    //             if (acqgridsstore.isStore) {
                    //                 acqgridsstore.load({
                    //                     callback: function(records, options, success) {
                    //                         //me.getController().renderHiddenColumnsWhenUnlocked();
                    //
                    //                         if (ingestiongridstore.isStore) {
                    //                             ingestiongridstore.proxy.extraParams = {force: true};
                    //                             ingestiongridstore.load({
                    //                                 callback: function(records, options, success){
                    //                                     myLoadMask.hide();
                    //
                    //                                     //Ext.resumeLayouts(true);
                    //                                     //var view = btn.up().up().getView();
                    //                                     ////view.getFeature('productcategories').expandAll();
                    //                                     //view.refresh();
                    //                                 }
                    //                             });
                    //                         }
                    //                     }
                    //                 });
                    //             }
                    //         }
                    //     });
                    // }
                    //
                    // //Ext.resumeLayouts(true);
                    //
                    // eumetcastsourcestore.load();
                    // internetsourcestore.load();

                    // me.getController().checkStatusServices();
                    //me.getController().renderHiddenColumnsWhenUnlocked();
                }
            }]
        });

        me.defaults = {
            menuDisabled: true,
            sortable: false,
            groupable:false,
            draggable:false,
            hideable: false,
            stopSelection: true
        };

        me.columns = [
        {
            text: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('productcategories') + '</div>',
            menuDisabled: true,
            defaults: {
                menuDisabled: true,
                sortable: false,
                groupable:false,
                draggable:false,
                hideable: false,
                stopSelection: true
            },
            columns: [{
                xtype:'templatecolumn',
                text: climatestation.Utils.getTranslation('product'),   // 'Product',
                tpl: new Ext.XTemplate(
                        '<b>{prod_descriptive_name}</b>' +
                        '<tpl if="version != \'undefined\'">',
                            '<b class="smalltext"> - {version}</b>',
                        '</tpl>',
                        '</br>' +
                        '<b class="smalltext" style="color:darkgrey;">'+climatestation.Utils.getTranslation('productcode')+': {productcode}</b>' +
                        '</br>' +
                        '<b class="smalltext" style="color:darkgrey;">'+climatestation.Utils.getTranslation('provider')+': {provider}</b>' +
                        '</br>'
                    ),
                width: 280,
                cellWrap:true,
                variableRowHeight:false
            },{
                xtype: 'actioncolumn',
                text: climatestation.Utils.getTranslation('active'),   // 'Active',
                hideable: true,
                hidden: Ext.getCmp('lockunlock').pressed ? false : true,
                width: 65,
                align: 'center',
                shrinkWrap: 0,
                items: [{
                    getClass: function(v, meta, rec) {
                        if (rec.get('activated')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('activated')) {
                            return climatestation.Utils.getTranslation('deactivateproduct');   // 'Deactivate Product';
                        } else {
                            return climatestation.Utils.getTranslation('activateproduct');   // 'Activate Product';
                        }
                    },
                    // isActionDisabled: function(view, rowIndex, colIndex, item, record) {
                    //     // Returns true if 'editable' is false (, null, or undefined)
                    //     return false // !record.get('editable');
                    // },
                    handler: function(grid, rowIndex, colIndex, icon, e, record) {
                        var rec = record;
                        // var action = (rec.get('activated') ? 'deactivated' : 'activated');
                        // Ext.toast({ html: action + ' ' + rec.get('productcode'), title: 'Action', width: 300, align: 't' });
                        rec.get('activated') ? rec.set('activated', false) : rec.set('activated', true);

                        // Ext.data.StoreManager.lookup('ProductsInactiveStore').reload();
                        // me.getController().renderHiddenColumnsWhenUnlocked();
                    }
                }]
            }]
        }, {
            text:  '<div class="grid-header-style">' + climatestation.Utils.getTranslation('get') + '</div>',
            id:'acquisitioncolumn',
            menuDisabled: true,
            defaults: {
                menuDisabled: true,
                sortable: false,
                groupable:false,
                draggable:false,
                hideable: false,
                stopSelection: true
            },
            columns: [{
                xtype: 'widgetcolumn',
                width: Ext.getCmp('lockunlock').pressed ? 483 : 347,
                variableRowHeight:false,
                text:
                // 'x-column-header x-column-header-align-start x-group-sub-header x-box-item x-column-header-default x-unselectable x-column-header-first x-column-header-sort-DESC',
                    // ' <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable x-column-header-first" style="border-top: 0px; width: 230px; left: 0px;" tabindex="-1">' +
                    ' <div class="x-column-header x-column-header-align-start x-group-sub-header x-box-item x-column-header-default x-unselectable x-column-header-first " style="border-top: 0px; width: 230px; left: 0px;" tabindex="-1">' +
                    '       <div data-ref="titleEl" class="x-column-header-inner x-leaf-column-header x-unselectable">' +
                    '           <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('Source') + '</span>' +
                    '       </div>' +
                    ' </div>' +
                    ' <div class="x-column-header x-column-header-align-start x-group-sub-header x-box-item x-column-header-default x-unselectable x-column-header-first " style="border-top: 0px; width: 65px; left: 230px; margin: 0px; top: 0px;" tabindex="-1">' +
                    '     <div data-ref="titleEl" class="x-column-header-inner x-leaf-column-header x-unselectable">' +
                    '         <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                    '     </div>' +
                    ' </div>' +
                    ' <div class="x-column-header x-column-header-align-start x-group-sub-header x-box-item x-column-header-default x-unselectable x-column-header-first " style="border-top: 0px; border-right: 0px; width: 70px; left: 295px; margin: 0px; top: 0px;" tabindex="-1">' +
                    '     <div data-ref="titleEl" class="x-column-header-inner x-leaf-column-header x-unselectable">' +
                    '         <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                    '     </div>' +
                    ' </div>',

                // listeners: {
                //     render: function(column){
                //         //column.titleEl.removeCls('x-column-header-inner x-unselectable');
                //     }
                // },
                widget: {
                    xtype: 'dataacquisitiongrid',
                    widgetattached: false
                },
                onWidgetAttach: function(col, widget, record) {
                    //console.info(widget.lookupViewModel());
                    var daStore = widget.getViewModel().get('productdatasources');
                    //Ext.suspendLayouts();
                    // if (!widget.widgetattached) {
                        //if (daStore.getFilters().items.length == 0) {
                        daStore.setFilters({
                            property: 'productid'
                            , value: record.id
                            , anyMatch: true
                        });
                        //Ext.resumeLayouts(true);
                        //}
                        widget.widgetattached = true;
                    // }
                }
            }]
        }, {
            text:  '<div class="grid-header-style">' + climatestation.Utils.getTranslation('ingestion') + '</div>',
            menuDisabled: true,
            defaults: {
                menuDisabled: true,
                sortable: false,
                groupable:false,
                draggable:false,
                hideable: false,
                stopSelection: true
            }
            ,columns: [{
                xtype: 'widgetcolumn',
                width: Ext.getCmp('lockunlock').pressed ? 712+70 : 712,
                bodyPadding: 5,

                text:
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 120px; right: auto; left: 0px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproduct') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 160px; left: 120px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 380px; right: auto; left: 280px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('completeness') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 70px; right: auto; left: 660px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                '           </div>' +
                //'       </div>' +
                //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px;  left: 695px; margin: 0px; top: 0px;" tabindex="-1">' +
                //'           <div data-ref="titleEl" class="x-column-header-inner x-unselectable">' +
                //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('log') + '</span>' +
                //'           </div>' +
                '       </div>',
                // listeners: {
                //     render: function(column){
                //         //column.titleEl.removeCls('x-column-header-inner x-unselectable');
                //     }
                // },
                widget: {
                    xtype: 'ingestiongrid',
                    widgetattached: false
                },
                onWidgetAttach: function(col, widget, record) {
                    var daStore = widget.getViewModel().get('productingestions');
                    // Ext.suspendLayouts();
                    // if (!widget.widgetattached) {
                        //if (daStore.getFilters().items.length == 0) {
                        daStore.setFilters({
                            property: 'productid'
                            , value: record.id
                            , anyMatch: true
                        });
                        //Ext.resumeLayouts(true);
                        //}
                        widget.widgetattached = true;
                    // }
                    // Ext.resumeLayouts(true);
                }
            }]
        },{
            xtype: 'actioncolumn',
            text: climatestation.Utils.getTranslation('log'),    // 'Log',
            width: 70,
            menuDisabled: true,
            align:'center',
            stopSelection: true,
            items: [{
                iconCls:'log-icon',
                width:32,
                height:32,
                tooltip: climatestation.Utils.getTranslation('showingestionlog'),     // 'Show log of this Ingestion',
                scope: me,
                handler: function (grid, rowIndex, colIndex, icon, e, record) {
                    var logViewWin = new climatestation.view.acquisition.logviewer.LogView({
                        params: {
                            logtype: 'ingest',
                            record: record
                        }
                    });
                    logViewWin.show();
                }
            }]
        }];

        me.callParent();
    }
    ,hideCompletenessTooltip: function(){
        // Hide the visible completness tooltips
        var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
        Ext.each(completenessTooltips, function(item) {
           item.hide();
        });
    }
});