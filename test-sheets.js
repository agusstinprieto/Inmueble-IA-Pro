// TEST: Ejecuta esto en la consola del navegador para probar la conexión

const testURL = 'TU_URL_DE_GOOGLE_SCRIPT_AQUI'; // Reemplaza con tu URL

const testPayload = {
    sheet: 'Propiedades',
    data: {
        ID: 'TEST-001',
        País: 'MEXICO',
        Moneda: 'MXN',
        Título: 'Casa de Prueba',
        Ciudad: 'Torreón',
        Colonia: 'Centro',
        Tipo: 'CASA',
        Operación: 'VENTA',
        Precio: 1000000,
        'M2 Terreno': 200,
        'M2 Const': 150
    }
};

fetch(testURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
})
    .then(() => console.log('✅ Test enviado. Revisa tu Google Sheet.'))
    .catch(err => console.error('❌ Error:', err));
