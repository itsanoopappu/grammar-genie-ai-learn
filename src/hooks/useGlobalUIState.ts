import { atom } from 'jotai';

export const activeTabAtom = atom<string>('chat');
export const topicToDrillAtom = atom<string | null>(null);