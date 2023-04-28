// rutas-usuarios-token.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Importación de librería
const jwt = require("jsonwebtoken");
const Usuario = require("../models/models-usuarios");



// * Listar todos los usuarios
router.get("/", async (req, res, next) => {
  let usuarios;
  try {
    usuarios = await Usuarios.find({}, "-password");
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
    usuario = await Usuarios.findById(idUsuario);
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

// * Crear nuevoUsuario
router.post("/", async (req, res, next) => {
  const { nombre, email, password, activo,  } = req.body;
  let existeUsuario;
  try {
    existeUsuario = await Usuarios.findOne({
      email: email,
    });
  } catch (err) {
    const error = new Error(err);
    error.code = 500;
    return next(error);
  }

  if (existeUsuario) {
    const error = new Error("Ya existe un usuario con ese e-mail.");
    error.code = 401; // ! 401: fallo de autenticación
    return next(error);
    // ! ATENCIÓN: FIJARSE EN DONDE EMPIEZA Y TERMINA ESTE ELSE
  } else {
    // ? Encriptación de password mediante bcrypt y salt
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12); // ? Método que produce la encriptación
    } catch (error) {
      const err = new Error(
        "No se ha podido crear el Usuarios. Inténtelo de nuevo"
      );
      err.code = 500;
      console.log(error.message);
      return next(err);
    }

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword, // ? La nueva password será la encriptada
      coches: [],
      activo: false,
    
    });

    try {
      await nuevoUsuario.save();
    } catch (error) {
      const err = new Error("No se han podido guardar los datos");
      err.code = 500;
      return next(err);
    }
    // ? Código para la creación del token
    try {
      token = jwt.sign(
        {
          userId: nuevoUsuario.id,
          email: nuevoUsuario.email,
        },
        "Admin123",
        {
          expiresIn: "1h",
        }
      );
    } catch (error) {
      const err = new Error("El proceso de alta ha fallado");
      err.code = 500;
      return next(err);
    }
    res.status(201).json({
      userId: nuevoUsuario.id,
      email: nuevoUsuario.email,
      token: token,
    });
  }
});

// * Crear nuevoUsuario (relacionándolo con Coche)
router.post('/', async (req, res, next) => {
	const { nombre, email, password, activo } = req.body;
	let existeUsuario;
	try {
		existeUsuario = await Usuarios.findOne({
			email: email,
		});
	} catch (err) {
		const error = new Error(err);
		error.code = 500;
		return next(error);
	}

	if (existeUsuario) {
		const error = new Error('Ya existe un usuario con ese e-mail.');
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
			const err = new Error('No se han podido guardar los datos');
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
		usuarioBuscar = await Usuarios.findById(idUsuario); // (1) Localizamos el usuario en la BDD
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
router.patch("alquilar/:id", async (req, res, next) => {
  const idUsuario = req.params.id;
  const cocheId = req.body.cocheId; // ID del coche alquilado

  try {
    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findById(idUsuario);

    // Agregar el ID del coche alquilado al array de coches alquilados del usuario
    usuario.cochesAlquilados.push(cocheId);

    // Guardar el usuario actualizado en la base de datos
    const usuarioActualizado = await usuario.save();

    res.status(200).json({
      mensaje: "Datos de usuario modificados",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    res.status(404).json({
      mensaje: "No se han podido actualizar los datos del usuario",
      error: error.message,
    });
  }
});

// * Eliminar un usuario
router.delete("/:id", async (req, res, next) => {
  let usuario;
  try {
    usuario = await Usuarios.findByIdAndDelete(req.params.id);
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
    usuarioExiste = await Usuarios.findOne({
      // ? (1) Comprobación de email
      email: email,
    });
  } catch (error) {
    const err = new Error(
      "No se ha podido realizar la operación. Pruebe más tarde"
    );
    err.code = 500;
    return next(err);
  }
  // ? ¿Qué pasa si el usuario no existe?
  if (!usuarioExiste) {
    const error = new Error(
      "No se ha podido identificar al Usuarios. Credenciales erróneos 2"
    );
    error.code = 422; // ! 422: Datos de usuario inválidos
    return next(error);
  }
  // ? Si existe el usuario, ahora toca comprobar las contraseñas.
  let esValidoElPassword = false;
  esValidoElPassword = bcrypt.compareSync(password, usuarioExiste.password);
  if (!esValidoElPassword) {
    const error = new Error(
      "No se ha podido identificar al usuario. Credenciales erróneos"
    );
    error.code = 401; // !401: Fallo de autenticación
    return next(error);
  }
  // ? usuario con los credeciales correctos.
  // ? Creamos ahora el token
  // ! CREACIÓN DEL TOKEN
  let token;
  try {
    token = jwt.sign(
      {
        userId: usuarioExiste.id,
        email: usuarioExiste.email,
      },
      "Admin123",
      {
        expiresIn: "1h",
      }
    );
  } catch (error) {
    const err = new Error("El proceso de login ha fallado");
    err.code = 500;
    return next(err);
  }
  res.status(201).json({
    mensaje: "usuario ha entrado con éxito en el sistema",
    userId: usuarioExiste.id,
    email: usuarioExiste.email,
    token: token,
  });
});

// * Buscar un usuario en función del parámetro de búsqueda
router.get("/buscar/:busca", async (req, res, next) => {
  const search = req.params.busca;
  let usuarios;
  try {
    usuarios = await Usuarios.find({
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
