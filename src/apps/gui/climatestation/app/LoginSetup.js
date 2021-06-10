/**
 * Setup singleton class definition
 */
Ext.define('climatestation.LoginSetup', {
     singleton:true
    ,requires:[
          'Ext.util.Observable'
         ,'Ext.util.Cookies'
    ]

    ,mixins:{
        observable:'Ext.util.Observable'
    }

    // url to get user data from and send login data to
    ,url:'login'

    /**
     * Constructor override
     * @param {Object} config
     */
    ,constructor:function(config) {
        var  me = this

            // private variable to hold user data
            ,user

            // private variable to hold login data until sent to the server
            ,params

            /**
             * Ajax request success callback
             * @private
             * @param {Object} response
             */
            ,success = function(response) {
                var o, exprireDate;

                // clear sensitive data
                params = null;

                // analyze the response and fire the appropriate events
                try {
                    o = Ext.decode(response.responseText);
                } catch(e) {
                    me.fireEvent('setupfail',response.responseText);
                    return;
                }
                if(true !== o.success) {
                    me.fireEvent('setupfail', o);
                }
                else {
                    // save received user data
                    exprireDate = Ext.Date.add (new Date(),Ext.Date.DAY,1);
                    user = o.user;
                    // Ext.util.Cookies.set('webpy_session_id', user.sessionid, exprireDate);
                    Ext.util.Cookies.set('estation2_userid', user.userid, exprireDate);
                    Ext.util.Cookies.set('estation2_username', user.username, exprireDate);
                    // Ext.util.Cookies.set('estation2_useremail', user.email, exprireDate);
                    Ext.util.Cookies.set('estation2_userlevel', user.userlevel, exprireDate);
                    Ext.util.Cookies.set('estation2_userlanguage', user.prefered_language, exprireDate);
                    if (user.prefered_language != climatestation.globals['selectedLanguage']){
                        window.location = '?lang=' + user.prefered_language;
                    }
                    else {
                        me.fireEvent('setupready')
                    }
                }
            } // eo function success

            /**
             * Ajax request failure callback
             * @private
             * @param {Object} response
             */
            ,failure = function(response) {
                // clear sensitive data
                params = null;

                me.fireEvent(me, response);
            } // eo function failure

        ; // eo vars

        me.initConfig(config);

        // initialize observable
        me.mixins.observable.constructor.call(me);

        me.callParent([config]);

        // although these methods can be changed from outside,
        // the changes won't get access to private vars, e.g. user
        // These methods are Setup API in fact
        Ext.apply(me, {

            /**
             * Initialize. Send the request to get user data. In the
             * case of login, username and password are sent as params.
             * That is not secure as plain password travels over the line.
             * In real life you would encode the password somehow
             * (MD5 + salt), for example.
             */
            init:function() {
                Ext.Ajax.request({
                     url:me.url
                    ,success:success
                    ,failure:failure
                    ,params:params
                    ,method:'POST'
                });
            } // eo function init

            /**
             * user getter - the only way how to get
             * user data from the private variable "user"
             * @returns {Object}
             */
            ,getUser:function() {
                return user;
            } // eo function getUser

            /**
             * user setter - the only way how to set
             * user data from the private variable "user"
             * @returns {Object}
             */
            ,setUser:function(usr) {
                var exprireDate = Ext.Date.add (new Date(),Ext.Date.DAY,1);
                user = usr;

                // Ext.util.Cookies.set('webpy_session_id', user.sessionid, exprireDate);
                Ext.util.Cookies.set('estation2_userid', user.userid, exprireDate);
                Ext.util.Cookies.set('estation2_username', user.username, exprireDate);
                // Ext.util.Cookies.set('estation2_useremail', user.email, exprireDate);
                Ext.util.Cookies.set('estation2_userlevel', user.userlevel, exprireDate);
                Ext.util.Cookies.set('estation2_userlanguage', user.prefered_language, exprireDate);
            } // eo function getUser

            // /**
            //  * Logs in the user
            //  * @param {Object} data Login name and password
            //  */
            // ,loginSession:function() {
            //     params = {sessionid:Ext.util.Cookies.get('webpy_session_id')};
            //     me.init();
            // } // eo function login

            /**
             * Logs in the user
             * @param {Object} data Login name and password
             */
            ,login:function(data) {
                params = data;
                me.init();
            } // eo function login

            /**
             * Logs out the user
             * Clears the session cookie and reloads the page.
             * Of course, there are other ways to logout, e.g. to
             * redirect a logout url.
             */
            ,logout:function() {
                user = null;
                // Ext.util.Cookies.clear('webpy_session_id');
                Ext.util.Cookies.clear('estation2_userid');
                Ext.util.Cookies.clear('estation2_username');
                // Ext.util.Cookies.clear('estation2_useremail');
                Ext.util.Cookies.clear('estation2_userlevel');
                Ext.util.Cookies.clear('estation2_userlanguage');
            } // eo function logout

        });

        // install global error handler
        Ext.Error.handle = function(err) {
            console.info(err);
            Ext.Msg.show({
                 title:'Error'
                ,msg:[
                     'Source Class: <b>' + err.sourceClass + '</b>'
                    ,'Source Method: <b>' + err.sourceMethod + '</b>'
                    ,'Message: <b>' + err.msg + '</b>'
                ].join('<br />')
                ,icon:Ext.Msg.ERROR
                ,buttons:Ext.Msg.OK
            });
            return true;
        };

    } // eo function constructor
}

// singleton instantiation callback
,function() {
    var  me = this;

    // shortcuts to useful methods
    Ext.apply(climatestation, {
         init:me.init
        ,getUser:me.getUser
        ,setUser:me.setUser
        ,login:me.login
        // ,loginSession:me.loginSession
        ,logout:me.logout
    });

});

// eof