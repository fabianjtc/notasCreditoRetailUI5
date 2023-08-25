/*global location */
/*master Branch*/
sap.ui.define([
	"zfisncv2/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"zfisncv2/model/formatter",
	"zfisncv2/model/models",
	"sap/m/Dialog",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	'sap/ui/core/BusyIndicator'

], function(BaseController, JSONModel, Filter, formatter, models, Dialog, ValueHelpDialog, BusyIndicator) {
	"use strict";
	var oValueHelpDialog = null;
	var oVista = null;

	return BaseController.extend("zfisncv2.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			var oControlModel = this._createControlModel();
			var oPeriodosModel = this._createPeriodosModel();

			this.setModel(oViewModel, "detailView");
			this.setModel(oControlModel, "controlModel");
			this.setModel(oPeriodosModel, "periodosModel");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			oVista = this.getView();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		onListUpdateFinishedLog: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("oModelLog");

			// only update the counter if the length is final
			if (this.byId("lineItemsListLog").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCountLog", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingLog");
				}
				oViewModel.setProperty("/lineItemListTitleLog", sTitle);
			}
		},

		//---------------------------------------
		// onEvents
		//---------------------------------------

		onExit: function() {
			if (this._aufnrHelpDialog) {
				this._aufnrHelpDialog.destroy();
			}
			if (this._segmentHelpDialog) {
				this._segmentHelpDialog.destroy();
			}
			if (this._waersHelpDialog) {
				this._waersHelpDialog.destroy();
			}
			/*			if (this._sgtxtHelpDialog) {
							this._sgtxtHelpDialog.destroy();
						}*/
			if (this._kostlHelpDialog) {
				this._kostlHelpDialog.destroy();
			}
			if (this._prctrHelpDialog) {
				this._prctrHelpDialog.destroy();
			}
			if (this._hbkidHelpDialog) {
				this._hbkidHelpDialog.destroy();
			}
			if (this._hktidHelpDialog) {
				this._hktidHelpDialog.destroy();
			}
			if (this._settingsDialog) {
				this._settingsDialog.destroy();
			}
		},

		onSearchBelnr: function(oEvent) {
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("bktxt", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilter.push(new Filter("sgtxt", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilter.push(new Filter("xblnr", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilter.push(new Filter("blart", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilter.push(new Filter("mwskz", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilter.push(new Filter("belnr", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			// filter binding
			var oTable = this.getView().byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);

		},

		onSelectionChange: function(oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var oItems = oEvent.getParameter("listItems");
			var i = 0;
			var oGridLog = this.byId("id_gridlog");
			var oGridDoc = this.byId("id_griddoc");
			var sPath = "";
			var vCantSel = oItems.length;

			if (bSelected && vCantSel === 1) {
				for (i = 0; i < oItems.length; i++) {
					sPath = oItems[i].getBindingContextPath();
					var oItem = this.getModel().getProperty(sPath);
					this._updateSelectedData(null, oItem, false);
				}
				this.updateButtonsSelected();
			} else {
				for (i = 0; i < oItems.length; i++) {
					sPath = oItems[i].getBindingContextPath();
					var oItemDel = this.getModel().getProperty(sPath);
					this._updateSelectedData(sPath, oItemDel, true);
				}
				this.updateButtonsSelected();
			}

			oGridLog.setVisible(false);
			oGridDoc.setVisible(false);
			this._calcularTotales(); // Calcula totales	
			// this._calcularTotalesLog(); // Calcula totales
		},

		onSelectionChangeLog: function(oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var oItems = oEvent.getParameter("listItems");
			var i = 0;
			var oGrid = this.byId("id_griddoc");
			var sPath = "";

			if (bSelected) {
				for (i = 0; i < oItems.length; i++) {
					sPath = oItems[i].getBindingContextPath();
					var oItem = this.getModel("oModelLog").getProperty(sPath);
					this._updateLogisticData(null, oItem, false);
				}
				this._updateButtons2(false, true, true, true, false);
			} else {
				for (i = 0; i < oItems.length; i++) {
					sPath = oItems[i].getBindingContextPath();
					var oItemDel = this.getModel("oModelLog").getProperty(sPath);
					this._updateLogisticData(sPath, oItemDel, true);
				}
				oGrid.setVisible(false);
				this._updateButtons2(false, false, false, false, false);
				this.cleanHeader();
			}

			var aDataSel = this.getModel("LogisticData").getData().Items;
			if (aDataSel.length > 0) {
				this._updateButtons2(false, true, true, true, false);
			}
			this._calcularTotalesLog(); // Calcula totales	
		},

		// Sumatoria del valor NC (nota credito)
		onLiveChange: function(oEvent) {
			var oValue = oEvent.getParameters("value");
			var oNewValue = oValue.value;
			var oAntValue = oEvent.getSource().getProperty("value");
			var oControl = this.getModel("controlModelLog");
			// var vNuevoWrbtr = oAntValue - oNewValue;
			var vNuevoWrbtr = 0;
			var vAntValue = oAntValue.replace('.', '') * 1;
			var vNewValue = oNewValue.replace('.', '') * 1;

			//Calcular total de posiciones logisticas seleccionadas
			var aDataSel = this.getModel("LogisticData").getData().Items;
			var aDataSelec = this.getModel("SelectedData").getData().Items.length;
			var iWrbtrTot = 0;
			var iWrbtr = 0;

			if (aDataSelec >= 1) {
				for (var i = 0; i < aDataSel.length; i++) {
					iWrbtr = aDataSel[i].valor_nc * 1;
					iWrbtrTot = iWrbtrTot + iWrbtr;
				}
			}

			vNuevoWrbtr = (iWrbtrTot - vAntValue) + vNewValue;

			oControl.setProperty("/wrbtrTotLog", vNuevoWrbtr);
		},

		// Validar cantidad
		onLiveMenge: function(oEvent) {
			var oValue = oEvent.getParameters();
			var vValue = oValue.value;
			var oTable = this.getView().byId("lineItemsListLog");
			var aClone = oValue.id.split("__");
			var vId = aClone[2];
			var oItems = oTable.mAggregations.items;
			var vCant = 0;

			for (var i = 0; i < oItems.length; i++) {
				var vItemId = oItems[i].sId;
				if (vItemId.includes(vId)) {
					vCant = oItems[i].mAggregations.cells[9].mProperties.number;
					break;
				}
			}

			if (vValue.includes(".")) {
				sap.m.MessageBox.error("Error de formato");
				sap.ui.getCore().byId(oValue.id).setValue(vCant);
			}

			if (parseInt(vValue) > parseInt(vCant)) {
				sap.m.MessageBox.error("La Cantidad NC no puede ser mayor a: " + vCant);
				sap.ui.getCore().byId(oValue.id).setValue(vCant);
			}
		},

		//Limpiar cabecera
		cleanHeader: function() {
			var headerData = {};
			this._updateHeaderData(headerData, false);

			var vendorData = {};
			this._updateVendorData(vendorData, false);

			this._updateItemsData("ItemsData", null, true);

		},

		// Limpiar posiciones logisticas
		cleanLogistic: function() {
			this._updateLogisticData("LogisticData", null, true);
		},

		// Actualizar botones
		updateButtonsSelected: function() {
			var vCantSel = this.getModel("SelectedData").getData().Items.length;
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			// var vCantSel = aSelectedData.length;

			if (vCantSel >= 1 && aSelectedData[0].flag === 'X') {
				this._updateButtons2(true, false, false, false, false);
			} else if (vCantSel === 1) {
				this._updateButtons2(false, true, true, true, false);
			} else {
				this._updateButtons2(false, false, false, false, false);
				this.cleanHeader();
				this.cleanLogistic();
			}
		},

		//
		handleSortConfirm: function(oEvent) {
			var oTable = this.getView().byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			var mParams = oEvent.getParameters();
			var sPath = mParams.sortItem.getKey();
			var bDescending = mParams.sortDescending;
			var aSorters = [];
			oBinding.sort(aSorters);
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			oBinding.sort(aSorters);
		},

		getGroup: function(oContext) {
			return oContext.getProperty('belnr');
		},

		getGroupHeader: function(oGroup) {

			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				press: "onPressGroup"
			});
		},

		onPressGroup: function(oEvent) {
			debugger;
		},

		//
		onBtnSort: function() {
			if (!this._settingsDialog) {
				this._settingsDialog = sap.ui.xmlfragment("zfisncv2.view.TableSettings", this);
			}
			this._settingsDialog.open();
		},

		//
		onBtnSortDocsLog: function() {
			if (!this._settingsDialog) {
				this._settingsDialog = sap.ui.xmlfragment("zfisncv2.view.SortDocsLogistics", this);
			}
			this._settingsDialog.open();
		},

		// Botn Log
		onBtnLog: function() {
			this.getRouter().navTo("logapp");
		},

		// Boton Refresh
		onBtnRefresh: function() {
			this._partidasRefresh();
		},
		


		// Boton "Detalle Logistico"
		onBtnDl: function(oEvent) {
			// var oVistaLog = null;
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			var vCantSel = aSelectedData.length;
			var oGrid = this.byId("id_gridlog");
			var newData = {};
			newData.ToDocsLogisticos = [];
			// var oModelLog = models.createDeviceModel();
			var oModelLog = this.getModel();
			var oControlModelLog = this._createControlModelLog();
			this.setModel(oControlModelLog, "controlModelLog");

			if (vCantSel >= 1 && this.validateSelection(aSelectedData) ) {
			

				/*				for (var i = 0; i < aSelectedData.length; i++) {
									var logistic = {};
									logistic.belnr = aSelectedData[i].belnr;
									logistic.gjahr = aSelectedData[i].gjahr;
									logistic.buzei = aSelectedData[i].buzei;
									logistic.bukrs = aSelectedData[i].bukrs;
									logistic.blart = aSelectedData[i].blart;
								}

								var sPath = "/PartidasSet(belnr='" + logistic.belnr + "\'," +
									"gjahr='" + logistic.gjahr + "\'," +
									"buzei='" + logistic.buzei + "\'," +
									"bukrs='" + logistic.bukrs + "\'," +
									"blart='" + logistic.blart + "')/ToDocsLogisticos"; 
				*/
				debugger;

				var sFilters = new Array();

				//				var sQuery = "";

				for (var i = 0; i < aSelectedData.length; i++) {

					//					if (i >= 1 ) {
					//						sQuery = sQuery + ' or ';
					//					}

					var vFilterKey = aSelectedData[i].bukrs + aSelectedData[i].belnr + aSelectedData[i].gjahr + aSelectedData[i].blart;
					//					sQuery = sQuery + "filterKey eq '" + vFilterKey + "\'";

					var oFilter = new sap.ui.model.Filter({
						path: "filterKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: vFilterKey
					});

					sFilters.push(oFilter);

				}
				var sPath = "/DocsLogisticosSet";

				var sthis = this;

				BusyIndicator.show();

				oModelLog.read(sPath, {
					filters: sFilters,
					success: function(oData) {
						var logisticJson = new JSONModel(oData);
						sthis.setModel(logisticJson, "oModelLog");
						BusyIndicator.hide();
					},
					error: function() {
						BusyIndicator.hide();
						this.fnErrorLog.bind(this);

					}
				});

				oGrid.setVisible(true);
				this._updateButtons2(false, false, false, false, false);
			}
			else { 	sap.m.MessageBox.error("Seleccione una única clase de documento"); }
		},
		
	validateSelection: function(aSelection)
		{
			var vReturn = true;
			var vFirstValue = aSelection[0].blart;
			
				for (var i = 1; i < aSelection.length; i++) {
				
					if ( aSelection[i].blart !== vFirstValue )
					{
						vReturn = false;
					}
					
				}
				
			return 	vReturn;
			
		},

		fnSuccessLog: function(oData, oResponse) {
			sap.m.MessageBox.success("Se encontraron documentos logísticos");
			this._partidasRefresh();
		},

		fnErrorLog: function(oError) {
			sap.m.MessageBox.error("ERROR no se encontraron documentos logísticos");
		},

		// Boton "Generar Factura de Cliente"
		onBtnFc: function(oEvent) {

			var oThis = this;

			var newData = {};
			newData.ToDocsLogisticos = [];
			var logisticos = [];
			var oModel = this.getModel();
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			var aLogisticData = this.getModel("LogisticData").getData().Items;
			var oTable = this.getView().byId("lineItemsListLog").mAggregations.items;
			var vCantSel = aSelectedData.length;

			if (oTable.length === aLogisticData.length) {
				if (vCantSel === 1) {
					for (var i = 0; i < aSelectedData.length; i++) {
						newData.lifnr = aSelectedData[i].lifnr;
						newData.bukrs = aSelectedData[i].bukrs;
						newData.belnr = aSelectedData[i].belnr;
						newData.gjahr = aSelectedData[i].gjahr;
						newData.buzei = aSelectedData[i].buzei;
						newData.blart = aSelectedData[i].blart;
					}
					newData.proceso = "1";
					for (var j = 0; j < aLogisticData.length; j++) {
						var logistic = {};
						logistic.bukrs = aLogisticData[j].bukrs;
						logistic.belnr = aLogisticData[j].belnr;
						logistic.gjahr = aLogisticData[j].gjahr;
						logistic.buzei = aLogisticData[j].buzei;
						logistic.ean11 = aLogisticData[j].ean11;
						logistic.bpmng = aLogisticData[j].bpmng;
						logistic.bprme = aLogisticData[j].bprme;
						logistic.txz01 = aLogisticData[j].txz01;
						logistic.netpr = aLogisticData[j].netpr;
						logistic.netwr = aLogisticData[j].netwr;
						logistic.menge = aLogisticData[j].menge;
						logistic.bstme = aLogisticData[j].bstme;
						logistic.mwskz = aLogisticData[j].mwskz;
						logistic.menge_nc = aLogisticData[j].menge_nc.toString();
						logistic.valor_nc = aLogisticData[j].valor_nc.toString();
						logistic.waers = aLogisticData[j].waers;
						logisticos.push(logistic);
					}

					var bPath = "/BloqueadoSet(Bukrs=" + "'" + newData.bukrs + "'," + "Konko=" + "'" + newData.lifnr + "')";

					oModel.read(bPath, {
						success: function(oData) {
							if (!oData.Block) {

								newData.ToDocsLogisticos = logisticos;
								oModel.create("/PartidasSet", newData, {
									success: oThis.fnSuccessFc.bind(oThis),
									error: oThis.fnErrorFc.bind(oThis)
								});

							} else {
								sap.m.MessageBox.error(oData.Messg);
							}
						}
					});

				} else {
					sap.m.MessageBox.success("Seleccionar solo una partida de acreedor");
				}
			} else {
				sap.m.MessageBox.success("Seleccionar todas las posiciones logisticas");
			}
		},

		//
		fnSuccessFc: function(oData, oResponse) {
			sap.m.MessageBox.success("Factura de Cliente Procesada, Revisar el Log");
			this._partidasRefresh();
		},
		//
		fnErrorFc: function(oError) {
			sap.m.MessageBox.error("ERROR al procesar Factura de Cliente, revisar el Log");
		},

		// Boton Generar Nota de Credito
		onBtnNc: function() {
			var oGrid = this.byId("id_griddoc");
			oGrid.setVisible(true);
			this._updateButtons2(false, false, false, false, true);
			this._readParameter("01");
			var bindingContext = this.getView().getBindingContext();
			var vCondPago = bindingContext.getProperty("zterm");
			this.getView().byId("id_izterm").setValue(vCondPago);
			var vViaPago = bindingContext.getProperty("zwels");
			this.getView().byId("id_izwels").setValue(vViaPago);
			var vIdBanco = bindingContext.getProperty("hbkid");
			this.getView().byId("id_ihbkid").setValue(vIdBanco);
			var vBlart = "KG"; //bindingContext.getProperty("blart");
			this.getView().byId("id_blart").setValue(vBlart);
			var vWaers = "PYG";
			this.getView().byId("id_waers").setValue(vWaers);
			var aSelectedData = this.getModel("SelectedData").getData().Items;

			if (aSelectedData[0].blart === 'K1' || aSelectedData[0].blart === 'K2') {
				this.getView().byId("id_prov_sgtxt").setValue(aSelectedData[0].bktxt);
			} else if (aSelectedData[0].blart === 'K4') {
				this.getView().byId("id_prov_sgtxt").setValue(aSelectedData[0].xblnr);
			}

			this.addItems();
		},

		addItems: function() {
			var aLogisticData = this.getModel("LogisticData").getData().Items;
			var iItemPos = parseInt(this._getLastItemPos(), 10);
			iItemPos += 10;
			var vTotC2 = 0;
			var vTotC1 = 0;
			var vTotC0 = 0;

			for (var j = 0; j < aLogisticData.length; j++) {
				if (aLogisticData[j].mwskz === 'C2') {
					vTotC2 = vTotC2 + parseFloat(aLogisticData[j].valor_nc);
				} else if (aLogisticData[j].mwskz === 'C1') {
					vTotC1 = vTotC1 + parseFloat(aLogisticData[j].valor_nc);
				} else if (aLogisticData[j].mwskz === 'C0') {
					vTotC0 = vTotC0 + parseFloat(aLogisticData[j].valor_nc);
				}
			}

			if (vTotC2 !== 0) {
				this.insertarItem('C2', vTotC2);
			}

			if (vTotC1 !== 0) {
				this.insertarItem('C1', vTotC1);
			}

			if (vTotC0 !== 0) {
				this.insertarItem('C0', vTotC0);
			}
		},

		insertarItem: function(sMwskz, sTotal) {
			var iItemPos = parseInt(this._getLastItemPos(), 10);
			iItemPos += 10;

			var newData = {
				buzei: iItemPos.toString(),
				wrbtr: "0",
				dmbtr: sTotal,
				mwskz: sMwskz,
				taxAmount: "0",
				taxAccount: "",
				kostl: "",
				aufnr: "",
				prctr: "",
				segment: "",
				zuonr: "",
				hkont: "1151000010",
				sgtxt: ""
			};
			this._updateItemsData(null, newData, false);
		},

		// Boton "Anular SNC"
		onBtnAnular: function() {
			this._reverseDialog();
		},

		//
		fnAnularPartidas: function(sText) {

			var oThis = this;

			var newData = {};
			newData.ToDocsLogisticos = [];
			var logisticos = [];
			var oModel = this.getModel();
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			var aLogisticData = this.getModel("LogisticData").getData().Items;
			for (var i = 0; i < aSelectedData.length; i++) {
				newData.lifnr = aSelectedData[i].lifnr;
				newData.bukrs = aSelectedData[i].bukrs;
				newData.belnr = aSelectedData[i].belnr;
				newData.gjahr = aSelectedData[i].gjahr;
				newData.buzei = aSelectedData[i].buzei;
				newData.blart = aSelectedData[i].blart;
			}
			newData.proceso = "2";
			for (var j = 0; j < aLogisticData.length; j++) {
				var logistic = {};
				logistic.bukrs = aLogisticData[j].bukrs;
				logistic.belnr = aLogisticData[j].belnr;
				logistic.gjahr = aLogisticData[j].gjahr;
				logistic.buzei = aLogisticData[j].buzei;
				logistic.ean11 = aLogisticData[j].ean11;
				logistic.bpmng = aLogisticData[j].bpmng;
				logistic.bprme = aLogisticData[j].bprme;
				logistic.txz01 = aLogisticData[j].txz01;
				logistic.netpr = aLogisticData[j].netpr;
				logistic.netwr = aLogisticData[j].netwr;
				logistic.menge = aLogisticData[j].menge;
				logistic.bstme = aLogisticData[j].bstme;
				logistic.mwskz = aLogisticData[j].mwskz;
				logistic.menge_nc = aLogisticData[j].menge_nc.toString();
				logistic.valor_nc = aLogisticData[j].valor_nc.toString();
				logistic.waers = aLogisticData[j].waers;
				logisticos.push(logistic);
			}

			var bPath = "/BloqueadoSet(Bukrs=" + "'" + newData.bukrs + "'," + "Konko=" + "'" + newData.lifnr + "')";

			oModel.read(bPath, {
				success: function(oData) {
					if (!oData.Block) {

						newData.ToDocsLogisticos = logisticos;
						oModel.create("/PartidasSet", newData, {
							success: oThis.fnSuccessAnul.bind(oThis),
							error: oThis.fnErrorAnul.bind(oThis)
						});

					} else {
						sap.m.MessageBox.error(oData.Messg);
					}
				}
			});

		},

		//	
		fnSuccessAnul: function(oData, oResponse) {
			sap.m.MessageBox.success("Facturas Anuladas, ver el log");
			this._partidasRefresh();
		},

		fnErrorAnul: function(oError) {
			sap.m.MessageBox.error("ERROR AL ANULAR FACTURAS, visualizar el log");
		},

		//
		onCheckTimbrado: function() {
			this._checkTimbrado();
		},

		//Boton contabilizar Nota de Credito
		onBtnContab: function() {

			var oThis = this;
			var oModel = this.getModel();
			var oHeaderData = this.getModel("HeaderData");
			var aSelectedData = this.getModel("SelectedData").getData().Items;


			var mParameters = {
				lifnr: aSelectedData[0].lifnr,
				blart: oHeaderData.getProperty("/blart"),
				timbrado: oHeaderData.getProperty("/timbrado"),
				bldat: oHeaderData.getProperty("/bldat") || ""
			};

			var bPath = "/BloqueadoSet(Bukrs=" + "'" + aSelectedData[0].bukrs + "'," + "Konko=" + "'" + aSelectedData[0].lifnr + "')";
			oModel.read(bPath, {
				success: function(oData) {
					if (!oData.Block) {

						bPath = "/TimbradoRefSet(Bukrs=" + "'" + aSelectedData[0].bukrs + "'," 
								+ "Xblnr=" + "'" + oHeaderData.getProperty("/xblnr") + "'," 
								+ "Timbrado=" + "'" + oHeaderData.getProperty("/timbrado") + "')" ;
								
						oModel.read(bPath, {
							success: function(oDataRef, oResponse) {
								if (!oDataRef.Exist) {
									
									oModel.callFunction("/Timbrado", {
										method: "GET",
										urlParameters: mParameters,
										success: function(oData, oResponse) {
											if (oResponse.data.type === "I") {

												// Campos Obligatorios
												var sField = oThis._checkObligatoryFields();

												// Verificacion de Datos obligatorios
												if (sField !== "OK") {

													sap.m.MessageBox.error("Ingrese todos los campos obligatorios:", {
														details: "Revisar: " + "(" + sField + ")" +
															", Importe" +
															", Fe.Contabilizacion" +
															", Fe.Documento" +
															", Periodo" +
															", Moneda" +
															", Clase de Documento" +
															", Referencia" +
															", Condicion de Pago" +
															", Timbrado" +
															", Indicador de Impuestos"
													});

												} else {

													var aActions = [];
													var sMessage = "";
													// var sDifParam = this.getModel("ControlData").getProperty("/dif");
													// var iDifParam = sDifParam * 1; //Parametro diferencia
													// var iWrbtrSeleAbs = Math.abs(iWrbtrSele); // Total seleccionado
													// var iWrbtrDif = iWrbtr - iWrbtrSeleAbs; // Diferencia entre Total seleccionado y el Asiento
													// var iWrbtrDifAbs = Math.abs(iWrbtrDif); // Diferencia en valor absoluto
													var aImports = oThis.fnCallImports();

													/*if( iWrbtr !== Math.abs(iWrbtrSele) ) {*/
													// if (iWrbtrDifAbs >= iDifParam) {
													if (aImports.vStatus === "2") {
														aActions = ["Generar Factura", "Generar SNC", "Continuar", "Cancelar"];
														sMessage = "El importe ingresado no es igual al de la Solicitud de Nota de Crédito" +
															": " + aImports.vTotSinIvaNC + " < " + aImports.vTotImport + " (" + aImports.vDifeToleran + ")";
														// ": " + iWrbtr + " <> " + iWrbtrSele + " (" + iDifParam + ")";
													} else {
														aActions = ["Continuar", "Cancelar"];
														sMessage = "Va a Contabilizar NC de Proveedor";
													}

													sap.m.MessageBox.show(
														sMessage, {
															icon: sap.m.MessageBox.Icon.INFORMATION,
															title: "Solicitud de nota de Credito",
															onClose: oThis.onClose.bind(oThis),
															actions: aActions,
															initialFocus: "Cancelar"
														}
													);
												}

											} else {
												sap.m.MessageBox.error(oResponse.data.message);
											}
										},
										error: function(oData) {
											sap.m.MessageBox.error("No se puede verificar el timbrado");
										}
									});

								} else {
									sap.m.MessageBox.error(oDataRef.Messg);
								}
							},
							error: function(oDataRef, oResponse){
								oThis.fnErrorLog.bind(oThis);
							}

						});

					} else {
						sap.m.MessageBox.error(oData.Messg);
					}
				}
			});

		},

		// Obtener valor de tolerancia
		fnValorTolerancia: function() {
			var oModelToleran = this.getModel();
			var sthis = this;
			oModelToleran.read("/ToleranciaSet", {
				success: function(oData) {
					var toleranJson = new JSONModel(oData);
					sthis.setModel(toleranJson, "oModelToleran");
				},
				error: function() {
					this.fnErrorLog.bind(this);
				}
			});
		},

		//Determinar si es mayor o menor valor
		fnCallImports: function() {
			var aLogisticData = this.getModel("LogisticData").getData().Items;
			// var aSelectedData = this.getModel("SelectedData").getData().Items;
			// var oTable = this.getView().byId("lineItemsListLog");
			var oModelLog = this.getModel("oModelLog").getData().results;
			// var oItems = oTable.mAggregations.items;
			var aImports = {};
			var vTotSinIvaNC = 0; //Total ValorNC sin iva
			var vTotImport = 0; //Total importe sin iva
			var vStatus = 0;
			var vDifeToleran = 0;
			var vValor_nc;

			for (var i = 0; i < oModelLog.length; i++) {
				vValor_nc = oModelLog[i].valor_nc;
				for (var x = 0; x < aLogisticData.length; x++) {
					if (aLogisticData[x].ean11 === oModelLog[i].ean11) {
						oModelLog[i].valor_nc = vValor_nc;
						break;
					} else {
						oModelLog[i].valor_nc = 0;
					}
				}
				// aLogisticData.push(oModelLog[i]);
			}

			for (var j = 0; j < oModelLog.length; j++) {
				vTotImport = vTotImport + parseFloat(oModelLog[j].netwr);

				if (oModelLog[j].mwskz === 'C1') {
					vTotSinIvaNC = vTotSinIvaNC + (parseFloat(oModelLog[j].valor_nc) / 1.05);
				} else if (oModelLog[j].mwskz === 'C2') {
					vTotSinIvaNC = vTotSinIvaNC + (parseFloat(oModelLog[j].valor_nc) / 1.10);
				} else {
					vTotSinIvaNC = vTotSinIvaNC + parseFloat(oModelLog[j].valor_nc); // 08.08.2023 add FTRIVIÑO
				}
			}

			var vValorToleran = this.getModel("oModelToleran").oData.results[0].valor_tolerancia;

			if (vTotSinIvaNC >= vTotImport) { // Mayor Valor
				vStatus = "1";
			} else if (vTotSinIvaNC < vTotImport) { // Menor Valor
				vDifeToleran = Math.abs(vTotImport) - Math.abs(vTotSinIvaNC); //diferencia de importes
				if (vDifeToleran > vValorToleran) {
					vStatus = "2"; //si la diferencia es mayor al valor de tolerancia
				} else {
					vStatus = "1";
				}
			}

			aImports.vTotSinIvaNC = parseInt(vTotSinIvaNC);
			aImports.vTotImport = parseInt(vTotImport);
			aImports.vStatus = vStatus;
			aImports.vDifeToleran = parseInt(vDifeToleran);

			return aImports;
		},

		//
		onClose: function(oAction) {

			var oThis = this;

			if (oAction === "Cancelar") {
				//sap.m.MessageBox.information("Accion Cancelada");
			} else {
				// Arma el documento a enviar
				var newDocument = this._armarDocumento();
				//

				var oModel = this.getModel();

				switch (oAction) {
					case "Generar Factura":
						// Genera NC, genera FC por la diferencia
						newDocument.proceso = "4";

						// ADD FTRIVIÑO 09.08.2023
						var bPath = "/AutorizacionSet(Bukrs=" + "'" + newDocument.bukrs + "'," + "Button=" + "'" + "GEN_FSAL" + "')";

						oModel.read(bPath, {
							success: function(oData, oResponse) {
								if (oData.Autho) {
									oModel.create("/DocheaderSet", newDocument, {
										success: oThis.fnSuccessNc.bind(oThis),
										error: oThis.fnErrorNc.bind(oThis)
									});
								} else {
									sap.m.MessageBox.error("ERROR al procesar NC de Proveedor, No cuenta con autorizacion para facturar");
								}
							}
						});

						break;

					case "Generar SNC":
						// Genera NC, genera SNC por la diferencia
						newDocument.proceso = "5";

						oModel.create("/DocheaderSet", newDocument, {
							success: this.fnSuccessNc.bind(this),
							error: this.fnErrorNc.bind(this)
						});

						break;
					case "Continuar":
						// Genera NC, no importa la diferencia
						newDocument.proceso = "6";

						oModel.create("/DocheaderSet", newDocument, {
							success: this.fnSuccessNc.bind(this),
							error: this.fnErrorNc.bind(this)
						});

						break;
				}
				//

			}
		},

		//
		fnSuccessNc: function(oData, oResponse) {
			sap.m.MessageBox.success("NC de Proveedor procesada, Revisar el log");
			this._partidasRefresh();
		},

		// 
		fnErrorNc: function(oError) {
			sap.m.MessageBox.error("ERROR al procesar NC de Proveedor, Revisar el log");
		},

		//
		onItemsAdd: function() {

			var iItemPos = parseInt(this._getLastItemPos(), 10);
			iItemPos += 10;

			var newData = {
				buzei: iItemPos.toString(),
				wrbtr: "0",
				dmbtr: "0",
				mwskz: "",
				taxAmount: "0",
				taxAccount: "",
				kostl: "",
				aufnr: "",
				prctr: "",
				segment: "",
				zuonr: "",
				hkont: "1151000010",
				sgtxt: ""
			};
			this._updateItemsData(null, newData, false);
		},

		//
		onItemsDelete: function(oEvent) {
			var oItem = oEvent.getParameters("listItem");
			var sPath = oItem.listItem.getBindingContextPath();
			this._updateItemsData(sPath, null, true);
		},

		//
		onItemsUpdateFinished: function(oEvent) {
			var oControlModel = this.getModel("controlModel");
			var oVendorData = this.getModel("VendorData");
			var iWrbtrItems = this._calcularTotalItems();
			var iAmountVendor = oVendorData.getProperty("/wrbtr");
			var iSaldo = iAmountVendor - iWrbtrItems;

			oControlModel.setProperty("/wrbtrTotItems", iWrbtrItems);
			oControlModel.setProperty("/wrbtrDif", iSaldo);
		},

		//
		onChangeHbkid: function(oEvent) {
			/*			var sValue = oEvent.getParameter("value");
						var aValues = sValue.split("-");
						var vendorData = {
							hktid: aValues[1]
						};
						this._updateVendorData(vendorData, true);*/
		},

		onChangeHktid: function(oEvent) {
			/*			var sValue = oEvent.getParameter("value");
						var aValues = sValue.split("-");
						var vendorData = {
							hktid: aValues[1]
						};
						this._updateVendorData(vendorData, true);*/
		},

		//
		onAmountItemChange: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var iWrbtrItems = 0;
			var oVendorData = this.getModel("VendorData");
			var oControlModel = this.getModel("controlModel");
			var iWrbtrVendor = oVendorData.getProperty("/wrbtr");

			if (!sValue || sValue <= 0) {
				iWrbtrItems = oControlModel.getProperty("/wrbtrTotItems");
			} else {
				iWrbtrItems = this._calcularTotalItems();
			}
			var iWrbtrDif = iWrbtrVendor - iWrbtrItems;
			oControlModel.setProperty("/wrbtrTotItems", iWrbtrItems);
			oControlModel.setProperty("/wrbtrDif", iWrbtrDif);
		},

		//	
		onVendorAmountChange: function(oEvent) {

			var iAmount = this.getModel("VendorData").getProperty("/wrbtr");
			var iTotalItems = this._calcularTotalItems();
			var oControlModel = this.getModel("controlModel");
			var iSaldo = iAmount - iTotalItems;
			oControlModel.setProperty("/wrbtrDif", iSaldo);
			oControlModel.setProperty("/wrbtrTotItems", iTotalItems);

		},

		onChangeBudat: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var sMonat = sValue.substring(4, 6);
			this.getModel("HeaderData").setProperty("/monat", sMonat);
		},

		//---------------------------------------
		// Value Help Methods
		//---------------------------------------

		// Prctr Help
		prctrValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._prctrHelpDialog) {
				this._prctrHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpPrctr", this);
				this.getView().addDependent(this._prctrHelpDialog);
			}
			// create a filter for the binding
			this._prctrHelpDialog.getBinding("items").filter(
				[new Filter("prctr", sap.ui.model.FilterOperator.Contains, sInputValue)]);
			// open value help dialog filtered by the input value
			this._prctrHelpDialog.open(sInputValue);
		},

		// Kostl Help
		kostlValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._kostlHelpDialog) {
				this._kostlHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpKostl", this);
				this.getView().addDependent(this._kostlHelpDialog);
			}
			// create a filter for the binding
			this._kostlHelpDialog.getBinding("items").filter(
				[new Filter("kostl", sap.ui.model.FilterOperator.Contains, sInputValue)]);
			// open value help dialog filtered by the input value
			this._kostlHelpDialog.open(sInputValue);
		},

		// Waers Help
		waersValueHelp: function(oEvent) {

			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._waersHelpDialog) {
				this._waersHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpWaers", this);
				this.getView().addDependent(this._waersHelpDialog);
			}

			// create a filter for the binding
			this._waersHelpDialog.getBinding("items").filter(
				[new Filter("waers", sap.ui.model.FilterOperator.Contains, sInputValue)]);

			// open value help dialog filtered by the input value
			this._waersHelpDialog.open(sInputValue);

		},

		// Segment Help
		segmentValueHelp: function(oEvent) {

			var aFilters = [];
			var oFilter = {};

			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._segmentHelpDialog) {
				this._segmentHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpSegment", this);
				this.getView().addDependent(this._segmentHelpDialog);
			}

			oFilter = new Filter("saknr", sap.ui.model.FilterOperator.Contains, sInputValue);
			aFilters.push(oFilter);

			oFilter = new Filter("txt20", sap.ui.model.FilterOperator.Contains, sInputValue);
			aFilters.push(oFilter);

			this._segmentHelpDialog.getBinding("items").filter(aFilters);

			// open value help dialog filtered by the input value
			this._segmentHelpDialog.open(sInputValue);

		},

		// Aufnr Help
		aufnrValueHelp: function(oEvent) {

			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._aufnrHelpDialog) {
				this._aufnrHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpAufnr", this);
				this.getView().addDependent(this._aufnrHelpDialog);
			}

			// create a filter for the binding
			this._aufnrHelpDialog.getBinding("items").filter(
				[new Filter("aufnr", sap.ui.model.FilterOperator.Contains, sInputValue)]);

			// open value help dialog filtered by the input value
			this._aufnrHelpDialog.open(sInputValue);

		},

		sgtxtValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._sgtxtHelpDialog) {
				this._sgtxtHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpSgtxt", this);
				this.getView().addDependent(this._sgtxtHelpDialog);
			}

			// create a filter for the binding
			this._sgtxtHelpDialog.getBinding("items").filter(
				[new Filter("sgtxt", sap.ui.model.FilterOperator.Contains, sInputValue)]);

			// open value help dialog filtered by the input value
			this._sgtxtHelpDialog.open(sInputValue);
		},

		hbkidValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._hbkidHelpDialog) {
				this._hbkidHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpHbkid", this);
				this.getView().addDependent(this._hbkidHelpDialog);
			}

			// create a filter for the binding
			this._hbkidHelpDialog.getBinding("items").filter(
				[new Filter("hbkid", sap.ui.model.FilterOperator.Contains, sInputValue)]);

			// open value help dialog filtered by the input value
			this._hbkidHelpDialog.open(sInputValue);
		},

		hktidValueHelp: function(oEvent) {
			var aFilters = [];
			var oFilter = {};

			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._hktidHelpDialog) {
				this._hktidHelpDialog = sap.ui.xmlfragment("zfisncv2.view.ValueHelpHktid", this);
				this.getView().addDependent(this._hktidHelpDialog);
			}

			// create a filter for the binding
			var vHbkid = this.getView().byId("id_ihbkid").getValue();
			oFilter = new Filter("hbkid", sap.ui.model.FilterOperator.Contains, vHbkid);
			aFilters.push(oFilter);

			oFilter = new Filter("hktid", sap.ui.model.FilterOperator.Contains, sInputValue);
			aFilters.push(oFilter);

			this._hktidHelpDialog.getBinding("items").filter(aFilters);

			// open value help dialog filtered by the input value
			this._hktidHelpDialog.open(sInputValue);
		},
		//---------------------------------------
		// Internal Methods Help
		//---------------------------------------

		// Prctr Search
		_prctrValueHelpSearch: function(oEvent) {

			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			aFilters.push(new Filter("prctr", sap.ui.model.FilterOperator.Contains, sValue));
			aFilters.push(new Filter("ktext", sap.ui.model.FilterOperator.Contains, sValue));
			oEvent.getSource().getBinding("items").filter(aFilters);

		},

		//Prctr Close
		_prctrValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		// Kostl
		_kostlValueHelpSearch: function(oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			aFilters.push(new Filter("kostl", sap.ui.model.FilterOperator.Contains, sValue));
			aFilters.push(new Filter("ktext", sap.ui.model.FilterOperator.Contains, sValue));
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		//Prctr
		_kostlValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		_sgtxtValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("sgtxt", sap.ui.model.FilterOperator.Contains, sValue);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_sgtxtValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getDescription());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		_hbkidValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("hbkid", sap.ui.model.FilterOperator.Contains, sValue);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_hbkidValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		_hktidValueHelpSearch: function(oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			aFilters.push(new Filter("hktid", sap.ui.model.FilterOperator.Contains, sValue));

			var vHbkid = this.getView().byId("id_ihbkid").getValue();
			aFilters.push(new Filter("hbkid", sap.ui.model.FilterOperator.Contains, vHbkid));
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		_hktidValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		// Waers
		_waersValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("waers", sap.ui.model.FilterOperator.Contains, sValue);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		//Prctr
		_waersValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		// Segment Search
		_segmentValueHelpSearch: function(oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			aFilters.push(new Filter("saknr", sap.ui.model.FilterOperator.Contains, sValue));
			aFilters.push(new Filter("txt20", sap.ui.model.FilterOperator.Contains, sValue));
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		//Segment Close
		_segmentValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		// Aufnr Search
		_aufnrValueHelpSearch: function(oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			aFilters.push(new Filter("aufnr", sap.ui.model.FilterOperator.Contains, sValue));
			aFilters.push(new Filter("ktext", sap.ui.model.FilterOperator.Contains, sValue));
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		//Aufnr Close
		_aufnrValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var inputField = this.getView().byId(this.inputId);
				inputField.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		//---------------------------------------
		// Internal Methods 
		//---------------------------------------

		_checkObligatoryFields: function() {

			// Cabecera
			var oHeaderData = this.getModel("HeaderData");
			var sBlart = oHeaderData.getProperty("/blart");
			if (!sBlart) {
				return "Clase de Documento";
			}
			var sWaers = oHeaderData.getProperty("/waers");
			if (!sWaers) {
				return "Moneda";
			}

			var sXblnr = oHeaderData.getProperty("/xblnr");
			if (!sXblnr) {
				return "Referencia";
			} else if (sBlart === 'KG') {
				var arr = sXblnr.split('-');
				var vCant = arr.length;
				if (vCant !== 3) {
					return "Formato de Referencia no valido";
				}

				for (var i = 0; i < arr.length; i++) {
					if (/^\d+$/.test(arr[i])) {
						switch (i) {
							case 0 || 1:
								var len1 = arr[i].length;
								if (len1 !== 3) {
									return "Formato de Referencia no valido";
								}
								break;
							case 2:
								var len3 = arr[i].length;
								if (len3 !== 7) {
									return "Formato de Referencia no valido";
								}
								break;
							default:
						}
					}
				}
				// return "Fortmato de Referencia no valido";
			}

			var sBudat = oHeaderData.getProperty("/budat");
			if (!sBudat) {
				return "Fe.contabilizacion";
			}
			var sBldat = oHeaderData.getProperty("/bldat");
			if (!sBldat) {
				return "Fe.Documento";
			}
			var sMonat = oHeaderData.getProperty("/monat");
			if (!sMonat) {
				return "Periodo";
			}
			var sTimbrado = oHeaderData.getProperty("/timbrado");
			if (!sTimbrado) {
				return "Timbrado";
			}
			// Posicion Acreedor
			var oVendorData = this.getModel("VendorData");
			var iWrbtr = oVendorData.getProperty("/wrbtr");
			if (iWrbtr === 0) {
				return "Importe";
			}
			/*			if (!oVendorData.getProperty("/sgtxt")) {
							return "Texto Posición Proveedor";
						}*/
			if (!oVendorData.getProperty("/zterm")) {
				return "Condicion de Pago";
			}
			// Posiciones de Mayor e Impuestos
			var sMwskz = "S";
			var aItems = [];
			aItems = this.getModel("ItemsData").getData().Items;
			for (var x = 0; x < aItems.length && sMwskz === "S"; x++) {
				if (aItems[x].mwskz === "") {
					sMwskz = "N";
				}
			}
			if (sMwskz === "N") {
				return "Indicador de Impuesto";
			}
			return "OK";
		},

		onCalculateTax: function(oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContextPath(); // "/Items/0"
			this._calcultateTax(sPath);
		},

		_calcultateTax: function(sPath) {
			var oModel = this.getModel();
			var oItemsData = this.getModel("ItemsData");
			var oHeaderData = this.getModel("HeaderData");
			var aSelectedData = this.getModel("SelectedData").getData().Items;

			var sBuzei = oItemsData.getProperty(sPath).buzei;
			var iAmount = oItemsData.getProperty(sPath).dmbtr;
			var sMwskz = oItemsData.getProperty(sPath).mwskz;
			var sBukrs = aSelectedData[0].bukrs;
			var sWaers = oHeaderData.getProperty("/waers");

			if (iAmount === 0 || sMwskz === "") {
				return;
			}

			var mParameters = {
				bukrs: sBukrs,
				mwskz: sMwskz,
				waers: sWaers,
				buzei: sBuzei,
				dmbtr: iAmount
			};

			function fnError() {
				sap.m.MessageToast.show("No se puede calcular el impuesto");
			}

			function fnSuccess(oData, oResponse) {
				var sPath2 = sPath + "/taxAmount";
				var sValue = oResponse.data.taxAmount;
				this.getModel("ItemsData").setProperty(sPath2, sValue);
			}

			oModel.callFunction("/CalculateTax", {
				method: "GET",
				urlParameters: mParameters,
				success: fnSuccess.bind(this),
				error: fnError.bind(this)
			});

		},

		//
		_readParameter: function(sParam) {
			var oModel = this.getModel();
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			var sBukrs = aSelectedData[0].bukrs;

			var mParameters = {
				bukrs: sBukrs,
				parametro: sParam
			};

			function fnErrorParam() {
				//sap.m.MessageToast.show("No leyo parametro" + sParam);
				var sValue = 0;
				this.getModel("ControlData").setProperty("/dif", sValue);
			}

			function fnSuccessParam(oData, oResponse) {
				//sap.m.MessageToast.show("diferencia" + sValue);
				var sValue = oResponse.data.message;
				this.getModel("ControlData").setProperty("/dif", sValue);
			}

			oModel.callFunction("/LeerParametro", {
				method: "GET",
				urlParameters: mParameters,
				success: fnSuccessParam.bind(this),
				error: fnErrorParam.bind(this)
			});
		},

		//
		_checkTimbrado: function() {
			var oModel = this.getModel();
			var oHeaderData = this.getModel("HeaderData");
			var aSelectedData = this.getModel("SelectedData").getData().Items;

			var mParameters = {
				lifnr: aSelectedData[0].lifnr,
				blart: oHeaderData.getProperty("/blart"),
				timbrado: oHeaderData.getProperty("/timbrado"),
				bldat: oHeaderData.getProperty("/bldat") || ""
			};

			oModel.callFunction("/Timbrado", {
				method: "GET",
				urlParameters: mParameters,
				success: function(oData, oResponse) {
					if (oResponse.data.type === "I") {
						sap.m.MessageBox.information(oResponse.data.message);
					} else {
						sap.m.MessageBox.error(oResponse.data.message);
					}
				},
				error: function(oData, oResponse) {
					sap.m.MessageBox.error("No se puede verificar el timbrado");
				}
			});
		},

		//Actualiza el estado de los datos en la vista
		_updateDocData: function() {
			var iLen = this.getModel("controlModel").getData().cantSele;
			//Si no hay items seleccionados 
			if (iLen === 0) {
				var oGrid = this.byId("id_griddoc");
				var oGridLog = this.byId("id_gridlog");
				oGrid.setVisible(false);
				oGridLog.setVisible(false);
			} else {
				var oSelectedData = this.getModel("SelectedData");
				var oData = oSelectedData.getData();
				var aData = oData.Items;
				//Actualizo datos de cabecera
				var headerData = {
					bukrs: aData[0].bukrs,
					gjahr: aData[0].gjahr,
					blart: "KG",
					waers: "PYG"
				};
				this._updateHeaderData(headerData, true);
			}
		},

		// 
		_partidasRefresh: function() {
			this.byId("lineItemsList").getBinding("items").refresh(true);
			this._updateSelectedData("SelectedData", null, true);
			this.byId("lineItemsListLog").getBinding("items").refresh(true);
			this._updateLogisticData("LogisticData", null, true);
			this._calcularTotales();
			this._calcularTotalesLog();
		},

		//
		_updateButtons2: function(bDl, bFc, bNc, bSn, bCo) {

			var oModel = this.getModel();
			var bBukrs = this.byId("objectHeader").getBinding("title").aValues[1];

			var oBtndl = this.byId("id_btndl");
			var oBtnfc = this.byId("id_btnfc");
			var oBtnnc = this.byId("id_btnnc");
			var oBtnsn = this.byId("id_btnsn");
			var oBtnco = this.byId("id_btnco");

			oBtndl.setEnabled(bDl);
			// ADD FTRIVIÑO 09.08.2023
			//AutorizacionSet(Bukrs='PY44',Button='ANU_SNC')
			var bPath = "/AutorizacionSet(Bukrs=" + "'" + bBukrs + "'," + "Button=" + "'" + "GEN_FTOT" + "')";

			oModel.read(bPath, {
				success: function(oData, oResponse) {
					if (oData.Autho) {
						oBtnfc.setEnabled(bFc);
					}
				}
			});

			oBtnnc.setEnabled(bNc);

			// ADD FTRIVIÑO 09.08.2023
			bPath = "/AutorizacionSet(Bukrs=" + "'" + bBukrs + "'," + "Button=" + "'" + "ANU_SNC" + "')";

			oModel.read(bPath, {
				success: function(oData, oResponse) {
					if (oData.Autho) {
						oBtnsn.setEnabled(bSn);
					}
				}
			});

			oBtnco.setEnabled(bCo);
		},

		//Actualiza el estado de los botones			
		_updateButtons: function() {
			var oGrid = this.byId("id_griddoc");

			if (oGrid.getVisible()) {
				return;
			}

			var iLen = this.getModel("controlModel").getData().cantSele;
			var oBtndl = this.byId("id_btndl");
			var oBtnfc = this.byId("id_btnfc");
			var oBtnnc = this.byId("id_btnnc");
			var oBtnsn = this.byId("id_btnsn");
			var oBtnco = this.byId("id_btnco");

			if (iLen === 1) {
				oBtndl.setEnabled(true);
				oBtnfc.setEnabled(false);
				oBtnnc.setEnabled(false);
				oBtnsn.setEnabled(false);
				oBtnco.setEnabled(false);
			} else {
				oBtndl.setEnabled(false);
				oBtnfc.setEnabled(false);
				oBtnnc.setEnabled(false);
				oBtnsn.setEnabled(false);
				oBtnco.setEnabled(false);
			}

		},

		//Actualiza el estado de los botones			
		_updateButtonsLog: function() {
			var oGrid = this.byId("id_gridlog");

			if (oGrid.getVisible()) {
				return;
			}

			var oBtndl = this.byId("id_btndl");
			var oBtnfc = this.byId("id_btnfc");
			var oBtnnc = this.byId("id_btnnc");
			var oBtnsn = this.byId("id_btnsn");
			var oBtnco = this.byId("id_btnco");

			oBtndl.setEnabled(false);
			oBtnfc.setEnabled(true);
			oBtnnc.setEnabled(true);
			oBtnsn.setEnabled(true);
			oBtnco.setEnabled(true);

		},

		// Actualiza las partidas seleccionadas
		_updateSelectedData: function(sPath, data, bDelete) {
			var oModel = this.getModel("SelectedData");
			var oData = oModel.getData();
			var aData = oData.Items;
			var i = 0;

			if (sPath && bDelete) {
				if (sPath === "SelectedData") {
					// Delete all elements
					aData.splice(0, aData.length);
					oModel.refresh(true);
				} else {
					//Delete entry
					for (i = 0; i < aData.length; i++) {
						if (aData[i].belnr === data.belnr) {
							aData.splice(i, 1);
						}
					}
					oModel.setData(oData);
				}
			} else if (sPath) {
				//Update model
				oModel.setProperty(sPath, data);
			} else {
				//Add new line
				aData.push(data);
				oModel.setData(oData);
			}
		},

		_updateLogisticData: function(sPath, data, bDelete) {
			var oModel = this.getModel("LogisticData");
			var oData = oModel.getData();
			var aData = oData.Items;
			var i = 0;

			if (sPath && bDelete) {
				if (sPath === "LogisticData") {
					// Delete all elements
					aData.splice(0, aData.length);
					oModel.refresh(true);
				} else {
					//Delete entry
					for (i = 0; i < aData.length; i++) {
						if (aData[i].ean11 === data.ean11) {
							aData.splice(i, 1);
						}
					}
					oModel.setData(oData);
				}
			} else if (sPath) {
				//Update model
				oModel.setProperty(sPath, data);
			} else {
				//Add new line
				aData.push(data);
				oModel.setData(oData);
			}
		},

		//
		_updateLogData: function() {
			var aDataSel = this.getModel("LogisticData");
			aDataSel.setData(aDataSel, false);
		},

		//
		_updateHeaderData: function(headerData, bMerge) {
			var oHeaderData = this.getModel("HeaderData");
			oHeaderData.setData(headerData, bMerge);
		},

		//
		_updateVendorData: function(vendorData, bMerge) {
			var oVendorData = this.getModel("VendorData");
			oVendorData.setData(vendorData, bMerge);
		},

		// Actualiza items data
		_updateItemsData: function(sPath, data, bDelete) {
			var oModelItems = this.getModel("ItemsData");
			var oDataItems = oModelItems.getData();
			var aDataItems = oDataItems.Items;

			if (sPath && bDelete) {
				if (sPath === "ItemsData") {
					// Delete all entries
					aDataItems.splice(0, aDataItems.length);
					oModelItems.refresh(true);
				} else {
					//Delete one entry
					var iIndex = sPath.substr(7);
					aDataItems.splice(iIndex, 1);
					oModelItems.setData(oDataItems);
				}
			} else if (sPath) {
				//Update Model path
				oModelItems.setProperty(sPath, data);
			} else {
				//Add new data
				aDataItems.push(data);
				oModelItems.setData(oDataItems);
			}
		},

		//	
		_getLastItemPos: function() {
			var oModelItems = this.getModel("ItemsData");
			var oDataItems = oModelItems.getData();
			var aDataItems = oDataItems.Items;
			var iPos = aDataItems.length - 1;

			if (iPos < 0) {
				return 0;
			} else {
				return aDataItems[iPos].buzei;
			}
		},

		// Calcula total de Items ingresados manualmente 
		_calcularTotalItems: function() {
			var oModelItems = this.getModel("ItemsData");
			var oDataItems = oModelItems.getData();
			var aDataItems = oDataItems.Items;
			var iTotal = 0;
			var iAux = 0;

			for (var i = 0; i < aDataItems.length; i++) {
				if (aDataItems[i].dmbtr >= 0) {
					iAux = aDataItems[i].dmbtr * 1;
					iTotal += iAux;
				}
			}
			return iTotal;
		},

		//Calcula el total de las partidas seleccionadas
		_calcularTotalSeleccionado: function() {
			//Calcular total de partidas seleccionadas
			var aDataSel = this.getModel("SelectedData").getData().Items;
			var iWrbtrTot = 0;
			var iWrbtr = 0;
			for (var i = 0; i < aDataSel.length; i++) {
				iWrbtr = aDataSel[i].dmbtr * 1;
				iWrbtrTot = iWrbtrTot + iWrbtr;
			}
			return iWrbtrTot;
		},

		//Calcula el Valor NC total de las posiciones logisticas seleccionadas
		_calcularTotalSeleccionadoLog: function() {
			//Calcular total de posiciones logisticas seleccionadas
			var aDataSel = this.getModel("LogisticData").getData().Items;
			var aDataSelec = this.getModel("SelectedData").getData().Items.length;
			var iWrbtrTot = 0;
			var iWrbtr = 0;

			if (aDataSelec >= 1) {
				for (var i = 0; i < aDataSel.length; i++) {
					iWrbtr = aDataSel[i].valor_nc * 1;
					iWrbtrTot = iWrbtrTot + iWrbtr;
				}
			}
			return iWrbtrTot;
		},

		//Calcula la cantidad de partidas seleccionadas
		_calcularCantidadSeleccionado: function() {
			return this.getModel("SelectedData").getData().Items.length;
		},

		//Calcula la cantidad de docs logisticos seleccionados
		_calcularCantidadSeleccionadoLog: function() {
			var aDataSelec = this.getModel("SelectedData").getData().Items.length;

			if (aDataSelec >= 1) {
				return this.getModel("LogisticData").getData().Items.length;
			} else {
				return 0;
			}
		},

		/**
		 *
		 * Calcula total de las partidas seleccionadas
		 * Calcula toal ingresado para la nc
		 * Calcula el saldo
		 */
		_calcularTotales: function() {
			var aDataSel = this.getModel("SelectedData").getData().Items;
			var oControl = this.getModel("controlModel");
			oControl.setProperty("/wrbtrTot", this._calcularTotalSeleccionado());
			oControl.setProperty("/cantSele", this._calcularCantidadSeleccionado());
			oControl.setProperty("/waers", (aDataSel.length > 0 ? aDataSel[0].waers : "PYG"));
		},

		_calcularTotalesLog: function() {
			var aDataSel = this.getModel("LogisticData").getData().Items;
			var oControl = this.getModel("controlModelLog");
			oControl.setProperty("/wrbtrTotLog", this._calcularTotalSeleccionadoLog());
			oControl.setProperty("/cantSeleLog", this._calcularCantidadSeleccionadoLog());
			oControl.setProperty("/waers", (aDataSel.length > 0 ? aDataSel[0].waers : "PYG"));
		},

		// Arma el documento a generar, cabecera y posiciones
		_armarDocumento: function() {
			// Armo la cabecera del documento
			var newDocument = {};
			newDocument.ToDocitems = [];
			newDocument.ToDocLogist = [];

			//Cabecera de documento
			newDocument = this._armarCabecera();

			// Armo la posicion de proveeedor
			var vendorPos = {};
			vendorPos = this._armarPosProveedor();

			// Armo las posiciones: Agrego Items ingresados manualmente
			var aItems = [];
			var aItemsTmp = [];
			aItemsTmp = this.getModel("ItemsData").getData().Items;
			aItems = aItemsTmp.slice();
			for (var x = 0; x < aItems.length; x++) {
				aItems[x].dmbtr = aItems[x].dmbtr.toString();
				aItems[x].taxAmount = aItems[x].taxAmount.toString();
			}

			// Armo las posiciones: Agrego Posicion de Proveedor
			aItems.push(vendorPos);

			// Armo las posiciones: Agrego las Partidas seleccionadas
			var aPartidasPos = [];
			aPartidasPos = this._armarPartidasPos();
			for (var i = 0; i < aPartidasPos.length; i++) {
				aItems.push(aPartidasPos[i]);
			}
			// Se arman las posiciones logisticas
			newDocument.ToDocLogist = this._armarDocsLogistic();

			//Armo el documento
			newDocument.ToDocitems = aItems;

			return newDocument;
		},

		// Arma las posiciones logisticas seleccionadas
		_armarDocsLogistic: function() {
			var aPosLogist = [];
			var aLogisticData = this.getModel("LogisticData").getData().Items;

			for (var i = 0; i < aLogisticData.length; i++) {
				var logistic = {};
				logistic.bukrs = aLogisticData[i].bukrs;
				logistic.belnr = aLogisticData[i].belnr;
				logistic.gjahr = aLogisticData[i].gjahr;
				logistic.buzei = aLogisticData[i].buzei;
				logistic.ean11 = aLogisticData[i].ean11;
				logistic.bpmng = aLogisticData[i].bpmng;
				logistic.bprme = aLogisticData[i].bprme;
				logistic.txz01 = aLogisticData[i].txz01;
				logistic.netpr = aLogisticData[i].netpr;
				logistic.netwr = aLogisticData[i].netwr;
				logistic.menge = aLogisticData[i].menge;
				logistic.bstme = aLogisticData[i].bstme;
				logistic.mwskz = aLogisticData[i].mwskz;
				logistic.menge_nc = aLogisticData[i].menge_nc.toString();
				logistic.valor_nc = aLogisticData[i].valor_nc.toString();
				logistic.waers = aLogisticData[i].waers;
				aPosLogist.push(logistic);
			}
			return aPosLogist;
		},

		// Arma las posiciones de las partidas seleccionadas
		_armarPartidasPos: function() {
			var aPartidasPos = [];
			var aSelectedData = this.getModel("SelectedData").getData().Items;

			for (var i = 0; i < aSelectedData.length; i++) {
				var newItem = {};
				newItem.bukrs = aSelectedData[i].bukrs;
				newItem.belnr = aSelectedData[i].belnr;
				newItem.gjahr = aSelectedData[i].gjahr;
				newItem.buzei = aSelectedData[i].buzei;
				newItem.lifnr = aSelectedData[i].lifnr;
				newItem.dmbtr = aSelectedData[i].dmbtr;
				aPartidasPos.push(newItem);
			}
			return aPartidasPos;
		},

		// Arma la cabecera del documento a generar
		_armarCabecera: function() {
			var oHeader = this.getModel("HeaderData").getData();
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			if (typeof oHeader.kursf === "undefined") {
				oHeader.kursf = "0";
			}

			var newDocument = {};

			newDocument = {
				bukrs: aSelectedData[0].bukrs || "",
				belnr: aSelectedData[0].belnr || "",
				gjahr: aSelectedData[0].gjahr || "",
				budat: oHeader.budat || "",
				bldat: oHeader.bldat || "",
				monat: oHeader.monat || "",
				blart: aSelectedData[0].blart || "",
				waers: oHeader.waers || "",
				xblnr: oHeader.xblnr || "",
				bktxt: oHeader.bktxt || "",
				kursf: oHeader.kursf || "",
				wwert: oHeader.wwert || "",
				timbrado: oHeader.timbrado || ""
			};
			return newDocument;
		},

		//Arma la poscion de Proveedor del documento a generar
		_armarPosProveedor: function() {
			var oHeader = this.getModel("HeaderData").getData();
			var oVendorData = this.getModel("VendorData").getData();
			var aSelectedData = this.getModel("SelectedData").getData().Items;
			var iItemPos = parseInt(this._getLastItemPos(), 10);

			if (oVendorData.hbkid) {
				var aValues = oVendorData.hbkid.split("-");
				var sHbkid = aValues[0];
			}

			iItemPos += 10;
			var vendorPos = {};

			vendorPos = {
				// bukrs: oHeader.bukrs,
				belnr: "",
				gjahr: oHeader.gjahr,
				buzei: iItemPos.toString(),
				dmbtr: oVendorData.wrbtr.toString() || "",
				zfbdt: oVendorData.zfbdt || "",
				zterm: oVendorData.zterm || "",
				zlspr: oVendorData.zahls || "",
				zlsch: oVendorData.zlsch || "",
				//xblnr: oVendorData.xblnr || "",
				zuonr: oVendorData.zuonr || "",
				hbkid: sHbkid || "",
				hktid: oVendorData.hktid || "",
				sgtxt: oVendorData.sgtxt || "",
				lifnr: aSelectedData[0].lifnr
			};
			return vendorPos;
		},

		//
		_createControlModel: function() {
			var oControlModel = new JSONModel({
				wrbtrTot: 0, //Total partidas seleccionadas
				wrbtrTotItems: 0, //Total Items ingresados manualmente
				wrbtrDif: 0, //Total pos Vendor - Total items
				waers: "",
				bukrs: "",
				bukrsParam: this.getOwnerComponent()._sBukrsParameter,
				cantSele: 0 //Cantidad de Partidas seleccionadas
			});
			return oControlModel;
		},

		_createControlModelLog: function() {
			var oControlModelLog = new JSONModel({
				lineItemListTitleLog: this.getResourceBundle().getText("detailLineItemTableHeadingLog"),
				wrbtrTotLog: 0, //Total partidas seleccionadas
				wrbtrTotItems: 0, //Total Items ingresados manualmente
				wrbtrDif: 0, //Total pos Vendor - Total items
				waers: "",
				bukrs: "",
				bukrsParam: this.getOwnerComponent()._sBukrsParameter,
				cantSeleLog: 0 //Cantidad de Partidas seleccionadas
			});
			return oControlModelLog;
		},

		//	
		_createPeriodosModel: function() {
			var oPeriodosModel = new JSONModel({
				"items": [{
					"periodo": "01"
				}, {
					"periodo": "02"
				}, {
					"periodo": "03"
				}, {
					"periodo": "04"
				}, {
					"periodo": "05"
				}, {
					"periodo": "06"
				}, {
					"periodo": "07"
				}, {
					"periodo": "08"
				}, {
					"periodo": "09"
				}, {
					"periodo": "10"
				}, {
					"periodo": "11"
				}, {
					"periodo": "12"
				}]
			});
			return oPeriodosModel;
		},

		/**
		 * Dialogo de confirmacion de anulacion
		 */
		_reverseDialog: function() {

			var that = this;
			var dialog = new sap.m.Dialog({
				title: "Anular Documento",
				type: "Message",
				content: [
					new sap.m.Label({
						text: "Ingrese texto de anulacion(max 50 caracteres)",
						labelFor: "reverseText"
					}),
					new sap.m.TextArea("reverseText", {
						width: "100%",
						maxLength: 50,
						placeholder: "Texto de anulacion..."
					})
				],
				beginButton: new sap.m.Button({
					text: "Anular",
					press: function() {
						var sText = sap.ui.getCore().byId("reverseText").getValue();
						that.fnAnularPartidas(sText);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancelar",
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		/**
		 * @param {string} sPath path del proveedor seleccionado
		 * Inicializa la vista
		 * Partidas seleccionadas
		 * Totales
		 * Datos del documento a crear
		 * Botones
		 */
		_inicializarView: function(sPath) {

			// Inicializa partidas seleccionadas a cero
			this._updateSelectedData("SelectedData", null, true);
			this._updateLogisticData("LogisticData", null, true);

			//Inicializa los checkbos de la tabla a cero
			var oTable = this.byId("lineItemsList");
			oTable.removeSelections(true);

			var oTableLog = this.byId("lineItemsListLog");
			oTableLog.removeSelections(true);

			// Inicializa posicion de Proveedor
			var oModel = this.getModel();
			var oVendor = oModel.getData(sPath);
			var vendorData = {
				wrbtr: "0",
				zterm: oVendor.zterm,
				zlspr: oVendor.zahls
			};
			this._updateVendorData(vendorData, false);

			//Inicializa cabecera de documento
			var headerData = {};
			this._updateHeaderData(headerData, false);

			//Inicializa Items data
			this._updateItemsData("ItemsData", null, true);

			//Oculta el grid
			var oGrid = this.byId("id_griddoc");
			oGrid.setVisible(false);

			var oGridLog = this.byId("id_gridlog");
			oGridLog.setVisible(false);

			// Reacalcula totales
			this._calcularTotales();
			// this._calcularTotalesLog();

			//Inicializa Botnes
			this._updateButtons(0);

			// Carga valor de tolerancia
			this.fnValorTolerancia();

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("AcreedoresSet", {
					bsik_key: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_onObjectMatchedLog: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("DocsLogisticosSet", {
					bukrs: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.bsik_key,
				sObjectName = oObject.name1,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId,
				location.href
			]));
			//
			this._inicializarView(sPath);
			//	
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		_onMetadataLoadedLog: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("oModelLog"),
				oLineItemTable = this.byId("lineItemsListLog"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelayLog", 0);

			oLineItemTable.attachEventOnce("updateFinishedLog", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelayLog", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});