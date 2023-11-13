const pg = require("pg");
const client = new pg.Client({
  database: "SheetJSPG",
  host: "127.0.0.1", // localhost
  port: 5432,
  user: "postgres",
  password: "khumcogi123",
});
(async () => {
  await client.connect();
  const res = await client.query("SELECT $1::text as message", [
    "Hello world!",
  ]);
  console.log(res.rows[0].message); // Hello world!
  await client.end();
})();
