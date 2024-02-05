require("dotenv").config({ path: ".env.test" });

import fetchMock from "jest-fetch-mock";
import fs from "fs";

fetchMock.mockResponse(async (req) => {
  const res = fs.readFileSync("./public/communities.test.json", "utf8");
  return res;
});

fetchMock.enableMocks();
