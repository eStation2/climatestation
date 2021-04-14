Ext.define('climatestation.view.acquisition.product.InternetSourceAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-product-internetsourceadmin',

    requires: [
        'Ext.data.StoreManager',
        'Ext.window.Window',
        'climatestation.Utils',
        'climatestation.model.InternetSource',
        'climatestation.view.acquisition.editInternetSource'
    ],

    onAssignInternetSourceClick: function(button) {
        var me = this.getView();
        var user = climatestation.getUser();
        var internetSourceGrid = this.lookupReference('internetSourceGrid'),
            selection = internetSourceGrid.getSelectionModel().getSelection()[0];

        var params = {
            productcode: me.params.product.productcode,
            subproductcode: me.params.product.subproductcode,
            version: me.params.product.version,
            data_source_id: selection.get('internet_id'),
            defined_by: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER'
        };

        Ext.Ajax.request({
            method: 'POST',
            url: 'internetsource/assigntoproduct',
            params: params,
            success: function(response, opts){
                //var result = Ext.JSON.decode(response.responseText);
                Ext.data.StoreManager.lookup('DataAcquisitionsStore').reload();
                //console.info(Ext.data.StoreManager.lookup('DataAcquisitionsStore'));
                me.close();
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });

    },

    onAddInternetSourceClick: function() {
        // Create a new internet source record and pass it. With the bind the store will automaticaly saved (through CRUD) on the server!
        var internetsourcestore  = Ext.data.StoreManager.lookup('InternetSourceStore');
        var user = climatestation.getUser();

        var newInternetSourceRecord = new climatestation.model.InternetSource({
                'internet_id': 'new-internet-source',
                'orig_internet_id': '',
                'defined_by': (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER',
                'descriptive_name': '',
                'description': '',
                'modified_by': '',
                'update_datetime': null,
                'url': '',
                'user_name': '',
                'password': '',
                'type': null,
                'include_files_expression': '',
                'files_filter_expression': '',
                'status': false,
                'pull_frequency': null,
                'frequency_id': null,
                'start_date': null,
                'end_date': null,
                'https_params': '',
                'datasource_descr_id': '',
                'format_type': null,
                'file_extension': '',
                'delimiter': '',
                'date_format': null,
                'date_position': null,
                'product_identifier': '',
                'prod_id_position': null,
                'prod_id_length': null,
                'area_type': null,
                'area_position': null,
                'area_length': null,
                'preproc_type': null,
                'product_release': null,
                'release_position': null,
                'release_length': null,
                'native_mapset': null
            });

            internetsourcestore.add(newInternetSourceRecord);
            // console.info(internetsourcestore);

            var editInternetDataSourceWin = new climatestation.view.acquisition.editInternetSource({
                params: {
                    create: true,
                    edit: false,
                    view: false,
                    internetsourcerecord: newInternetSourceRecord,
                    data_source_id: 'new-internet-source'
                }
            });
            editInternetDataSourceWin.show();
    },

    onEditInternetSourceClick: function(grid, rowIndex, colIndex){
        var record = grid.getStore().getAt(rowIndex);
        var data_source_id = record.get('internet_id');
        var user = climatestation.getUser();
        // console.info(record);
        // console.info(data_source_id);

        var edit = false;
        var view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
            edit = true;
            view = false;
        }

        var editInternetDataSourceWin = new climatestation.view.acquisition.editInternetSource({
            params: {
                create: false,
                edit: edit,
                view: view,
                internetsourcerecord: record,
                data_source_id: data_source_id
            }
        });
        editInternetDataSourceWin.show();
    },

    onRemoveInternetSourceClick: function(grid, rowIndex, row) {
        var record = grid.getStore().getAt(rowIndex);

        var messageText = climatestation.Utils.getTranslation('delete_internetsource-question') + ': <BR>' +
                 '<b>'+ record.get('internet_id')+'</b>';

        messageText += '<span class="smalltext">' +
                  '<b style="color:darkgrey;"> - '+record.get('descriptive_name')+'</b></span>';

        Ext.Msg.show({
            title: climatestation.Utils.getTranslation('deleteinternetsourcequestion'),     // 'Delete Internet source definition?',
            message: messageText,
            buttons: Ext.Msg.OKCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(btn) {
                if (btn === 'ok') {
                    grid.getStore().remove(record);
                    Ext.data.StoreManager.lookup('InternetSourceStore').sync();
                    // grid.getStore().sync(); // Chained store does not have sync() method!
                }
            }
        });

        // var internetSourceGrid = this.lookupReference('internetSourceGrid'),
        //     selection = internetSourceGrid.getSelectionModel().getSelection()[0];
        // selection.drop();
        //this.getStore('internetsources').remove(selection);
        //console.info(this.getSession().getChanges());

    },

    reloadStore: function(btn){
        Ext.data.StoreManager.lookup('InternetSourceStore').load();
    },

    onClose: function(win, ev) {
        let editWindows = Ext.ComponentQuery.query('editinternetsource');
        if (editWindows !== []) {
            Ext.Object.each(editWindows, function (id, editwin, thisObj) {
                editwin = null;
            });
        }
    }
});
