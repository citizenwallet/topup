import { dbconnect, db, dbreset, dbclose } from "../lib/db";
import { futureDate } from "../lib/lib";

const communitySlug = "testCommunity";
const description = "testDescription";

let record;

describe("db.test.js", () => {
  beforeAll(async () => {
    await dbconnect();
    await dbreset();
    record = await db.insert("redeem_codes", {
      communitySlug,
      description,
    });
  });

  afterAll(async () => {
    // Close the database connection.
    await dbclose();
  });

  test("select *", async () => {
    // Arrange

    // Act
    const result = await db.select("redeem_codes", "*");

    // Assert
    expect(result.rowCount).toEqual(1);
    expect(result.rows.length).toEqual(1);
    expect(result.rows[0].communitySlug).toEqual(communitySlug);
    expect(result.rows[0].description).toEqual(description);
    expect(result.fields.length).toEqual(20);
  });
  test("select * with WHERE", async () => {
    // Arrange

    // Act
    const result = await db.select("redeem_codes", "*", { communitySlug });

    // Assert
    expect(result.rowCount).toEqual(1);
    expect(result.rows.length).toEqual(1);
    expect(result.rows[0].communitySlug).toEqual(communitySlug);
    expect(result.rows[0].description).toEqual(description);
    expect(result.fields.length).toEqual(20);
  });
});
