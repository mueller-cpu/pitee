import "dotenv/config";
import { prisma } from "../src/lib/db";

console.log("Seeding database with exercises...");

interface UebungSeed {
  name: string;
  kategorie: string;
  muskelgruppen: string;
  geraet: string;
  gelenkbelastung: string;
  schwierigkeitsgrad: string;
  beschreibung: string;
  tempo: string | null;
  istMaschinenVariante: boolean;
}

const uebungen: UebungSeed[] = [
  // ─────────────────────────────────────────────
  // OBERKÖRPER PUSH (~12)
  // ─────────────────────────────────────────────
  {
    name: "Bankdrücken (Langhantel)",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,trizeps,vordere_schulter",
    geraet: "langhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Klassisches Bankdrücken mit der Langhantel. Stange kontrolliert zur Brust senken und explosiv drücken.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Schrägbankdrücken",
    kategorie: "oberkörper_push",
    muskelgruppen: "obere_brust,trizeps,vordere_schulter",
    geraet: "langhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Bankdrücken auf der Schrägbank (30-45°) für verstärkte Aktivierung der oberen Brust.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Kurzhantel-Bankdrücken",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,trizeps,vordere_schulter",
    geraet: "kurzhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Bankdrücken mit Kurzhanteln für größeren Bewegungsumfang und verbesserte Stabilisation.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Brustpresse (Maschine)",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,trizeps,vordere_schulter",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Geführte Brustpresse an der Maschine. Gelenkschonende Alternative zum freien Bankdrücken.",
    tempo: "3-1-2-0",
    istMaschinenVariante: true,
  },
  {
    name: "Schulterdrücken",
    kategorie: "oberkörper_push",
    muskelgruppen: "vordere_schulter,seitliche_schulter,trizeps",
    geraet: "langhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Overhead Press mit der Langhantel im Stehen oder Sitzen. Grundübung für die Schultern.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Kurzhantel-Schulterdrücken",
    kategorie: "oberkörper_push",
    muskelgruppen: "vordere_schulter,seitliche_schulter,trizeps",
    geraet: "kurzhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Schulterdrücken mit Kurzhanteln im Sitzen. Ermöglicht natürlichere Bewegungsbahn.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Seitheben",
    kategorie: "oberkörper_push",
    muskelgruppen: "seitliche_schulter",
    geraet: "kurzhantel",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Kurzhanteln seitlich bis auf Schulterhöhe anheben. Isolationsübung für die seitliche Schulter.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Dips (Maschine)",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,trizeps,vordere_schulter",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Assistierte Dips an der Maschine. Trainiert Brust und Trizeps mit einstellbarem Widerstand.",
    tempo: "3-1-2-0",
    istMaschinenVariante: true,
  },
  {
    name: "Cable Crossover",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,vordere_schulter",
    geraet: "kabel",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Kabelzug-Flys von oben für die untere Brust oder von unten für die obere Brust.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Trizeps Pushdown",
    kategorie: "oberkörper_push",
    muskelgruppen: "trizeps",
    geraet: "kabel",
    gelenkbelastung: "ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Trizepsdrücken am Kabelzug mit Seil oder Stange. Isolationsübung für den Trizeps.",
    tempo: "2-1-2-1",
    istMaschinenVariante: false,
  },
  {
    name: "Überkopf-Trizeps",
    kategorie: "oberkörper_push",
    muskelgruppen: "trizeps",
    geraet: "kabel",
    gelenkbelastung: "ellbogen,schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Trizepsstreckung über Kopf am Kabel oder mit Kurzhantel. Betont den langen Trizepskopf.",
    tempo: "2-1-2-1",
    istMaschinenVariante: false,
  },
  {
    name: "Liegestütze",
    kategorie: "oberkörper_push",
    muskelgruppen: "brust,trizeps,vordere_schulter,core",
    geraet: "koerpergewicht",
    gelenkbelastung: "schulter,ellbogen,handgelenk",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Klassische Liegestütze. Können bei Bedarf erhöht (Hände auf Bank) ausgeführt werden.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },

  // ─────────────────────────────────────────────
  // OBERKÖRPER PULL (~12)
  // ─────────────────────────────────────────────
  {
    name: "Latzug breit",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,bizeps,hintere_schulter",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Latzug mit breitem Obergriff zur Brust. Trainiert die Breite des Rückens.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Latzug eng",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,bizeps,rhomboiden",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Latzug mit engem Untergriff. Stärkere Bizepsbeteiligung und Fokus auf die untere Lat-Region.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Rudern Langhantel",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,rhomboiden,bizeps,hintere_schulter,unterer_ruecken",
    geraet: "langhantel",
    gelenkbelastung: "schulter,ellbogen,unterer_ruecken",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Vorgebeugtes Rudern mit der Langhantel. Grundübung für die Rückendicke.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Rudern Kurzhantel",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,rhomboiden,bizeps,hintere_schulter",
    geraet: "kurzhantel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Einarmiges Rudern mit der Kurzhantel an der Bank. Erlaubt hohen Bewegungsumfang.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Rudern Maschine",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,rhomboiden,bizeps,hintere_schulter",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Geführtes Rudern an der Maschine. Gelenkschonend mit stabiler Sitzposition.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Cable Row",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,rhomboiden,bizeps,hintere_schulter",
    geraet: "kabel",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Sitzendes Kabelrudern mit V-Griff oder breitem Griff. Konstante Spannung durch Kabelzug.",
    tempo: "2-1-3-1",
    istMaschinenVariante: false,
  },
  {
    name: "Face Pulls",
    kategorie: "oberkörper_pull",
    muskelgruppen: "hintere_schulter,rhomboiden,rotatorenmanschette",
    geraet: "kabel",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Kabelzug zum Gesicht mit Seilgriff. Wichtig für Schulterstabilität und aufrechte Haltung.",
    tempo: "2-2-3-1",
    istMaschinenVariante: false,
  },
  {
    name: "Bizepscurl Langhantel",
    kategorie: "oberkörper_pull",
    muskelgruppen: "bizeps,unterarm",
    geraet: "langhantel",
    gelenkbelastung: "ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Klassischer Bizepscurl mit der Langhantel oder SZ-Stange. Grundübung für den Bizeps.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Bizepscurl Kurzhantel",
    kategorie: "oberkörper_pull",
    muskelgruppen: "bizeps,unterarm",
    geraet: "kurzhantel",
    gelenkbelastung: "ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Bizepscurls mit Kurzhanteln, alternierend oder gleichzeitig. Erlaubt Supination.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Hammercurl",
    kategorie: "oberkörper_pull",
    muskelgruppen: "bizeps,brachialis,unterarm",
    geraet: "kurzhantel",
    gelenkbelastung: "ellbogen",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Curls mit neutralem Griff (Daumen oben). Trainiert den Brachialis und die Unterarme.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Klimmzüge (assistiert)",
    kategorie: "oberkörper_pull",
    muskelgruppen: "latissimus,bizeps,hintere_schulter,core",
    geraet: "maschine",
    gelenkbelastung: "schulter,ellbogen",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Klimmzüge an der Assistenzmaschine mit einstellbarer Unterstützung. Aufbau zur freien Variante.",
    tempo: "2-1-3-0",
    istMaschinenVariante: true,
  },
  {
    name: "Reverse Flys",
    kategorie: "oberkörper_pull",
    muskelgruppen: "hintere_schulter,rhomboiden",
    geraet: "maschine",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Reverse Flys an der Maschine oder mit Kurzhanteln. Stärkt die hintere Schulter und den oberen Rücken.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },

  // ─────────────────────────────────────────────
  // UNTERKÖRPER (~15)
  // ─────────────────────────────────────────────
  {
    name: "Kniebeuge",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus,beinbizeps,unterer_ruecken",
    geraet: "langhantel",
    gelenkbelastung: "knie,huefte,unterer_ruecken",
    schwierigkeitsgrad: "fortgeschritten",
    beschreibung:
      "Kniebeugen mit der Langhantel auf dem oberen Rücken. Königsübung für die Beine.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Beinpresse",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus,beinbizeps",
    geraet: "maschine",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Beinpresse an der Maschine. Gelenkschonende Alternative zur Kniebeuge mit hoher Belastbarkeit.",
    tempo: "3-1-2-0",
    istMaschinenVariante: true,
  },
  {
    name: "Ausfallschritte",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus,beinbizeps",
    geraet: "kurzhantel",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Ausfallschritte mit Kurzhanteln. Trainiert Beine und Gleichgewicht unilateral.",
    tempo: "2-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Bulgarische Kniebeuge",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus,beinbizeps",
    geraet: "kurzhantel",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "fortgeschritten",
    beschreibung:
      "Einbeinige Kniebeuge mit hinterem Fuß erhöht auf einer Bank. Hohe Anforderung an Balance.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Beinstrecker",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps",
    geraet: "maschine",
    gelenkbelastung: "knie",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Isolationsübung für den Quadrizeps an der Beinstrecker-Maschine.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Beinbeuger",
    kategorie: "unterkörper",
    muskelgruppen: "beinbizeps",
    geraet: "maschine",
    gelenkbelastung: "knie",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Isolationsübung für die hintere Oberschenkelmuskulatur an der Beinbeuger-Maschine.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Rumänisches Kreuzheben",
    kategorie: "unterkörper",
    muskelgruppen: "beinbizeps,gluteus,unterer_ruecken",
    geraet: "langhantel",
    gelenkbelastung: "huefte,unterer_ruecken",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Kreuzheben mit gestreckten Beinen. Fokus auf die hintere Kette (Beinbizeps und Gesäß).",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Kreuzheben",
    kategorie: "unterkörper",
    muskelgruppen: "beinbizeps,gluteus,quadrizeps,unterer_ruecken,core",
    geraet: "langhantel",
    gelenkbelastung: "huefte,knie,unterer_ruecken",
    schwierigkeitsgrad: "fortgeschritten",
    beschreibung:
      "Konventionelles Kreuzheben mit der Langhantel. Ganzkörperübung mit Schwerpunkt hintere Kette.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Sumo-Kreuzheben",
    kategorie: "unterkörper",
    muskelgruppen: "gluteus,adduktoren,quadrizeps,beinbizeps,unterer_ruecken",
    geraet: "langhantel",
    gelenkbelastung: "huefte,knie,unterer_ruecken",
    schwierigkeitsgrad: "fortgeschritten",
    beschreibung:
      "Kreuzheben mit weitem Stand. Stärkere Beteiligung der Adduktoren und des Gesäßes.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Hip Thrust",
    kategorie: "unterkörper",
    muskelgruppen: "gluteus,beinbizeps",
    geraet: "langhantel",
    gelenkbelastung: "huefte",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Hüftstreckung gegen Widerstand mit dem oberen Rücken auf einer Bank. Beste Übung für den Gluteus.",
    tempo: "2-2-3-1",
    istMaschinenVariante: false,
  },
  {
    name: "Wadenheben stehend",
    kategorie: "unterkörper",
    muskelgruppen: "waden",
    geraet: "maschine",
    gelenkbelastung: "sprunggelenk",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Stehendes Wadenheben an der Maschine. Trainiert den Gastrocnemius.",
    tempo: "2-2-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Wadenheben sitzend",
    kategorie: "unterkörper",
    muskelgruppen: "waden",
    geraet: "maschine",
    gelenkbelastung: "sprunggelenk",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Sitzendes Wadenheben an der Maschine. Trainiert vorwiegend den Soleus.",
    tempo: "2-2-3-1",
    istMaschinenVariante: true,
  },
  {
    name: "Goblet Squat",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus,core",
    geraet: "kurzhantel",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Kniebeuge mit einer Kurzhantel vor der Brust. Ideal zum Erlernen der Kniebeugen-Technik.",
    tempo: "3-1-2-0",
    istMaschinenVariante: false,
  },
  {
    name: "Hackenschmidt",
    kategorie: "unterkörper",
    muskelgruppen: "quadrizeps,gluteus",
    geraet: "maschine",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Kniebeuge an der Hackenschmidt-Maschine. Geführte Bewegung mit weniger Belastung für den Rücken.",
    tempo: "3-1-2-0",
    istMaschinenVariante: true,
  },
  {
    name: "Abduktoren",
    kategorie: "unterkörper",
    muskelgruppen: "abduktoren,gluteus",
    geraet: "maschine",
    gelenkbelastung: "huefte",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Abduktorenmaschine zur Stärkung der äußeren Hüftmuskulatur. Wichtig für Hüftstabilität.",
    tempo: "2-1-3-1",
    istMaschinenVariante: true,
  },

  // ─────────────────────────────────────────────
  // CORE (~8)
  // ─────────────────────────────────────────────
  {
    name: "Plank",
    kategorie: "core",
    muskelgruppen: "core,rectus_abdominis,transversus",
    geraet: "koerpergewicht",
    gelenkbelastung: "schulter,unterer_ruecken",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Unterarmstütz in gerader Linie. Isometrische Ganzkörper-Stabilisierung.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Seitlicher Plank",
    kategorie: "core",
    muskelgruppen: "obliques,core,huefte",
    geraet: "koerpergewicht",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Seitlicher Unterarmstütz. Trainiert die seitliche Rumpfmuskulatur und Hüftstabilität.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Cable Crunch",
    kategorie: "core",
    muskelgruppen: "rectus_abdominis",
    geraet: "kabel",
    gelenkbelastung: "unterer_ruecken",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Kniende Crunches am Kabelzug. Ermöglicht progressive Überlastung der Bauchmuskulatur.",
    tempo: "2-1-3-1",
    istMaschinenVariante: false,
  },
  {
    name: "Pallof Press",
    kategorie: "core",
    muskelgruppen: "core,obliques,transversus",
    geraet: "kabel",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Anti-Rotationsübung am Kabelzug. Kabel seitlich halten und Arme nach vorne strecken.",
    tempo: "2-2-2-1",
    istMaschinenVariante: false,
  },
  {
    name: "Dead Bug",
    kategorie: "core",
    muskelgruppen: "core,rectus_abdominis,transversus",
    geraet: "koerpergewicht",
    gelenkbelastung: "unterer_ruecken",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Rückenlage, gegenüberliegenden Arm und Bein strecken. Sichere Core-Übung bei Rückenproblemen.",
    tempo: "2-2-2-1",
    istMaschinenVariante: false,
  },
  {
    name: "Bird Dog",
    kategorie: "core",
    muskelgruppen: "core,unterer_ruecken,gluteus",
    geraet: "koerpergewicht",
    gelenkbelastung: "schulter,huefte",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Vierfüßlerstand, gegenüberliegenden Arm und Bein strecken. Fördert Rumpfstabilität.",
    tempo: "2-2-2-1",
    istMaschinenVariante: false,
  },
  {
    name: "Beinheben hängend",
    kategorie: "core",
    muskelgruppen: "rectus_abdominis,hueftbeuger",
    geraet: "geraet",
    gelenkbelastung: "schulter,huefte",
    schwierigkeitsgrad: "fortgeschritten",
    beschreibung:
      "Beinheben im Hang an der Klimmzugstange oder an Armschlingen. Hohe Beanspruchung des unteren Bauchs.",
    tempo: "2-1-3-0",
    istMaschinenVariante: false,
  },
  {
    name: "Russian Twist",
    kategorie: "core",
    muskelgruppen: "obliques,rectus_abdominis",
    geraet: "koerpergewicht",
    gelenkbelastung: "unterer_ruecken",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Sitzend mit angehobenem Oberkörper den Rumpf rotieren. Optional mit Gewicht oder Medizinball.",
    tempo: "2-0-2-0",
    istMaschinenVariante: false,
  },

  // ─────────────────────────────────────────────
  // CARDIO (~6)
  // ─────────────────────────────────────────────
  {
    name: "Ruderergometer",
    kategorie: "cardio",
    muskelgruppen: "ganzkörper,latissimus,beine,core",
    geraet: "geraet",
    gelenkbelastung: "knie,huefte,schulter",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Ganzkörper-Cardio am Ruderergometer. Schonend für die Gelenke bei gleichzeitig hohem Kalorienverbrauch.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Laufband",
    kategorie: "cardio",
    muskelgruppen: "beine,herz_kreislauf",
    geraet: "geraet",
    gelenkbelastung: "knie,huefte,sprunggelenk",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Gehen oder Laufen auf dem Laufband. Steigung nutzen für geringere Gelenkbelastung bei hohem Puls.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Crosstrainer",
    kategorie: "cardio",
    muskelgruppen: "beine,arme,herz_kreislauf",
    geraet: "geraet",
    gelenkbelastung: "knie,huefte",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Gelenkschonendes Ganzkörper-Cardio am Crosstrainer. Ideal bei Knie- oder Gelenkproblemen.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Fahrradergometer",
    kategorie: "cardio",
    muskelgruppen: "beine,herz_kreislauf",
    geraet: "geraet",
    gelenkbelastung: "knie",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Radfahren am Ergometer. Sehr gelenkschonend und gut dosierbar für Aufwärmen oder Ausdauertraining.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Schwimmen",
    kategorie: "cardio",
    muskelgruppen: "ganzkörper,herz_kreislauf",
    geraet: "koerpergewicht",
    gelenkbelastung: "schulter",
    schwierigkeitsgrad: "mittel",
    beschreibung:
      "Schwimmen als gelenkschonendes Ganzkörpertraining. Ideal zur aktiven Regeneration.",
    tempo: null,
    istMaschinenVariante: false,
  },
  {
    name: "Walking",
    kategorie: "cardio",
    muskelgruppen: "beine,herz_kreislauf",
    geraet: "koerpergewicht",
    gelenkbelastung: "knie,huefte,sprunggelenk",
    schwierigkeitsgrad: "anfaenger",
    beschreibung:
      "Zügiges Gehen im Freien oder auf dem Laufband. Niedrigste Belastungsstufe für aktive Erholung.",
    tempo: null,
    istMaschinenVariante: false,
  },
];

// ──────────────────────────────────────────────────
// Alternative exercise mappings (by name)
// ──────────────────────────────────────────────────
const alternativeMap: Record<string, string[]> = {
  // Push alternatives
  "Bankdrücken (Langhantel)": [
    "Kurzhantel-Bankdrücken",
    "Brustpresse (Maschine)",
  ],
  "Kurzhantel-Bankdrücken": [
    "Bankdrücken (Langhantel)",
    "Brustpresse (Maschine)",
  ],
  "Brustpresse (Maschine)": [
    "Bankdrücken (Langhantel)",
    "Kurzhantel-Bankdrücken",
  ],
  Schrägbankdrücken: ["Kurzhantel-Bankdrücken", "Brustpresse (Maschine)"],
  Schulterdrücken: ["Kurzhantel-Schulterdrücken"],
  "Kurzhantel-Schulterdrücken": ["Schulterdrücken"],
  "Trizeps Pushdown": ["Überkopf-Trizeps", "Dips (Maschine)"],
  "Überkopf-Trizeps": ["Trizeps Pushdown", "Dips (Maschine)"],
  "Dips (Maschine)": ["Trizeps Pushdown", "Liegestütze"],
  Liegestütze: ["Brustpresse (Maschine)", "Dips (Maschine)"],

  // Pull alternatives
  "Latzug breit": ["Latzug eng", "Klimmzüge (assistiert)"],
  "Latzug eng": ["Latzug breit", "Klimmzüge (assistiert)"],
  "Klimmzüge (assistiert)": ["Latzug breit", "Latzug eng"],
  "Rudern Langhantel": ["Rudern Kurzhantel", "Rudern Maschine", "Cable Row"],
  "Rudern Kurzhantel": ["Rudern Langhantel", "Rudern Maschine", "Cable Row"],
  "Rudern Maschine": ["Rudern Langhantel", "Rudern Kurzhantel", "Cable Row"],
  "Cable Row": ["Rudern Langhantel", "Rudern Kurzhantel", "Rudern Maschine"],
  "Bizepscurl Langhantel": ["Bizepscurl Kurzhantel", "Hammercurl"],
  "Bizepscurl Kurzhantel": ["Bizepscurl Langhantel", "Hammercurl"],
  Hammercurl: ["Bizepscurl Langhantel", "Bizepscurl Kurzhantel"],
  "Face Pulls": ["Reverse Flys"],
  "Reverse Flys": ["Face Pulls"],

  // Lower body alternatives
  Kniebeuge: ["Beinpresse", "Goblet Squat", "Hackenschmidt"],
  Beinpresse: ["Kniebeuge", "Goblet Squat", "Hackenschmidt"],
  "Goblet Squat": ["Kniebeuge", "Beinpresse"],
  Hackenschmidt: ["Kniebeuge", "Beinpresse"],
  Ausfallschritte: ["Bulgarische Kniebeuge"],
  "Bulgarische Kniebeuge": ["Ausfallschritte"],
  Kreuzheben: ["Rumänisches Kreuzheben", "Sumo-Kreuzheben"],
  "Rumänisches Kreuzheben": ["Kreuzheben", "Beinbeuger"],
  "Sumo-Kreuzheben": ["Kreuzheben", "Rumänisches Kreuzheben"],
  Beinbeuger: ["Rumänisches Kreuzheben"],
  Beinstrecker: ["Goblet Squat", "Beinpresse"],
  "Wadenheben stehend": ["Wadenheben sitzend"],
  "Wadenheben sitzend": ["Wadenheben stehend"],

  // Core alternatives
  Plank: ["Dead Bug", "Bird Dog"],
  "Seitlicher Plank": ["Pallof Press"],
  "Cable Crunch": ["Beinheben hängend", "Russian Twist"],
  "Pallof Press": ["Seitlicher Plank"],
  "Dead Bug": ["Plank", "Bird Dog"],
  "Bird Dog": ["Plank", "Dead Bug"],
  "Beinheben hängend": ["Cable Crunch", "Russian Twist"],
  "Russian Twist": ["Cable Crunch", "Beinheben hängend"],

  // Cardio alternatives
  Ruderergometer: ["Crosstrainer"],
  Laufband: ["Crosstrainer", "Walking"],
  Crosstrainer: ["Ruderergometer", "Fahrradergometer"],
  Fahrradergometer: ["Crosstrainer", "Walking"],
  Walking: ["Laufband", "Fahrradergometer"],
};

async function main() {
  console.log("Seeding Uebungen...");

  // Step 1: Upsert all exercises
  for (const u of uebungen) {
    await prisma.uebung.upsert({
      where: { name: u.name },
      update: {
        kategorie: u.kategorie,
        muskelgruppen: u.muskelgruppen,
        geraet: u.geraet,
        gelenkbelastung: u.gelenkbelastung,
        schwierigkeitsgrad: u.schwierigkeitsgrad,
        beschreibung: u.beschreibung,
        tempo: u.tempo,
        istMaschinenVariante: u.istMaschinenVariante,
      },
      create: {
        name: u.name,
        kategorie: u.kategorie,
        muskelgruppen: u.muskelgruppen,
        geraet: u.geraet,
        gelenkbelastung: u.gelenkbelastung,
        schwierigkeitsgrad: u.schwierigkeitsgrad,
        beschreibung: u.beschreibung,
        tempo: u.tempo,
        istMaschinenVariante: u.istMaschinenVariante,
      },
    });
    console.log(`  ✔ ${u.name}`);
  }

  // Step 2: Build name → id lookup
  const allUebungen = await prisma.uebung.findMany({
    select: { id: true, name: true },
  });
  const nameToId = new Map<string, string>();
  for (const u of allUebungen) {
    nameToId.set(u.name, u.id);
  }

  // Step 3: Update alternativeIds
  console.log("\nLinking alternatives...");
  for (const [name, altNames] of Object.entries(alternativeMap)) {
    const id = nameToId.get(name);
    if (!id) {
      console.warn(`  ⚠ Exercise not found: ${name}`);
      continue;
    }

    const altIds = altNames
      .map((altName) => {
        const altId = nameToId.get(altName);
        if (!altId) {
          console.warn(`  ⚠ Alternative not found: ${altName} (for ${name})`);
        }
        return altId;
      })
      .filter(Boolean) as string[];

    if (altIds.length > 0) {
      await prisma.uebung.update({
        where: { id },
        data: { alternativeIds: altIds.join(",") },
      });
      console.log(`  ✔ ${name} → ${altIds.length} alternatives`);
    }
  }

  const count = await prisma.uebung.count();
  console.log(`\nSeeding complete. Total exercises: ${count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
