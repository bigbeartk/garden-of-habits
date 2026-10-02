import type { PlantSpecies } from '../types';
import { cactus } from './cactus';
import { cherry } from './cherry';
import { corn } from './corn';
import { orange } from './orange';
import { pothos } from './pothos';
import { sunflower } from './sunflower';

/** Thêm loài mới: tạo file <id>.tsx export một PlantSpecies rồi thêm vào mảng này. */
export const PLANTS: PlantSpecies[] = [sunflower, corn, cactus, pothos, orange, cherry];

export function getSpecies(id: string): PlantSpecies {
  return PLANTS.find((p) => p.id === id) ?? PLANTS[0];
}
