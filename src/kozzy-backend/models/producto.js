'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {

      // ✔ Relación N:M con Ordenes
      Producto.belongsToMany(models.Orden, {
        through: models.OrdProd,
        foreignKey: 'productoId',
        otherKey: 'ordenId',
        as: 'ordenes'
      });

      // ✔ Acceso directo al detalle
      Producto.hasMany(models.OrdProd, {
        foreignKey: 'productoId',
        as: 'detalle'
      });
    }
  }

  Producto.init({
    nombre: DataTypes.STRING,
    descripcion: DataTypes.JSON,
    imagenUrl: DataTypes.STRING,
    imagenUrlCartoon: DataTypes.STRING,
    precio: DataTypes.FLOAT,
    categoria: DataTypes.STRING,
    ventasMes: DataTypes.INTEGER,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Producto',
    tableName: 'Productos'
  });

  return Producto;
};
