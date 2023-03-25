const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = express.Router({ mergeParams: true });
module.exports = timesheetsRouter;

timesheetsRouter.param('timesheetId', (req, res, next, id) => {
    db.get('SELECT * FROM Timesheet WHERE id = $id', {
        $id: id
    }, (err, timesheet) => {
        if (err) {
            next(err);
        } else if (timesheet) {
            req.timesheet = timesheet;
            next();
        } else {
            res.status(404).send();
        }
    });
});

timesheetsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Timesheet WHERE employee_id = $employeeId', {
        $employeeId: req.employee.id
    }, (err, timesheets) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({timesheets: timesheets});
        }
    });
});

const validateTimesheet = (req, res, next) => {
    const toCreateTimesheet = req.body.timesheet;
    if (!toCreateTimesheet.hours || !toCreateTimesheet.rate || !toCreateTimesheet.date) {
        return res.status(400).send();
    }
    next();
};

timesheetsRouter.post('/', validateTimesheet, (req, res, next) => {
    const newTimesheet = req.body.timesheet;
    db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)', {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employeeId: req.employee.id
    }, function(err) {
        if (err) {
            console.log(err);
        }
        db.get('SELECT * FROM Timesheet WHERE id = $id', {
            $id: this.lastID
        }, (err, timesheet) => {
            if (err) {
                next(err);
            } else if (!timesheet) {
                return res.status(500).send();
            }
            res.status(201).send({timesheet: timesheet});
        });
    });
});

timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
    const newTimesheet = req.body.timesheet;    
    db.run('UPDATE timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE id = $id', {
        $id: req.timesheet.id,
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employeeId: req.employee.id
    }, (err) => {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Timesheet WHERE id = $id', {
            $id: req.timesheet.id
        }, (err, timesheet) => {
            if (err) {
                next(err);
            } else if (!timesheet) {
                return res.status(500).send();
            }
            res.status(200).send({timesheet: timesheet});
        });
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run('DELETE FROM Timesheet WHERE id = $id', {
        $id: req.timesheet.id,
    }, (err) => {
        if (err) {
            next(err);
        }
        res.status(204).send();
    });
});
