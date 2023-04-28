import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './estiloCoches.css';

const Coches = ({ userId }) => {
  const [coches, setCoches] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/coches')
      .then(response => {
        console.log(response.data.coches);
        setCoches(response.data.coches);
      })
      .catch(error => {
        console.log(error);
      });
  }, []);

  const handleAlquilarCoche = async (cocheId) => {
    if (!userId) {
      alert('Debes iniciar sesión para alquilar un coche');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/usuarios/coches/crear', {
        coche: cocheId,
        usuario: userId
      });
      console.log(response.data);
      alert('Coche alquilado con éxito');
    } catch (error) {
      console.log(error);
      alert('Error al alquilar el coche');
    }
  };

  return (
    <div className='plantilla'>

      {coches.map((coche, index) => (
        <div key={index} className='tarjeta'>
          <div className='imagen'>
            <img src={coche.imagen} alt={coche.nombre} />
          </div>
          <h2>{coche.nombre}</h2>
          <p>
            <span id='parametro'>Marca:</span> {coche.marca}
          </p>
          <p>
            <span id='parametro'>Modelo:</span> {coche.modelo}
          </p>
          <p>
            <span id='parametro'>Año:</span> {coche.año}
          </p>
          <p>
            <span id='parametro'>Precio:</span> {coche.precio}/día
          </p>
          <button type='button' onClick={() => handleAlquilarCoche(coche.id)}>Alquilar</button>
        </div>
      ))}
    </div>
  );
};

export default Coches;