const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuitemsRouter = express.Router({ mergeParams: true });
module.exports = menuitemsRouter;

menuitemsRouter.param('menuItemId', (req, res, next, id) => {
    db.get('SELECT * FROM MenuItem WHERE id = $id', {
        $id: id
    }, (err, menuItem) => {
        if (err) {
            next(err);
        } else if (menuItem) {
            req.menuItem = menuItem;
            next();
        } else {
            res.status(404).send();
        }
    });
});

menuitemsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM MenuItem WHERE menu_id = $menuId', {
        $menuId: req.menu.id
    }, (err, menuItems) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({menuItems: menuItems});
        }
    });
});

const validateMenuItem = (req, res, next) => {
    const toCreateMenuItem = req.body.menuItem;
    if (!toCreateMenuItem.name || !toCreateMenuItem.inventory || !toCreateMenuItem.price) {
        return res.status(400).send();
    }
    next();
};

menuitemsRouter.post('/', validateMenuItem, (req, res, next) => {
    const newMenuItem = req.body.menuItem;
    db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)', {
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price,
        $menuId: req.menu.id
    }, function(err) {
        if (err) {
            console.log(err);
        }
        db.get('SELECT * FROM MenuItem WHERE id = $id', {
            $id: this.lastID
        }, (err, menuItem) => {
            if (err) {
                next(err);
            } else if (!menuItem) {
                return res.status(500).send();
            }
            res.status(201).send({menuItem: menuItem});
        });
    });
});

menuitemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
    const newMenuItem = req.body.menuItem;    
    db.run('UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE id = $id', {
        $id: req.menuItem.id,
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price,
        $menuId: req.menu.id
    }, (err) => {
        if (err) {
            next(err);
        }
        db.get('SELECT * FROM MenuItem WHERE id = $id', {
            $id: req.menuItem.id
        }, (err, menuItem) => {
            if (err) {
                next(err);
            } else if (!menuItem) {
                return res.status(500).send();
            }
            res.status(200).send({menuItem: menuItem});
        });
    });
});

menuitemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run('DELETE FROM MenuItem WHERE id = $id', {
        $id: req.menuItem.id,
    }, (err) => {
        if (err) {
            next(err);
        }
        res.status(204).send();
    });
});
