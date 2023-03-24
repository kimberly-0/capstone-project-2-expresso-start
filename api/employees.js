const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const employeesRouter = express.Router();
module.exports = employeesRouter;

employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get('SELECT * FROM Employee WHERE id = $id', {
        $id: id
    }, (err, employee) => {
        if (err) {
            next(err);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.status(404).send();
        }
    });
});

employeesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (err, employees) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({employees: employees});
        }
    });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({employee: req.employee});
});

const validateEmployee = (req, res, next) => {
    const toCreateEmployee = req.body.employee;
    if (!toCreateEmployee.name || !toCreateEmployee.position || !toCreateEmployee.wage) {
        return res.status(400).send();
    }
    if (!toCreateEmployee.isCurrentEmployee) {
        req.body.employee.isCurrentEmployee = 1;
    }
    next();
};

employeesRouter.post('/', validateEmployee, (req, res, next) => {
    const toCreateEmployee = req.body.employee;    
    db.run('INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)', {
        $name: toCreateEmployee.name,
        $position: toCreateEmployee.position, 
        $wage: toCreateEmployee.wage, 
        $isCurrentEmployee: toCreateEmployee.isCurrentEmployee
    }, function(err) {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Employee WHERE id = $id', {
            $id: this.lastID
        }, (err, employee) => {
            if (!employee) {
                return res.status(500).send();
            }
            res.status(201).send({employee: employee});
        });
    });
});

employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
    const newEmployee = req.body.employee;    
    db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = $id', {
        $id: req.employee.id,
        $name: newEmployee.name,
        $position: newEmployee.position, 
        $wage: newEmployee.wage, 
        $isCurrentEmployee: newEmployee.isCurrentEmployee
    }, (err) => {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Employee WHERE id = $id', {
            $id: req.employee.id
        }, (err, employee) => {
            if (err) {
                next(err);
            } else if (!employee) {
                return res.status(500).send();
            }
            res.status(200).send({employee: employee});
        });
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run('UPDATE Employee SET is_current_employee = 0 WHERE id = $id', {
        $id: req.employee.id,
    }, (err) => {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Employee WHERE id = $id', {
            $id: req.employee.id
        }, (err, employee) => {
            if (err) {
                next(err);
            } else if (!employee || employee.is_current_employee !== 0) {
                return res.status(400).send();
            } 
            res.status(200).send({employee: employee});
        });
    });
});
