'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Orden extends Model {
    static associate(models) {

      // ✔ Relación con Usuario (1:N)
      Orden.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });

      // ✔ Relación N:M con Productos
      Orden.belongsToMany(models.Producto, {
        through: models.OrdProd,      // tabla intermedia
        foreignKey: 'ordenId',
        otherKey: 'productoId',
        as: 'productos'
      });

      // ✔ Acceso directo al detalle (opcional pero útil)
      Orden.hasMany(models.OrdProd, {
        foreignKey: 'ordenId',
        as: 'detalle'
      });
    }
  }

  Orden.init({
    usuarioId: DataTypes.INTEGER,
    items: DataTypes.JSON,    // si ya no usarás esto, puedes quitarlo
    envio: DataTypes.JSON,
    pago: DataTypes.JSON,
    total: DataTypes.FLOAT,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Orden',
    tableName: 'Ordenes'
  });

  return Orden;
};
