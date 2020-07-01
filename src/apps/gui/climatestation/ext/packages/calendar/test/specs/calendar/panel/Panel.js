topSuite("Ext.calendar.panel.Panel", ['Ext.calendar.*'], function() {
    var view;

    function makeView(cfg) {
        cfg = Ext.apply({
            width: 800,
            height: 600
        }, cfg);
        view = new Ext.calendar.panel.Panel(cfg);
        view.render(Ext.getBody());
        view.getView().activeView.getView().doRefresh();
    }

    afterEach(function() {
        view = Ext.destroy(view);
    });

    // EXTJS-26815
    describe("TodayCellCls", function() {
        describe("month view", function() {
            var weekCls = "x-today-cell-highlight-weeks-day";

            it("calender should be having the today cell highlighted when config is true", function() {
                makeView({
                    highlightToday: true
                });

                var monthView = view.getView();

                expect(monthView.el.selectNode('.' + weekCls)).toBeTruthy();
            });

            it("calender should not be having the today cell highlighted when config is false", function() {
                makeView({
                    highlightToday: false
                });

                var monthView = view.getView();

                expect(monthView.el.selectNode('.' + weekCls)).toBeNull();
            });
        });

        describe("week view", function() {
            var dayCls = "x-today-cell-highlight-day";

            it("calender should be having the today cell highlighted when config is true", function() {
                makeView({
                    highlightToday: true,
                    defaultView: 'week'
                });

                var weekView = view.getView();

                expect(weekView.el.selectNode('.' + dayCls)).toBeTruthy();
            });

            it("calender should not be having the today cell highlighted when config is false", function() {
                makeView({
                    highlightToday: false,
                    defaultView: 'week'
                });

                var weekView = view.getView();

                expect(weekView.el.selectNode('.' + dayCls)).toBeNull();
            });
        });
    });
});
