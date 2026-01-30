import { createSong } from './server/db.ts';

// Brani di repertorio corale italiano
const songs = [
  {
    title: 'Ave Maria',
    composer: 'Franz Schubert',
    arranger: null,
    language: 'Latino',
    durationSeconds: 300,
    difficulty: 3,
    tempoBpm: 80,
    key: 'Fa maggiore',
    categories: ['Sacro', 'Classico'],
    tags: ['Messa', 'Preghiera'],
  },
  {
    title: 'Va, pensiero',
    composer: 'Giuseppe Verdi',
    arranger: 'Luigi Molfino',
    language: 'Italiano',
    durationSeconds: 270,
    difficulty: 4,
    tempoBpm: 60,
    key: 'Mi bemolle maggiore',
    categories: ['Profano', 'Opera'],
    tags: ['Nabucco', 'Patriottico'],
  },
  {
    title: 'Panis Angelicus',
    composer: 'César Franck',
    arranger: null,
    language: 'Latino',
    durationSeconds: 240,
    difficulty: 2,
    tempoBpm: 72,
    key: 'Re maggiore',
    categories: ['Sacro'],
    tags: ['Eucaristia', 'Messa'],
  },
  {
    title: 'O Sole Mio',
    composer: 'Eduardo di Capua',
    arranger: 'John Rutter',
    language: 'Napoletano',
    durationSeconds: 180,
    difficulty: 3,
    tempoBpm: 120,
    key: 'Sol maggiore',
    categories: ['Profano', 'Popolare'],
    tags: ['Napoletano', 'Canzone'],
  },
  {
    title: 'Adeste Fideles',
    composer: 'John Francis Wade',
    arranger: null,
    language: 'Latino',
    durationSeconds: 210,
    difficulty: 2,
    tempoBpm: 90,
    key: 'Do maggiore',
    categories: ['Sacro', 'Natalizio'],
    tags: ['Natale', 'Tradizionale'],
  },
  {
    title: 'Hallelujah',
    composer: 'Leonard Cohen',
    arranger: 'Roger Emerson',
    language: 'Inglese',
    durationSeconds: 330,
    difficulty: 4,
    tempoBpm: 68,
    key: 'Do maggiore',
    categories: ['Profano', 'Moderno'],
    tags: ['Pop', 'Spirituale'],
  },
  {
    title: 'Miserere',
    composer: 'Gregorio Allegri',
    arranger: null,
    language: 'Latino',
    durationSeconds: 720,
    difficulty: 5,
    tempoBpm: 60,
    key: 'Sol minore',
    categories: ['Sacro', 'Rinascimentale'],
    tags: ['Salmo', 'Cappella Sistina'],
  },
  {
    title: 'Bella Ciao',
    composer: 'Anonimo',
    arranger: 'Francesco Lotoro',
    language: 'Italiano',
    durationSeconds: 150,
    difficulty: 2,
    tempoBpm: 110,
    key: 'Mi minore',
    categories: ['Profano', 'Popolare'],
    tags: ['Partigiano', 'Tradizionale'],
  },
  {
    title: 'Ave Verum Corpus',
    composer: 'Wolfgang Amadeus Mozart',
    arranger: null,
    language: 'Latino',
    durationSeconds: 180,
    difficulty: 3,
    tempoBpm: 76,
    key: 'Re maggiore',
    categories: ['Sacro', 'Classico'],
    tags: ['Eucaristia', 'Mozart'],
  },
  {
    title: 'Signore delle Cime',
    composer: 'Bepi De Marzi',
    arranger: null,
    language: 'Italiano',
    durationSeconds: 240,
    difficulty: 3,
    tempoBpm: 88,
    key: 'Fa maggiore',
    categories: ['Sacro', 'Alpino'],
    tags: ['Montagna', 'Preghiera'],
  },
  {
    title: 'Tu scendi dalle stelle',
    composer: 'Alfonso Maria de\' Liguori',
    arranger: null,
    language: 'Italiano',
    durationSeconds: 180,
    difficulty: 1,
    tempoBpm: 100,
    key: 'Sol maggiore',
    categories: ['Sacro', 'Natalizio'],
    tags: ['Natale', 'Tradizionale'],
  },
  {
    title: 'Cantique de Jean Racine',
    composer: 'Gabriel Fauré',
    arranger: null,
    language: 'Francese',
    durationSeconds: 300,
    difficulty: 4,
    tempoBpm: 72,
    key: 'Re bemolle maggiore',
    categories: ['Sacro', 'Romantico'],
    tags: ['Fauré', 'Liturgico'],
  },
  {
    title: 'Santa Lucia',
    composer: 'Teodoro Cottrau',
    arranger: null,
    language: 'Napoletano',
    durationSeconds: 210,
    difficulty: 2,
    tempoBpm: 96,
    key: 'Sol maggiore',
    categories: ['Profano', 'Popolare'],
    tags: ['Napoletano', 'Barcarola'],
  },
  {
    title: 'Locus Iste',
    composer: 'Anton Bruckner',
    arranger: null,
    language: 'Latino',
    durationSeconds: 150,
    difficulty: 3,
    tempoBpm: 80,
    key: 'Do maggiore',
    categories: ['Sacro', 'Romantico'],
    tags: ['Mottetto', 'Bruckner'],
  },
  {
    title: 'Il Canto degli Italiani',
    composer: 'Michele Novaro',
    arranger: 'Arrigo Boito',
    language: 'Italiano',
    durationSeconds: 120,
    difficulty: 2,
    tempoBpm: 120,
    key: 'Si bemolle maggiore',
    categories: ['Profano', 'Patriottico'],
    tags: ['Inno', 'Nazionale'],
  },
];

console.log('🎵 Inizio inserimento brani di esempio...\n');

let inserted = 0;
let errors = 0;

for (const song of songs) {
  try {
    const result = await createSong({
      organizationId: 1, // Coro Demo
      createdBy: 1, // Admin user
      ...song,
    });
    
    if (result) {
      console.log(`✅ Inserito: "${song.title}" - ${song.composer}`);
      inserted++;
    } else {
      console.error(`❌ Errore inserendo "${song.title}": createSong returned null`);
      errors++;
    }
  } catch (error) {
    console.error(`❌ Errore inserendo "${song.title}":`, error.message);
    errors++;
  }
}

console.log(`\n📊 Riepilogo:`);
console.log(`   Inseriti: ${inserted}/${songs.length}`);
console.log(`   Errori: ${errors}`);

console.log('\n✅ Script completato!');
