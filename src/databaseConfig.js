const mysql = require('mysql');
config = {
  //debug
  host: "localhost",
  user: "root",
  password: "",
  database: "plataforma",
  //production
  //host: "162.214.125.48",
  //user: "wwkosm_development",
  //password: "-g8!W5FO=&V;",
  //database: "wwkosm_plataforma",
  port: '3306',
}

var db =mysql.createConnection(config);


db.connect((err) => {
  if (err) {
    console.error(err);
  }else{
    console.log('Mysql conectado.');
  }
});


module.exports ={
     connection : mysql.createConnection(config)
   }
