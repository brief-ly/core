import { Hono } from "hono";
import example from "./example";
import lawyers from "./lawyers";
import groups from "./groups";
import upload from "./upload";

const routes = new Hono()
  .route("/example", example)
  .route("/lawyers", lawyers)
  .route("/groups", groups)
  .route("/upload", upload);

export default routes;
