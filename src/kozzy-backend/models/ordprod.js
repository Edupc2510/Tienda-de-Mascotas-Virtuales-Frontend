'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrdProd extends Model {
    static associate(models) {
      // Opcional: acceso directo desde OrdProd a Orden y Producto
      OrdProd.belongsTo(models.Orden, {
        foreignKey: 'ordenId',
        as: 'orden'
      });
      OrdProd.belongsTo(models.Producto, {
        foreignKey: 'productoId',
        as: 'producto'
      });
    }
  }

  OrdProd.init(
    {
      ordenId: DataTypes.INTEGER,
      productoId: DataTypes.INTEGER,
      cantidad: DataTypes.INTEGER,
      precioUnitario: DataTypes.FLOAT
    },
    {
      sequelize,
      modelName: 'OrdProd',
      tableName: 'OrdProds'
    }
  );

  return OrdProd;
};
