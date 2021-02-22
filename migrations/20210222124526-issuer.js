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
  return db.createTable("issuer", {
    id: {
      type: "int",
      primaryKey: true,
      autoIncrement: true
    },
    person: {
      type: "int",
      foreignKey: {
        name: "issuer_person_fk",
        table: "person",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("issuer");
};

exports._meta = {
  "version": 1
};
