define("UsrRealty1Page", ["RightUtilities", "ProcessModuleUtilities"], function(RightUtilities, ProcessModuleUtilities) {
	return {
		entitySchemaName: "UsrRealty",
		messages: {
			"RefreshVisitsDataGrid": {
        		mode: Terrasoft.MessageMode.PTP,
        		direction: Terrasoft.MessageDirectionType.PUBLISH
		    },
		},

		attributes: {
			"IsPriceEditable": {
				"dataValueType": this.Terrasoft.DataValueType.BOOLEAN,
				"type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"value": false
			},
			"UsrCommissionUSD": {
				dependencies: [
					{
						columns: ["UsrPriceUSD", "UsrOfferType"],
						methodName: "calcCommission"
					}
				]
			},
			"UsrOfferType" : {
				lookupListConfig: {
					columns: ["UsrCommissionCoeff"]
				}
			}
		},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"Files": {
				"schemaName": "FileDetailV2",
				"entitySchemaName": "UsrRealtyFile",
				"filter": {
					"masterColumn": "Id",
					"detailColumn": "UsrRealty"
				}
			},
			"UsrRealtyVisitDetail": {
				"schemaName": "UsrRealtyVisitDetailGrid",
				"entitySchemaName": "UsrRealtyVisit",
				"filter": {
					"detailColumn": "UsrRealty",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{
			"UsrPriceUSD": {
				"9dd19bba-005b-4e93-a5cf-aacbea6338e1": {
					"uId": "9dd19bba-005b-4e93-a5cf-aacbea6338e1",
					"enabled": true,
					"removed": false,
					"ruleType": 0,
					"property": 1,
					"logical": 1,
					"conditions": [
						{
							"comparisonType": 3,
							"leftExpression": {
								"type": 1,
								"attribute": "IsPriceEditable"
							},
							"rightExpression": {
								"type": 0,
								"value": true,
								"dataValueType": 12
							}
						},
						{
							"comparisonType": 4,
							"leftExpression": {
								"type": 1,
								"attribute": "UsrType"
							},
							"rightExpression": {
								"type": 0,
								"value": "eb5d6fe4-cc40-4ee3-81c3-07001e140c7b",
								"dataValueType": 10
							}
						}
					]
				}
			}
		}/**SCHEMA_BUSINESS_RULES*/,
		methods: {
			calcCommission: function() {
				var price = this.get("UsrPriceUSD");
				var offerTypeObject = this.get("UsrOfferType");
				var result = 0;
				if (offerTypeObject) {
					var coeff = offerTypeObject.UsrCommissionCoeff;
					result = price * coeff / 100;
				}
				this.set("UsrCommissionUSD", result);
			},
			onEntityInitialized: function() {
				this.callParent();
				RightUtilities.checkCanExecuteOperation({ operation: "CanEditRealtyPrice" },
						this.getEditPriceOperationResult, this);
				this.calcCommission();
			},
			getEditPriceOperationResult: function(result) {
				this.set("IsPriceEditable", result);
			},
			asyncValidate: function(callback, scope) {
				this.callParent([
						function(response) {
					if (!this.validateResponse(response)) {
						return;
					}
					this.validateRealtyData(function(response) {
						if (!this.validateResponse(response)) {
							return;
						}
						callback.call(scope, response);
					}, this);
				}, this]);
			},

			validateRealtyData: function(callback, scope) {
				// create query for server side
				var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
					rootSchemaName: "UsrRealty"
				});
				esq.addAggregationSchemaColumn("UsrPriceUSD", Terrasoft.AggregationType.SUM, "PriceSum");
				esq.addColumn("[UsrRealtyVisit:UsrRealty:Id].UsrVisitDatetime");

				var offerTypeObject = this.get("UsrOfferType");
				if (offerTypeObject) {
					var offerTypeId = offerTypeObject.value;
					var offerTypeFilter = esq.createColumnFilterWithParameter(this.Terrasoft.ComparisonType.EQUAL,
						"UsrOfferType", offerTypeId);
					esq.filters.addItem(offerTypeFilter);
				}

				var realtyTypeObject = this.get("UsrType");
				if (realtyTypeObject) {
					var typeId = realtyTypeObject.value;
					var typeFilter = esq.createColumnFilterWithParameter(this.Terrasoft.ComparisonType.EQUAL,
						"UsrType", typeId);
					esq.filters.addItem(typeFilter);
				}
				
				// run query
				esq.getEntityCollection(function(response) {
					if (response.success && response.collection) {
						var sum = 0;
						var items = response.collection.getItems();
						if (items.length > 0) {
							sum = items[0].get("PriceSum");
						}
						var max = 1000000;
						if (sum > max) {
							if (callback) {
								callback.call(this, {
									success: false,
									message: "You cannot save, because sum = " + sum + " is bigger than " + max
								});
							}
						} else
						if (callback) {
							callback.call(scope, {
								success: true
							});
						}
					}
				}, this);
			},
			
			onMyButtonClick: function() {
				this.console.log("My button pressed.");
				// todo
				
				this.showBodyMask();
				ProcessModuleUtilities.executeProcess({
					sysProcessName: "UsrAddRealtyVisitProcess",
					parameters: {
						"RealtyId": this.get("Id")
					},
					callback: this.runProcessCallback,
					scope: this
				});
			},
			
			runProcessCallback: function() {
				this.hideBodyMask();
				this.console.log("callback of process exec called.");
				// make message publish
				var result = this.sandbox.publish("RefreshVisitsDataGrid", null, []);
				this.console.log("result of publishing message: " + result);
			},

			init: function() {
 				this.callParent(arguments);
	    		// Регистрация коллекции сообщений.
    			this.sandbox.registerMessages(this.messages);
			},
			
			getMyButtonEnabled: function() {
				var name = this.get("UsrName");
				let result = name != '';
				return result;
			}
		},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "UsrName0c530621-39df-4cfc-a01e-3aef2642fff6",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrName",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "FLOAT22de8d7a-534e-4215-a627-752bea815423",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrPriceUSD",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "FLOATdae5846f-afd0-491d-9475-ce5d231a2f70",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrAreaM2",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "MyButton",
				"values": {
					"itemType": 5,
					"caption": {
						"bindTo": "Resources.Strings.MyButtonCaption"
					},
					"click": {
						"bindTo": "onMyButtonClick"
					},
					"enabled": {
						"bindTo": "getMyButtonEnabled"
					},
					"style": "red",
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 4,
						"layoutName": "ProfileContainer"
					}
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "FLOAT11c9adf8-07fc-4ba1-b19c-4d1fa0d41bb6",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 3,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrCommissionUSD",
					"enabled": false
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "LOOKUPf077589a-792d-4180-8d6a-86e73ba51337",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "LOOKUP96ac66ee-98ec-4a53-81c3-5617b7d8462e",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 12,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrOfferType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "TabRealtyVisit",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.TabRealtyVisitTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "UsrRealtyVisitDetail",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "TabRealtyVisit",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesAndFilesTab",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
					},
					"items": [],
					"order": 1
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Files",
				"values": {
					"itemType": 2
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesControlGroup",
				"values": {
					"itemType": 15,
					"caption": {
						"bindTo": "Resources.Strings.NotesGroupCaption"
					},
					"items": []
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Notes",
				"values": {
					"bindTo": "UsrNotes",
					"dataValueType": 1,
					"contentType": 4,
					"layout": {
						"column": 0,
						"row": 0,
						"colSpan": 24
					},
					"labelConfig": {
						"visible": false
					},
					"controlConfig": {
						"imageLoaded": {
							"bindTo": "insertImagesToNotes"
						},
						"images": {
							"bindTo": "NotesImagesCollection"
						}
					}
				},
				"parentName": "NotesControlGroup",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 2
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
