const request = require("supertest");
const app = require("../server");
const db = require("../db");
const fs = require("fs");

beforeAll(done => {
  db.run("DELETE FROM products", () => done());
});


describe("CSV Import", () => {

  test("Import valid CSV", async () => {
    const csvData = `name,unit,category,brand,stock,status,image,description
Hammer,pcs,Tools,BrandX,10,In Stock,,Sample`;

    fs.writeFileSync("test.csv", csvData);

    const res = await request(app)
      .post("/api/products/import")
      .attach("file", "test.csv")
      .expect(200);

    expect(res.body).toHaveProperty("added");
    expect(res.body.added).toBeGreaterThan(0);

    fs.unlinkSync("test.csv");
  });

});
