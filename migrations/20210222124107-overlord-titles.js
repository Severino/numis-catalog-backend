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
  return db.createTable("overlord_titles", {
    overlord_id: {
      type: "int",
      foreignKey: {
        name: "overlord_title_fk",
        table: "overlord",
        mapping: "id",
        rules: { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
      }
    },
    title_id: {
      type: "int",
      foreignKey: {
        name: "overlord_honorific_fk",
        table: "title",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    }
  });
};

exports.down = function (db) {
  return db.dropTable("overlord_titles");
};

exports._meta = {
  "version": 1
};
