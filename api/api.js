const express = require('express');
const app = require('../server');

const apiRouter = express.Router();
module.exports = apiRouter;

const employeesRouter = require('./employees');
apiRouter.use('/employees', employeesRouter);

const timesheetsRouter = require('./timesheets');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

const menusRouter = require('./menus');
apiRouter.use('/menus', menusRouter);

const menuitemsRouter = require('./menuitems');
menusRouter.use('/:menuId/menu-items', menuitemsRouter);
