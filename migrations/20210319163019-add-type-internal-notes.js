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

exports.up = function (db, callback) {
  return db.addColumn("type", "internal_notes" , {
    type: "string",
    defaultValue: ""
  }, callback);
};

exports.down = function (db, callback) {
  return db.removeColumn("type", "internal_notes", callback);
};

exports._meta = {
  "version": 1
};
