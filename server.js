const express = require("express");
const pg = require("pg");
const format = require("pg-format");
const XLSX = require("xlsx");
const multer = require("multer");
const cors = require('cors')

const app = express();


const opts = {
  database: "SheetJSPG",
  host: "localhost", 
  port: 5432,
  user: "postgres",
  password: "khumcogi123",
};

app.use(cors())

async function aoo_to_pg_table(client, aoo, table_name) {
  // ... rest of the code remains the same
    /* define types that can be converted (e.g. boolean can be stored in float) */
    const T_FLOAT = ["float8", "boolean"];
    const T_BOOL = ["boolean"];
  
    /* types is a map from column headers to Knex schema column type */
    const types = {};
  
    /* names is an ordered list of the column header names */
    const names = [];
  
    /* loop across each row object */
    aoo.forEach((row) =>
      /* Object.entries returns a row of [key, value] pairs */
      Object.entries(row).forEach(([k, v]) => {
        /* If this is first occurrence, mark unknown and append header to names */
        if (!types[k]) {
          types[k] = "";
          names.push(k);
        }
  
        /* skip null and undefined values */
        if (v == null) return;
  
        /* check and resolve type */
        switch (typeof v) {
          /* change type if it is empty or can be stored in a float */
          case "number":
            if (!types[k] || T_FLOAT.includes(types[k])) types[k] = "float8";
            break;
          /* change type if it is empty or can be stored in a boolean */
          case "boolean":
            if (!types[k] || T_BOOL.includes(types[k])) types[k] = "boolean";
            break;
          /* no other type can hold strings */
          case "string":
            types[k] = "text";
            break;
          default:
            types[k] = "text";
            break;
        }
      })
    );
  
    /* Delete table if it exists in the DB */
  //   const query = format("DROP TABLE IF EXISTS %I;", table_name);
  //   await client.query(query);
  
     /* Create table */
      {
        const entries = Object.entries(types);
        const Istr = entries.map((e) => format(`%I ${e[1]}`, e[0])).join(", ");
        let query = format.withArray(`CREATE TABLE IF NOT EXISTS %I (${Istr});`, [table_name]);
        await client.query(query);
      }
  
    /* Insert each row */
    for (let row of aoo) {
      const ent = Object.entries(row);
      const Istr = Array.from({ length: ent.length }, () => "%I").join(", ");
      const Lstr = Array.from({ length: ent.length }, () => "%L").join(", ");
      let query = format.withArray(`INSERT INTO %I (${Istr}) VALUES (${Lstr});`, [
        table_name,
        ...ent.map((x) => x[0]),
        ...ent.map((x) => x[1]),
      ]);
      await client.query(query);
    }
  
    return client;
}

// Configure multer to handle file uploads
const upload = multer({ dest: "uploads/" });

app.post("/import-excel", upload.single("excelFile"), async (req, res) => {
  try {
    const fileName = req.file.path;
    const sheetName = req.body.sheetName;
    const oldwb = XLSX.readFile(fileName);
    const oldws = oldwb.Sheets[oldwb.SheetNames[sheetName]];
    // const oldws = oldwb.Sheets[sheetName];
    const table_name = fileName.replace(/\.[^/.]+$/, "");

    const client = new pg.Client(opts);
    await client.connect();

    const aoo = XLSX.utils.sheet_to_json(oldws);

    await aoo_to_pg_table(client, aoo, table_name);

    await client.end();

    res.json({ success: true, message: "Data imported successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error importing data.", error });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});