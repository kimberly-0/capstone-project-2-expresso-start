const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menusRouter = express.Router();
module.exports = menusRouter;

menusRouter.param('menuId', (req, res, next, id) => {
    db.get('SELECT * FROM Menu WHERE id = $id', {
        $id: id
    }, (err, menu) => {
        if (err) {
            next(err);
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            res.status(404).send();
        }
    });
});

menusRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Menu', (err, menus) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({menus: menus});
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({menu: req.menu});
});

const validateMenu = (req, res, next) => {
    if (!req.body.menu.title) {
        return res.status(400).send();
    }
    next();
};

menusRouter.post('/', validateMenu, (req, res, next) => {
    db.run('INSERT INTO Menu (title) VALUES ($title)', {
        $title: req.body.menu.title
    }, function(err) {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Menu WHERE id = $id', {
            $id: this.lastID
        }, (err, menu) => {
            if (!menu) {
                return res.status(500).send();
            }
            res.status(201).send({menu: menu});
        });
    });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
    db.run('UPDATE Menu SET title = $title WHERE id = $id', {
        $id: req.menu.id,
        $title: req.body.menu.title
    }, (err) => {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM Menu WHERE id = $id', {
            $id: req.menu.id
        }, (err, menu) => {
            if (err) {
                next(err);
            } else if (!menu) {
                return res.status(500).send();
            }
            res.status(200).send({menu: menu});
        });
    });
});

const ensureMenuHasNoMenuItems = (req, res, next) => {
    const toDeleteMenu = req.menu;
    db.all('SELECT * FROM MenuItem WHERE menu_id = $menuId', {
        $menuId: toDeleteMenu.id
    }, (err, menuItems) => {
        if (err) {
            next(err);
        } else if (menuItems.length > 0) {
            return res.status(400).send();
        }
        next();
    });
};

menusRouter.delete('/:menuId', ensureMenuHasNoMenuItems, (req, res, next) => {
    db.run('DELETE FROM Menu WHERE id = $id', {
        $id: req.menu.id,
    }, (err) => {
        if (err) {
            next(err);
        }
        res.status(204).send();
    });
});
