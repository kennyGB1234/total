
const { response } = require("express");
const express = require("express");
const router = express.Router();

const Usuario = require("../models/models-usuario");


// * Listar todos los usuarios
router.get("/", async (req, res, next) => {
  let usuarios;
  try {
    usuarios = await Usuario.find({}, "-password").populate("coches");
  } catch (err) {
    const error = new Error("Ha ocurrido un error en la recuperación de datos");
    error.code = 500;
    return next(error);
  }
  res.status(200).json({
    mensaje: "Todos los usuarios",
    usuarios: usuarios,
  });
});

// * Listar un usuario en concreto
router.get("/:id", async (req, res, next) => {
  const idUsuario = req.params.id;
  let usuario;
  try {
    usuario = await Usuario.findById(idUsuario);
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido recuperar los datos"
    );
    error.code = 500;
    return next(error);
  }
  if (!usuario) {
    const error = new Error(
      "No se ha podido encontrar un usuario con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }
  res.json({
    mensaje: "usuario encontrado",
    usuario: usuario,
  });
});

// * Crear nuevo usuario
router.post("/", async (req, res, next) => {
  const { nombre, email, password, coches, activo } = req.body;
  let existeUsuario;
  try {
    existeUsuario = await Usuario.findOne({
      email: email,
    });
  } catch (err) {
    const error = new Error(err);
    error.code = 500;
    return next(error);
  }

  if (existeUsuario) {
    const error = new Error("Ya existe un usuario con ese e-mail.");
    error.code = 401; // 401: fallo de autenticación
    return next(error);
  } else {
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password,
      coches,
      activo,
    });
    try {
      await nuevoUsuario.save();
    } catch (error) {
      const err = new Error("No se han podido guardar los datos");
      err.code = 500;
      return next(err);
    }
    res.status(201).json({
      usuario: nuevoUsuario,
    });
  }
});

// * Crear nuevo usuario (relacionándolo con coche)
router.post("/", async (req, res, next) => {
  const { nombre, email, password, activo } = req.body;
  let existeUsuario;
  try {
    existeUsuario = await Usuario.findOne({
      email: email,
    });
  } catch (err) {
    const error = new Error(err);
    error.code = 500;
    return next(error);
  }

  if (existeUsuario) {
    const error = new Error("Ya existe un usuario con ese e-mail.");
    error.code = 401; // 401: fallo de autenticación
    return next(error);
  } else {
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password,
      activo,
      coches: [],
    });
    try {
      await nuevoUsuario.save();
    } catch (error) {
      const err = new Error("No se han podido guardar los datos");
      err.code = 500;
      return next(err);
    }
    res.status(201).json({
      usuario: nuevoUsuario,
    });
  }
});

// * Modificar datos de un usuario
router.patch('/:id', async (req, res, next) => {
	const { nombre, email, password, coches, activo } = req.body; // ! Recordar: Destructuring del objeto req.body
	const idUsuario = req.params.id;
	let usuarioBuscar;
	try {
		usuarioBuscar = await Usuario.findById(idUsuario); // (1) Localizamos el usuario en la BDD
	} catch (error) {
		const err = new Error(
			'Ha habido algún problema. No se ha podido actualizar la información del usuario'
		);
		err.code = 500;
		throw err;
	}

	// (2) Modificamos el usuario
	usuarioBuscar.nombre = nombre;
	usuarioBuscar.email = email;
	usuarioBuscar.password = password;
	usuarioBuscar.coches = coches;
	usuarioBuscar.activo = activo;

	try {
		usuarioBuscar.save(); // (3) Guardamos los datos del usuario en la BDD
	} catch (error) {
		const err = new Error(
			'Ha habido algún problema. No se ha podido guardar la información actualizada'
		);
		err.code = 500;
		throw err;
	}
	res.status(200).json({
		mensaje: 'Datos de usuario modificados',
		usuario: usuarioBuscar,
	});
});

// * Modificar datos de un usuario - Método más efectivo (findByIdAndUpadate)
router.patch("/:id", async (req, res, next) => {
  const idUsuario = req.params.id;
  const camposPorCambiar = req.body;
  let usuarioBuscar;
  try {
    usuarioBuscar = await Usuario.findByIdAndUpdate(
      idUsuario,
      camposPorCambiar,
      {
        new: true,
        runValidators: true,
      }
    ); // (1) Localizamos y actualizamos a la vez el usuario en la BDD
  } catch (error) {
    res.status(404).json({
      mensaje: "No se han podido actualizar los datos del usuario",
      error: error.message,
    });
  }
  res.status(200).json({
    mensaje: "Datos de usuario modificados",
    usuario: usuarioBuscar,
  });
});

// * Eliminar un usuario
router.delete("/:id", async (req, res, next) => {
  let usuario;
  try {
    usuario = await Usuario.findByIdAndDelete(req.params.id);
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido eliminar los datos"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    mensaje: "usuario eliminado",
    usuario: usuario,
  });
});

// * Login de usuarios
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  let usuarioExiste;
  try {
    usuarioExiste = await Usuario.findOne({
      // (1) Comprobación de email
      email: email,
    });
  } catch (error) {
    const err = new Error(
      "No se ha podido realizar la operación. Pruebe más tarde"
    );
    err.code = 500;
    return next(err);
  }

  if (!usuarioExiste || usuarioExiste.password !== password) {
    const error = new Error(
      "No se ha podido identificar al Usuario. Credenciales erróneos"
    ); // (2) El usuario no existe
    error.code = 422; // 422: Datos de usuario inválidos
    return next(error);
  } else {
    res.json({
      mensaje: "usuario logueado", // (3) El usuario existe
    });
  }
});

// * Buscar un usuario en función del parámetro de búsqueda
router.get("/buscar/:busca", async (req, res, next) => {
  const search = req.params.busca;
  let usuarios;
  try {
    usuarios = await Usuario.find({
      nombre: { $regex: search, $options: "i" },
    });
  } catch (err) {
    const error = new Error("Ha ocurrido un error en la recuperación de datos");
    error.code = 500;
    return next(error);
  }
  res.status(200).json({ mensaje: "usuarios encontrados", usuarios: usuarios });
});

module.exports = router;
