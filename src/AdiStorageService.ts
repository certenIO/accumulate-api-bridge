/**
 * ADI Storage Service for CERTEN API Bridge
 * Provides persistent storage of ADI data with file-based backend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StoredAdi {
  adiUrl: string;
  adiName: string;
  bookUrl: string;
  keyPageUrl: string;
  publicKeyHash: string;
  publicKey: string;
  privateKey: string; // In production, encrypt this
  creditBalance: number;
  createdAt: string;
  transactionHash: string;
  linkedChains?: LinkedChain[];
}

export interface LinkedChain {
  chainId: string;
  address: string;
  verified: boolean;
  addedAt: string;
  verificationMethod?: string;
}

export interface AdiWithAuthorities extends StoredAdi {
  authorities?: {
    url: string;
    type: number;
    threshold: number;
    priority: number;
    signers: any[];
  }[];
}

export class AdiStorageService {
  private readonly storageFile: string;
  private adis: StoredAdi[] = [];

  constructor() {
    // Use data directory relative to project root, or Docker volume path
    const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', 'data');
    this.storageFile = path.join(dataDir, 'adis.json');
    this.ensureStorageDirectory();
    this.loadAdis();
  }

  private ensureStorageDirectory(): void {
    const dataDir = path.dirname(this.storageFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created ADI storage directory:', dataDir);
    }
  }

  private loadAdis(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        this.adis = JSON.parse(data);
        console.log(`Loaded ${this.adis.length} ADIs from persistent storage`);
      } else {
        console.log('No existing ADI storage file, starting fresh');
        this.adis = [];
      }
    } catch (error) {
      console.error('Failed to load ADIs from storage:', error);
      this.adis = [];
    }
  }

  private saveAdis(): void {
    try {
      const data = JSON.stringify(this.adis, null, 2);
      fs.writeFileSync(this.storageFile, data, 'utf8');
      console.log(`Saved ${this.adis.length} ADIs to persistent storage`);
    } catch (error) {
      console.error('Failed to save ADIs to storage:', error);
    }
  }

  /**
   * Get all stored ADIs
   */
  getAllAdis(): StoredAdi[] {
    return [...this.adis]; // Return a copy
  }

  /**
   * Get a specific ADI by URL
   */
  getAdi(adiUrl: string): StoredAdi | null {
    return this.adis.find(adi => adi.adiUrl === adiUrl) || null;
  }

  /**
   * Save or update an ADI
   */
  saveAdi(adi: StoredAdi): boolean {
    try {
      const existingIndex = this.adis.findIndex(existing => existing.adiUrl === adi.adiUrl);

      if (existingIndex >= 0) {
        this.adis[existingIndex] = adi;
        console.log('Updated existing ADI:', adi.adiUrl);
      } else {
        this.adis.push(adi);
        console.log('Added new ADI:', adi.adiUrl);
      }

      this.saveAdis();
      return true;
    } catch (error) {
      console.error('Failed to save ADI:', error);
      return false;
    }
  }

  /**
   * Delete an ADI
   */
  deleteAdi(adiUrl: string): boolean {
    try {
      const initialLength = this.adis.length;
      this.adis = this.adis.filter(adi => adi.adiUrl !== adiUrl);

      if (this.adis.length < initialLength) {
        this.saveAdis();
        console.log('Deleted ADI:', adiUrl);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete ADI:', error);
      return false;
    }
  }

  /**
   * Get ADI with authorities (enhanced with governance data)
   */
  async getAdiWithAuthorities(adiUrl: string): Promise<AdiWithAuthorities | null> {
    const baseAdi = this.getAdi(adiUrl);
    if (!baseAdi) {
      return null;
    }

    // Return the basic ADI structure with default authority
    return {
      ...baseAdi,
      authorities: [
        {
          url: baseAdi.keyPageUrl,
          type: 2, // KeyBook type
          threshold: 1,
          priority: 1,
          signers: []
        }
      ]
    };
  }

  /**
   * Import ADIs from browser localStorage format
   */
  importAdisFromBrowser(adis: StoredAdi[]): boolean {
    try {
      for (const adi of adis) {
        this.saveAdi(adi);
      }
      console.log(`Imported ${adis.length} ADIs from browser storage`);
      return true;
    } catch (error) {
      console.error('Failed to import ADIs:', error);
      return false;
    }
  }

  /**
   * Clear all ADIs (useful for development)
   */
  clearAll(): boolean {
    try {
      this.adis = [];
      this.saveAdis();
      console.log('Cleared all ADIs from storage');
      return true;
    } catch (error) {
      console.error('Failed to clear ADIs:', error);
      return false;
    }
  }
}
