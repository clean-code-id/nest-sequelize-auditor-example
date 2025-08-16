'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'CleanCode Admin',
        email: 'admin@cleancode.id',
        phone: '+62-21-123-4567',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'CleanCode User',
        email: 'user@cleancode.id', 
        phone: '+62-21-987-6543',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@cleancode.id', 'user@cleancode.id']
    }, {});
  }
};
