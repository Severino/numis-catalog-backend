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
  return db.createTable("type", {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    projectId: { type: "int", unique: true, notNull: true },
    treadwellId: "string",
    mint: {
      type: "int",
      unsigned: true,
      foreignKey: {
        name: "type_mint_fk",
        table: "mint",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    },
    mintAsOnCoin: "string",
    nominal: {
      type: "int",
      unsigned: true,
      foreignKey: {
        name: "type_nominal_fk",
        table: "nominal",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    }, yearOfMinting: "string",
    donativ: "boolean",
    procedure: "string",
    caliph: {
      type: "int",
      foreignKey: {
        name: "type_person_caliph_fk",
        table: "person",
        mapping: "id",
        rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' }
      }
    },
    front_side_field_text: "string",
    front_side_inner_inscript: "string",
    front_side_intermediate_inscript: "string",
    front_side_outer_inscript: "string",
    front_side_misc: "string",
    back_side_field_text: "string",
    back_side_inner_inscript: "string",
    back_side_intermediate_inscript: "string",
    back_side_outer_inscript: "string",
    back_side_misc: "string",
    cursive_script: "boolean",
    isolated_characters: "string",
    literature: "string"
  });
};

exports.down = function (db) {
  return db.dropTable("type");
};

exports._meta = {
  "version": 1
};
