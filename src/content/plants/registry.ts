import type { PlantSpecies } from '../types';
import { cactus } from './cactus';
import { cherry } from './cherry';
import { corn } from './corn';
import { monstera } from './monstera';
import { orange } from './orange';
import { rose } from './rose';
import { sunflower } from './sunflower';
import { tomato } from './tomato';
import { blueberry } from './blueberry';
import { daisy } from './daisy';
import { strawberry } from './strawberry';
import { tulip } from './tulip';
import { watermelon } from './watermelon';

/** Thêm loài mới: tạo file <id>.tsx export một PlantSpecies rồi thêm vào mảng này. */
export const PLANTS: PlantSpecies[] = [sunflower, corn, cactus, monstera, orange, cherry, rose, watermelon, tulip, tomato, blueberry, daisy, strawberry];

export function getSpecies(id: string): PlantSpecies {
  return PLANTS.find((p) => p.id === id) ?? PLANTS[0];
}
