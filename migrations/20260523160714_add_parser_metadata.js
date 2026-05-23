exports.up = async function(knex) {
  await knex.schema.alterTable('transactions', function(table) {
    table.decimal('parsed_confidence', 5, 4).nullable();
    table.integer('attempts').defaultTo(0);
    table.timestamp('parsing_started_at').nullable();
    table.integer('parsing_duration_ms').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('transactions', function(table) {
    table.dropColumn('parsed_confidence');
    table.dropColumn('attempts');
    table.dropColumn('parsing_started_at');
    table.dropColumn('parsing_duration_ms');
  });
};