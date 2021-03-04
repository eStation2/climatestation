Ext.define('climatestation.view.acquisition.product.ProductAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-product-productadmin',

    requires: [
        'Ext.data.StoreManager',
        'climatestation.Utils',
        'climatestation.view.acquisition.product.editProduct'
    ],

    loadProductsStore: function(){
        var me = this.getView();
        var productsStore = Ext.data.StoreManager.lookup('ProductsStore');
        var ingestsubproductsStore = Ext.data.StoreManager.lookup('IngestSubProductsStore');

        if (me.forceStoreLoad || !productsStore.isLoaded() || !ingestsubproductsStore.isLoaded()) {
            var myLoadMask = new Ext.LoadMask({
                msg: climatestation.Utils.getTranslation('loading'), // 'Loading...',
                target: me
            });
            myLoadMask.show();

            productsStore.load({
                callback: function(records, options, success) {
                    ingestsubproductsStore.load({
                        callback: function(records, options, success) {
                            myLoadMask.hide();
                        }
                    });
                }
            });

            me.forceStoreLoad = false;
        }
        Ext.data.StoreManager.lookup('mapsets').load();
        Ext.data.StoreManager.lookup('categoriesall').load();
        Ext.data.StoreManager.lookup('frequencies').load();
        Ext.data.StoreManager.lookup('dateformats').load();
        Ext.data.StoreManager.lookup('datatypes').load();
    },

    editProduct: function(grid, rowIndex, colIndex, refElement, event){
        // var record = grid.getStore().getAt(rowIndex);    // for an to me unknown reason rowIndex is the index within the group category
        var record = event.record;
        var user = climatestation.getUser();

        var edit = false;
        var view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
            edit = true;
            view = false;
        }

        // console.info(record);
        // console.info(grid.getStore());
        // console.info(grid);
        // console.info(rowIndex);
        // console.info(colIndex);
        // console.info(refElement);
        // console.info(event);

        var editProductWin = new climatestation.view.acquisition.product.editProduct({
            params: {
                new: false,
                edit: edit,
                view: view,
                product: record,
                orig_productcode: record.get('productcode'),
                orig_version: record.get('version')
            }
        });
        editProductWin.show();
    },

    deleteProduct: function(grid, rowIndex, row){
        var record = grid.getStore().getAt(rowIndex);
        var messageText = climatestation.Utils.getTranslation('delete_product-and-its-subproducts-question') + ': <BR>' +
                 '<b>'+ record.get('prod_descriptive_name')+'</b>';

        if (record.get('version') != ''){
           messageText += '<span class="smalltext"><b> - ' + record.get('version') + '</b></span>' ;
        }

        messageText += '<span class="smalltext">' + '<b style="color:darkgrey;"> - ' + record.get('productcode') + '</b></span>';

        // if (record.get('deletable')){
            Ext.Msg.show({
                title: climatestation.Utils.getTranslation('deleteproductquestion'),     // 'Delete product definition?',
                message: messageText,
                buttons: Ext.Msg.OKCANCEL,
                icon: Ext.Msg.QUESTION,
                fn: function(btn) {
                    if (btn === 'ok') {
                        grid.getStore().remove(record);
                    }
                }
            });
        // }
    }
});
