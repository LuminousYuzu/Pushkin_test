exports.up = function (knex) {
  return knex.schema.createTable("pushkin_userMeta", (table) => {
    table.increments("id").primary();
    table.string("user_id").references("user_id").inTable("pushkin_users").notNullable();
    table.json("metaQuestion").notNullable();
    table.json("metaResponse").notNullable();
    table.timestamp("created_at").notNullable();
    table.timestamp("updated_at");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("pushkin_userMeta");
};
