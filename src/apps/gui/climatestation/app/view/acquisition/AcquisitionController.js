Ext.define('climatestation.view.acquisition.AcquisitionController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.acquisition',

    requires: [
        'climatestation.Utils',
        'climatestation.view.acquisition.product.ProductAdmin',
        'climatestation.view.acquisition.product.editProduct',
        'climatestation.view.acquisition.product.selectProduct'
    ],


    checkStatusServices: function(){
        var me = this.getView();

        // AJAX call to check the status of all 3 services
        Ext.Ajax.request({
            method: 'POST',
            url: 'services/checkstatusall',
            success: function(response, opts){
                let services = Ext.JSON.decode(response.responseText);
                let eumetcastbtn = me.down('button[name=eumetcastbtn]');
                let internetbtn = me.down('button[name=internetbtn]');
                let ingestbtn = me.down('button[name=ingestbtn]');

                if (services.eumetcast){
                    // eumetcastbtn.setStyle('color','green');
                    eumetcastbtn.setIconCls('green');
                    eumetcastbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    eumetcastbtn.down('menuitem[name=runeumetcast]').setDisabled(true);
                    eumetcastbtn.down('menuitem[name=stopeumetcast]').setDisabled(false);
                    eumetcastbtn.down('menuitem[name=restarteumetcast]').setDisabled(false);
                } else {
                    // eumetcastbtn.setStyle('color','red');
                    eumetcastbtn.setIconCls('red');
                    eumetcastbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    eumetcastbtn.down('menuitem[name=runeumetcast]').setDisabled(false);
                    eumetcastbtn.down('menuitem[name=stopeumetcast]').setDisabled(true);
                    eumetcastbtn.down('menuitem[name=restarteumetcast]').setDisabled(true);
                }
                if (services.internet){
                    // internetbtn.setStyle('color','green');
                    internetbtn.setIconCls('green');
                    internetbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    internetbtn.down('menuitem[name=runinternet]').setDisabled(true);
                    internetbtn.down('menuitem[name=stopinternet]').setDisabled(false);
                    internetbtn.down('menuitem[name=restartinternet]').setDisabled(false);
                } else {
                    // internetbtn.setStyle('color','red');
                    internetbtn.setIconCls('red');
                    internetbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    internetbtn.down('menuitem[name=runinternet]').setDisabled(false);
                    internetbtn.down('menuitem[name=stopinternet]').setDisabled(true);
                    internetbtn.down('menuitem[name=restartinternet]').setDisabled(true);
                }
                if (services.ingest){
                    // ingestbtn.setStyle('color','green');
                    ingestbtn.setIconCls('green');
                    ingestbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    ingestbtn.down('menuitem[name=runingest]').setDisabled(true);
                    ingestbtn.down('menuitem[name=stopingest]').setDisabled(false);
                    ingestbtn.down('menuitem[name=restartingest]').setDisabled(false);
                } else {
                    // ingestbtn.setStyle('color','red');
                    ingestbtn.setIconCls('red');
                    ingestbtn.setGlyph("xf013@'Font Awesome 5 Free'");
                    ingestbtn.down('menuitem[name=runingest]').setDisabled(false);
                    ingestbtn.down('menuitem[name=stopingest]').setDisabled(true);
                    ingestbtn.down('menuitem[name=restartingest]').setDisabled(true);
                }
                var ingestarchives_chkbox = Ext.getCmp('ingest_archives_from_eumetcast');
                //console.info(ingestarchives_chkbox);
                //ingestarchives_chkbox.suspendEvents(false);
                ingestarchives_chkbox.setRawValue(services.ingest_archive_eum);
                //ingestarchives_chkbox.resumeEvents();
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },


    setIngestArchivesFromEumetcast: function(chkbox, ev){

        // AJAX call to run/start a specified service (specified through the menuitem name).
        Ext.Ajax.request({
            method: 'GET',
            url: 'acquisition/setingestarchives',
            params: {
                setingestarchives: chkbox.value
            },
            success: function(response, opts){
                var result = Ext.JSON.decode(response.responseText);
                var message = climatestation.Utils.getTranslation('turnedoff');     // 'turned off'
                if (chkbox.value) {
                    message = climatestation.Utils.getTranslation('turnedon');  // 'turned on'
                }
                if (result.success){
                    Ext.toast({ html: climatestation.Utils.getTranslation('ingest_archives_from_eumetcast') + ' ' + message, title: climatestation.Utils.getTranslation('ingest_archives_from_eumetcast'), width: 350, align: 't' });
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    }


    // ,selectProduct: function(btn, event) {
    //     var selectProductWin = new climatestation.view.acquisition.product.selectProduct();
    //     // selectProductWin.down('grid').getStore().load();
    //     selectProductWin.show();
    // }

    ,openProductAdmin: function(btn, event) {
        var ProductAdminWin = new climatestation.view.acquisition.product.ProductAdmin();
        // selectProductWin.down('grid').getStore().load();
        ProductAdminWin.show();
    }

    ,editProduct: function(grid, rowIndex, row){
        var record = grid.getStore().getAt(rowIndex);
        if (record.get('defined_by') != 'JRC') {
            var editProductWin = new climatestation.view.acquisition.product.editProduct({
                params: {
                    edit: true,
                    product: record,
                    orig_productcode: record.get('productcode'),
                    orig_version: record.get('version')
                }
            });
            editProductWin.show();
        }
    }


    //,renderHiddenColumnsWhenUnlocked: function(){
        //var dataacquisitiongrids = Ext.ComponentQuery.query('dataacquisitiongrid');
        //var ingestiongrids = Ext.ComponentQuery.query('ingestiongrid');
        //
        //if (Ext.getCmp('lockunlock').pressed) {
        //    //console.info('unlock status: ' + Ext.getCmp('lockunlock').pressed);
        //
        //    Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
        //        dataacquisitiongrid.columns[1].show();      // Edit Data Source
        //        //dataacquisitiongrid.columns[1].updateLayout();
        //        dataacquisitiongrid.columns[2].show();      // Store Native
        //        //dataacquisitiongrid.columns[2].updateLayout();
        //        //dataacquisitiongrid.columns[2].show();   // Last executed
        //        //dataacquisitiongrid.columns[3].show();   // Store Native
        //        //dataacquisitiongrid.updateLayout();
        //    });
        //
        //    Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
        //        ingestiongrid.columns[0].show();    // Add Mapset
        //        //ingestiongrid.columns[0].updateLayout();
        //        ingestiongrid.columns[3].show();    // Delete Mapset
        //        //ingestiongrid.columns[3].updateLayout();
        //        //ingestiongrid.updateLayout();
        //    });
        //}
        //else {
        //    Ext.Object.each(dataacquisitiongrids, function(id, dataacquisitiongrid, myself) {
        //        dataacquisitiongrid.columns[1].hide();  // Edit Data Source
        //        dataacquisitiongrid.columns[2].hide();  // Store Native
        //        //dataacquisitiongrid.columns[3].hide();
        //        //dataacquisitiongrid.updateLayout();
        //    });
        //    Ext.Object.each(ingestiongrids, function(id, ingestiongrid, myself) {
        //        ingestiongrid.columns[0].hide();    // Add Mapset
        //        ingestiongrid.columns[3].hide();    // Delete Mapset
        //        //ingestiongrid.updateLayout();
        //    });
        //}
    //}
    //
    //
    //,onAddClick: function(){
    //
    //    win = Ext.create('climatestation.view.acquisition.product.editProduct', {
    //        product : "",
    //        module: true
    //    });
    //
    //    win.show();
    //
    //    if (!win) {
    //        win = Ext.create('climatestation.view.acquisition.product.editProduct', {
    //            product : "",
    //            module: true
    //        });
    //    }
    //
    //    if (win.isVisible()) {
    //        win.hide(me, function() {
    //
    //        });
    //    } else {
    //        win.show(me, function() {
    //
    //        });
    //    }
    //
    //    // Create a model instance
    //    var rec = new climatestation.model.ProductAcquisition({
    //        productcode: 'newproductcode',
    //        version: 'undefined',
    //        activated: false,
    //        category_id: 'fire',
    //        descriptive_name: false,
    //        order_index:1
    //    });
    //
    //    me.getStore().insert(0, rec);
    //    me.cellEditing.startEditByPosition({
    //        row: 0,
    //        column: 0
    //    });
    //}

});
