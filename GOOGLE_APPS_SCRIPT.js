
/**
 * Script para Google Apps Script destinado a INMUEBLE IA PRO.
 * Este script actúa como un Web App para recibir datos de la aplicación React y guardarlos en Sheets.
 */

function doPost(e) {
    try {
        var requestData = JSON.parse(e.postData.contents);
        var sheetName = requestData.sheet; // 'Propiedades' o 'Clientes'
        var data = requestData.data;

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            // Si la hoja no existe, la crea con las cabeceras correspondientes
            sheet = ss.insertSheet(sheetName);
            var headers = Object.keys(data);
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }

        // Preparar fila
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var newRow = headers.map(function (header) {
            return data[header] || "";
        });

        sheet.appendRow(newRow);

        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput("Servicio de Sincronización INMUEBLE IA PRO Activo.");
}
