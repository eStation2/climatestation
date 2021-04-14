Ext.define('climatestation.view.acquisition.product.editProductController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-product-editproduct',

    requires: [
        'Ext.data.StoreManager',
        'climatestation.Utils',
        'climatestation.model.IngestSubProduct',
        'climatestation.view.acquisition.editEumetcastSource',
        'climatestation.view.acquisition.editInternetSource',
        'climatestation.view.acquisition.product.EumetcastSourceAdmin',
        'climatestation.view.acquisition.product.InternetSourceAdmin',
        'climatestation.view.acquisition.product.editIngestSubProduct'
    ],

    setup: function() {
        let me = this.getView();
        let user = climatestation.getUser();

        let productDatasourcesStore = me.getViewModel().get('productdatasources');
        let ingestsubproductsStore = me.getViewModel().get('ingestsubproducts');

        if (me.params.edit){
            me.lookupReference('category').setValue(me.params.product.get('category_id'));
            me.lookupReference('productcode').setValue(me.params.product.get('productcode'));
            me.lookupReference('version').setValue(me.params.product.get('version'));
            me.lookupReference('provider').setValue(me.params.product.get('provider'));
            me.lookupReference('product_name').setValue(me.params.product.get('prod_descriptive_name'));
            me.lookupReference('productdescription').setValue(me.params.product.get('description'));
            me.lookupReference('defined_by_field').setValue(me.params.product.get('defined_by'));
            me.lookupReference('activate_product_field').setValue(me.params.product.get('activated'));

            productDatasourcesStore.setFilters({
                 property:'productid'
                ,value:me.params.product.get('productid')
                ,anyMatch: true
            });

            ingestsubproductsStore.setFilters({
                 property: 'productid'
                ,value: me.params.product.get('productid')
                ,anyMatch: true

            //     property: 'productcode'
            //     ,value: me.params.product.get('productcode')
            //     ,anyMatch: true
            // },{
            //     property: 'version'
            //     ,value: me.params.product.get('version')
            //     ,anyMatch: true
            });

            me.lookupReference('datasourcesfieldset').show();
            me.lookupReference('ingestionsfieldset').show();

            // console.info(ingestsubproductsStore);
            // console.info(me.params.product.get('productid'));
        }
        else {
            if (climatestation.Utils.objectExists(user) && user.userlevel == 1){
                me.lookupReference('defined_by_field').setValue('JRC');
            }
            else {
                me.lookupReference('defined_by_field').setValue('USER');
            }

            productDatasourcesStore.setFilters({
                 property:'productid'
                ,value:' '
                //,anyMatch:true
            });

            ingestsubproductsStore.setFilters({
                 property:'productid'
                ,value:' '
                //,anyMatch:true
            });
        }

    },

    addDataSource: function(widget, event) {
        let me = this.getView();

        let selectdatasourcetypeWin = Ext.create('Ext.window.Window', {
            title: climatestation.Utils.getTranslation('datasourcetype'),   // 'Data Source Type',
            id: 'selectdatasourcetypeWin',
            titleAlign: 'center',
            modal: true,
            closable: true,
            closeAction: 'destroy', // 'hide',
            border: true,
            frame: true,
            width: 200,
            scrollable: false,
            bodyPadding: '10 5 0 5',
            viewConfig: {forceFit: true},
            bbar: ['->', {
                xtype: 'button',
                id: 'selectdatasourcebtn',
                text: climatestation.Utils.getTranslation('choose'),   // 'Choose',
                iconCls: 'far fa-thumbs-up',
                style: {color: 'green'},
                scale: 'medium',
                scope: me,
                handler: function () {
                    let eumetcastradio = me.lookupReference('eumetcastradio'),
                        internetradio = me.lookupReference('internetradio');

                    if (eumetcastradio.getValue()) {
                        // open EUMETCAST datasource administration window
                        let EumetcastSourceAdminWin = new climatestation.view.acquisition.product.EumetcastSourceAdmin({
                            params: {
                                assigntoproduct: true,
                                product: {
                                    productcode: me.params.orig_productcode,
                                    subproductcode: me.params.orig_productcode + '_native',
                                    version: me.params.orig_version
                                }
                            }
                        });

                        EumetcastSourceAdminWin.show();
                        selectdatasourcetypeWin.close();
                    } else if (internetradio.getValue()) {
                        // open INTERNET datasource administration window
                        let InternetSourceAdminWin = new climatestation.view.acquisition.product.InternetSourceAdmin({
                            params: {
                                assigntoproduct: true,
                                product: {
                                    productcode: me.params.orig_productcode,
                                    subproductcode: me.params.orig_productcode + '_native',
                                    version: me.params.orig_version
                                }
                            }
                        });

                        InternetSourceAdminWin.show();
                        selectdatasourcetypeWin.close();
                    }
                }
            }],
            items: [{
                xtype: 'fieldset',
                reference: 'choosedatasourcetype',
                width: 180,
                hidden: false,
                defaultType: 'radio',
                //padding: 5,
                layout: 'anchor',
                defaults: {
                    anchor: '100%',
                    labelWidth: 100
                },

                items: [{
                    xtype: 'radiogroup',
                    id: 'datasourceradiogroup',
                    columns: 1,
                    vertical: true,
                    items: [{
                        boxLabel: '<b>EUMETCAST</b>',
                        id: 'eumetcastradio',
                        name: 'datasourcetype',
                        inputValue: 'eumetcast',
                        checked: true
                    }, {
                        boxLabel: '<b>INTERNET</b>',
                        id: 'internetradio',
                        name: 'datasourcetype',
                        inputValue: 'internet',
                        checked: false
                    }]
                }]
            }]
        });
        selectdatasourcetypeWin.show();
        //me.lookupReference('choosedatasourcetype').show();
    },

    unassignDataSource: function(grid, rowIndex, colIndex) {
        let me = this.getView(),
            rec = grid.getStore().getAt(rowIndex);
        // grid = me.lookupReference('productDataSourcesGrid'),
            // rec = grid.getSelectionModel().getSelection()[0];

        if (climatestation.Utils.objectExists(rec)) {
            //rec.remove();

            let params = {
                productcode: rec.get('productcode'),
                subproductcode: rec.get('subproductcode'),
                version: rec.get('version'),
                data_source_id: rec.get('data_source_id')
            };

            Ext.Ajax.request({
                method: 'POST',
                url: 'product/unassigndatasource',
                params: params,
                success: function(response, opts){
                    let result = Ext.JSON.decode(response.responseText);
                    if (result.success){
                        Ext.toast({ html: climatestation.Utils.getTranslation('productdatasourceunassigned'), title: climatestation.Utils.getTranslation('productdatasourceunassigned'), width: 200, align: 't' });
                    }

                    Ext.data.StoreManager.lookup('DataAcquisitionsStore').load();

                },
                failure: function(response, opts) {
                    console.info(response.status);
                }
            });
        }
    },

    editDataSource: function(grid, rowIndex, colIndex){
        let record = grid.getStore().getAt(rowIndex);
        let data_source_id = record.get('data_source_id');
        let user = climatestation.getUser();

        // console.info(record.get('defined_by'));
        // console.info(record);
        // console.info(data_source_id);

        let edit = false;
        let view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
            edit = true;
            view = false;
        }

        if (record.get('type') == 'INTERNET') {
            // data_source_id = record.get('internet_id');
            let editInternetDataSourceWin = new climatestation.view.acquisition.editInternetSource({
                params: {
                    create: false,
                    edit: edit,
                    view: view,
                    internetsourcerecord: record,
                    data_source_id: data_source_id
                }
            });
            editInternetDataSourceWin.show();
        }
        else {
            let editEumetcastDataSourceWin = new climatestation.view.acquisition.editEumetcastSource({
                params: {
                    create: false,
                    edit: edit,
                    view: view,
                    eumetcastsourcerecord: record,
                    data_source_id: data_source_id
                }
            });
            editEumetcastDataSourceWin.show();
        }
    },

    saveProductInfo: function(widget, event){
        let me = this.getView();
        let productDatasourcesStore = me.getViewModel().get('productdatasources');
        let ingestsubproductsStore = me.getViewModel().get('ingestsubproducts');

        let url = 'product/createproduct';
        //orig_productcode = '',
            //orig_version = '';
        if (me.params.edit){
            url = 'product/updateproductinfo';
            //orig_productcode = me.params.product.get('productcode');
            //orig_version = me.params.product.get('version');
        }
        let params = {
            category_id: me.lookupReference('category').getValue(),
            orig_productcode: me.params.orig_productcode,
            orig_version: me.params.orig_version,
            productcode: me.lookupReference('productcode').getValue(),
            version: me.lookupReference('version').getValue(),
            provider: me.lookupReference('provider').getValue(),
            prod_descriptive_name: me.lookupReference('product_name').getValue(),
            description: me.lookupReference('productdescription').getValue().trim(),
            defined_by: me.lookupReference('defined_by_field').getValue(),
            activated: me.lookupReference('activate_product_field').getValue()
        };
        // params = Ext.util.JSON.encode(params);

        Ext.Ajax.request({
            method: 'POST',
            url: url,
            params: params,
            success: function(response, opts){
                let result = Ext.JSON.decode(response.responseText);
                if (result.success){
                    Ext.toast({ html: climatestation.Utils.getTranslation('productinfoupdated'), title: climatestation.Utils.getTranslation('productinfoupdated'), width: 200, align: 't' });
                }
                if (!me.params.edit){
                    me.params.edit = true;
                    me.height = 830;

                    me.lookupReference('datasourcesfieldset').show();
                    me.lookupReference('ingestionsfieldset').show();
                    me.center();

                    me.params.orig_productcode = me.lookupReference('productcode').getValue();
                    me.params.orig_version = me.lookupReference('version').getValue();
                    //
                    // var daStore = Ext.data.StoreManager.lookup('DataAcquisitionsStore');
                    // Ext.data.StoreManager.lookup('DataAcquisitionsStore').load();

                    productDatasourcesStore.setFilters({
                         property:'productid'
                        ,value:me.params.orig_productcode + '_' + me.params.orig_version
                        ,exactMatch:true
                    });

                    ingestsubproductsStore.setFilters({
                         property:'productid'
                        ,value:me.params.orig_productcode + '_' + me.params.orig_version
                        ,exactMatch:true
                    });

                    me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('editproduct') + '</span>');
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });
    },

    addIngestSubProduct: function(grid){
        let me = this.getView();
        let ingestsubproductstore = Ext.data.StoreManager.lookup('IngestSubProductsStore');
        let user = climatestation.getUser();

        let newIngestSubProductRecord = new climatestation.model.IngestSubProduct({
            'productid': 'new-ingest-subproduct',
            'productcode': me.lookupReference('productcode').getValue(),    // me.params.product.get('productcode'),
            'orig_subproductcode': '',
            'subproductcode': '',
            'version': me.lookupReference('version').getValue(),   // me.params.product.get('version'),
            'defined_by': (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER',
            'activated': false,
            'category_id': me.lookupReference('category').getValue(),   // me.params.product.get('category_id'),
            'product_type': 'Ingest',
            'descriptive_name': '',
            'description': '',
            'provider': me.lookupReference('provider').getValue(),  // me.params.product.get('provider'),
            'frequency_id': '',
            'date_format': '',
            'scale_factor': null,
            'scale_offset': null,
            'nodata': null,
            'mask_min': null,
            'mask_max': null,
            'unit': '',
            'data_type_id': '',
            'masked': true,
            'enable_in_timeseries': false,
            'timeseries_role': null,
            'display_index': null
        });

        ingestsubproductstore.add(newIngestSubProductRecord);

        let newIngestionWin = new climatestation.view.acquisition.product.editIngestSubProduct({
            params: {
                create: true,
                edit: false,
                view: false,
                ingestsubproductrecord: newIngestSubProductRecord,
                productid: 'new-ingest-subproduct'
            }
        });
        newIngestionWin.show();
    },

    editIngestSubProduct: function(grid, rowIndex, row){
        let me = this.getView();
        let record = grid.getStore().getAt(rowIndex);
        let user = climatestation.getUser();

        let edit = false;
        let view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
            edit = true;
            view = false;
        }

        let editIngestionWin = new climatestation.view.acquisition.product.editIngestSubProduct({
            params: {
                create: false,
                edit: edit,
                view: view,
                ingestsubproductrecord: record,
                productid: me.params.orig_productcode + '_' + me.params.orig_version
            }
        });
        editIngestionWin.show();
    },

    deleteIngestSubProduct: function(grid, rowIndex, row){
        let record = grid.getStore().getAt(rowIndex);

        let messageText = climatestation.Utils.getTranslation('deleteingestsubproductquestion2') + ': <BR>' +
            '<b>' + record.get('descriptive_name') + '</b>';

        messageText += '<span class="smalltext">' +
                  '<b style="color:darkgrey;"> - '+record.get('subproductcode')+'</b></span>';

        Ext.Msg.show({
            title: climatestation.Utils.getTranslation('deleteingestsubproductquestion'),     // 'Delete Internet source definition?',
            message: messageText,
            buttons: Ext.Msg.OKCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(btn) {
                if (btn === 'ok') {
                    let ingestsubproductStore = Ext.data.StoreManager.lookup('IngestSubProductsStore');
                    grid.getStore().remove(record);

                    ingestsubproductStore.sync({
                        success: function (proxy, operations) {
                            // pop success message
                            Ext.toast({ html: climatestation.Utils.getTranslation('ingestsubproductdeleted'), title: climatestation.Utils.getTranslation('ingestsubproductdeleted'), width: 200, align: 't' });
                        },
                        failure: function (proxy, operations) {
                            // console.info(proxy);
                            // console.info(operations);
                            Ext.Msg.show({
                               title: climatestation.Utils.getTranslation('errordeleting_ingestsubproduct'),         // 'REMOTE EXCEPTION - Error deleting Ingest Sub Product',
                               msg: proxy.operations[0].getError().response.responseText,
                               icon: Ext.Msg.ERROR,
                               buttons: Ext.Msg.OK
                            });

                            // gridStore.add(gridStore.getRemovedRecords());
                            // resume records
                            ingestsubproductStore.rejectChanges();
                        }
                    });
                    // grid.getStore().sync(); // Chained store does not have sync() method!
                }
            }
        });
    },

    onClose: function(win, ev) {
        // Ext.data.StoreManager.lookup('ProductsStore').load();
    }
});
