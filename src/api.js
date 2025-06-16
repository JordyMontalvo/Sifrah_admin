import axios from "axios";

axios.defaults.baseURL = process.env.VUE_APP_SERVER + "/api";

class API {
  constructor({
    users,
    affiliations,
    Collects,
    OfficeCollects,
    activations,
    products,
    kadex,
    closeds,
    promos,
    promo,
    pay,
    wallet,
    Tree,
    offices,
    stock,
    reports,
    plans,
    transaction,
  }) {
    this.users = users;
    this.affiliations = affiliations;
    this.Collects = Collects;
    this.OfficeCollects = OfficeCollects;
    this.activations = activations;
    this.products = products;
    this.kadex = kadex;
    this.closeds = closeds;
    this.promos = promos;
    this.promo = promo;
    this.pay = pay;
    this.wallet = wallet;
    this.Tree = Tree;
    this.offices = offices;
    this.stock = stock;
    this.reports = reports;
    this.plans = plans;
    this.transaction = transaction;
  }
}

class Users {
  GET({ filter, page = 1, limit = 10, search, showAvailable }) {
    // Añadir showAvailable como parámetro
    const searchParam = search ? `&search=${search}` : "";
    const availableParam = showAvailable
      ? `&showAvailable=${showAvailable}`
      : ""; // Añadir el parámetro showAvailable
    return axios.get(
      `/admin/users?filter=${filter}&page=${page}&limit=${limit}${searchParam}${availableParam}`
    );
  }
  POST({ action, id, data }) {
    return axios.post(`/admin/users`, { action, id, data });
  }
} // Incluir el nuevo parámetro en la URL

class Affiliations {
  GET({ filter, account, page = 1, limit = 20, search }) {
    const searchParam = search ? `&search=${search}` : "";
    return axios.get(
      `/admin/affiliations?filter=${filter}&account=${account}&page=${page}&limit=${limit}${searchParam}`
    );
  }
  POST({ action, id }) {
    return axios.post(`/admin/affiliations`, { action, id });
  }
}

class Collects {
  GET({ filter, account }) {
    return axios.get(`/admin/collects?filter=${filter}&&account=${account}`);
  }
  POST({ action, id }) {
    return axios.post(`/admin/collects`, { action, id });
  }
}

class OfficeCollects {
  GET({ filter, account }) {
    return axios.get(
      `/admin/office-collects?filter=${filter}&&account=${account}`
    );
  }
  POST({ action, id }) {
    return axios.post(`/admin/office-collects`, { action, id });
  }
}

class Activations {
  GET({ filter, account, page = 1, limit = 20, search }) {
    const searchParam = search ? `&search=${search}` : "";
    return axios.get(
      `/admin/activations?filter=${filter}&account=${account}&page=${page}&limit=${limit}${searchParam}`
    );
  }
  POST({ action, id, points }) {
    return axios.post(`/admin/activations`, { action, id, points });
  }
}

class Products {
  GET() {
    return axios.get(`/admin/products`);
  }
  POST({ action, id, data }) {
    return axios.post(`/admin/products`, { action, id, data });
  }
}

class Kadex {
  GET() {
    return axios.get(`/admin/kadex`);
  }
  POST({ action, id, data }) {
    return axios.post(`/admin/kadex`, { action, id, data });
  }
}

class Closeds {
  GET() {
    return axios.get(`/admin/closeds`);
  }
  POST({ action, id, data }) {
    return axios.post(`/admin/closeds`, { action, id, data });
  }
}

class Promos {
  GET() {
    return axios.get(`/admin/promos`);
  }
  POST({ id, img, pos }) {
    return axios.post(`/admin/promos`, { id, img, pos });
  }
}
class Promo {
  POST({ type, action, data }) {
    // console.log({ type, action, data })
    return axios.post(`/admin/promo`, { type, action, data });
  }
}

class Pay {
  GET() {
    return axios.get(`/admin/pay`);
  }
  POST({ dni, amount, desc }) {
    return axios.post(`/admin/pay`, { dni, amount, desc });
  }
}

class Wallet {
  GET() {
    return axios.get(`/admin/wallet`);
  }
}

class Tree {
  GET() {
    return axios.get(`/admin/tree`);
  }
  POST({ to, from }) {
    return axios.post(`/admin/tree`, { to, from });
  }
}

class Stock {
  GET({ id }) {
    return axios.get(`/admin/stock?id=${id}`);
  }
  POST({ id, amount }) {
    return axios.post(`/admin/stock`, { id, amount });
  }
}

class Offices {
  GET() {
    return axios.get(`/admin/offices`);
  }
  POST({ id, products, office }) {
    return axios.post(`/admin/offices`, { id, products, office });
  }
}
class Reports {
  GET({ filter }) {
    return axios.get(`/admin/reports?filter=${filter}`);
  }
  POST({ id, products, office }) {
    return axios.post(`/admin/reports`, { id, products, office });
  }
}

class Plans {
  GET() {
    return axios.get(`/admin/plans`);
  }
}

class Transaction {
  GET(filter, account, page = 1, limit = 20, search) {
    const searchParam = search ? `&search=${search}` : "";
    return axios.get(
      `/admin/trans?filter=${filter}&account=${account}&page=${page}&limit=${limit}${searchParam}`
    );
  }
  POST({ action, id, data }) {
    return axios.post("/admin/trans", { action, id, data });
  }
}

export default new API({
  users: new Users(),
  affiliations: new Affiliations(),
  Collects: new Collects(),
  OfficeCollects: new OfficeCollects(),
  activations: new Activations(),
  products: new Products(),
  kadex: new Kadex(),
  closeds: new Closeds(),
  promos: new Promos(),
  promo: new Promo(),
  pay: new Pay(),
  wallet: new Wallet(),
  Tree: new Tree(),
  offices: new Offices(),
  stock: new Stock(),
  reports: new Reports(),
  plans: new Plans(),
  transaction: new Transaction(),
});
