// const db = require("../config/db");
// const { user } = db.models;

// create
exports.create = (Model) => async (req, res) => {
    try {
        const item = await Model.create(req.body);

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// find
exports.find = (Model) => async (req, res) => {
    try {
        const item = await Model.findByPk(req.params.id);
        if (!item) {
            res.status(404).json({ message: "Item not found" });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// findAll
exports.findAll = (Model) => async (req, res) => {
    try {
        const items = await Model.findAll();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// update
// PUT request

// delete
exports.delete = (Model) => async (req, res) => {
    try {
        const primaryKeyField = Model.primaryKeyAttribute;
        const item = await Model.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        await Model.destroy({
            where: { [primaryKeyField]: req.params.id }
        });

        res.status(200).json({ message: "Deleted successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};