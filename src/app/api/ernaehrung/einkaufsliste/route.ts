import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface EinkaufsItem {
  name: string;
  menge?: string;
}

interface KategorisierteEinkaufsliste {
  [kategorie: string]: EinkaufsItem[];
}

// Simple keyword-based categorization for German groceries
function kategorisiereZutat(zutat: string): string {
  const lower = zutat.toLowerCase();

  // Fleisch & Fisch
  if (
    /huhn|hähnchen|hühnchen|pute|rind|schwein|lachs|thunfisch|garnelen|fisch|fleisch|schinken|hack|steak|filet|wurst|salami|forelle|kabeljau|pangasius/.test(
      lower
    )
  ) {
    return "Fleisch & Fisch";
  }

  // Milchprodukte
  if (
    /milch|joghurt|quark|käse|mozzarella|sahne|butter|skyr|whey|protein|casein|ei(er)?(?!\w)|hüttenkäse|frischkäse|parmesan|gouda|feta/.test(
      lower
    )
  ) {
    return "Milchprodukte";
  }

  // Obst & Gemüse
  if (
    /apfel|banane|beeren|erdbeere|blaubeere|himbeere|orange|zitrone|tomate|gurke|paprika|brokkoli|spinat|salat|zwiebel|knoblauch|kartoffel|süßkartoffel|karotte|möhre|avocado|pilz|champignon|zucchini|aubergine|obst|gemüse|kohl|blumenkohl|erbse|bohne(?!n.*dose)|spargel|kürbis|mango|kiwi|birne|traube|ananas|melone/.test(
      lower
    )
  ) {
    return "Obst & Gemüse";
  }

  // Getreide & Hülsenfrüchte
  if (
    /reis|nudel|pasta|brot|haferflocken|hafer|müsli|linsen|kichererbsen|bohnen|quinoa|couscous|bulgur|mehl|vollkorn|toast|wraps|tortilla|hülsenfrücht/.test(
      lower
    )
  ) {
    return "Getreide & Hülsenfrüchte";
  }

  return "Sonstiges";
}

// Parse recipe text to extract ingredient lines
function extrahiereZutaten(rezeptText: string): string[] {
  // Split by common separators and filter out cooking instructions
  const teile = rezeptText
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && t.length < 100);

  return teile;
}

// Try to merge duplicate ingredients
function aggregiereZutaten(
  items: EinkaufsItem[]
): EinkaufsItem[] {
  const merged = new Map<string, EinkaufsItem>();

  for (const item of items) {
    // Normalize name for grouping
    const key = item.name
      .toLowerCase()
      .replace(/\d+\s*(g|ml|kg|l|stück|el|tl|scheibe[n]?|portion(en)?)\s*/g, "")
      .trim();

    if (!merged.has(key)) {
      merged.set(key, { name: item.name, menge: item.menge });
    }
    // If already exists, keep the first entry (simplification)
  }

  return Array.from(merged.values());
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Get current week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    // Fetch all nutrition plans for this week
    const plans = await prisma.nutritionPlan.findMany({
      where: {
        userId: user.id,
        datum: {
          gte: monday,
          lt: sunday,
        },
      },
      include: {
        mahlzeiten: true,
      },
    });

    if (plans.length === 0) {
      return NextResponse.json({ einkaufsliste: {} });
    }

    // Extract all ingredients from recipes
    const alleZutaten: EinkaufsItem[] = [];

    for (const plan of plans) {
      for (const mahlzeit of plan.mahlzeiten) {
        if (mahlzeit.rezept) {
          const zutaten = extrahiereZutaten(mahlzeit.rezept);
          for (const zutat of zutaten) {
            alleZutaten.push({ name: zutat });
          }
        }
      }
    }

    // Categorize
    const kategorisiert: KategorisierteEinkaufsliste = {
      "Fleisch & Fisch": [],
      "Milchprodukte": [],
      "Obst & Gemüse": [],
      "Getreide & Hülsenfrüchte": [],
      "Sonstiges": [],
    };

    for (const item of alleZutaten) {
      const kategorie = kategorisiereZutat(item.name);
      kategorisiert[kategorie].push(item);
    }

    // Aggregate duplicates within each category
    for (const kategorie of Object.keys(kategorisiert)) {
      kategorisiert[kategorie] = aggregiereZutaten(kategorisiert[kategorie]);
    }

    // Remove empty categories
    for (const kategorie of Object.keys(kategorisiert)) {
      if (kategorisiert[kategorie].length === 0) {
        delete kategorisiert[kategorie];
      }
    }

    return NextResponse.json({ einkaufsliste: kategorisiert });
  } catch (error) {
    console.error("Einkaufsliste GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Einkaufsliste." },
      { status: 500 }
    );
  }
}
