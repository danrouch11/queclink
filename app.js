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

// funcion de servidor
async function serveron(){
  console.log('Listo para recibir data'.green);
  // nueva conexión de equipo
  server.on('connection', async (socket) => {
    // creamos el nuevo socket
    // console.log('Nueva conexión');
    // creamos el socket id
    socket.id = uuidv4();
    sockets[socket.id] = socket;
    socketids.push(socket.id);
    // nueva recepción de datos
    socket.on('data', async(data) => {
      try {
        const raw = new Buffer.from(data);
        const datas = queclink.parse(raw);
        // separamos por typo de dato ok o gps
        switch (datas.type) {
          case 'ok':
          console.log('Confirmación de comando.');
          // console.log(datas);
          break;
          case 'data':
          switch (datas.alarm.type) {
            // posicion gps
            case 'Gps':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects('ALT',datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // boton de panico 1
            case 'SOS_Button':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',1,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // remolque 2
            case 'Towing':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',2,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // movimiento detectado 3
            case 'Motion_State_Changed':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',3,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // conectado nuevamente a gprs
            case 'GPRS_Connection_Established':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',4,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // ignicion detectada
            case 'DI':
            console.log(datas);
            if (datas.datetime && datas.loc.coordinates) {
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=14+additioner;
              const dataObjects = await generatedataobjects2('ALT',numerodemodo,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // tapa retirada
            case 'Shell_Open':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',16,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // movimiento
            case 'Movement':
            if (datas.datetime && datas.loc.coordinates) {
              // 17	unidad en Movimiento
              // 18	unidad en detenida
              var additioner= datas.alarm.status;
              var numero = 17+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // conducta brusca
            case 'Harsh_Behavior':
            if (datas.datetime && datas.loc.coordinates) {
              // 19	Frenada Brusca
              // 20	 Aceleración Brusca
              // 21	giro brusco
              // 22	frenada brusca girando
              // 23	aceleración brusca girando
              // 24	comportamiento brusco desconocido
              var additioner= datas.alarm.status;
              var numero = 19+additioner;
              dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // choque
            case 'Crash':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',25,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // excesos de velocidad
            case 'Over_Speed':
            if (datas.datetime && datas.loc.coordinates) {
              // 26	exceso de velocidad
              // 27	regresando a velocidad permitida
              var additioner= datas.alarm.status;
              var numero = 26+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            // encendido y apagado del equipo
            case 'Power':
            if (datas.datetime && datas.loc.coordinates) {
              // 28	exceso de velocidad
              // 29	regresando a velocidad permitida
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=28+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }else {
              console.log('imposible guardar registro sin datos gps.');
            }
            break;
            
            case 'Heartbeat':
            console.log('Heartbeat recibido...');
            console.log("Estatus: "+datas.alarm.message);
            console.log('Envíando respuesta de heartbeat');
            socket.write('+SACK:GTHBD,,'+datas.serialId+'$');
            break;
            default:
            console.log('Respuesta de comando...');
            console.log(datas);
            guardarrespuestacomando(datas.imei,datas.raw);
          }
          break;
          default:
          console.log('Sin tipo definido...');
          console.log(datas);
        }
      } catch (e) {
        console.log('imposible guardar los datos....');
        console.log(e);
      }
    });
    socket.on('close', () => {
      console.log('socket cerrado.');
      delete sockets[socket.id];
      var i = socketids.indexOf( socket.id );
      if (i >=0 ) {
        socketids.splice(i,1);
        console.log('socketeliminado');
      }
    });
    socket.on('error', (error) => {
      console.log('error en socket.');
      delete sockets[socket.id];
      var i = socketids.indexOf( socket.id );
      if (i >=0 ) {
        socketids.splice(i,1);
        console.log('socketeliminado');
      }
    });
  });
}

async function generatedataobjects(tipo,datas,socket){
  const fechaHora = new Date(datas.datetime);
  const fechaFormateada = fechaHora.toISOString().split('T')[0];
  const horaFormateada = fechaHora.toISOString().split('T')[1].split('.')[0];
  var instate = '0000';
  var mode = 0;
  if (datas.status) {
    tipo = 'STT';
    if (datas.status.input['1']) {
      instate = '0001';
    }
  }else {
    mode = 10;
    if (datas.alarm.status == 'Requested') {
      guardarrespuestacomando(datas.imei,datas.raw);
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


async function generatedataobjects2(tipo,mode,datas,socket){
  console.log(datas);
  const fechaHora = new Date(datas.datetime);
  const fechaFormateada = fechaHora.toISOString().split('T')[0];
  const horaFormateada = fechaHora.toISOString().split('T')[1].split('.')[0];
  var instate = '0000';
  if (mode == 14) {
    instate = '0001';
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

function guardarrespuestacomando(imei,respuesta){
  var querystring = 'UPDATE comandos SET respuesta = 5, `msg` = "'+respuesta+'" WHERE `comandos`.`movil_id` = '+imei+' and `comandos`.`activo` = 1 and `comandos`.`respuesta` = 2 LIMIT 1;';
  db.query(querystring, function(err, rows, fields) {
    if (err) console.log(err);
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
