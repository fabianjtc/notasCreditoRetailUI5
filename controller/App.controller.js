sap.ui.define([
	"zfisncv2/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("zfisncv2.controller.App", {

		onInit: function() {

			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function() {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			window.addEventListener('online', this.handleNetworkChange.bind(this));
			window.addEventListener('offline', this.handleNetworkChange.bind(this));

		},

		handleNetworkChange: function() {
			if (navigator.onLine) {
				console.log("Conexión establecida.");
			} else {
				console.log("Conexión perdida. La página se recargará.");
				setTimeout(function() {
					location.reload();
				}, 3000);
			}
		}

	});

});