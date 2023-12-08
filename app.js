const server = require('net').createServer(),
express = require('express'),
path = require('path'),
colors = require('colors'),
{v4: uuidv4} = require('uuid'),
app = express();
const { Console } = require('console');
const queclink = require('queclink-parser');
var dbconfig = require('./src/databaseConfig.js');
var db = dbconfig.connection;
// variables globales
let devices = [];
let clients = [];
sockets = {};
socketids=[];
//Solicitamos el cron para buscar comandos y envíarlos
require('./src/buscarenviarcomandos.js');
// procedemos aa activar el servico
console.log('Iniciando Servicio Queclink Node Server'.yellow);

serveron();

async function serveron(){
  console.log('Listo para recibir data'.green);
  // nueva conexión de equipo
  server.on('connection', async (socket) => {
    // creamos el nuevo socket
    console.log('Nueva conexión');
    socket.id = uuidv4();
    sockets[socket.id] = socket;
    socketids.push(socket.id);
    // nueva recepción de datos
    socket.on('data', async(data) => {
      const raw = new Buffer.from(data);
      try {
        const datas = queclink.parse(raw);
        if (datas.command) {
          console.log('comando recibido');
          console.log(datas);
        }else {
          if (datas.alarm.type === 'Gps') {
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects('ALT',datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
          }else if (datas.alarm.type === 'Heartbeat') {
            console.log('Heartbeat recibido...');
            console.log("Estatus: "+datas.alarm.message);
            console.log('Envíando respuesta de heartbeat');
            socket.write('+SACK:GTHBD,,'+datas.serialId+'$');
            socket.write('+AT:GTRTO');
            // {
            //    raw: '+ACK:GTHBD,270D04,863457050347911,,20231206192459,7930$',
            //    manufacturer: 'queclink',
            //    device: 'Queclink-GV300W',
            //    type: 'data',
            //    imei: '863457050347911',
            //    protocolVersion: { raw: '270D04', deviceType: 'GV300W', version: '13.4' },
            //    temperature: null,
            //    history: false,
            //    sentTime: 2023-12-06T19:24:59.000Z,
            //    serialId: 31024,
            //    alarm: { type: 'Heartbeat', message: 'Conexión viva' }
            //  }
          }else {
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects('ALT',datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
          }
        }
      } catch (e) {
        console.log('imposible guardar los datos....');
        console.log(e);
      }
    });
    socket.on('close', () => {
      delete sockets[socket.id];
      var i = socketids.indexOf( socket.id );
      if (i >=0 ) {
        socketids.splice(i,1);
        console.log('socketeliminado');
      }
    });
    socket.on('error', (error) => {
      console.log('Error en la conexion');
    });
  });
}

async function generatedataobjects(tipo,datas,socket){
  const fechaHora = new Date(datas.datetime);
  const fechaFormateada = fechaHora.toISOString().split('T')[0];
  const horaFormateada = fechaHora.toISOString().split('T')[1].split('.')[0];
  var instate = '0000';
  var mode = 0;
  if (datas.status.sos) {
    mode = 1;
  }else {
    if (datas.status.state) {
      switch (datas.status.state) {
        case 'Tow':
        var instate = '0000';
        mode = 2;
        break;
        case 'Fake Tow':
        var instate = '0000';
        mode = 3;
        break;
        case 'Ignition Off Rest':
        var instate = '0000';
        mode = 4;
        break;
        case 'Ignition Off Moving':
        var instate = '0000';
        mode = 5;
        break;
        case 'Ingition On Rest':
        var instate = '0001';
        mode = 6;
        break;
        case 'Ignition On Moving':
        var instate = '0001';
        mode = 7;
        break;
        case 'Sensor Rest':
        var instate = '0000';
        mode = 8;
        break;
        case 'Sensor Motion':
        var instate = '0000';
        mode = 9;
        break;
        default:
        tipo = 'STT';
        break;
      }
    }
  }
  dataObject0 = {
    date_connected: datas.datetime || null,
    fecha: fechaFormateada || null,
    date: fechaFormateada || null,
    time: horaFormateada || null,
    Device_ID: datas.imei || null,
    Command_Type: tipo,
    IN_STATE:instate,
    MODE:mode,
    Software_Version : datas.protocolVersion.version || null,
    MCC:datas.mcc,
    MNC:datas.mnc,
    LAC:datas.lac,
    LAT: datas.loc.coordinates[1],
    LON: datas.loc.coordinates[0],
    altitude: datas.altitude ? datas.altitude.toString().slice(0, 4) : 0,
    SPD: datas.speed || 0,
    CRS: datas.hdop || 0,
    FIX: datas.gpsStatus ? 1 : 0,
    BAT_PERCENT: datas.voltage.battery || 0,
    PWR_VOLT: datas.voltage.inputCharge || 0,
    H_METTER: datas.odometer || 0
  };
  dataObject1 = {
    date_connected: datas.datetime || null,
    date: fechaFormateada || null,
    time: horaFormateada || null,
    Device_ID: datas.imei || null,
    Command_Type: tipo,
    IN_STATE:instate,
    MODE:mode,
    Software_Version : datas.protocolVersion.version || null,
    MCC:datas.mcc,
    MNC:datas.mnc,
    LAC:datas.lac,
    LAT: datas.loc.coordinates[1],
    LON: datas.loc.coordinates[0],
    altitude: datas.altitude ? datas.altitude.toString().slice(0, 4) : 0,
    SPD: datas.speed || 0,
    CRS: datas.hdop || 0,
    FIX: datas.gpsStatus ? 1 : 0,
    BAT_PERCENT: datas.voltage.battery || 0,
    PWR_VOLT: datas.voltage.inputCharge || 0,
    H_METTER: datas.odometer || 0,
    socket:socket,
  };
  return [dataObject0,dataObject1];
}

function guardardatosendb(dataObjects){
  const sql = 'INSERT INTO movile_devices SET ?';
  const sql2 = 'REPLACE INTO currentpositions SET ?';
  db.query(sql, dataObjects[0], (err, results) => {
    if (err) {
      console.log(err);
    }else {
      console.log('insertado correctamente');
    }
  });
  db.query(sql2, dataObjects[1], (err, results) => {
    if (err) {
      console.log(err);
    }else {
      console.log('insertado correctamente');
    }
  });
}

//configure server to listen on PORT
server.listen(5557, () => {
    console.log('Servidor iniciado en puerto %s at %s', server.address().port, server.address().address);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Starting Server
app.listen(app.get('port'), () => {
  // console.log(`Servidor en puerto ${app.get('port')}`);
});

app.get('/queclink_server', function (req, res) {
  res.sendFile('index.html', { root: './src/public/' });
});
