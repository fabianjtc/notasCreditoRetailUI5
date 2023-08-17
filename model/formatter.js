sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue, sCurr) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
			buzeiValue : function (sValue) {
				var value = Number(sValue);
				return value;	
			},
			
			//
			logIconColor : function (sMsgty) {
				if (sMsgty === "E") {
					return "Red";
				} else if (sMsgty === "W") {
					return "Yellow";
				} else {
					return "Green";
				}	
			},

			//
			logIcon : function (sMsgty) {
				if (sMsgty === "E") {
					return "sap-icon://message-error";
				} else if (sMsgty === "W") {
					return "sap-icon://message-warning";
				} else {
					return "sap-icon://message-success";
				}	
			},			
			//
			dateValue : function (sValue){
				var sSeparator = "/";
				return sValue.substring(0,4) + sSeparator  +
					sValue.substring(4,6) + sSeparator  +
					sValue.substring(6,8);
			},
			//
			dateValue1 : function (sValue){
				var sSeparator = "-";
				return sValue.substring(0,4) + sSeparator  +
					sValue.substring(4,6) + sSeparator  +
					sValue.substring(6,8);
			},
			//
			dateValue2 : function (sValue, sSeparator){
				return sValue.substring(0,4) + sSeparator  +
					sValue.substring(4,6) + sSeparator  +
					sValue.substring(6,8);
			}
			
		};
	}
);