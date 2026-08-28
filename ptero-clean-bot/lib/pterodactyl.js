const axios = require('axios');

const PANEL_URL = (process.env.PTLA_URL || '').replace(/\/+$/, '');
const API_KEY = process.env.PTLA_KEY;

if (!PANEL_URL || !API_KEY) {
  console.warn('[pterodactyl] PTLA_URL / PTLA_KEY belum di-set di environment variables');
}

const client = axios.create({
  baseURL: `${PANEL_URL}/api/application`,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Ambil satu halaman server
async function listServersPage(page = 1) {
  const res = await client.get('/servers', { params: { page, per_page: 100, include: 'user,node' } });
  return res.data;
}

// Ambil SEMUA server (auto pagination)
async function getAllServers() {
  let servers = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await listServersPage(page);
    servers = servers.concat(data.data);
    totalPages = data.meta?.pagination?.total_pages || 1;
    page++;
  } while (page <= totalPages);
  return servers;
}

async function getServer(id) {
  const res = await client.get(`/servers/${id}`, { params: { include: 'user,node,allocations' } });
  return res.data.data;
}

// force=true -> hapus paksa walau ada backup transfer dsb (hati-hati)
async function deleteServer(id, force = false) {
  const endpoint = force ? `/servers/${id}/force` : `/servers/${id}`;
  await client.delete(endpoint);
}

async function suspendServer(id) {
  await client.post(`/servers/${id}/suspend`);
}

async function unsuspendServer(id) {
  await client.post(`/servers/${id}/unsuspend`);
}

async function reinstallServer(id) {
  await client.post(`/servers/${id}/reinstall`);
}

async function getNodes() {
  const res = await client.get('/nodes', { params: { per_page: 100 } });
  return res.data.data;
}

async function getUsers() {
  let users = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await client.get('/users', { params: { page, per_page: 100 } });
    users = users.concat(res.data.data);
    totalPages = res.data.meta?.pagination?.total_pages || 1;
    page++;
  } while (page <= totalPages);
  return users;
}

module.exports = {
  getAllServers,
  getServer,
  deleteServer,
  suspendServer,
  unsuspendServer,
  reinstallServer,
  getNodes,
  getUsers,
};
