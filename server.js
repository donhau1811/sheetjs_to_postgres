const express = require("express");
const pg = require("pg");
const format = require("pg-format");
const XLSX = require("xlsx");
const multer = require("multer");
const cors = require("cors");

const app = express();

const opts = {
  database: "rre_dataset",
  host: "192.168.100.24",
  port: 5432,
  user: "postgres",
  password: "40ebd8f159eec821b3ed519ce89e3b93",
};

app.use(cors());

function getMonthStartAndEndDate(monthString) {
  const dateObject = new Date(monthString);

  const year = dateObject.getFullYear(); // Get the full year
  const month = dateObject.getMonth(); // Get the month (0-11)

  // Calculate the start date of the month
  const startDate = new Date(year, month, 1);
  const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;

  // Calculate the end date of the month
  const endDate = new Date(year, month + 1, 0);
  const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate
  };
}

async function aoo_to_pg_table(client, aoo, table_name) {
  // ... rest of the code remains the same
  /* define types that can be converted (e.g. boolean can be stored in float) */
  // const T_FLOAT = ["float8", "boolean"];
  // const T_BOOL = ["boolean"];

  /* types is a map from column headers to Knex schema column type */
  // const types = {};

  /* names is an ordered list of the column header names */
  // const names = [];

  /* loop across each row object */
  // aoo.forEach((row) =>
  //   /* Object.entries returns a row of [key, value] pairs */
  //   Object.entries(row).forEach(([k, v]) => {
  //     /* If this is first occurrence, mark unknown and append header to names */
  //     if (!types[k]) {
  //       types[k] = "";
  //       names.push(k);
  //     }

  //     /* skip null and undefined values */
  //     if (v == null) return;

  //     /* check and resolve type */
  //     switch (typeof v) {
  //       /* change type if it is empty or can be stored in a float */
  //       case "number":
  //         if (!types[k] || T_FLOAT.includes(types[k])) types[k] = "float8";
  //         break;
  //       /* change type if it is empty or can be stored in a boolean */
  //       case "boolean":
  //         if (!types[k] || T_BOOL.includes(types[k])) types[k] = "boolean";
  //         break;
  //       /* no other type can hold strings */
  //       case "string":
  //         types[k] = "text";
  //         break;
  //       default:
  //         types[k] = "text";
  //         break;
  //     }
  //   })
  // );

  /* Delete table if it exists in the DB */
  //   const query = format("DROP TABLE IF EXISTS %I;", table_name);
  //   await client.query(query);

  /* Create table */

  // {
  //   const entries = Object.entries(types);
  //   const Istr = entries.map((e) => format(`%I ${e[1]}`, e[0])).join(", ");
  //   let query = format.withArray(`CREATE TABLE IF NOT EXISTS %I (${Istr});`, [
  //     table_name,
  //   ]);
  //   await client.query(query);
  // }

  /* Insert each row */
  for (let row of aoo) {
    const ent = Object.entries(row);
    const Istr = Array.from({ length: ent.length }, () => "%I").join(", ");
    const Lstr = Array.from({ length: ent.length }, () => "%L").join(", ");
    // let query = format.withArray(`INSERT INTO %I (${Istr}) VALUES (${Lstr});`, [
    //   table_name,
    //   ...ent.map((x) => x[0]),
    //   ...ent.map((x) => x[1]),
    // ]);
    let query = format.withArray(
      // `INSERT INTO %I (${Istr}) VALUES (${Lstr}) ON CONFLICT (building_key, report_date, report_start, account_key) DO UPDATE SET amount = EXCLUDED.amount, initial_amount = EXCLUDED.initial_amount;`,
      `INSERT INTO %I (${Istr}) VALUES (${Lstr})`,
      [table_name, ...ent.map((x) => x[0]), ...ent.map((x) => x[1])]
    );
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
    const month = req.body.month;
    
    const {startDate, endDate} = getMonthStartAndEndDate(month)
 
    const oldwb = XLSX.readFile(fileName);
    // const oldws = oldwb.Sheets[oldwb.SheetNames[sheetName]];
    const oldws = oldwb.Sheets[sheetName];
    // const table_name = fileName.replace(/\.[^/.]+$/, "");
    // const table_name = sheetName;
    const table_name = `building_accounting_fact_sample`;

    const client = new pg.Client(opts);
    await client.connect();

    let aoo = XLSX.utils.sheet_to_json(oldws, {
      header: [0, 0, 2, 3, 4, 5, 6, 7, 8, 12, 9],
      defval: 0,
    });

    // console.log(JSON.stringify(aoo));

    const mapping = {
      "Tiền lương theo Hợp đồng": "A.1.1",
      "Tiền lương ngoài giờ, phụ cấp,…": "A.1.2",
      "Chi phí ăn trưa": "A.1.3",
      "Các loại BH trích theo lương & KP Công Đoàn": "A.1.4",
      "Thưởng hoàn thành công việc": "A.1.5",
      "Chi phí đồng phục, giày, bảo hộ lao động": "A.1.6",
      "Chi phí bảo hiểm & kiểm tra sức khoẻ": "A.1.7",
      "Chi phí có tính chất phúc lợi (nghỉ mát, hiếu hỉ…)": "A.1.8",
      "Chi phí Bảo Vệ thuê ngoài": "A.2.0",
      "Chi phí Vệ Sinh thuê ngoài": "A.3.0",
      "Khuyến khích bán hàng theo chính sách của REE": "A.4.0",
      "Chi phí giấy vệ sinh": "A.5.1",
      "Chi phí hóa chất, xà phòng & bao rác": "A.5.2",
      "Chi phí khấu hao TSCĐ": "A.5.3",
      "Chi phí cho hoạt động PCCC": "A.5.4",
      "Chi phí hành chính, tiếp tân & khác…": "A.5.5",
      "Hệ thống Thang máy": "B.1.1",
      "Hệ thống Máy phát điện": "B.1.2",
      "Hệ thống chiller/hệ thống lạnh": "B.1.3",
      "Hệ thống điện": "B.1.4",
      "Hệ nước": "B.1.5",
      "Chi phí cải tạo, sửa chữa cho hạng mục Xây Dựng": "B.1.6",
      "Dịch vụ bảo trì thang máy": "B.2.1",
      "Dịch vụ bảo trì máy phát điện": "B.2.2",
      "Dịch vụ bảo trì hệ thống chiller": "B.2.3",
      "Dịch vụ xử lý nước chiller": "B.2.4",
      "Dịch vụ bảo trì máy biến thế / tủ điện": "B.2.5",
      "Dịch vụ Pest Control": "C.1.0",
      "Dịch vụ chăm sóc cây kiểng": "C.2.0",
      // "Dịch vụ thu gom chất thải & rút hầm cầu": "C.3.0",
      "Thu gom rác sinh hoạt": "C.3.1",
      "Rút hầm cầu/bể tách mỡ": "C.3.2",
      "Xử lý chất thải nguy hại": "C.3.3",
      "Dịch vụ vệ sinh mặt kính / tường, sàn bên ngoài": "C.4.0",
      "Chi phí giữ an ninh & trật tự bên ngoài toà nhà": "C.5.0",
      // "Dịch vụ bảo trì khác (Hệ thống giữ xe, Khử mùi toilet…)": "C.6.0",
      "Hệ thống giữ xe": "C.6.1",
      "Khử mùi toilet": "C.6.2",
      "Tổng đài điện thoại": "C.6.3",
      "Cảnh báo cháy": "C.6.4",
    };

    aoo.forEach((obj) => {
      for (const key in obj) {
        if (mapping[obj[key]]) {
          obj[key] = mapping[obj[key]];
        }
      }
    });

    // console.log(JSON.stringify(aoo))

    const keysToFilter = [
      "A.1.1",
      "A.1.2",
      "A.1.3",
      "A.1.4",
      "A.1.5",
      "A.1.6",
      "A.1.7",
      "A.1.8",
      "A.2.0",
      "A.3.0",
      "A.4.0",
      "A.5.1",
      "A.5.2",
      "A.5.3",
      "A.5.4",
      "A.5.5",
      "B.1.1",
      "B.1.2",
      "B.1.3",
      "B.1.4",
      "B.1.5",
      "B.1.6",
      "B.2.1",
      "B.2.2",
      "B.2.3",
      "B.2.4",
      "B.2.5",
      "C.1.0",
      "C.2.0",
      // "C.3.0",
      "C.3.1",
      "C.3.2",
      "C.3.3",
      "C.4.0",
      "C.5.0",
      // "C.6.0",
      "C.6.1",
      "C.6.2",
      "C.6.3",
      "C.6.4",
    ];

    aoo = aoo.filter((element) => keysToFilter.includes(element["0"]));

    aoo = aoo
      .map((obj) => {
        const buildingKeys = Object.keys(obj).filter((key) => key !== "0");
        const reportDate = endDate;
        const reportStart = startDate;
        const accountKey = obj["0"];

        return buildingKeys.map((buildingKey) => ({
          building_key: buildingKey,
          report_date: reportDate,
          report_start: reportStart,
          account_key: accountKey,
          amount: obj[buildingKey],
          initial_amount: null,
        }));
      })
      .flat();

    // console.log(JSON.stringify(aoo));

    await aoo_to_pg_table(client, aoo, table_name);

    await client.end();

    res.json({
      success: true,
      message: "Data imported successfully."
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error importing data.", error });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
