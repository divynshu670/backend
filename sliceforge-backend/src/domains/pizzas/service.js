// src/domains/pizzas/service.js
import prisma from "../../db/prisma.js";

export const listPizzas = async () => {
  return prisma.pizza.findMany({ orderBy: { createdAt: "desc" } });
};

export const getPizza = async (id) => {
  return prisma.pizza.findUnique({ where: { id } });
};

export const createPizza = async (data) => {
  return prisma.pizza.create({ data });
};

export const updatePizza = async (id, data) => {
  return prisma.pizza.update({ where: { id }, data });
};

export const deletePizza = async (id) => {
  return prisma.pizza.delete({ where: { id } });
};
