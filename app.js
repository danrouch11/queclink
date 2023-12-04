const server = require('net').createServer(),
express = require('express'),
path = require('path'),
colors = require('colors'),
app = express();
const { Console } = require('console');
const queclink = require('queclink-parser');

var dbconfig = require('./src/databaseConfig.js');
// nos conectamos a la base de datos
var db= dbconfig.connection;
let equipos=[];
var dataObject = [];
console.log('Iniciando Servicio Queclink Node Server'.yellow);

serveron();

async function serveron(){
  console.log('Listo para recibir data'.green);
  server.on('connection', async (conn) => {
      const addr = conn.remoteAddress + ':' + conn.remotePort;
      console.log('Nueva conexion de %s', addr);
      conn.on('data', async(data) => {
        const raw = new Buffer.from(data);
        const datas = queclink.parse(raw);
        //console.log(datas);
        const fechaHora = new Date(datas.datetime);
        const fechaFormateada = fechaHora.toISOString().split('T')[0];
        const horaFormateada = fechaHora.toISOString().split('T')[1].split('.')[0];
        let LAT = 0.0000000;
        let LON = 0.0000000;
        if (datas.loc) {
          LAT = datas.loc.coordinates[1];
          LON = datas.loc.coordinates[0]
        }
        let BCK_VOLT = ''
        let PWR_VOLT = '';
        if (datas.voltage) {
          BCK_VOLT = datas.battery;
          PWR_VOLT = datas.inputCharge;
        }
        if (datas.alarm.type === 'Gps') {
          dataObject = {
            date_connected: datas.datetime || null,
            //fecha: fechaFormateada || null,
            date: fechaFormateada || null,
            time: horaFormateada || null,
            Device_ID: datas.imei || null,
            Command_Type: 'STT',
            LAT: LAT || null,
            LON: LON || null,
            altitude: datas.altitude ? datas.altitude.toString().slice(0, 4) : null,
            SPD: datas.speed || null,
            CRS: datas.hdop || null,
            BCK_VOLT: BCK_VOLT || null,
            PWR_VOLT: PWR_VOLT || null,
            sendtime: datas.sentTime || null,
            H_METTER: datas.hourmeter || null
          };
          guardardatosendb(dataObject);
        } else {
          dataObject = {
            date_connected: datas.datetime || null,
            //fecha: fechaFormateada || null,
            date: fechaFormateada || null,
            time: horaFormateada || null,
            Device_ID: datas.imei || null,
            Command_Type: 'ALT',
            LAT: LAT || null,
            LON: LON || null,
            altitude: datas.altitude ? datas.altitude.toString().slice(0, 4) : null,
            SPD: datas.speed || null,
            CRS: datas.hdop || null,
            BCK_VOLT: BCK_VOLT || null,
            PWR_VOLT: PWR_VOLT || null,
            sendtime: datas.sentTime || null,
            GPS_ODOM: datas.odometer || null,
            H_METTER: datas.hourmeter || null
          };
          guardardatosendb(dataObject);
        }
      });
      conn.once('close', () => {
        console.log('Conexion de %s cerrada', addr);
      });
      conn.on('error', (error) => {
        console.log('Error en la conexion %s: %s', addr, error.message);
      });
  });
}

function guardardatosendb(dataObject){
    //console.log(dataObject['Device_ID']);
    let sql_search = `SELECT count(*) as contador FROM equipos where movil_id = '${dataObject['Device_ID']}'`;
    let query = db.query(sql_search, (err, result) => {
      if (err) { console.error(err); }
      if (result[0].contador == 0) {
        console.log('++++++++++++++++++ El Movil ID '.red+dataObject['Device_ID']+' no se encuentra registrado'.red);
      }else {
        const sql = 'INSERT INTO movile_devices SET ?';
        const sql2 = 'REPLACE INTO currentpositions SET ?';
        db.query(sql, dataObject, (err, results) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Data inserted successfully movile_devices!');
          }
        });
        db.query(sql2, dataObject, (err, results) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Data inserted successfully currentpositions!');
          }
        });
      }
    });
}

//configure server to listen on PORT
server.listen(12100, () => {
    console.log('Servidor iniciado en puerto %s at %s', server.address().port, server.address().address);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Starting Server
app.listen(app.get('port'), () => {
  // console.log(`Servidor en puerto ${app.get('port')}`);
});

app.get('/dhl_server', function (req, res) {
  res.sendFile('index.html', { root: './src/public/' });
});
