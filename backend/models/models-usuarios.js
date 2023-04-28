const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  coches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coche",
    },
  ],
});

module.exports = mongoose.model("Usuario", usuarioSchema);