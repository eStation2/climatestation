
Ext.define("climatestation.view.impact.impactMain",{
    extend: "Ext.tab.Panel",
    controller: "impact-impactmain",
    viewModel: {
        type: "impact-impactmain"
    },

    xtype  : 'impact-main',

    requires: [
        'Ext.data.StoreManager',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.Card',
        'Ext.util.DelayedTask',
        'Ext.ux.TabReorderer',
        'climatestation.Utils',
        'climatestation.view.impact.impactMainController',
        'climatestation.view.impact.impactMainModel'
    ],

    id: 'impactmain',
    name: 'impactmain',
    reference: 'impactmain',

    plugins: ['tabreorderer'],

    layout: {
        type: 'card',
        padding: 0
    },
    frame: false,
    border: false,
    bodyPadding: '1 0 0 0',
    tabPosition: 'top',
    tabBar: {
        padding: 0
    },

    initComponent: function () {
        let me = this;

        me.tbar = [{
            xtype: 'button',
            text: 'Compact the grid',
            handler: function(){
                me.grid.compact();
            }
        }];

        me.gridoptions = {
            column: 8,
            minRow: 1, // don't collapse when empty
            // cellHeight: 70,
            disableOneColumnMode: true,
            float: false,
            alwaysShowResizeHandle: false,
            margin: 5,
            minWidth:'613px',
            minHeight:'415px',
            placeholderClass: 'grid-stack-placeholder', // <- default value
            placeholderText: '',
          // dragIn: '.sidebar .grid-stack-item', // class that can be dragged from outside
          // dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' }, // clone
          // removable: '.trash', // drag-out delete class
          // removeTimeout: 100,
            acceptWidgets: function(el) { return true; } // function example, else can be simple: true | false | '.someClass' value
        };

        // var newMapViewWin = new climatestation.view.analysis.mapView();
        // me.add(newMapViewWin);
        me.griditems = [
            {x: 0, y: 0, width: 2, height: 2, content: '<div id="gridcell_'+me.id+'">adfasd</div>'},
            {x: 3, y: 1, width: 1, height: 2, autoPosition: true},
            {width: 1, height: 2, autoPosition: true, resizeHandles: 's, se, sw, n, ne, nw, e, w'},
            {x: 4, y: 1, width: 1, minWidth: 1, minHeight: 1},
            {x: 2, y: 3, width: 3, maxWidth: 3, id: 'special'},
            {x: 2, y: 5, width: 1, locker: true, noResize: true, noMove: true}
        ];

        // me.listeners = {
        //     afterrender: function(){
        //         me.grid = GridStack.init(me.gridoptions);
        //         me.grid.load(me.griditems);
        //
        //         //debugger;
        //         //let el = Ext.get("map"+me.id);
        //         let el = document.querySelector('div[data-gs-id="special"]')
        //         new Ext.panel.Panel({title:'MAP 1', layout:'fit', width:500, height:400, renderTo:el});
        //         // new climatestation.view.analysis.mapView({renderTo:el});
        //         //newMapViewWin.renderTo
        //     }
        // };

        me.items = [{
            xtype: 'panel',
            title: 'Gridstack test',
            layout: 'fit',
            scrollable: true
            // html: '<div class="grid-stack grid-stack-6"></div>',
            // listeners: {
            //     afterrender: function(){
            //         me.grid = GridStack.initAll(me.gridoptions);
            //         me.grid.load(me.griditems);
            //
            //         //debugger;
            //         //let el = Ext.get("map"+me.id);
            //         let el = document.querySelector('div[data-gs-id="special"]')
            //         el = el.querySelector('div');
            //         //el = el.querySelector('div[class="grid-stack-item-content"]');
            //         new Ext.panel.Panel({title:'MAP 1', layout:'fit', width:500, height:400, renderTo:el});
            //         // new climatestation.view.analysis.mapView({renderTo:el});
            //         //newMapViewWin.renderTo
            //     }
            // }
            // items: [{
            //     xtype: 'container'
            // }]

            // items: [{
            //     xtype: 'dashboard',
            //     reference: 'portal',
            //     stateful: !1,
            //     columnWidths: [0.25, 0.25, 0.25, 0.25],
            //     parts: {
            //         mapView: {
            //             viewTemplate: {
            //                 title: 'Map',
            //                 items: [{
            //                     xtype: 'mapview-window'
            //                 }]
            //             }
            //         },
            //         graphView: {
            //             viewTemplate: {
            //                 title: 'Graph',
            //                 items: [{
            //                     xtype: 'timeserieschart-window'
            //                 }]
            //             }
            //         }
            //     },
            //     defaultContent: [{
            //         type: 'mapView',
            //         columnIndex: 0,
            //         rowIndex: 0,
            //         height: 600
            //     }, {
            //         type: 'graphView',
            //         columnIndex: 1,
            //         rowIndex: 0,
            //         height: 600
            //     }, {
            //         type: 'graphView',
            //         columnIndex: 2,
            //         rowIndex: 0,
            //         height: 600
            //     },{
            //         type: 'mapView',
            //         columnIndex: 0,
            //         rowIndex: 1,
            //         height: 600
            //     },{
            //         type: 'mapView',
            //         columnIndex: 1,
            //         rowIndex: 1,
            //         height: 600
            //     },{
            //         type: 'mapView',
            //         columnIndex: 2,
            //         rowIndex: 1,
            //         height: 600
            //     }]
            // }]
        }];

        me.callParent();
    },
    setColumnWidths: function(arr){
        let i = 0;
        this.items.each(function(item){
            if(item instanceof Ext.resizer.Splitter)
                return; // ignore
            item.columnWidth = arr[i++] || 1;
        });
        this.updateLayout();
    }
});
