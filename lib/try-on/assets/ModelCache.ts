import * as THREE from "three";

/**
 * ModelCache
 * LRU In-Memory Cache for parsed Three.js GLB models.
 * Enables zero-latency, instant switching between eyewear frames without re-fetching or re-parsing.
 */
export class ModelCache {
  private static instance: ModelCache | null = null;
  private cache: Map<string, THREE.Group> = new Map();
  private maxEntries = 6;

  public static getInstance(): ModelCache {
    if (!ModelCache.instance) {
      ModelCache.instance = new ModelCache();
    }
    return ModelCache.instance;
  }

  public get(url: string): THREE.Group | null {
    const cached = this.cache.get(url);
    if (cached) {
      // Refresh LRU order
      this.cache.delete(url);
      this.cache.set(url, cached);
      return cached.clone(true);
    }
    return null;
  }

  public set(url: string, model: THREE.Group): void {
    if (this.cache.has(url)) {
      this.cache.delete(url);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const oldModel = this.cache.get(oldestKey);
        this.disposeModel(oldModel);
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(url, model.clone(true));
  }

  public clear(): void {
    this.cache.forEach((model) => {
      this.disposeModel(model);
    });
    this.cache.clear();
  }

  private disposeModel(model?: THREE.Group): void {
    if (!model) return;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
