import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

import { join } from "path";

type Data = string[];

export const devdb = () => {
  const db = new LowSync<string[]>(
    new JSONFileSync(join(process.cwd() + "/data/db.json")),
    [] as Data,
  );

  return db;
};
