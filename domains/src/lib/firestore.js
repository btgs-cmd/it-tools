import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, serverTimestamp, orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// ── Clients ──────────────────────────────────────────────
export async function getClients() {
  const snap = await getDocs(query(collection(db, "clients"), orderBy("name")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addClient(data) {
  return addDoc(collection(db, "clients"), { ...data, createdAt: serverTimestamp() });
}

export async function updateClient(id, data) {
  return updateDoc(doc(db, "clients", id), data);
}

export async function deleteClient(id) {
  // Also delete their domains
  const domains = await getDomainsForClient(id);
  await Promise.all(domains.map(d => deleteDomain(d.id)));
  return deleteDoc(doc(db, "clients", id));
}

export async function getClientByToken(token) {
  const snap = await getDocs(query(collection(db, "clients"), where("token", "==", token)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ── Domains ──────────────────────────────────────────────
export async function getAllDomains() {
  const snap = await getDocs(query(collection(db, "domains"), orderBy("daysUntilExpiry")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getDomainsForClient(clientId) {
  const snap = await getDocs(query(collection(db, "domains"), where("clientId", "==", clientId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addDomain(data) {
  return addDoc(collection(db, "domains"), {
    ...data,
    status: "unknown",
    expiryDate: null,
    daysUntilExpiry: null,
    lastChecked: null,
    createdAt: serverTimestamp()
  });
}

export async function updateDomain(id, data) {
  return updateDoc(doc(db, "domains", id), data);
}

export async function deleteDomain(id) {
  return deleteDoc(doc(db, "domains", id));
}

// ── Alerts ───────────────────────────────────────────────
export async function getUnseenAlerts() {
  const snap = await getDocs(query(collection(db, "alerts"), where("seen", "==", false)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markAlertSeen(id) {
  return updateDoc(doc(db, "alerts", id), { seen: true });
}

// ── Helpers ───────────────────────────────────────────────
export function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getDomainStatus(daysUntilExpiry) {
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) return "unknown";
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 14) return "critical";
  if (daysUntilExpiry <= 45) return "warning";
  return "ok";
}
