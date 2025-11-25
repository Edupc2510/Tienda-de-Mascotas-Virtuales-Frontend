'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Productos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descripcion: {
        type: Sequelize.JSON,
        allowNull: true
      },
      imagenUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      imagenUrlCartoon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      precio: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      categoria: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ventasMes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Productos');
  }
};
