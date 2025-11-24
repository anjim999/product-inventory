const request = require("supertest");
const app = require("../server");
const db = require("../db");

let createdProductId;

beforeAll(done => {
  db.serialize(() => {
    db.run("DELETE FROM products", () => {
      db.run("DELETE FROM inventory_logs", () => done());
    });
  });
});


describe("Inventory History API", () => {
  test("Create product first", async () => {
    const res = await request(app)
      .post("/api/products")
      .field("name", "History Test")
      .field("unit", "pcs")
      .field("category", "Tools")
      .field("brand", "Generic")
      .field("stock", "10")
      .expect(201);

    createdProductId = res.body.id;
    expect(createdProductId).toBeDefined();
  });

  test("Update product to create history record", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .field("name", "History Test")
      .field("unit", "pcs")
      .field("category", "Tools")
      .field("brand", "Generic")
      .field("stock", "5")
      .expect(200);

    expect(res.body.stock).toBe(5);
  });

  test("GET /:id/history should return inventory logs", async () => {
    const res = await request(app)
      .get(`/api/products/${createdProductId}/history`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("product_id");
  });
});
