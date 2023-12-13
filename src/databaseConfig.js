const mysql = require('mysql');
config = {
  //debug
  host: "localhost",
  user: "root",
  password: "",
  database: "plataforma",
  //production
  // host: "162.215.214.33",
  // user: "wwdrac_node_server",
  // password: "r.j),#jyhtX=",
  // database: "wwdrac_draco",
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
