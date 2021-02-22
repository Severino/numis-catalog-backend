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
  return db.createTable("overlord", {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    rank: "int",
    type: {
      type: "int",
      foreignKey: {
        name: "overlord_type_fk",
        table: "type",
        mapping: "id",
        rules: { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }
      },
      person: {
        name: "overlord_person_fk",
        table: "person",
        mapping: "id",
        rules: { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }
      },
    },

  });
};

exports.down = function (db) {
  return db.dropTable("overlord");
};

exports._meta = {
  "version": 1
};
