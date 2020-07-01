
Ext.define("climatestation.view.dashboard.UPS",{
    extend: "Ext.panel.Panel",

    requires: [
        'climatestation.view.dashboard.UPSController',
        'climatestation.view.dashboard.UPSModel'
    ],
    controller: "dashboard-ups",
    viewModel: {
        type: "dashboard-ups"
    }

});
