Ext.define('climatestation.view.dashboard.DashboardModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.dashboard-dashboard',

    requires: [
        'climatestation.model.Dashboard'
    ],

    stores: {
        dashboard: {
            model: 'climatestation.model.Dashboard',
            session: true
        }
    }
});
