
Ext.define("climatestation.view.datamanagement.MapSetDataSet",{
    extend: "Ext.grid.Panel",

    controller: "datamanagement-mapsetdataset",

    viewModel: {
       type: "datamanagement-mapsetdataset"
    },

    "xtype"  : 'mapsetdatasetgrid',

    requires: [
        'Ext.grid.column.Action',
        'climatestation.Utils',
        'climatestation.model.MapSetDataSet',
        'climatestation.view.datamanagement.MapSetDataSetController',
        'climatestation.view.datamanagement.MapSetDataSetModel',
        'climatestation.view.datamanagement.sendRequest'
    ],

    store : {
        model: 'climatestation.model.MapSetDataSet'
        ,sorters: [{property: 'display_index', direction: 'ASC'}]
    },

    hideHeaders: true,
    columnLines: false,
    rowLines:false,
    scrollToTop: false,
    alwaysOnTop: true,
    focusOnToFront: false,
    scrollable: 'y',

    margin: '0 0 10 0',

    initComponent: function () {
        var me = this;

        me.viewConfig = {
            stripeRows: false,
            enableTextSelection: true,
            draggable: false,
            markDirty: false,
            resizable: false,
            disableSelection: true,
            trackOver: false,
            preserveScrollOnRefresh: true,
            preserveScrollOnReload: true,
            focusable: true,
            forceFit: true,
            listeners: {
                render: function (view) {
                    // console.info(view);
                    view.tooltip = Ext.create('Ext.tip.ToolTip', {
                        id: view.getId() + '_completness_tooltip',
                        // The overall target element.
                        target: view.getEl(),
                        // triggerElement: view.getEl(),
                        // Each grid row causes its own seperate show and hide.
                        delegate: view.itemSelector,
                        // Render immediately so that tip.body can be referenced prior to the first show.
                        // renderTo: Ext.getBody(),
                        maxHeight: 350,
                        scrollable: true,
                        // autoRender: true,
                        hidden: false,
                        disabled: false,
                        trackMouse: true,
                        // mouseOffset: [-5, 0],
                        autoHide: true,
                        showDelay: 500,
                        hideDelay: 1000,
                        // dismissDelay: 5000, // auto hide after 5 seconds
                        closable: true,
                        anchorToTarget: false,
                        // anchor: 'left',
                        padding: 5,
                        listeners: {
                            close: function (tip) {
                                // tip.disable();
                                tip.hide();
                            },
                            // Change content dynamically depending on which element triggered the show.
                            beforeshow: function (tip) {
                                // console.info(tip.triggerElement);
                                if (climatestation.Utils.objectExists(tip.triggerElement)) {
                                    var datasetinterval = '',
                                        datasetForTipText,
                                        tooltipintervals,
                                        mapsetdatasetrecord = view.getRecord(tip.triggerElement);   // view.dataSource.getData().items[0],   //  view.dataSource.data.items[0], //

                                    if (climatestation.Utils.objectExists(mapsetdatasetrecord)){
                                        var completeness = mapsetdatasetrecord.get('datasetcompleteness');

                                        var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                                        Ext.each(completenessTooltips, function (item) {
                                            // item.disable();
                                            if (item != tip) {
                                                item.hide();
                                            }
                                        });

                                        datasetForTipText = '<b>' + climatestation.Utils.getTranslation('dataset_intervals_for') + ':</br>' +
                                            mapsetdatasetrecord.get('productcode') + ' - ' +
                                            mapsetdatasetrecord.get('version') + ' - ' +
                                            (mapsetdatasetrecord.get('mapset_descriptive_name') || mapsetdatasetrecord.get('mapsetname')) + ' - ' +
                                            mapsetdatasetrecord.get('subproductcode') + '</b></br></br>';

                                        tooltipintervals = datasetForTipText;
                                        if (mapsetdatasetrecord.get('frequency_id') == 'singlefile' && completeness.totfiles == 1 && completeness.missingfiles == 0) {
                                            datasetinterval = '<span style="color:#BDF65E"><b>' + climatestation.Utils.getTranslation('singlefile') + '</b></span>';
                                            tooltipintervals += datasetinterval;
                                        }
                                        else if (completeness.totfiles < 2 && completeness.missingfiles < 2) {
                                            datasetinterval = '<span style="color:#ffffff"><b>' + climatestation.Utils.getTranslation('notanydata') + '</b></span>';
                                            tooltipintervals += datasetinterval;
                                        }
                                        else {
                                            completeness.intervals.forEach(function (interval) {
                                                var color, intervaltype = '';
                                                if (interval.intervaltype == 'present') {
                                                    color = '#BDF65E'; // green
                                                    intervaltype = climatestation.Utils.getTranslation('present');
                                                }
                                                if (interval.intervaltype == 'missing') {
                                                    color = '#F34242'; // red
                                                    intervaltype = climatestation.Utils.getTranslation('missing');
                                                }
                                                if (interval.intervaltype == 'permanent-missing') {
                                                    color = '#ffffff'; // gray
                                                    intervaltype = climatestation.Utils.getTranslation('permanent-missing');
                                                }
                                                datasetinterval = '<span style="color:' + color + '"><b>' + climatestation.Utils.getTranslation('from') + ' ' + interval.fromdate + ' ' + climatestation.Utils.getTranslation('to') + ' ' + interval.todate + ' - ' + intervaltype + '</b></span></br>';
                                                tooltipintervals += datasetinterval;
                                            });
                                        }

                                        tip.update(tooltipintervals);
                                    }

                                }

                                // tip.on('show', function(){
                                //     Ext.defer(tip.hide, 20000, tip);
                                // }, tip, {single: true});
                            }
                        }
                    });
                    // Ext.util.Observable.capture(view, function(e){console.log(view.id + ': ' + e);});
                }
            }
        };

        me.listeners = {
            rowmousedown: function(view, record, element, rowIndex, e, eOpts){
                var widgettooltip = Ext.getCmp(view.getId() + '_completness_tooltip');
                var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                Ext.each(completenessTooltips, function(item) {
                    if (item != widgettooltip){
                        item.hide();
                    }
                });
                if (climatestation.Utils.objectExists(widgettooltip)){
                    widgettooltip.trackMouse = false;
                }

            },
            // scrolltoselection: function (view) {
            //     console.info('scrolltoselection');
            //
            //     var record = view.getSelection();
            //     console.info(record);
            //     if (record.length > 0)
            //         view.ensureVisible(record[0], {focus: true});
            // },
            itemmouseenter: function(view, record, el, rowidx){
                var widgettooltip = Ext.getCmp(view.getId() + '_completness_tooltip');
                widgettooltip.trackMouse = true;
                if (widgettooltip.disabled){
                    widgettooltip.enable();
                }
            }
            // ,itemmouseleave: function(view){
            //     // console.info('itemmouseleave');
            //     var widgettooltip = Ext.getCmp(view.getId() + '_completness_tooltip');
            //     if (!widgettooltip.disabled && widgettooltip.trackMouse){
            //         widgettooltip.disable();
            //     }
            // }
        };

        me.defaults = {
            menuDisabled: true,
            draggable:false,
            groupable:false,
            hideable: false,
            variableRowHeight: true
        };

        me.columns = [{
            // header: '', // 'Sub Product Code',
            // dataIndex: 'subproductcode',
            xtype:'templatecolumn',
            header: '', // 'Productcode',
            tpl: new Ext.XTemplate(
                '<b>{descriptive_name}</b>' +
                '</br>' +
                '<b class="smalltext"style="color:darkgrey;">{productcode}</b>' +
                '<tpl if="version != \'undefined\'">',
                '<b class="smalltext" style="color:darkgrey;"> - {version} </b>',
                '</tpl>',
                '<b class="smalltext"style="color:darkgrey;"> - {subproductcode}</b>'
                // '<BR>(display_index: <b style="color:black">{display_index}</b>)'
            ),

            width: 250,
            cellWrap:true
        }, {
            // header: '', // 'Status',
            width: 450,
            xtype: 'templatecolumn',
            // dataIndex: 'datasetcompletenessimage',
            tpl: new Ext.XTemplate(
                    '<img style="cursor: pointer;" src="{datasetcompletenessimage}" />'
                )
            ,listeners: {
                click: function(view){
                    var widgettooltip = Ext.getCmp(view.getId() + '_completness_tooltip');
                    var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                    Ext.each(completenessTooltips, function(item) {
                       // item.disable();
                        if (item != widgettooltip){
                            item.hide();
                        }
                    });
                    if (climatestation.Utils.objectExists(widgettooltip)){
                        widgettooltip.trackMouse = false;
                        // widgettooltip.enable();
                        // widgettooltip.show();
                    }
                }
            }
        },{
            xtype: 'actioncolumn',
            width: 65,
            align:'center',
            stopSelection: false,
            items: [{
                // icon: 'resources/img/icons/download.png',
                iconCls: 'far fa-download',
                tooltip: climatestation.Utils.getTranslation('tipcompletedataset'),    // 'Complete data set',
                scope: me,
                handler: function (grid, rowIndex) {
                        var rec = grid.getStore().getAt(rowIndex);

                        var sendRequestWin = new climatestation.view.datamanagement.sendRequest({
                            params: {
                                level: 'dataset',
                                record: rec
                            }
                        });
                        sendRequestWin.show();
                }
            }]
        }];

        me.callParent();
    }
});