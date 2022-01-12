const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Column = new Schema({
    fontColor: {
    type: String
  },
  fontSize: {
    type: String
  },
  backgroundColor: {
    type: String
  },
  isPrimaryKey: {
    type: Boolean
  },
  field: {
    type: String
  },
  headerText: {
    type: String
  },
  textAlign: {
    type: String
  },
  width: {
    type: String
  },
  minWidth: {
    type: String
  },
  
}, {
  collection: 'columns'
})

module.exports = mongoose.model('Column', Column)


