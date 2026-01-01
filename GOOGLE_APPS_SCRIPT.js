/**
 * Script para Google Apps Script - INMUEBLE IA PRO
 * Este script recibe datos de la aplicación y los guarda en Google Sheets
 */

function doPost(e) {
    try {
        // Log para debugging
        Logger.log('Recibiendo petición POST');

        // Parsear el contenido
        var contents = e.postData.contents;
        Logger.log('Contenido recibido: ' + contents);

        var requestData = JSON.parse(contents);
        var sheetName = requestData.sheet; // 'Propiedades' o 'Clientes'
        var data = requestData.data;

        Logger.log('Sheet: ' + sheetName);
        Logger.log('Data: ' + JSON.stringify(data));

        // Obtener la hoja activa
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName(sheetName);

        // Si la hoja no existe, crearla con las cabeceras
        if (!sheet) {
            Logger.log('Creando nueva hoja: ' + sheetName);
            sheet = ss.insertSheet(sheetName);

            // Configurar headers según la hoja
            var headers = Object.keys(data);
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

            // Formatear headers
            sheet.getRange(1, 1, 1, headers.length)
                .setFontWeight('bold')
                .setBackground('#f59e0b')
                .setFontColor('white');
        }

        // Obtener headers existentes
        var lastColumn = sheet.getLastColumn();
        var headers = sheet.getRange(1, 1, 1, lastColumn || Object.keys(data).length).getValues()[0];

        // Preparar fila con los datos
        var newRow = headers.map(function (header) {
            return data[header] !== undefined ? data[header] : '';
        });

        Logger.log('Nueva fila: ' + JSON.stringify(newRow));

        // Agregar la fila
        sheet.appendRow(newRow);

        Logger.log('✅ Fila agregada exitosamente');

        // Respuesta exitosa
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                message: 'Datos agregados correctamente'
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        Logger.log('❌ Error: ' + error.toString());

        // Respuesta de error
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'error',
                message: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService
        .createTextOutput('✅ Servicio de Sincronización INMUEBLE IA PRO está Activo')
        .setMimeType(ContentService.MimeType.TEXT);
}

// Función de prueba (ejecuta esto para probar)
function testScript() {
    var testData = {
        postData: {
            contents: JSON.stringify({
                sheet: 'Propiedades',
                data: {
                    ID: 'TEST-123',
                    País: 'MEXICO',
                    Moneda: 'MXN',
                    Título: 'Casa de Prueba',
                    Ciudad: 'Torreón',
                    Colonia: 'Centro',
                    Tipo: 'CASA',
                    Operación: 'VENTA',
                    Precio: 1500000,
                    'M2 Terreno': 200,
                    'M2 Const': 150
                }
            })
        }
    };

    var result = doPost(testData);
    Logger.log('Resultado test: ' + result.getContent());
}
