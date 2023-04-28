
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Importación de librería
const jwt = require("jsonwebtoken");

const Usuario = require("../models/models-usuarios");
const Coches = require("../models/models-coches");

// * Listar todos los usuarios
router.get("/", async (req, res, next) => {
  let usuarios;
  try {
    usuarios = await Usuario.find({}, "-password");
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

// * Crear nuevo Usuario
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
    const error = new Error("Ya existe un Usuario con ese e-mail.");
    error.code = 401; // ! 401: fallo de autenticación
    return next(error);
  } else {
    // ? Encriptación de password mediante bcrypt y salt
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12); // ? Método que produce la encriptación
    } catch (error) {
      const err = new Error(
        "No se ha podido crear el Usuario. Inténtelo de nuevo"
      );
      err.code = 500;
      return next(err);
    }

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword, // ? La nueva password será la encriptada
      coches: [],
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


// PROBLEMA: EL LOGIN SE HACE CON LA CONTRASEÑA ENCRIPTADA
// router.post("/login", async (req, res, next) => {
//   const { email, password } = req.body;
//   let usuarioExiste;
//   try {
//     usuarioExiste = await Usuario.findOne({
//       // ? (1) Comprobación de email
//       email: email,
//     });
//   } catch (error) {
//     const err = new Error(
//       "No se ha podido realizar la operación. Pruebe más tarde"
//     );
//     err.code = 500;
//     return next(err);
//   }
//   // ? ¿Qué pasa si el usuario no existe?
//   if (!usuarioExiste) {
//     const error = new Error(
//       "No se ha podido identificar al usuario. Credenciales erróneos 2"
//     );
//     error.code = 422; // ! 422: Datos de usuario inválidos
//     return next(error);
//   }
//   // ? Si existe el usuario, ahora toca comprobar las contraseñas.
//   let esValidoElPassword = false;
//   try {
//     if (password === usuarioExiste.password) {
//       esValidoElPassword = true;
//     }
//     // LA LINEA DE ABAJO COMPARA LAS CONTRASEÑAS PARA QUE SE BUSQUE POR LA CONTRASEÑA SIN HASH
//     esValidoElPassword = bcrypt.compare(password, usuarioExiste.password);
//   } catch (error) {
//     const err = new Error(
//       "No se ha realizar el login. Revise sus credenciales"
//     );
//     err.code = 500;
//     return next(err);
//   }
//   if (!esValidoElPassword) {
//     const error = new Error(
//       "No se ha podido identificar al usuario. Credenciales erróneos"
//     );
//     error.code = 401; // !401: Fallo de autenticación
//     return next(error);
//   }
//   res.json({
//     mensaje: "usuario logueado", // ? (3) El usuario existe
//   });
// });

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  let usuarioExiste;
  try {
    usuarioExiste = await Usuario.findOne({
      email: email,
    });
  } catch (err) {
    const error = new Error("No se ha podido realizar la operación. Pruebe más tarde");
    error.code = 500;
    return next(error);
  }

  if (!usuarioExiste) {
    const error = new Error("El email o la contraseña son incorrectos");
    error.code = 401; // 401: fallo de autenticación
    return next(error);
  }

  let passwordCorrecta = false;
  try {
    passwordCorrecta = await bcrypt.compare(password, usuarioExiste.password); // Compara la contraseña introducida con la contraseña encriptada almacenada en la base de datos
  } catch (err) {
    const error = new Error(err);
    error.code = 500;
    return next(error);
  }

  if (!passwordCorrecta) {
    const error = new Error("El email o la contraseña son incorrectos");
    error.code = 401; // 401: fallo de autenticación
    return next(error);
  }

  // Crear token
  const token = jwt.sign({ email: usuarioExiste.email, id: usuarioExiste._id }, "mySecretKey", { expiresIn: "1h" });

  res.status(200).json({
    mensaje: "Usuario logueado correctamente",
    userId: usuarioExiste.id,
    email: usuarioExiste.email,
    token: token,
  });
});

// router.patch("alquilar/:id", async (req, res, next) => {
//   const idUsuario = req.params.id;
//   let clienteCoche;
//   let elCoche;
  
//   try {
//      clienteCoche = await Usuario.findById(idUsuario);
//      elCoche = await Coches.findById(req.body.coches);

//      clienteCoche.coches.push(elCoche);

//      await clienteCoche.save();
//   } catch (error) {
//     res.status(500).json({ mensaje: 'Error al alquilar el coche', error: error.message });
//     return next(error);
//   }
//   res.status(200).json({
//     mensaje : `Añadido el coche al cliente`,
//     coches : clienteCoche
//   })
// });

router.patch("/alquilar/:id", async (req, res, next) => {
  const idUsuario = req.params.id;
  let cocheId; // ID del coche alquilado
  let usuario;
  try {
    // Buscar el usuario en la base de datos
     usuario = await Usuario.findById(idUsuario);
     cocheId = await Coches.findById(req.body.coches)
     console.log(idUsuario)
      console.log(cocheId)
    // Agregar el ID del coche alquilado al array de coches alquilados del usuario
    usuario.coches.push(cocheId);

    // Guardar el usuario actualizado en la base de datos
     await usuario.save();

    res.status(200).json({
      mensaje: "Datos de usuario modificados",
      usuario: usuario,
    });
  } catch (error) {
    res.status(404).json({
      mensaje: "No se han podido actualizar los datos del usuario",
      error: error.message,
    });
  }
});

module.exports = router;

