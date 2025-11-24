const request = require("supertest");
const app = require("../server");
const db = require("../db");

beforeAll(done => {
  const now = new Date().toISOString();

  db.serialize(() => {
    db.run("DELETE FROM products");
    db.run(
      `INSERT INTO products
      (owner_id, name, unit, category, brand, stock, status, image, description, is_deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        "ExportTest",
        "pcs",
        "Tools",
        "BrandX",
        5,
        "In Stock",
        "",
        "",
        0,
        now,
        now
      ],
      (err) => {
        if (err) console.error("Insert error:", err);
        done();
      }
    );
  });
});

describe("CSV Export", () => {
  test("Export CSV should return CSV file", async () => {
    const res = await request(app)
      .get("/api/products/export")
      .expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("ExportTest");
  });
});
