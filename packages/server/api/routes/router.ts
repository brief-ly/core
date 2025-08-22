import { Hono } from "hono";
import example from "./example";
import lawyers from "./lawyers";
import groups from "./groups";

const routes = new Hono()
  .route("/example", example)
  .route("/lawyers", lawyers)
  .route("/groups", groups);

export default routes;
