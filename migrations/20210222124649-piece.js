'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable("piece", {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    piece: "string",
    type: {
      type: "int",
      foreignKey: {
        name: "piece_type_fk",
        table: "type",
        mapping: "id",
        rules: { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("piece");
};

exports._meta = {
  "version": 1
};
