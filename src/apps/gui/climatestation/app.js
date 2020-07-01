/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'climatestation.Application',

    name: 'climatestation',

    requires: [
        // This will automatically load all classes in the climatestation namespace
        // so that application classes do not need to require each other.
        'climatestation.*'
    ],

    // The name of the initial view to create.
    // mainView: 'climatestation.view.main.Main'
});
