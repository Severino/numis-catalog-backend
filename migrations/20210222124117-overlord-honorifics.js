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
  return db.createTable("overlord_honorifics", {
    overlord_id: {
      type: "int",
      foreignKey: {
        name: "oh_overlord_fk",
        table: "overlord",
        mapping: "id",
        rules: { onDelete: 'CASCADE', onUpdate: 'CASCADE' }

      }
    },
    honorific_id: {
      type: "int",
      foreignKey: {
        name: "oh_honorific_fk",
        table: "honorific",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("overlord_honorifics");
};

exports._meta = {
  "version": 1
};
