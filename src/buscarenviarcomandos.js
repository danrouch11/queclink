const colors = require('colors'),
express = require('express'),
cron = require("node-cron");
var dbconfig = require('./databaseConfig.js');
var db= dbconfig.connection;

cron.schedule("*/5 * * * * *", function() {
  buscarComandosParaEnviar();
});


function buscarComandosParaEnviar(){
  // var querystring = 'SELECT comandos.id,comandos.socketid,comandos.comando from comandos '+
  //  'inner join equipos as e on e.id = comandos.id_equipo '+
  //  'where comandos.activo = 1 and comandos.respuesta = 1 and id_tipoequipo != 12 order by comandos.id ASC';
  var querystring = 'Select * From getcomandosqueclink;';
  db.query(querystring, function(err, rows, fields) {
    if (err) throw err;
    rows.forEach(function(row) {
      if (socketids.indexOf(row.socketid) !== -1) {
        if (row.comando == 'AT+GTRTO=gv300w,2,,,,,,FFFF$') {
          var enviarcomando = "Call imposibleenviarcomando("+row.id+")";
        }else {
          sockets[row.socketid].write(row.comando);
          var enviarcomando = "Call posibleenviarcomando("+row.id+")";
        }
        db.query(enviarcomando, function (err, result) {
          if (err) throw err;
        });
      }
      else {
        var noenviarcomando = "Call imposibleenviarcomando("+row.id+")";
        db.query(noenviarcomando, function (err, result) {
          if (err) throw err;
        });
      }
    });
  });
}
