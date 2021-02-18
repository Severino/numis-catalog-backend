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

exports.up = function(db) {
  return  db.create("titled_person", {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    person: {
      type: "int",
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: "titledperson_person_fk",
        table: "person",
        mapping: "id"
      },foreignKey: {
        name: "titledperson_person_fk",
        table: "person",
        mapping: "id"
      },foreignKey: {
        name: "titledperson_person_fk",
        table: "person",
        mapping: "id"
      }
    });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
