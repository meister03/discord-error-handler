const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  guildid: { type: String },
  msgid: { type: String},
  error: { type: String},
  content: { type: String }, /// Change the field name | add other Fields, do not forget the "," ;)
  count: {type:  String }
});

module.exports = mongoose.model('reaction', reactionSchema);
