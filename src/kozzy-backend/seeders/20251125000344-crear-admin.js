'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Usuarios', [
      {
        id: 0,
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@local',
        password: 'admin',  // Ojo: SIN hashear, si usas bcrypt deberías hashearlo antes
        role: 'admin',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', { id: 0 }, {});
  }
};
