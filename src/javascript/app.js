Ext.define("blocker-multi-view", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    categoryLeaderMapping: {
        "Architecture":	"Raj Shah",
        "Environments (non-prod)": "Tom Francis",
        "Licensing": "Bill Lo",
        "Logical Build": "Jerry Branson",
        "Physical Build":"Bill Lo",
        "Resource Availability- Dev Ops":"Matt Price",
        "Resource Availability- Engineering":"Omer Ansari, Raj Shah",
        "Resource Availability- Other":"Diem Nguyen",
        "Resource Availability- Product Owner":"Dave Lively, Jonathan Golding",
        "No Lab Available":"Tom Francis",
        "Testing":"Tom Francis",
        "Other":"Diem Nguyen"
    },
    fetchList: ['Feature', 'FormattedID', 'Project','Release', 'Iteration', 'Tags', 'Blocked', 'BlockedReason', 'c_BlockerCategory',
                'c_BlockerOwnerFirstLast', 'c_BlockerCreationDate', 'c_BlockerState','c_BlockerEstimatedResolutionDate','age','Name'],
    onTimeboxScopeChange: function(scope) {
        console.log('scope',scope);
        if (this.down('#blocker-tabs')){
            this.down('#blocker-tabs').destroy();
        }
        this._fetchData(scope.getRecord());
    },
    _fetchData: function(release_record){

        var release_filter = {
            property: 'Release',
            value: ''
        };

        if (release_record){
            release_filter = {
                property: 'Release.Name',
                value: release_record.get('Name')
            };
        }

        Rally.technicalservices.BlockerModelBuilder.getModel('hierarchicalrequirement').then({
            scope: this,
            success: function(model){
                var blocker_model = Rally.technicalservices.BlockerModelBuilder.build(model, this.categoryLeaderMapping);
                var store = Ext.create('Rally.data.wsapi.Store',{
                    model: blocker_model,
                    filters: [{
                        property: 'Blocked',
                        value: true
                    },{
                        property: 'DirectChildrenCount',
                        value: 0
                    },release_filter],
                    limit: 'Infinity',
                    pageSize: 200,
                    remoteSort: false,
                    sortOnFilter: true,
                    fetch: this.fetchList
                });
                store.load({
                    scope: this,
                    callback: function(records, operation, success){
                        this.logger.log('load current store success', store, records, operation, success);
                        this._addTabs(store);
                    }
                });
            }
        });
    },
    _addTabs: function(store){
        var tabHeight = 50;

        this.add({
            xtype: 'tabpanel',
            itemId: 'blocker-tabs',
            layout: 'card',
            listeners: {
                scope: this,
                tabchange: function(tp, newTab){
                    console.log('change')
                    newTab.showPanel();
                },
                afterrender: function(tp){
                    var tab = tp.child('#leadership-view');
                    //tp.setActiveTab(tab);
                    tab.tab.show();
                    tab.showPanel();
                }
            },
            tabBar: {
                height: tabHeight,
                style: {
                    backgroundColor: 'white'
                }
            },
            items: [{
                itemId: 'leadership-view',
                xtype: 'tsblockerviewleadership',
                currentStore: store,
                context: this.getContext(),
                tabConfig: {
                    height: tabHeight
                }
            }, {
                itemId: 'category-view',
                xtype: 'tsblockerviewcategory',
                currentStore: store,
                context: this.getContext(),
                tabConfig: {
                    height: tabHeight

                }
            },{
                itemId: 'team-view',
                xtype: 'tsblockerviewteam',
                currentStore: store,
                context: this.getContext(),
                tabConfig: {
                    height: tabHeight
                }
            },{
                itemId: 'category-metrics-view',
                xtype: 'tsblockerviewmetrics',
                currentStore: store,
                tabConfig: {
                    height: tabHeight
                }
            },{
                itemId: 'missing-data-blocker-view',
                xtype: 'tsblockerviewmissingdata',
                currentStore: store,
                context: this.getContext(),
                tabConfig: {
                    height: tabHeight
                }
            },{
                itemId: 'current-blocker-view',
                xtype: 'tsblockerviewcurrent',
                currentStore: store,
                context: this.getContext(),
                tabConfig: {
                    height: tabHeight
                }
            //},{
            //    itemId: 'historical-blocker-view',
            //    xtype: 'tsblockerviewhistorical',
            //    currentStore: store,
            //    context: this.getContext(),
            //    tabConfig: {
            //        title: 'Historical Blocker Data',
            //        height: tabHeight,
            //        tooltip: 'Historical view of blocker data'
            //    }
            }]
        });
    }
});
