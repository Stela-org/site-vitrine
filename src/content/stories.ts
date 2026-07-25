// Success stories : STRUCTURE prête, à remplir uniquement avec des cas clients
// réels et instrumentés (règle : chiffres réels et sourcés uniquement, aucun
// chiffre inventé). Tant que le tableau est vide, la home affiche un état
// honnête « à venir », jamais un faux témoignage.
//
// Convention : `metric` est LE CHIFFRE en titre (ex. « +40 avis en 2 mois »),
// tel qu'il ressort d'une mesure réelle côté client.

export type Story = {
  metric: string; // le chiffre réel, mis en titre
  title: string; // une phrase de contexte
  quote: string; // verbatim du client
  author: string; // prénom + rôle
  sector: string; // secteur (restaurant, coiffeur...)
  city?: string;
};

// VIDE volontairement : à compléter avec des cas réels (voir convention ci-dessus).
export const STORIES: Story[] = [];
