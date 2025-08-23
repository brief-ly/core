import { hc } from "hono/client";
import type { ExampleType } from "@/api/routes/example"
import type { LawyersType } from "@/api/routes/lawyers";
import type { UploadType } from "@/api/routes/upload";
import type { GroupsType } from "@/api/routes/groups";

const baseUrl = process.env.BUN_PUBLIC_SERVER_URL || "http://localhost:3000/api/v1";

const client = {
    example: hc<ExampleType>(`${baseUrl}/example`),
    lawyers: hc<LawyersType>(`${baseUrl}/lawyers`),
    upload: hc<UploadType>(`${baseUrl}/upload`),
    groups: hc<GroupsType>(`${baseUrl}/groups`),
};

export default client;