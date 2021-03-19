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
  return db.createTable("type_coin_marks", {
    type: {
      type: "int",
      foreignKey: {
        name: "cmt_type_fk",
        table: "type",
        mapping: "id",
        rules: { onDelete: 'CASCADE', onUpdate: 'CASCADE' }

      }
    },
    coin_mark: {
      type: "int",
      foreignKey: {
        name: "cmt_coin_mark_fk",
        table: "coin_marks",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("type_coin_marks");
  ;
};

exports._meta = {
  "version": 1
};
