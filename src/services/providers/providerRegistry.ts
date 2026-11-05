/**
 * AURA 2.0 - Universal Source Engine
 * Provider Registry
 * Central registry tracking active music providers, capability matrices, and health statuses.
 */

import { IMusicProvider, ProviderId, ProviderType, ProviderCapabilities } from './types';
import { localProvider } from './localProvider';
import { audiusProvider } from './audiusProvider';
import { jamendoProvider } from './jamendoProvider';
import { radioBrowserProvider } from './radioBrowserProvider';
import { youtubeEmbedProvider } from './youtubeEmbedProvider';

export class ProviderRegistry {
  private providers = new Map<ProviderId, IMusicProvider>();
  private availabilityCache = new Map<ProviderId, { available: boolean; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register(localProvider);
    this.register(audiusProvider);
    this.register(jamendoProvider);
    this.register(radioBrowserProvider);
    this.register(youtubeEmbedProvider);
  }

  public register(provider: IMusicProvider): void {
    this.providers.set(provider.id, provider);
  }

  public unregister(providerId: ProviderId): boolean {
    return this.providers.delete(providerId);
  }

  public get(providerId: ProviderId): IMusicProvider | undefined {
    return this.providers.get(providerId);
  }

  public getAll(): IMusicProvider[] {
    return Array.from(this.providers.values());
  }

  public getByType(type: ProviderType): IMusicProvider[] {
    return this.getAll().filter((p) => p.type === type);
  }

  public getByCapability(filter: (caps: ProviderCapabilities) => boolean): IMusicProvider[] {
    return this.getAll().filter((p) => filter(p.capabilities));
  }

  public async isProviderAvailable(providerId: ProviderId): Promise<boolean> {
    const provider = this.get(providerId);
    if (!provider) return false;

    const cached = this.availabilityCache.get(providerId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.available;
    }

    try {
      const available = await provider.isAvailable();
      this.availabilityCache.set(providerId, {
        available,
        expiresAt: now + this.CACHE_TTL_MS,
      });
      return available;
    } catch {
      this.availabilityCache.set(providerId, {
        available: false,
        expiresAt: now + this.CACHE_TTL_MS,
      });
      return false;
    }
  }

  public clearAvailabilityCache(): void {
    this.availabilityCache.clear();
  }
}

export const providerRegistry = new ProviderRegistry();
