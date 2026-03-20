const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

const defaultData = {
  users: [],
  appointments: [],
  slots: [],
  settings: []
};

let db = { ...defaultData };

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
    } else {
      saveDB();
    }
  } catch (err) {
    console.log('Error loading DB:', err);
    saveDB();
  }
};

const saveDB = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

loadDB();

const dbOperations = {
  find: (collection, query = {}) => {
    const items = db[collection] || [];
    return items.filter(item => {
      return Object.keys(query).every(key => {
        if (typeof query[key] === 'object' && query[key] !== null) {
          if (query[key].$in) {
            return query[key].$in.includes(item[key]);
          }
          if (query[key].$gte) {
            return item[key] >= query[key].$gte;
          }
          if (query[key].$lte) {
            return item[key] <= query[key].$lte;
          }
          if (query[key].$exists) {
            return query[key].$exists ? item[key] !== undefined : item[key] === undefined;
          }
          if (query[key].$ne) {
            return item[key] !== query[key].$ne;
          }
        }
        return item[key] === query[key];
      });
    });
  },

  findOne: (collection, query = {}) => {
    const items = db[collection] || [];
    return items.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    }) || null;
  },

  insert: (collection, document) => {
    if (!db[collection]) db[collection] = [];
    document._id = Date.now().toString();
    document.createdAt = new Date();
    document.updatedAt = new Date();
    db[collection].push(document);
    saveDB();
    return document;
  },

  update: (collection, query, update) => {
    const items = db[collection] || [];
    let updated = false;
    items.forEach((item, index) => {
      const matches = Object.keys(query).every(key => item[key] === query[key]);
      if (matches) {
        if (update.$set) {
          items[index] = { ...item, ...update.$set, updatedAt: new Date() };
        }
        updated = true;
      }
    });
    if (updated) saveDB();
    return updated;
  },

  updateOne: (collection, query, update) => {
    const items = db[collection] || [];
    let updated = false;
    let updatedDoc = null;
    for (let i = 0; i < items.length; i++) {
      const matches = Object.keys(query).every(key => items[i][key] === query[key]);
      if (matches) {
        if (update.$set) {
          items[i] = { ...items[i], ...update.$set, updatedAt: new Date() };
          updatedDoc = items[i];
        }
        updated = true;
        break;
      }
    }
    if (updated) saveDB();
    return updatedDoc;
  },

  deleteOne: (collection, query) => {
    const items = db[collection] || [];
    const index = items.findIndex(item => 
      Object.keys(query).every(key => item[key] === query[key])
    );
    if (index > -1) {
      items.splice(index, 1);
      saveDB();
      return true;
    }
    return false;
  },

  count: (collection, query = {}) => {
    return dbOperations.find(collection, query).length;
  },

  insertMany: (collection, documents) => {
    if (!db[collection]) db[collection] = [];
    documents.forEach(doc => {
      doc._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
      db[collection].push(doc);
    });
    saveDB();
    return documents;
  },

  distinct: (collection, field, query = {}) => {
    const items = dbOperations.find(collection, query);
    return [...new Set(items.map(item => item[field]))];
  },

  getDb: () => db
};

module.exports = dbOperations;
