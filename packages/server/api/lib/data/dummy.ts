import { db } from "./db";

const sql = await Bun.file("./api/lib/data/dummy.sql").text();

db.run(sql);
