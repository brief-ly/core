import { db } from "./db";

const sql = await Bun.file("./dummy.sql").text();

db.run(sql);
