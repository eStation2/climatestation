Ext.define('climatestation.view.analysis.timeseriesChartSelectionController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.analysis-timeserieschartselection',

    requires: [
        'climatestation.Utils',
        'climatestation.view.analysis.timeseriesChartView'
    ],
    getTimeseriesSelections: function(graphtype){
        var me = this.getView(),
            wkt_polygon = me.lookupReference('wkt_polygon'),
            timeseriesselections = null;

        if (wkt_polygon.getValue().trim() == '') {
            Ext.Msg.show({
               title: climatestation.Utils.getTranslation('selectapolygon'),    // 'Select a polygon!',
               msg: climatestation.Utils.getTranslation('pleaseselectapolygon'),    // 'Please select or draw a polygon in a MapView!',
               width: 300,
               buttons: Ext.Msg.OK,
               animEl: '',
               icon: Ext.Msg.WARNING
            });
            return timeseriesselections;
        }

        // console.info(me.lookupReference('timeseriesproductselection_'+graphtype));
        timeseriesselections = me.lookupReference('timeseriesproductselection_'+graphtype).getController().getSelections();
        // console.info(timeseriesselections);
        if (timeseriesselections != null ){
            timeseriesselections.wkt_geom = wkt_polygon.getValue();
            timeseriesselections.selectedregionname = me.lookupReference('selectedregionname').getValue();
        }

        return timeseriesselections
    }

    ,generateTimeseriesChart: function(btn){
        var me = this.getView();
        var TSChartWinConfig = this.getTimeseriesSelections(btn.graphtype);
        if (TSChartWinConfig != null){
            TSChartWinConfig.workspace = me.workspace;
            var newTSChartWin = new climatestation.view.analysis.timeseriesChartView(TSChartWinConfig);

            me.workspace.add(newTSChartWin);
            // Ext.getCmp('analysismain').add(newTSChartWin);
            newTSChartWin.show();
        }
    }
});
