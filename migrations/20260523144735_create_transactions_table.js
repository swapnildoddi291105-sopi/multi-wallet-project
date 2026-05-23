exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').nullable();
    table.string('wallet_id').nullable();
    table.text('raw_text').notNullable();
    table.decimal('amount', 18, 8).nullable();
    table.string('currency', 10).nullable();
    table.string('merchant').nullable();
    table.string('method').nullable();
    table.timestamp('timestamp').nullable();
    table.timestamp('parsed_at').defaultTo(knex.fn.now());
    table.string('status').defaultTo('new');
    table.string('source').nullable();
    table.unique(['wallet_id', 'raw_text', 'parsed_at']); // prevents duplicate logs
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('transactions');
};

exports.up = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.text('error_message').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.dropColumn('error_message');
  });
};