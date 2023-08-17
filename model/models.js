sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/odata/v2/ODataModel",
		"sap/ui/Device"
	], function (JSONModel, ODataModel, Device) {
		"use strict";

		return {
			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},
			
			createODataModel : function (sPath) {
				var oModel	 = new ODataModel(sPath);
				return oModel;
			},

			createFLPModel : function () {
				var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
					bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false,
					oModel = new JSONModel({
						isShareInJamActive: bIsShareInJamActive
					});
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			}
		};

	}
);