Ext.define('climatestation.view.acquisition.product.EumetcastSourceAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-product-eumetcastsourceadmin',

    requires: [
        'Ext.data.StoreManager',
        'Ext.window.Window',
        'climatestation.Utils',
        'climatestation.model.EumetcastSource',
        'climatestation.view.acquisition.editEumetcastSource'
    ],

    onAssignEumetcastSourceClick: function(button) {
        const me = this.getView();
        const user = climatestation.getUser();
        const eumetcastSourceGrid = this.lookupReference('eumetcastSourceGrid'),
            selection = eumetcastSourceGrid.getSelectionModel().getSelection()[0];

        const params = {
            productcode: me.params.product.productcode,
            subproductcode: me.params.product.subproductcode,
            version: me.params.product.version,
            data_source_id: selection.get('eumetcast_id'),
            defined_by: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER'
        };

        Ext.Ajax.request({
            method: 'POST',
            url: 'eumetcastsource/assigntoproduct',
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

    onAddEumetcastSourceClick: function() {
        // Create a new eumetcast source record and pass it. With the bind the store will automaticaly saved (through CRUD) on the server!
        const eumetcastsourcestore = Ext.data.StoreManager.lookup('EumetcastSourceStore');
        const user = climatestation.getUser();

        const newEumetcastSourceRecord = new climatestation.model.EumetcastSource({
            'eumetcast_id': 'new-eumetcast-source',
            'orig_eumetcast_id': '',
            'collection_name': '',
            'filter_expression_jrc': '',
            'frequency': '',
            'description': '',
            'typical_file_name': '',
            'keywords_theme': '',
            'keywords_societal_benefit_area': '',
            'defined_by': (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER',
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

        eumetcastsourcestore.add(newEumetcastSourceRecord);

        const editEumetcastDataSourceWin = new climatestation.view.acquisition.editEumetcastSource({
            params: {
                create: true,
                edit: false,
                view: false,
                internetsourcerecord: newEumetcastSourceRecord,
                data_source_id: 'new-eumetcast-source'
            }
        });
        editEumetcastDataSourceWin.show();
    },

    onEditEumetcastSourceClick: function(grid, rowIndex, colIndex) {
        const record = grid.getStore().getAt(rowIndex);
        const data_source_id = record.get('eumetcast_id');
        const user = climatestation.getUser();
        // console.info(record);
        // console.info(data_source_id);

        let edit = false;
        let view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
            edit = true;
            view = false;
        }

        const editEumetcastDataSourceWin = new climatestation.view.acquisition.editEumetcastSource({
            params: {
                create: false,
                edit: edit,
                view: view,
                internetsourcerecord: record,
                data_source_id: data_source_id
            }
        });
        editEumetcastDataSourceWin.show();
    },

    onRemoveEumetcastSourceClick: function(grid, rowIndex, row) {
        const record = grid.getStore().getAt(rowIndex);

        let messageText = climatestation.Utils.getTranslation('delete_eumetcastsource-question') + ': <BR>' +
            '<b>' + record.get('eumetcast_id') + '</b>';

        messageText += '<span class="smalltext">' +
                  '<b style="color:darkgrey;"> - '+record.get('collection_name')+'</b></span>';

        Ext.Msg.show({
            title: climatestation.Utils.getTranslation('deleteeumetcastsourcequestion'),     // 'Delete Internet source definition?',
            message: messageText,
            buttons: Ext.Msg.OKCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(btn) {
                if (btn === 'ok') {
                    grid.getStore().remove(record);
                    Ext.data.StoreManager.lookup('EumetcastSourceStore').sync();
                    // grid.getStore().sync(); // Chained store does not have sync() method!
                }
            }
        });

        // var eumetcastSourceGrid = this.lookupReference('eumetcastSourceGrid'),
        //     selection = eumetcastSourceGrid.getSelectionModel().getSelection()[0];
        // selection.drop();
        //this.getStore('eumetcastsources').remove(selection);
        //console.info(this.getSession().getChanges());

    },

    reloadStore: function(btn){
        Ext.data.StoreManager.lookup('EumetcastSourceStore').load();
    },

    onClose: function(win, ev) {
        const editWindows = Ext.ComponentQuery.query('editeumetcastsource');
        if (editWindows !== []) {
            Ext.Object.each(editWindows, function (id, editwin, thisObj) {
                editwin = null;
            });
        }
    }
});
