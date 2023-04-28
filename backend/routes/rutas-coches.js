const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Coche = require("../models/models-coches");
const Usuario = require("../models/models-usuarios");
const checkAuth = require("../middleware/check-auth"); // (1) Importamos middleware de autorización




// * Recuperar coches desde la BDD en Atlas
router.get("/", async (req, res, next) => {
  let coches;
  try {
    coches = await Coche.find({}).populate("usuario");
  } catch (err) {
    const error = new Error("Ha ocurrido un error en la recuperación de datos");
    error.code = 500;
    return next(error);
  }
  res.status(200).json({
    mensaje: "Todos los coches",
    coches: coches,
  });
});

// * Recuperar un Coche por su Id
router.get("/:id", async (req, res, next) => {
  const idCoche = req.params.id;
  let coche;
  try {
    coche = await Coche.findById(idCoche).populate("usuario");
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido recuperar los datos"
    );
    error.code = 500;
    return next(error);
  }
  if (!coche) {
    const error = new Error(
      "No se ha podido encontrar un coche con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }
  res.json({
    mensaje: "coche encontrado",
    coche: coche,
  });
});

// * Buscar un coche en función del parámetro de búsqueda
router.get("/buscar/:busca", async (req, res, next) => {
  const search = req.params.busca;
  console.log(search);
  let coches;
  try {
    coches = await Coche.find({
      coche: { $regex: search, $options: "i" },
    }).populate("usuario");
  } catch (err) {
    const error = new Error("Ha ocurrido un error en la recuperación de datos");
    error.code = 500;
    return next(error);
  }
  res.status(200).json({ mensaje: "Todos los coches", coches: coches });
});

// ! Middleware para autorización
router.use(checkAuth);


// router.post('/', async (req, res, next) => {
//   const usuarioId = req.body.usuario; // Obtener el ID del usuario del cuerpo de la petición
//   try {
//     const usuario = await Usuario.findById(usuarioId); // Buscar el usuario por su ID en la base de datos
//     if (!usuario) {
//       // Si no se encuentra al usuario, devolver un error
//       const err = new Error('Usuario no encontrado');
//       err.code = 404;
//       throw err;
//     }
//     const nuevoCoche = new Coche({
//       imagen: req.body.imagen,
//       usuario: usuarioId, // Asignar el ID del usuario al campo "usuario" del coche
//       nombre: req.body.nombre,
//       marca: req.body.marca,
//       modelo: req.body.modelo,
//       año: req.body.año,
//       precio: req.body.precio,
//     });
//     await nuevoCoche.save(); // Guardar el coche en la base de datos
//     usuario.coches.push(nuevoCoche); // Agregar el ID del nuevo coche a la matriz de coches del usuario
//     await usuario.save(); // Guardar los cambios en el usuario
//     res.status(201).json({
//       mensaje: 'Coche añadido a la BDD',
//       coche: nuevoCoche,
//     });
//   } catch (error) {
//     console.log(error.message);
//     const err = new Error('No se han podido guardar los datos');
//     err.code = 500;
//     return next(err);
//   }
// });

// * Crear un nuevo coche (y el usuario relacionado) y guardarlo en Atlas
router.post("/crear", async (req, res, next) => {
  // ? Primero creamos el coche y lo guardamos en Atlas
  const { imagen, usuario, nombre, marca, modelo, año, precio } = req.body;
  const nuevoCoche = new Coche({
    // Nuevo documento basado en el Model coche.
    imagen: imagen,
    usuario: usuario,
    nombre: nombre,
    marca: marca,
    modelo: modelo,
    año: año,
    precio: precio,
  });
  // ? Localizamos al usuario que se corresponde con el que hemos recibido en el request
  let usuarioBusca;
  try {
    usuarioBusca = await Usuario.findById(req.body.usuario);
  } catch (error) {
    const err = new Error("Ha fallado la operación de creación");
    err.code = 500;
    return next(err);
  }
  console.log(usuarioBusca);
  // ? Si no está en la BDD mostrar error y salir
  if (!usuarioBusca) {
    const error = new Error(
      "No se ha podido encontrar un usuario con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }
  /**
   * ? Si está en la BDD tendremos que:
   * ?  1 - Guardar el nuevo coche
   * ?  2 - Añadir el nuevo coche al array de coches del usuario localizado
   * ?  3 - Guardar el usuario, ya con su array de coches actualizado
   */
  console.log(usuarioBusca);
  try {
    await nuevoCoche.save(); // ? (1)
    usuarioBusca.coches.push(nuevoCoche); // ? (2)
    await usuarioBusca.save(); // ? (3)
  } catch (error) {
    const err = new Error("Ha fallado la creación del nuevo coche");
    err.code = 500;
    return next(err);
  }
  res.status(201).json({
    mensaje: "coche añadido a la BDD",
    coche: nuevoCoche,
  });
});

// * Modificar un coche en base a su id
// router.patch('/:id', async (req, res, next) => {
// 	const idCoche = req.params.id;
// 	let cocheBuscar;
// 	try {
// 		cocheBuscar = await Coche.findById(idCoche); // (1) Localizamos el coche en la BDD
// 	} catch (error) {
// 		const err = new Error(
// 			'Ha habido algún problema. No se ha podido actualizar la información del coche'
// 		);
// 		err.code = 500;
// 		throw err;
// 	}
// 	if (cocheBuscar.usuario.toString() !== req.userData.userId) {
// 		// Verifica que el creador en la BDD sea el mismo que viene en el req. (headers)
// 		const err = new Error('No tiene permiso para modificar este coche');
// 		err.code = 401; // Error de autorización
// 		return next(err);
// 	}
// 	let cocheSearch;
// 	try {
// 		cocheSearch = await Coche.findByIdAndUpdate(idCoche, req.body, {
// 			new: true,
// 			runValidators: true,
// 		});
// 	} catch (error) {
// 		const err = new Error(
// 			'Ha ocurrido un error. No se han podido actualizar los datos'
// 		);
// 		err.code = 500;
// 		return next(error);
// 	}
// 	res.status(200).json({
// 		mensaje: 'coche modificado',
// 		coche: cocheSearch,
// 	});
// });

// * Modificar un coche en base a su id ( y su referencia en usuarios)
router.patch("/:id", async (req, res, next) => {
  const idCoche = req.params.id;
  let cocheBuscar;
  try {
    cocheBuscar = await Coche.findById(idCoche).populate("usuario"); // (1) Localizamos el coche en la BDD
  } catch (error) {
    const err = new Error(
      "Ha habido algún problema. No se ha podido actualizar la información del coche"
    );
    err.code = 500;
    throw err;
  }
  // // ! Verificación de usuario
  if (cocheBuscar.usuario.id.toString() !== req.userData.userId) {
    // Verifica que el creador en la BDD sea el mismo que viene en el req. (headers)
    const err = new Error("No tiene permiso para modificar este coche");
    err.code = 401; // Error de autorización
    return next(err);
  }
  // ? Si existe el coche y el usuario se ha verificado
  try {
    cocheBuscar = await Coche.findById(idCoche).populate("usuario");
    // ? Bloque si queremos modificar el usuario que imparte el coche
    if (req.body.usuario) {
      cocheBuscar.usuario.coches.pull(cocheBuscar); // * Elimina el coche del usuario al que se le va a quitar
      await cocheBuscar.usuario.save(); // * Guarda dicho usuario
      usuarioBuscar = await Usuario.findById(req.body.usuario); // * Localiza el usuario a quien se le va a reasignar el coche
      usuarioBuscar.coches.push(cocheBuscar); // * Añade al array de coches del usuario el coche que se le quitó al otro usuario
      usuarioBuscar.save(); // * Guardar el usuario con el nuevo coche en su array de coches
    }
    // ? Si queremos modificar cualquier propiedad del coche, menos el usuario.
    cocheBuscar = await Coche.findByIdAndUpdate(idCoche, req.body, {
      new: true,
      runValidators: true,
    }).populate("usuario");
  } catch (err) {
    console.log(err.message);
    const error = new Error(
      "Ha habido algún error. No se han podido modificar los datos"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    message: "coche modificado",
    coche: cocheBuscar,
  });
});

// * Modificar coche en base a su id - Método alternativo
// router.patch('/:id', async (req, res, next) => {
// 	// const { coche, usuario, opcion, aula, precio } = req.body;
// 	const idCoche = req.params.id;
// 	let cocheBuscar;
// 	try {
// 		cocheBuscar = await Coche.findByIdAndUpdate(idCoche, { precio: 7000 });
// 	} catch (error) {
// 		const err = new Error(
// 			'Ha ocurrido un error. No se han podido actualizar los datos'
// 		);
// 		error.code = 500;
// 		return next(err);
// 	}
// 	res.status(200).json({
// 		mensaje: 'coche modificado',
// 		coche: cocheBuscar,
// 	});
// });

// * Eliminar un coche en base a su id
// router.delete('/:id', async (req, res, next) => {
// 	let coche;
// 	try {
// 		coche = await Coche.findByIdAndDelete(req.params.id);
// 	} catch (err) {
// 		const error = new Error(
// 			'Ha habido algún error. No se han podido eliminar los datos'
// 		);
// 		error.code = 500;
// 		return next(error);
// 	}
// 	res.json({
// 		message: 'coche eliminado',
// 		coche: coche,
// 	});
// });

// * Eliminar un coche en base a su id (y el usuario relacionado)
router.delete("/:id", async (req, res, next) => {
  const idCoche = req.params.id;
  let coche;
  try {
    coche = await Coche.findById(idCoche).populate("usuario"); // ? Localizamos el coche en la BDD por su id
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido recuperar los datos para eliminación"
    );
    error.code = 500;
    return next(error);
  }
  if (!coche) {
    // ? Si no se ha encontrado ningún coche lanza un mensaje de error y finaliza la ejecución del código
    const error = new Error(
      "No se ha podido encontrar un coche con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }

  // // ! Verificación de usuario
  if (coche.usuario.id.toString() !== req.userData.userId) {
    // Verifica que el creador en la BDD sea el mismo que viene en el req. (headers) procedente de checkAuth
    const err = new Error("No tiene permiso para eliminar este coche");
    err.code = 401; // Error de autorización
    return next(err);
  }

  // ? Si existe el coche y el usuario se ha verificado
  try {
    // ? (1) Eliminar coche de la colección
    await coche.deleteOne();
    // ? (2) En el campo usuario del documento coche estará la lista con todos lo coches de dicho usuario. Con el método pull() le decimos a mongoose que elimine el coche también de esa lista.
    coche.usuario.coches.pull(coche);
    await coche.usuario.save(); // ? (3) Guardamos los datos de el campo usuario en la colección coche, ya que lo hemos modificado en la línea de código previa
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido eliminar los datos"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    message: "coche eliminado",
  });
});

module.exports = router;
