const express = require('express');
const cors = require('cors');

const { Usuario, Producto, Orden } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

// ========================================================
// USUARIOS
// ========================================================

app.get('/usuarios', async (req, res) => {
  const usuarios = await Usuario.findAll();
  res.json(usuarios);
});

app.get('/usuarios/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  usuario ? res.json(usuario) : res.status(404).json({ error: "Usuario no encontrado" });
});

app.post('/usuarios', async (req, res) => {
  try {
    const nuevo = await Usuario.create(req.body);
    res.json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  await usuario.update(req.body);
  res.json(usuario);
});

app.delete('/usuarios/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  await usuario.destroy();
  res.json({ mensaje: "Usuario eliminado" });
});

// ========================================================
// CAMBIAR CONTRASEÑA
// ========================================================

app.put('/usuarios/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { actual, nueva } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (usuario.password !== actual)
      return res.status(400).json({ error: "Contraseña actual incorrecta" });

    await usuario.update({ password: nueva });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cambiando la contraseña" });
  }
});

// ========================================================
// LOGIN
// ========================================================

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Faltan datos" });

    const usuario = await Usuario.findOne({ where: { email, password } });

    if (!usuario)
      return res.status(401).json({ error: "Credenciales inválidas" });
    
    if (!usuario.activo)
      return res.status(403).json({ error: "Usuario inactivo, no puede iniciar sesión" });

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      role: usuario.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ========================================================
// PRODUCTOS
// ========================================================

app.get('/productos', async (req, res) => {
  const productos = await Producto.findAll();
  res.json(productos);
});

app.get('/productos/:id', async (req, res) => {
  const producto = await Producto.findByPk(req.params.id);
  producto ? res.json(producto) : res.status(404).json({ error: "Producto no encontrado" });
});

app.post('/productos', async (req, res) => {
  try {
    const nuevo = await Producto.create(req.body);
    res.json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/productos/:id', async (req, res) => {
  const producto = await Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

  await producto.update(req.body);
  res.json(producto);
});

app.delete('/productos/:id', async (req, res) => {
  const producto = await Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

  await producto.destroy();
  res.json({ mensaje: "Producto eliminado" });
});

// ========================================================
// ORDENES
// ========================================================

app.get('/ordenes', async (req, res) => {
  try {
    const ordenes = await Orden.findAll({
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Producto, as: 'productos' }
      ]
    });
    res.json(ordenes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

app.get('/ordenes/:id', async (req, res) => {
  try {
    const orden = await Orden.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Producto, as: 'productos' }
      ]
    });

    orden ? res.json(orden) : res.status(404).json({ error: "Orden no encontrada" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo la orden" });
  }
});

app.post('/ordenes', async (req, res) => {
  try {
    const nueva = await Orden.create(req.body);
    res.json(nueva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/ordenes/:id', async (req, res) => {
  const orden = await Orden.findByPk(req.params.id);
  if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

  await orden.update(req.body);
  res.json(orden);
});

app.delete('/ordenes/:id', async (req, res) => {
  const orden = await Orden.findByPk(req.params.id);
  if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

  await orden.destroy();
  res.json({ mensaje: "Orden eliminada" });
});

// ========================================================
// SERVIDOR
// ========================================================

app.listen(5000, () => console.log("Servidor ejecutándose en puerto 5000"));
