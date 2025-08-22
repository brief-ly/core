import { Hono } from "hono";
import example from "./example";
import lawyers from "./lawyers";

const routes = new Hono().route("/example", example).route("/lawyers", lawyers);

export default routes;
