export interface MixAvailability {
  readonly allowed: boolean;
  readonly reason: string;
}

const RELATED_LAYER_RULES: Readonly<Record<string, ReadonlySet<string>>> = {
  thunder: new Set(['gentle-rain']),
  forest: new Set(['forest', 'forest-morning']),
  'forest-morning': new Set(['forest', 'forest-morning']),
  'guitar-acoustic': new Set(['guitar']),
};

export function getMixAvailability(primarySoundId: string, layerSoundId: string): MixAvailability {
  if (primarySoundId === layerSoundId) {
    return { allowed: false, reason: 'Already playing as the primary atmosphere' };
  }

  if (RELATED_LAYER_RULES[primarySoundId]?.has(layerSoundId)) {
    if (primarySoundId === 'thunder') {
      return { allowed: false, reason: 'Rain is already part of Rain & Thunder' };
    }
    if (primarySoundId === 'forest' || primarySoundId === 'forest-morning') {
      return { allowed: false, reason: 'Birds are already part of this forest atmosphere' };
    }
    return { allowed: false, reason: 'Guitar is already part of Acoustic Guitar' };
  }

  return { allowed: true, reason: '' };
}
