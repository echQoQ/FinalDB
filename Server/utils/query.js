const mysql = require('mysql');
require("dotenv").config()


const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

function query(sql, values) {
	return new Promise((resolve, reject) => {
	  pool.getConnection((err, connection) => {
		if (err) {
		  reject(err);
		} else {
		  connection.query(sql, values, (err, results) => {
			connection.release();
			if (err) {
			  reject(err);
			} else {
			  resolve(results);
			}
		  });
		}
	  });
	});
}

module.exports = { query };