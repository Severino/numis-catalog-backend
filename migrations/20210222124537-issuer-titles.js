'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable("issuer_titles", {
    issuer: {
      type: "int",
      foreignKey: {
        name: "ih_issuer_fk",
        table: "issuer",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }

      }
    },
    title: {
      type: "int",
      foreignKey: {
        name: "ih_title_fk",
        table: "title",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }

      }
    },
  });
};

exports.down = function (db) {
  return db.dropTable("issuer_titles");
};

exports._meta = {
  "version": 1
};
