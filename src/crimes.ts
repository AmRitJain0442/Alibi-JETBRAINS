// Crime Database for Alibi
// Evidence reveal times adjusted for 60-second interrogation phase

import { Crime } from './types';

export const CRIMES: Crime[] = [
  {
    id: 'museum_heist',
    title: 'Art Theft',
    description: 'A valuable sculpture was stolen from the Meridian Museum at 9:47 PM.',
    location: 'Meridian Museum',
    time: '9:47 PM',
    evidence: [
      {
        id: 'tattoo',
        description: 'The thief had a tattoo on their left hand.',
        revealTime: 10
      },
      {
        id: 'shoes',
        description: 'Muddy size 10 boot prints were found.',
        revealTime: 20
      }
    ]
  },
  {
    id: 'corporate_espionage',
    title: 'Data Breach',
    description: 'Files were stolen from TechCorp HQ at 11:23 PM.',
    location: 'TechCorp HQ',
    time: '11:23 PM',
    evidence: [
      {
        id: 'coffee',
        description: 'A coffee cup with lipstick was found.',
        revealTime: 10
      },
      {
        id: 'parking',
        description: 'A car with tinted windows was seen.',
        revealTime: 20
      }
    ]
  },
  {
    id: 'jewelry_theft',
    title: 'Diamond Heist',
    description: 'Diamonds worth $50K stolen from Luxe Jewelers at 8:15 PM.',
    location: 'Luxe Jewelers',
    time: '8:15 PM',
    evidence: [
      {
        id: 'gloves',
        description: 'A latex glove was found at the scene.',
        revealTime: 10
      },
      {
        id: 'witness',
        description: 'Someone in a red jacket was seen nearby.',
        revealTime: 20
      }
    ]
  },
  {
    id: 'vandalism',
    title: 'City Hall Vandalism',
    description: 'Graffiti was spray-painted on City Hall at 2:30 AM.',
    location: 'City Hall',
    time: '2:30 AM',
    evidence: [
      {
        id: 'paint',
        description: 'Blue paint stains led away from the scene.',
        revealTime: 10
      },
      {
        id: 'camera',
        description: 'Someone on a bicycle was seen fleeing.',
        revealTime: 20
      }
    ]
  },
  {
    id: 'restaurant_poisoning',
    title: 'Restaurant Sabotage',
    description: 'Food at Bella Cucina was contaminated at 6:45 PM.',
    location: 'Bella Cucina',
    time: '6:45 PM',
    evidence: [
      {
        id: 'kitchen',
        description: 'An unauthorized person was in the kitchen.',
        revealTime: 10
      },
      {
        id: 'bottle',
        description: 'An empty cleaning bottle was found.',
        revealTime: 20
      }
    ]
  }
];

export function getRandomCrime(): Crime {
  return CRIMES[Math.floor(Math.random() * CRIMES.length)];
}
