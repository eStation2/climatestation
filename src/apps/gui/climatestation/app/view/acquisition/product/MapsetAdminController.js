Ext.define('climatestation.view.acquisition.product.MapsetAdminController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.acquisition-product-mapsetadmin',

    requires: [
        'Ext.data.StoreManager',
        'climatestation.Utils',
        'climatestation.model.MapSet',
        'climatestation.view.acquisition.product.editMapset'
    ],

    onAssignMapsetClick: function(){
        var me = this.getView();
        var selrec = me.lookupReference('mapsetGrid').getSelectionModel().getSelected();
        for ( var i=0, len=selrec.items.length; i<len; ++i ){
          me.selectedmapset = selrec.items[i].data.mapsetcode;
        }

        Ext.Ajax.request({
            method: 'GET',
            url: 'addingestmapset',
            params: {
                productcode: me.productcode,
                version: me.productversion,
                subproductcode: me.subproductcode,
                selectedmapset: me.selectedmapset
            },
            success: function(response, opts){
                var result = Ext.JSON.decode(response.responseText);
                if (result.success){
                    var ingestiongridstore = Ext.data.StoreManager.lookup('IngestionsStore');

                    if (ingestiongridstore.isStore) {
                        ingestiongridstore.load({
                            callback: function(records, options, success){
                                me.getController().onClose();
                            }
                        });
                    }
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });

        //me.close();
    },

    loadMapsetStore: function(){
        var me = this.getView(),
            mapsetsStore = Ext.data.StoreManager.lookup('mapsets'),
            mapsetsforingestStore = this.getStore('mapsetsforingest');

        if (me.config.assigntoproduct){
            mapsetsforingestStore.load({
                params: {
                    productcode: me.productcode,
                    version: me.productversion,
                    subproductcode: me.subproductcode
                }
            });
        }
        else{
            mapsetsStore.load();
        }
    },

    onAddMapsetClick: function(){
        // Create a new eumetcast source record and pass it. With the bind the store will automaticaly saved (through CRUD) on the server!
        var mapsetstore  = Ext.data.StoreManager.lookup('mapsets');
        var user = climatestation.getUser();

        var newMapSetRecord = new climatestation.model.MapSet({
                'mapsetcode': 'new-mapset',
                'defined_by': (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 'JRC' : 'USER',
                'descriptive_name': '',
                'description': null,
                'center_of_pixel': false,
                'pixel_size_x': null,
                'pixel_size_y': null,
                'footprint_image': null,
                'proj_code': null,
                // 'projection_descriptive_name': null,
                // 'srs_wkt': '',
                'bboxcode': null,
                // 'bbox_descriptive_name': null,
                'upper_left_long': null,
                'upper_left_lat': null,
                'lower_right_long': null,
                'lower_right_lat': null,
                'resolutioncode': null,
                // 'resolution_descriptive_name': null,
                // 'pixel_shift_long': null,
                // 'pixel_shift_lat': null,
                // 'rotation_factor_long': null,
                // 'rotation_factor_lat': null,
                'ingestions_assigned': null
            });

        mapsetstore.add(newMapSetRecord);

        var editMapsetWin = new climatestation.view.acquisition.product.editMapset({
            params: {
                create: true,
                edit: false,
                view: false,
                mapsetrecord: newMapSetRecord,
                mapsetcode: 'new-mapset'
            }
        });
        editMapsetWin.show();
    },

    onEditMapsetClick: function(grid, rowIndex){
        var record = grid.getStore().getAt(rowIndex);
        var mapsetcode = record.get('mapsetcode');
        var user = climatestation.getUser();

        var edit = false;
        var view = true;
        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
            edit = true;
            view = false;
        }

        var editMapsetWin = new climatestation.view.acquisition.product.editMapset({
            params: {
                create: false,
                edit: edit,
                view: view,
                mapsetrecord: record,
                mapsetcode: mapsetcode
            }
        });
        editMapsetWin.show();
    },

    onRemoveMapsetClick: function(grid, rowIndex){
        var record = grid.getStore().getAt(rowIndex);

        var messageText = climatestation.Utils.getTranslation('deletemapsetquestion2') + ': <BR>' +
                 '<b>'+ record.get('mapsetcode')+'</b>';

        messageText += '<span class="smalltext">' +
                  '<b style="color:darkgrey;"> - '+record.get('descriptive_name')+'</b></span>';

        Ext.Msg.show({
            title: climatestation.Utils.getTranslation('deletemapsetquestion'),     // 'Delete Mapset definition?',
            message: messageText,
            buttons: Ext.Msg.OKCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(btn) {
                if (btn === 'ok') {
                    grid.getStore().remove(record);
                    Ext.data.StoreManager.lookup('mapsets').sync({
                        success: function () {
                            // console.log('success');
                            Ext.toast({html: climatestation.Utils.getTranslation('mapsetdeleted'), title: climatestation.Utils.getTranslation('mapsetdeleted'), width: 200, align: 't'});
                        },
                        failure: function () {
                            // console.log('failure');
                            Ext.toast({html: climatestation.Utils.getTranslation('errordeletingmapset'), title: climatestation.Utils.getTranslation('error'), width: 200, align: 't'});
                        }
                    });
                    // grid.getStore().sync(); // Chained store does not have sync() method!
                }
            }
        });
    },

    mapsetItemClick: function(dataview, record ){
        this.lookupReference('assignmapsetBtn').enable();
        this.getView().selectedmapset = record.get('mapsetcode');
    },

    onClose: function(win, ev) {
        var me = this.getView(),
            ref = 'assignmapsetBtn',  // this.reference,
            refHolder = me.lookupReferenceHolder();

        if (refHolder) {
            delete refHolder.getView().refs[ref];
        }

        var editmapsetWindows = Ext.ComponentQuery.query('editmapset');
        if (editmapsetWindows !== []) {
            Ext.Object.each(editmapsetWindows, function (id, editmapsetwin, thisObj) {
                editmapsetwin = null;
                // console.info(editmapsetwin);
                // editmapsetwin.destroy();
            });
        }
    }
});
