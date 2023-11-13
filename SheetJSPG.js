const pg = require("pg"),
  format = require("pg-format");
const XLSX = require("xlsx");
const opts = {
  database: "SheetJSPG",
  host: "127.0.0.1", // localhost
  port: 5432,
  user: "postgres",
  password: "khumcogi123",
};

/* create table and load data given an array of objects and a PostgreSQL client */
async function aoo_to_pg_table(client, aoo, table_name) {
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
  const query = format("DROP TABLE IF EXISTS %I;", table_name);
  await client.query(query);

  /* Create table */
  {
    const entries = Object.entries(types);
    const Istr = entries.map((e) => format(`%I ${e[1]}`, e[0])).join(", ");
    let query = format.withArray(`CREATE TABLE %I (${Istr});`, [table_name]);
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

(async () => {
  /* read file and get first worksheet */
  const oldwb = XLSX.readFile("pres.numbers");
  const oldws = oldwb.Sheets[oldwb.SheetNames[0]];

  /* import data to postgres */
  let client = new pg.Client(opts);
  try {
    /* open connection to PostgreSQL database */
    await client.connect();

    /* generate array of objects from worksheet */
    const aoo = XLSX.utils.sheet_to_json(oldws);

    /* create table and load data */
    await aoo_to_pg_table(client, aoo, "Presidents");
  } finally {
    /* disconnect */
    await client.end();
  }

  /* export data to xlsx */
  client = new pg.Client(opts);
  try {
    /* open connection to PostgreSQL database */
    await client.connect();

    /* fetch all data from specified table */
    const res = await client.query(format(`SELECT * FROM %I`, "Presidents"));

    /* export to file */
    const newws = XLSX.utils.json_to_sheet(res.rows);
    const newwb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newwb, newws, "Export");
    XLSX.writeFile(newwb, "SheetJSPGExport.xlsx");
  } finally {
    /* disconnect */
    await client.end();
  }
})();
