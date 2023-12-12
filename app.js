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
          // regresa ok cuando un comando es recibido
          case 'ok':
          console.log('Confirmación de comando.');
          // console.log(datas);
          break;

          // esto envía cuando manda datos
          case 'data':
          switch (datas.alarm.type) {

            // posicion gps
            case 'Gps':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects('ALT',datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // boton de panico 1
            case 'SOS_Button':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',1,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // remolque 2
            case 'Towing':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',2,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // movimiento detectado 3
            case 'Motion_State_Changed':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',3,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // conectado nuevamente a gprs
            case 'GPRS_Connection_Established':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',4,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // ENTRADAS
            case 'DI':
            if (datas.datetime && datas.loc.coordinates) {
              var numero = datas.alarm.number;
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner = 1;
              }
              numerodemodo=13+additioner+numero;
              const dataObjects = await generatedataobjects2('ALT',numerodemodo,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // SALIDAS
            case 'DO':
            if (datas.datetime && datas.loc.coordinates) {
              var numero = datas.alarm.number;
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner = 1;
              }
              numerodemodo=60+additioner+numero;
              const dataObjects = await generatedataobjects2('ALT',numerodemodo,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // tapa retirada
            case 'Shell_Open':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',20,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // movimiento
            case 'Movement':
            if (datas.datetime && datas.loc.coordinates) {
              // 21	unidad en Movimiento
              // 22	unidad en detenida
              var additioner= datas.alarm.status;
              var numero = 21+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // conducta brusca
            case 'Harsh_Behavior':
            if (datas.datetime && datas.loc.coordinates) {
              // 23	Frenada Brusca
              // 24	 Aceleración Brusca
              // 25	giro brusco
              // 26	frenada brusca girando
              // 27	aceleración brusca girando
              // 28	comportamiento brusco desconocido
              var additioner= datas.alarm.status;
              var numero = 23+additioner;
              dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // choque
            case 'Crash':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',29,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // excesos de velocidad
            case 'Over_Speed':
            if (datas.datetime && datas.loc.coordinates) {
              // 30	exceso de velocidad
              // 31	regresando a velocidad permitida
              var additioner= datas.alarm.status;
              var numero = 30+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // encendido y apagado del equipo
            case 'Power':
            if (datas.datetime && datas.loc.coordinates) {
              // 32	equipo apagado
              // 33	equipo encendido
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=32+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // batería baja
            case 'Low_Battery':
            if (datas.datetime && datas.loc.coordinates) {
              // 34 bateria baja
              const dataObjects = await generatedataobjects2('ALT',34,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // carga de equipo
            case 'Charging':
            if (datas.datetime && datas.loc.coordinates) {
              // 35	equipo cargando
              // 36	equipo equipo dejando de cargar
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=35+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // External_Low_battery
            case 'External_Low_battery':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',37,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // GPS_Antena
            case 'GPS_Antena':
            if (datas.datetime && datas.loc.coordinates) {
              // 38 antena gps conectada
              // 39	antena gps desconectada
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=38+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // Jamming
            case 'Jamming':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',50,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // Vehicle_Start_Status
            case 'Vehicle_Start_Status':
            if (datas.datetime && datas.loc.coordinates) {
              const dataObjects = await generatedataobjects2('ALT',40,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // Roaming
            case 'Roaming':
            if (datas.datetime && datas.loc.coordinates) {
              // 41 antena gps conectada
              // 42	antena gps desconectada
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=41+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            // Gps_Status
            case 'Gps_Status':
            if (datas.datetime && datas.loc.coordinates) {
              // 43 gps conectado
              // 44	 gps desconectado
              var additioner = 0;
              if (datas.alarm.status == false) {
                additioner= 1;
              }
              numerodemodo=43+additioner;
              const dataObjects = await generatedataobjects2('ALT',numero,datas,socket.id);
              guardardatosendb(dataObjects);
            }
            break;

            case 'Heartbeat':
            // console.log('Heartbeat recibido...');
            // console.log("Estatus: "+datas.alarm.message);
            // console.log('Envíando respuesta de heartbeat');
            socket.write('+SACK:GTHBD,,'+datas.serialId+'$');
            break;

            // default
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
  // console.log(datas);
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
