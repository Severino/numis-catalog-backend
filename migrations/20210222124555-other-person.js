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
  return db.createTable("other_person", {
    type: {
      type: "int",
      foreignKey: {
        name: "other_person_type_fk",
        table: "type",
        mapping: "id",
        rules: { onDelete: 'CASCADE', onUpdate: 'CASCADE' }

      }
    },
    person: {
      type: "int",
      foreignKey: {
        name: "other_person_person_fk",
        table: "person",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("other_person");
};

exports._meta = {
  "version": 1
};
