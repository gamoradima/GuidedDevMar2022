define("UsrRealtyVisitDetailGrid", [], function() {
	return {
		entitySchemaName: "UsrRealtyVisit",
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		diff: /**SCHEMA_DIFF*/[]/**SCHEMA_DIFF*/,
		methods: {
			init: function() {
				this.callParent(arguments);
				// Регистрация коллекции сообщений.
				this.sandbox.registerMessages(this.messages);
				this.sandbox.subscribe("RefreshVisitsDataGrid", this.refreshGridDataMethod, this, []);
			},
			refreshGridDataMethod: function() {
				this.console.log("Message subscriber called.");
				this.reloadGridData();
				return "ok!";
			}
		},
		messages: {
			"RefreshVisitsDataGrid": {
        		mode: Terrasoft.MessageMode.PTP,
        		direction: Terrasoft.MessageDirectionType.SUBSCRIBE
		    },
		},
		
	};
});
