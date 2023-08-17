sap.ui.define([
	"zfisncv2/controller/BaseController",
	"sap/ui/core/routing/History",
	"zfisncv2/model/formatter"
], function(BaseController, History, formatter){
	"use strict";		
	
	return BaseController.extend("zfisncv2.controller.LogApp", {
		
		formatter: formatter,
		
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the add controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Register to the add route matched
			this.getRouter().getRoute("logapp").attachPatternMatched(this._onRouteMatched, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		//
		onBtnRefreshLog: function() {
			this.byId("id_tablogapp").getBinding("items").refresh(true);
		},


		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		_onRouteMatched: function() {
		
		},


		_onMetadataLoaded : function () {
			
		},

		/**
		 * Event handler for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			
			this.getView().unbindObject();
			
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("master", {}, bReplace);
				//this.getRouter().navTo("worklist", {}, bReplace);
			}
		}
	});	
});