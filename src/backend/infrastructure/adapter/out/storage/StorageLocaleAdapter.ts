// ============================================================
// StorageLocaleAdapter
// Infrastructure layer – implements StorageLocalePort (Crash recovery UC4)
// ============================================================

import { StorageLocalePort } from "@/backend/domain/port/out/StorageLocalePort";
import { Workout } from "@/backend/domain/model/types";
import fs from "fs";
import path from "path";
import os from "os";

export class StorageLocaleAdapter implements StorageLocalePort {
  private tmpDir = path.join(os.tmpdir(), "trackfit_snapshots");

  constructor() {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  private getPath(workoutId: string): string {
    return path.join(this.tmpDir, `${workoutId}.json`);
  }

  salva(workoutId: string, workout: Workout): void {
    fs.writeFileSync(this.getPath(workoutId), JSON.stringify(workout, null, 2), "utf-8");
  }

  carica(workoutId: string): Workout | null {
    try {
      const data = fs.readFileSync(this.getPath(workoutId), "utf-8");
      return JSON.parse(data) as Workout;
    } catch {
      return null;
    }
  }

  exists(workoutId: string): boolean {
    return fs.existsSync(this.getPath(workoutId));
  }

  anomaliaRilevata(workoutId: string): boolean {
    // SDD rule: If local snapshot exists, it means app crashed before syncing to DB
    return this.exists(workoutId);
  }

  elimina(workoutId: string): void {
    try {
      if (this.exists(workoutId)) {
        fs.unlinkSync(this.getPath(workoutId));
      }
    } catch (error) {
      console.error("Errore cancellazione snapshot locale", error);
    }
  }
}