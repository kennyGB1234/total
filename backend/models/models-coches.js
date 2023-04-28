const mongoose = require("mongoose");

const cocheSchema = new mongoose.Schema({
  imagen: {
    type: String,
    required: true,
    trim: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  marca: {
    type: String,
    required: true,
    trim: true,
  },
  modelo: {
    type: String,
    required: true,
    trim: true,
  },
  año: {
    type: Number,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
    trim: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
});

module.exports = mongoose.model("Coche", cocheSchema);