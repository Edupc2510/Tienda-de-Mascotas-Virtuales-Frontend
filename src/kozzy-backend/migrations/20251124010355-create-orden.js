'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ordenes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      items: {
        type: Sequelize.JSON,
        allowNull: false
      },
      envio: {
        type: Sequelize.JSON,
        allowNull: false
      },
      pago: {
        type: Sequelize.JSON,
        allowNull: false
      },
      total: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pendiente'
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
    await queryInterface.dropTable('Ordenes');
  }
};
