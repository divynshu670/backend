// src/domains/pizzas/controller.js
import * as service from "./service.js";

export const list = async (req, res) => {
  try {
    const pizzas = await service.listPizzas();
    return res.json(pizzas);
  } catch (err) {
    console.error("Pizzas list error:", err);
    return res.status(500).json({ msg: "Failed to list pizzas" });
  }
};

export const get = async (req, res) => {
  try {
    const pizza = await service.getPizza(req.params.id);
    if (!pizza) return res.status(404).json({ msg: "Not found" });
    return res.json(pizza);
  } catch (err) {
    console.error("Get pizza error:", err);
    return res.status(500).json({ msg: "Failed to fetch pizza" });
  }
};

function validatePizzaPayload(p) {
  // required: name and priceCents (priceCents must be integer)
  if (!p || typeof p !== "object") return false;
  if (!p.name) return false;
  if (p.priceCents === undefined || !Number.isInteger(p.priceCents)) return false;
  return true;
}

export const create = async (req, res) => {
  try {
    // Support both single object and array of objects
    const payload = req.body;

    if (Array.isArray(payload)) {
      // allow empty array -> return empty array
      if (payload.length === 0) return res.status(201).json([]);

      // validate each
      const invalidIndex = payload.findIndex((p) => !validatePizzaPayload(p));
      if (invalidIndex !== -1) {
        return res.status(400).json({ msg: `Missing/invalid fields for item at index ${invalidIndex}` });
      }

      // create all pizzas
      const created = await Promise.all(
        payload.map((p) =>
          service.createPizza({
            name: p.name,
            description: p.description ?? "",
            imageUrl: p.imageUrl ?? "",
            priceCents: p.priceCents
          })
        )
      );

      return res.status(201).json(created);
    } else {
      // single object
      const { name, description, imageUrl, priceCents } = payload;
      if (!name || priceCents === undefined || !Number.isInteger(priceCents)) return res.status(400).json({ msg: "Missing fields" });

      const created = await service.createPizza({ name, description: description ?? "", imageUrl: imageUrl ?? "", priceCents });
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error("Create pizza error:", err);
    return res.status(500).json({ msg: "Create failed" });
  }
};

export const update = async (req, res) => {
  try {
    const pizzaId = req.params.id;
    const existing = await service.getPizza(pizzaId);
    if (!existing) return res.status(404).json({ msg: "Pizza not found" });

    const updateData = req.body;
    // optional: validate update fields (if provided)
    if (updateData.priceCents !== undefined && !Number.isInteger(updateData.priceCents)) {
      return res.status(400).json({ msg: "priceCents must be an integer" });
    }

    const updated = await service.updatePizza(pizzaId, updateData);
    return res.json(updated);
  } catch (err) {
    console.error("Update pizza error:", err);
    return res.status(500).json({ msg: "Update failed" });
  }
};

export const remove = async (req, res) => {
  try {
    await service.deletePizza(req.params.id);
    return res.json({ msg: "Deleted" });
  } catch (err) {
    console.error("Delete pizza error:", err);
    return res.status(500).json({ msg: "Delete failed" });
  }
};
