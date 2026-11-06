import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { seedData } from "@/lib/mock-data";
import { calculateProjectPrice, getProjectCalculatedPrice, getProjectDurationSeconds } from "@/lib/pricing";
import type { AppData, Client, Invoice, NotificationItem, PricingSettings, Project } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "editflow.json");
const TMP_FILE = path.join(os.tmpdir(), "editflow.json");

let memoryStore: AppData | null = null;

async function ensureDataFile(): Promise<AppData> {
  if (memoryStore) {
    return memoryStore;
  }

  // 1. Check if temporary serverless write exists
  try {
    const rawTmp = await fs.readFile(TMP_FILE, "utf-8");
    const parsedTmp = JSON.parse(rawTmp) as Partial<AppData>;
    if (parsedTmp.projects && parsedTmp.projects.length > 0) {
      memoryStore = parsedTmp as AppData;
      return memoryStore;
    }
  } catch {}

  // 2. Read from data/editflow.json
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.projects && parsed.projects.length > 0) {
      memoryStore = parsed as AppData;
      return memoryStore;
    }
  } catch {}

  // 3. Fallback to bundled seedData and attempt to write
  memoryStore = JSON.parse(JSON.stringify(seedData)) as AppData;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch {
    try {
      await fs.writeFile(TMP_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
    } catch {}
  }

  return memoryStore;
}

export async function loadStore(): Promise<AppData> {
  return await ensureDataFile();
}

export async function saveStore(data: AppData) {
  memoryStore = data;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Read-only filesystem fallback for serverless hosting (e.g. Vercel)
    try {
      await fs.writeFile(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }
}

export async function getProjects(): Promise<Project[]> {
  const store = await loadStore();
  const settings = store.pricingSettings;
  return store.projects.map((project) => {
    const seconds = getProjectDurationSeconds(project);
    const calculatedPrice = getProjectCalculatedPrice(project, settings);
    const finalAmount = calculateProjectPrice(project, settings);
    return {
      ...project,
      finalDurationSeconds: seconds,
      calculatedPrice,
      finalAmount,
    };
  });
}

export async function upsertProject(project: Project): Promise<Project> {
  const store = await loadStore();
  const index = store.projects.findIndex((item) => item.id === project.id);
  const settings = store.pricingSettings;

  const seconds = getProjectDurationSeconds(project);
  const calculatedPrice = getProjectCalculatedPrice(project, settings);
  const finalAmount = calculateProjectPrice(project, settings);

  const updatedProject: Project = {
    ...project,
    finalDurationSeconds: seconds,
    calculatedPrice,
    finalAmount,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    store.projects[index] = updatedProject;
  } else {
    store.projects.unshift(updatedProject);
  }
  await saveStore(store);
  return updatedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const store = await loadStore();
  const initialCount = store.projects.length;
  store.projects = store.projects.filter((item) => item.id !== id);
  if (store.projects.length !== initialCount) {
    await saveStore(store);
    return true;
  }
  return false;
}

export async function getClients(): Promise<Client[]> {
  const store = await loadStore();
  return store.clients;
}

export async function upsertClient(client: Client): Promise<Client> {
  const store = await loadStore();
  const index = store.clients.findIndex((item) => item.id === client.id);
  if (index >= 0) {
    store.clients[index] = client;
  } else {
    store.clients.unshift(client);
  }
  await saveStore(store);
  return client;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const store = await loadStore();
  return store.pricingSettings;
}

export async function updatePricingSettings(settings: PricingSettings): Promise<PricingSettings> {
  const store = await loadStore();
  store.pricingSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate all project prices using new settings unless manual override or non-billable
  store.projects = store.projects.map((project) => {
    const seconds = getProjectDurationSeconds(project);
    const calculatedPrice = getProjectCalculatedPrice(project, store.pricingSettings);
    const finalAmount = calculateProjectPrice(project, store.pricingSettings);
    return {
      ...project,
      finalDurationSeconds: seconds,
      calculatedPrice,
      finalAmount,
      updatedAt: new Date().toISOString(),
    };
  });

  await saveStore(store);
  return store.pricingSettings;
}

export async function getInvoices(): Promise<Invoice[]> {
  const store = await loadStore();
  return store.invoices;
}

export async function addInvoice(invoice: Invoice): Promise<Invoice> {
  const store = await loadStore();
  store.invoices.unshift(invoice);
  await saveStore(store);
  return invoice;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const store = await loadStore();
  const prevCount = store.invoices.length;
  store.invoices = store.invoices.filter((inv) => inv.id !== id);
  if (store.invoices.length !== prevCount) {
    await saveStore(store);
    return true;
  }
  return false;
}

export async function addNotification(item: NotificationItem): Promise<NotificationItem> {
  const store = await loadStore();
  store.notifications.unshift(item);
  await saveStore(store);
  return item;
}
