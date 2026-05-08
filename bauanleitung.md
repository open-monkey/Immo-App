# Bauanleitung — Immobilien-Investment-App (Neubau)

> **Status**: Greenfield-Bauanleitung für den Coding-Agenten.
> **Stufe**: Architektur- und Logikspezifikation. Datenmodell, Formeln und Schnittstellen sind verbindlich. UI-Detailentscheidungen (Layout, Microcopy, exakte Komponentenauswahl innerhalb der vorgegebenen Library-Wahl) liegen beim Agenten.
> **Geltungsbereich**: Deutschland, Baden-Württemberg.
> **Zielnutzer**: semi-professionelle Privatanleger.

---

## Inhalt

0. [Lesehinweise](#0-lesehinweise)
1. [Zielbild und Scope-Disziplin](#1-zielbild-und-scope-disziplin)
2. [Architekturüberblick](#2-architekturüberblick)
3. [Konventionen](#3-konventionen)
4. [Datenmodell](#4-datenmodell)
5. [Berechnungs-Engine](#5-berechnungs-engine)
6. [UI-Architektur](#6-ui-architektur)
7. [Forms und Validierung](#7-forms-und-validierung)
8. [State-Management](#8-state-management)
9. [Persistenz und Share-Links](#9-persistenz-und-share-links)
10. [PDF-Export](#10-pdf-export)
11. [Phasenplan](#11-phasenplan)
12. [Akzeptanzkriterien und Tests](#12-akzeptanzkriterien-und-tests)
13. [Anhang](#13-anhang)

---

## 0. Lesehinweise

Diese Anleitung ist verbindlich in folgender Reihenfolge:

1. **Datenmodell (Sektion 4)** — alle Variablen, Typen, Einheiten, Defaults, Validierung. Source of Truth für Eingaben, Zwischenwerte, Kennzahlen.
2. **Engine (Sektion 5)** — alle Formeln. Wenn eine Formel hier nicht steht, existiert sie nicht. Keine eigenmächtigen KPIs einführen.
3. **Phasenplan (Sektion 11)** — Reihenfolge der Implementierung. Nicht nach vorne arbeiten; Phase n+1 erst nach grünen Tests in Phase n.

Alles übrige (UI-Layout, Komponentenstil innerhalb des Designsystems, Microcopy) ist Agenten-Entscheidung im Rahmen der Designrichtlinien.

**Verbindliche Leitplanken (Wiederholung der Projektguardrails):**

- Formeln transparent. Jede Kennzahl hat im Code ein `metadata`-Objekt mit `formel`, `bedeutung`, `eingaben[]`. Wird in Tooltips angezeigt.
- Wirtschaftliche Logik und Steuerlogik strikt getrennt — eigene Module, eigene Tests.
- Monatlicher Cashflow wird **niemals** mit spekulativer Wertsteigerung verrechnet. Wertsteigerung ist eigene KPI-Schicht (Exit-Sicht).
- Correctness vor UI-Polish.
- Keine spekulativen Cross-Cutting-Änderungen; was nicht spezifiziert ist, wird nicht gebaut.

---

## 1. Zielbild und Scope-Disziplin

### 1.1 Was die App leistet

Eine browserbasierte Wirtschaftlichkeitsprüfung für den Kauf einer einzelnen Wohnung mit Vermietungsabsicht in Deutschland (Schwerpunkt Baden-Württemberg). Liefert:

- Einjahressicht: Cashflow vor/nach Steuern, Renditen, Break-even, DSCR.
- Mehrjahressicht: Tilgungsplan über drei Zinsphasen, Cashflow-Reihe, Restschuld, Wertentwicklung.
- Live-Dashboard: jede Eingabe rechnet sofort durch.
- Persistenz über Share-Links (Server-Storage) und Auto-Save lokal (LocalStorage).
- PDF-Export wahlweise als Kennzahlen-Report oder Kennzahlen + Tilgungsplan.

### 1.2 Was die App **nicht** leistet (Scope-Disziplin)

Bewusst ausgeschlossen, um Fokus zu halten:

- **Keine Mehrobjekt-Verwaltung**: ein aktives Objekt im Browser. Weitere Objekte entstehen über „Neu speichern → neuer Share-Link".
- **Kein Account-System, keine Authentifizierung**: Zugang ausschließlich über Share-Link.
- **Kein vollständiges Steuermodul**: vereinfachte Schätzung mit linearem persönlichem Steuersatz × steuerlichem Überschuss. Keine 15-%-Grenze, kein §82b EStDV, keine Spekulationssteuer, kein Soli, keine Kirchensteuer.
- **Kein vollständiges Exit-Modul**: nur Wertentwicklung über Zeit. Keine Verkaufskosten, keine Vorfälligkeitsentschädigung, keine Spekulationssteuer-Berechnung, kein Exit-IRR.
- **Keine Migration alter Datenbestände**: Hard-Cut zur bestehenden Vorgängerversion. Alte Share-Links sind nicht mehr gültig.
- **Keine i18n im MVP**: nur Deutsch. Texte werden zentralisiert, damit i18n später trivial nachrüstbar ist.

Wenn der Anwender später eines dieser Felder will, wird das als eigene Phase nachgezogen — nicht durch spekulatives Vorbauen.

### 1.3 Zielgruppen-Annahme

Semi-professionelle Privatanleger: Grundbegriffe (Eigenkapital, Zinssatz, Tilgung, Hausgeld, AfA) sind bekannt. Tooltips erklären präzise und sachlich; keine Erklärung von Banalitäten, aber jede KPI erläutert ihre Formel.

---

## 2. Architekturüberblick

### 2.1 Hohe Sicht

```
┌──────────────────────── Browser ────────────────────────┐
│                                                          │
│   React UI  ──►  Zustand-Store  ──►  Domain-Engine       │
│       ▲                ▲                  │              │
│       │                │                  ▼              │
│   RHF + Zod     LocalStorage         decimal.js-light    │
│       │                │                                 │
│       └──────► TanStack Query ──► HTTP ──┐               │
│                                          │               │
└──────────────────────────────────────────┼───────────────┘
                                           ▼
                            ┌─────────── Backend ──────────┐
                            │   Fastify  ──►  Postgres     │
                            │   (nur Storage + Share-API)  │
                            └──────────────────────────────┘
```

### 2.2 Verbindliche Technologieauswahl

| Bereich | Technologie | Begründung in Kurzform |
|---|---|---|
| Sprache | TypeScript (strict) | Konsistenz mit bestehender Welt |
| Frontend-Framework | React 18 | bestehende Welt |
| Build | Vite | bestehende Welt |
| Routing | react-router-dom 6 | bestehende Welt |
| Server-Calls | TanStack Query | bereits installiert |
| State (Domain + UI) | **Zustand** | leichtgewichtig, kein Boilerplate |
| Form-State | **React Hook Form** | performant bei vielen Feldern |
| Validierung | **Zod** | Single Source of Truth für Typ + Regel |
| Numerik | **decimal.js-light** | nur in der Engine, keine Float-Drifts |
| Charts | **Recharts** | React-nativ, deckt alle benötigten Chart-Typen |
| PDF | **pdfmake** | clientseitig, tabellenstark |
| Persistenz Browser | **LocalStorage** | Auto-Save + lokale Share-ID-Liste |
| Persistenz Server | **PostgreSQL 16** (bestehend) | bestehende Welt |
| Backend | **Fastify** (bestehend) | bestehende Welt, **nur noch Storage** |
| Tests | Vitest | bestehende Welt |
| Styling | Eigenes CSS + CSS Custom Properties als Tokens | bestehende Welt |
| i18n | nicht im MVP, aber Texte zentralisiert | Vorbereitung |

### 2.3 Verzeichnisstruktur Frontend

```
frontend/
  src/
    domain/                         # framework-frei, voll Vitest-getestet
      finance/
        types.ts                    # alle Domain-Typen (Inputs, Intermediates, KPIs)
        defaults.ts                 # Default-Werte (BW-spezifisch)
        engine.ts                   # zentrale compute()-Funktion
        amortization.ts             # Tilgungsplan über drei Phasen
        cashflow.ts                 # Mehrjahres-Cashflow
        kpis.ts                     # alle Kennzahlen + Metadaten
        tax.ts                      # Steuermodul (vereinfacht)
        valuation.ts                # Wertentwicklung
        index.ts                    # Public API
      __tests__/
        amortization.test.ts
        engine.test.ts
        cashflow.test.ts
        kpis.test.ts
        tax.test.ts
        valuation.test.ts
        fixtures.ts                 # Beispielszenarien

    schemas/                        # Zod-Schemas, abgeleitet → Types
      inputs.ts                     # parallel/identisch zu domain/finance/types.ts

    state/
      useImmoStore.ts               # Zustand-Store (Inputs + Selectors)

    api/
      client.ts                     # fetch-Wrapper
      shareLinks.ts                 # POST /calculations, GET/DELETE /calculations/:shareId

    components/
      ui/                           # Hauseigene Komponenten-Library
        NumberInput.tsx
        CurrencyInput.tsx
        PercentInput.tsx
        IntegerInput.tsx
        Section.tsx                 # klappbar
        KPICard.tsx
        Tooltip.tsx
        InfoIcon.tsx
        Button.tsx
        Toggle.tsx
        Tabs.tsx
      sections/                     # eine Komponente pro Dashboard-Sektion
        ObjektSection.tsx
        SanierungSection.tsx
        FinanzierungSection.tsx
        MieteSection.tsx
        KostenSection.tsx
        RisikoSection.tsx
        SzenarioSection.tsx
        SteuerSection.tsx
        WertentwicklungSection.tsx
      charts/
        TilgungsplanChart.tsx
        CashflowChart.tsx
        WertentwicklungChart.tsx
      kpis/
        KPIBoard.tsx                # Container für alle KPI-Karten
        KPIDefinitions.tsx          # Modal mit Formeln/Erklärungen
      pdf/
        ReportTemplate.ts           # pdfmake-Definition
        TilgungsplanTemplate.ts

    pages/
      DashboardPage.tsx             # Hauptansicht
      ShareViewPage.tsx             # Read-only-Ansicht für Share-Links
      NotFoundPage.tsx

    styles/
      tokens.css                    # CSS Custom Properties
      base.css                      # Reset + Defaults
      components.css                # Komponenten-Styles

    i18n/
      de.ts                         # alle UI-Texte, KPI-Beschreibungen, Tooltips

    lib/
      formatting.ts                 # Intl.NumberFormat-Helper

    App.tsx
    main.tsx
```

### 2.4 Verzeichnisstruktur Backend (Refactor, nicht Neubau)

```
backend/
  src/
    routes/
      calculations.ts               # POST, GET /:shareId, DELETE /:shareId
      health.ts
    db/
      schema.sql                    # neues Schema (siehe Sektion 9)
      migrations/                   # forward-only, kein Migrieren alter Daten
      repository.ts
    lib/
      shareId.ts                    # Erzeugung kollisionssicherer IDs
    server.ts
  tests/
    routes.test.ts
```

**Wichtig**: `backend/src/services/calculationEngine.ts` wird **gelöscht**. Das Backend rechnet nichts mehr. Es validiert nur das Schema und speichert/lädt JSONB.

### 2.5 Datenfluss bei einer Eingabe

1. Nutzer ändert Wert in einem RHF-Feld.
2. RHF validiert via Zod (synchron).
3. Bei Validierung OK: Zustand-Store wird aktualisiert.
4. Selectors im Store rufen `compute(inputs)` aus der Engine auf (memoized).
5. KPI-Komponenten lesen die abgeleiteten Werte aus dem Store und rendern neu.
6. LocalStorage wird gedebounced (300 ms) als Auto-Save geschrieben.
7. Server wird **nicht** automatisch kontaktiert. Erst beim expliziten Klick „Speichern und Share-Link erzeugen".

### 2.6 Datenfluss beim Laden eines Share-Links

1. Route `/s/:shareId` wird angesteuert.
2. TanStack Query lädt `GET /api/calculations/:shareId`.
3. Antwort wird gegen Zod-Schema validiert (Schutz vor Schema-Drift).
4. Inputs werden in den Store geladen, KPIs werden berechnet.
5. Ansicht ist read-only. „Bearbeiten" erzeugt **neue** Share-ID, nicht Überschreiben (Schutz vor versehentlichem Ändern fremder Berechnungen).

---

## 3. Konventionen

### 3.1 Einheiten und Zahltypen

| Konzept | Eingabe (UI) | Speicherung (Domain) | Anzeige |
|---|---|---|---|
| Währung | Eurobetrag, max. 2 Nachkommastellen | `Decimal` (decimal.js-light), in EUR | `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` |
| Prozent | als Prozentzahl, z. B. `4` oder `4.5` | als **Dezimal**, z. B. `0.04` (Engine rechnet immer mit Dezimal) | mit Suffix `%`, max. 2 Nachkommastellen, deutsche Schreibweise mit Komma |
| Quadratmeter | ganze Zahl oder eine Nachkommastelle | `Decimal` | mit Suffix `m²` |
| Jahre / Monate | ganze Zahl | `number` (Integer) | mit Suffix `Jahre` bzw. `Monate` |
| Boolean | Toggle | `boolean` | — |

**Konversion an der Schicht-Grenze**: UI ↔ Schema rechnet Prozent automatisch um. Engine sieht **immer** Dezimal-Prozent.

### 3.2 Rundung

- **Engine intern**: keine Rundung, voller Decimal-Precision.
- **Engine-Output**: bei der Übergabe ans UI auf 2 Dezimalstellen kaufmännisch (`ROUND_HALF_EVEN`) gerundet, außer für KPIs wie DSCR oder Kaufpreisfaktor (3 Stellen).
- **Tilgungsplan**: jede Jahreszeile auf 2 Stellen gerundet, Restschuld am Jahresende auf 2 Stellen. Summen werden aus den **ungerundeten** Werten gebildet, nicht aus den gerundeten.

### 3.3 Benennung

- Code: TypeScript-Standard, `camelCase` für Felder und Funktionen, `PascalCase` für Typen und Komponenten.
- Domain-Typen verbindlich definiert in `domain/finance/types.ts`. Alle anderen Module importieren von dort. Keine Duplikate.
- KPI-IDs sind stabile, sprechende Bezeichner in `camelCase`, z. B. `cashflowVorSteuern`, `bruttomietrendite`.

### 3.4 Defaults

Defaults für Baden-Württemberg (siehe `domain/finance/defaults.ts`):

- Grunderwerbsteuersatz: **5,0 %**
- Notar- und Grundbuchkosten: **1,5 %** (Faustregel)
- Maklerprovision: **3,57 % brutto** (inkl. 19 % USt) als Käuferanteil bei hälftiger Teilung — kann auch 0 % sein, wenn provisionsfrei.
- Tilgungsphasen: 1. Phase 10 Jahre, 2. Phase 10 Jahre, 3. Phase Restlaufzeit. Beide ersten Phasenlängen sind editierbar.

### 3.5 Vokabular (verbindlich)

Damit die App nicht zwischen Synonymen schwankt:

| Begriff | Definition in dieser App |
|---|---|
| Kaufpreis | reiner Wohnungskaufpreis ohne alles andere |
| Kaufnebenkosten | Grunderwerbsteuer + Notar + Grundbuch + Maklerprovision |
| Sanierungskosten | einmalige Investition vor Vermietung, addiert in Gesamtkapitalbedarf |
| Gesamtkapitalbedarf | Kaufpreis + Kaufnebenkosten + Sanierungskosten |
| Eigenkapital | vom Anleger eingebrachter Betrag |
| Fremdkapital | Gesamtkapitalbedarf − Eigenkapital, ggf. um nicht finanzierte Anteile bereinigt |
| Jahresnettokaltmiete | Monatsnettokaltmiete × 12, **ohne** Leerstandsabzug |
| Effektive Jahresmiete | Jahresnettokaltmiete × (1 − Leerstandsquote) |
| Bewirtschaftungskosten | nicht umlagefähige Eigentümerkosten + Instandhaltungskosten (Sondereigentum) |
| Jahresreinertrag | Effektive Jahresmiete − Bewirtschaftungskosten |
| Kapitaldienst | Zinslast + Tilgung im jeweiligen Jahr (aus Tilgungsplan, **nicht** aus Anfangstilgungssatz) |
| Cashflow vor Steuern | Jahresreinertrag − Kapitaldienst |
| Steuerlicher Überschuss | Jahresreinertrag − Zinslast − AfA (Tilgung **nicht** abziehen) |
| Steuerlast | Steuerlicher Überschuss × persönlicher Steuersatz (kann negativ = Steuerersparnis) |
| Cashflow nach Steuern | Cashflow vor Steuern − Steuerlast |

Diese Begriffe werden 1:1 als KPI-Namen, Tooltip-Texte und Variablennamen verwendet. Keine Synonyme einführen.

## 4. Datenmodell

Verbindlich. Alle drei Tabellen (Eingaben, Zwischenwerte, Kennzahlen) sind die einzige Quelle der Wahrheit. Engine, Schemas, UI lesen aus dieser Spezifikation.

### 4.1 Eingaben

Spalten:
- **Feld**: Name in `camelCase`. Identisch in TS-Type und Zod-Schema.
- **Bereich**: Sektion im Dashboard.
- **Typ**: TypeScript-Typ.
- **Einheit**: physische Einheit.
- **Pflicht**: ob für eine Berechnung Pflicht.
- **Default (BW)**: Default beim Anlegen einer leeren Berechnung.
- **Validierung**: Min/Max/sonstige Regeln.
- **Anmerkung**.

#### 4.1.1 Sektion „Objekt"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `kaufpreis` | Decimal | EUR | ja | — | > 0, ≤ 10 000 000 | reiner Kaufpreis |
| `wohnflaecheQm` | Decimal | m² | ja | — | > 0, ≤ 1 000 | Wohnfläche |
| `bundesland` | enum | — | ja | `'BW'` | enum DE-Bundesländer | wirkt auf Default Grunderwerbsteuer |

#### 4.1.2 Sektion „Kaufnebenkosten"

Zwei Modi: **vereinfacht** (eine Summe) oder **detailliert** (Einzelposten). Schalter `kaufnebenkostenModus`. Wenn detailliert, Summe deaktiviert; wenn vereinfacht, Detailfelder deaktiviert. Niemals beide gleichzeitig aktiv (Doppelzählung verhindern).

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `kaufnebenkostenModus` | `'vereinfacht' \| 'detailliert'` | — | ja | `'detailliert'` | enum | UI-Schalter |
| `kaufnebenkostenSumme` | Decimal | EUR | nur wenn vereinfacht | — | ≥ 0 | nur aktiv im Modus „vereinfacht" |
| `grunderwerbsteuerSatz` | Decimal | Prozent (Dezimal) | nur wenn detailliert | `0.05` (BW) | 0–0,07 | bundeslandabhängiger Default |
| `notarGrundbuchSatz` | Decimal | Prozent (Dezimal) | nur wenn detailliert | `0.015` | 0–0,03 | Notar + Grundbuch zusammen |
| `maklerprovisionSatz` | Decimal | Prozent (Dezimal) | nur wenn detailliert | `0.0357` | 0–0,07 | Käuferanteil, brutto |

#### 4.1.3 Sektion „Sanierung"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `sanierungskostenSumme` | Decimal | EUR | ja | `0` | ≥ 0 | direkte Eingabe als Summe; **keine** €/m²-Eingabe (in der Vorgängerversion problematisch). Optionaler Helfer im UI: „aus €/m² berechnen" als reiner Convenience-Trigger, der die Summe einmalig setzt. |
| `sanierungWertanrechnungSatz` | Decimal | Prozent (Dezimal) | nein | `0.7` | 0–1 | Anteil der Sanierungskosten, der den Marktwert beim Exit erhöht |

#### 4.1.4 Sektion „Finanzierung"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `eigenkapital` | Decimal | EUR | ja | — | ≥ 0 | |
| `finanziertePosten` | Set<`'kaufpreis' \| 'kaufnebenkosten' \| 'sanierung'`> | — | ja | `{kaufpreis, kaufnebenkosten, sanierung}` | nicht leer wenn Fremdkapital > 0 | bestimmt, was die Bank mitfinanziert. Wirkt auf Fremdkapitalhöhe. |
| `phase1Jahre` | number (Integer) | Jahre | ja | `10` | 1–40 | Länge erste Zinsphase |
| `phase1Sollzins` | Decimal | Prozent (Dezimal) | ja | `0.04` | 0–0,15 | nominal p. a. |
| `phase1AnfTilgung` | Decimal | Prozent (Dezimal) | ja | `0.02` | 0–0,1 | anfänglicher Tilgungssatz, bezogen auf Restschuld bei Phasenbeginn |
| `phase1Sondertilgung` | Decimal | EUR | nein | `0` | ≥ 0 | jährliche Sondertilgung in dieser Phase |
| `phase2Jahre` | number (Integer) | Jahre | ja | `10` | 0–40 | Länge zweite Phase. `0` = nur eine Phase plus Restzeit. |
| `phase2Sollzins` | Decimal | Prozent (Dezimal) | nur wenn phase2Jahre > 0 | `0.045` | 0–0,15 | |
| `phase2AnfTilgung` | Decimal | Prozent (Dezimal) | nur wenn phase2Jahre > 0 | `0.025` | 0–0,1 | |
| `phase2Sondertilgung` | Decimal | EUR | nein | `0` | ≥ 0 | |
| `phase3Sollzins` | Decimal | Prozent (Dezimal) | ja | `0.05` | 0–0,15 | gilt bis Volltilgung |
| `phase3AnfTilgung` | Decimal | Prozent (Dezimal) | ja | `0.03` | 0–0,1 | bezogen auf Restschuld bei Phase-3-Start |
| `phase3Sondertilgung` | Decimal | EUR | nein | `0` | ≥ 0 | |
| `tilgungsplanMaxJahre` | number (Integer) | Jahre | nein | `40` | 5–60 | Sicherheitsobergrenze, falls bei sehr niedriger Tilgung kein Volltilgungspunkt erreicht wird; in dem Fall wird der Plan abgeschnitten und ein Hinweis ausgegeben. |

#### 4.1.5 Sektion „Mieteinnahmen"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `monatsnettokaltmiete` | Decimal | EUR/Monat | ja | — | > 0 | reine Kaltmiete, ohne Nebenkostenvorauszahlung |
| `mietsteigerungSatz` | Decimal | Prozent (Dezimal) p. a. | nein | `0.015` | −0,05–0,1 | für Mehrjahressicht |

#### 4.1.6 Sektion „Laufende Kosten"

Zwei Modi analog zu Kaufnebenkosten: **vereinfacht** (eine Summe) oder **detailliert** (Einzelposten). Schalter `kostenModus`.

**Wichtig**: Instandhaltung wird **immer** separat erfasst, nicht über das Hausgeld. Damit ist die in der Vorgängerversion identifizierte Doppelzählung WEG-Rücklage ↔ Instandhaltung ausgeschlossen. UI-Hinweis im Hausgeldfeld: „ohne Instandhaltungsrücklage eintragen — diese im Feld Instandhaltung erfassen".

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `kostenModus` | `'vereinfacht' \| 'detailliert'` | — | ja | `'detailliert'` | enum | |
| `nichtUmlagefaehigeKostenSumme` | Decimal | EUR/Jahr | nur wenn vereinfacht | — | ≥ 0 | Sammelfeld |
| `hausgeldNichtUmlagefaehigPa` | Decimal | EUR/Jahr | nur wenn detailliert | — | ≥ 0 | **ohne** Instandhaltungsrücklage |
| `verwaltungskostenPa` | Decimal | EUR/Jahr | nur wenn detailliert | — | ≥ 0 | Sondereigentums-Verwalter |
| `versicherungenPa` | Decimal | EUR/Jahr | nur wenn detailliert | `0` | ≥ 0 | nicht umlagefähige Anteile |
| `sonstigeKostenPa` | Decimal | EUR/Jahr | nur wenn detailliert | `0` | ≥ 0 | Sammelfeld für Reste |
| `instandhaltungskostenPa` | Decimal | EUR/Jahr | ja | — | ≥ 0 | Eigentümer-Rücklage Sondereigentum, separat von Hausgeld |
| `kostensteigerungSatz` | Decimal | Prozent (Dezimal) p. a. | nein | `0.02` | −0,05–0,1 | für Mehrjahressicht |

#### 4.1.7 Sektion „Leerstand und Risiko"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `leerstandsmonateProJahr` | Decimal | Monate | ja | `0.5` | 0–12 | laufender, struktureller Leerstand |
| `erstvermietungsleerstandMonate` | Decimal | Monate | nein | `0` | 0–24 | einmaliger Leerstand zu Beginn (z. B. nach Sanierung) |
| `mietausfallwagnisSatz` | Decimal | Prozent (Dezimal) | nein | `0.02` | 0–0,1 | Zahlungsausfall, separat zum Leerstand |

#### 4.1.8 Sektion „Steuern" (vereinfacht)

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `steuerModulAktiv` | boolean | — | ja | `false` | — | UI-Toggle für die ganze Sektion |
| `persoenlicherSteuersatz` | Decimal | Prozent (Dezimal) | nur wenn aktiv | `0.42` | 0–0,5 | Grenzsteuersatz |
| `gebaeudeanteilSatz` | Decimal | Prozent (Dezimal) | nur wenn aktiv | `0.8` | 0,3–0,95 | Anteil des Kaufpreises, der auf das Gebäude entfällt (Boden ist nicht abschreibbar) |
| `afaSatz` | Decimal | Prozent (Dezimal) | nur wenn aktiv | `0.02` | 0,02 / 0,025 / 0,03 | linearer AfA-Satz, abhängig vom Baujahr |

#### 4.1.9 Sektion „Wertentwicklung und Mehrjahressicht"

| Feld | Typ | Einheit | Pflicht | Default | Validierung | Anmerkung |
|---|---|---|---|---|---|---|
| `betrachtungszeitraumJahre` | number (Integer) | Jahre | ja | `15` | 1–50 | für Mehrjahres-KPIs und Charts |
| `wertsteigerungSatz` | Decimal | Prozent (Dezimal) p. a. | nein | `0.015` | −0,05–0,1 | nominale Marktwertsteigerung |

### 4.2 Zwischenwerte (vom Engine berechnet, nicht eingebbar)

| Name | Einheit | Formel (Kurzform) | sichtbar im UI? |
|---|---|---|---|
| `kaufnebenkostenSummeBerechnet` | EUR | je nach Modus, siehe 5.2 | ja, als kleines Hilfsdisplay neben Eingaben |
| `gesamtkapitalbedarf` | EUR | Kaufpreis + Kaufnebenkosten + Sanierung | ja, prominent |
| `fremdkapital` | EUR | siehe 5.3 | ja |
| `jahresnettokaltmiete` | EUR | Monatsmiete × 12 | ja |
| `leerstandsquote` | Dezimal | Leerstandsmonate / 12 | nein |
| `effektiveJahresmiete` | EUR | Jahresmiete × (1 − Leerstand) × (1 − Mietausfallwagnis) | nein |
| `nichtUmlagefaehigeKostenAggregiert` | EUR | je nach Modus | nein |
| `bewirtschaftungskosten` | EUR | nicht umlagefähige Kosten + Instandhaltung | nein |
| `jahresreinertrag` | EUR | effektive Jahresmiete − Bewirtschaftungskosten | ja |
| `tilgungsplan` | Tabelle | siehe 5.5 | ja, als Chart und Tabelle |
| `restschuldEnde` | EUR | Restschuld am Ende des Betrachtungszeitraums | ja |
| `marktwertEnde` | EUR | siehe 5.9 | ja |
| `afaJaehrlich` | EUR | siehe 5.7 | nein |

### 4.3 Kennzahlen (KPIs)

Verbindliche KPI-Liste. Jede KPI hat in `domain/finance/kpis.ts` ein `metadata`-Objekt mit `id`, `displayName`, `formel`, `bedeutung`, `eingaben[]`, `einheit`, `kategorie`. Die UI rendert daraus Tooltips. Keine KPI ohne Metadaten.

| KPI | Kategorie | Einheit | Anmerkung |
|---|---|---|---|
| `bruttomietrendite` | Schnellsicht | % | klassische Brutto-Sicht |
| `nettomietrendite` | Schnellsicht | % | mit Bewirtschaftungskosten und Leerstand |
| `kaufpreisfaktor` | Schnellsicht | Faktor | klassisch: Kaufpreis / Jahresmiete |
| `kaufpreisfaktorAllIn` | Schnellsicht | Faktor | Gesamtkapitalbedarf / Jahresmiete |
| `cashflowVorSteuernJahr1` | Cashflow | EUR/Jahr | Jahr 1 |
| `cashflowVorSteuernJahr1Monatlich` | Cashflow | EUR/Monat | Jahr 1 / 12 |
| `monatlicheZuzahlung` | Cashflow | EUR/Monat | `max(0, -cashflowVorSteuernJahr1Monatlich)` |
| `cashflowNachSteuernJahr1` | Cashflow | EUR/Jahr | nur wenn Steuer-Modul aktiv |
| `vermoegensaufbauProMonatJahr1` | Cashflow | EUR/Monat | Tilgung Jahr 1 / 12 |
| `dscr` | Risiko | Faktor | Jahresreinertrag / Kapitaldienst Jahr 1 |
| `eigenkapitalrenditeCashflow` | Rendite | % | Cashflow vor Steuern / Eigenkapital |
| `eigenkapitalrenditeMitTilgung` | Rendite | % | (Cashflow vor Steuern + Tilgung Jahr 1) / Eigenkapital |
| `breakEvenMieteProQmLiquiditaet` | Break-even | EUR/m²/Monat | mit Tilgung — Liquiditätssicht |
| `breakEvenMieteProQmWirtschaftlich` | Break-even | EUR/m²/Monat | nur Zinslast + Bewirtschaftung — Wirtschaftlichkeitssicht |
| `kaufpreisProQm` | Markt | EUR/m² | |
| `mieteProQm` | Markt | EUR/m²/Monat | |
| `instandhaltungProQm` | Markt | EUR/m²/Jahr | Plausibilitätscheck |
| `restschuldNachPhase1` | Finanzierung | EUR | aus Tilgungsplan |
| `restschuldNachPhase2` | Finanzierung | EUR | aus Tilgungsplan |
| `restschuldEndeBetrachtung` | Finanzierung | EUR | am Ende des Betrachtungszeitraums |
| `marktwertEndeBetrachtung` | Wertentwicklung | EUR | inkl. Sanierungs-Wertanrechnung |
| `vermoegensbilanzEnde` | Wertentwicklung | EUR | Marktwert Ende − Restschuld Ende |
| `steuerlasterJahr1` | Steuer (optional) | EUR/Jahr | nur wenn Steuer-Modul aktiv; kann negativ sein |

**Bewusst gestrichen** gegenüber dem Vorgängermodell, weil dort als problematisch identifiziert:

- `qmBruttorendite` — mathematisch identisch mit Bruttomietrendite, redundant.
- `sanierungskostenAmortisationPa` — Doppelzählung mit Gesamtkapitalbedarf.
- `breakEvenMieteAllIn` (mit Sanierungs-Amortisation) — gleiches Doppelzählungsproblem.
- `eigenkapitalrendite` (undefiniert in der alten Tabelle) — ersetzt durch zwei klar benannte Varianten.

### 4.4 TypeScript-Typen (verbindlich)

Wird in `domain/finance/types.ts` so definiert:

```ts
import Decimal from 'decimal.js-light';

export type Bundesland = 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE'
  | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type KaufnebenkostenModus = 'vereinfacht' | 'detailliert';
export type KostenModus = 'vereinfacht' | 'detailliert';
export type FinanzierterPosten = 'kaufpreis' | 'kaufnebenkosten' | 'sanierung';

export interface ImmoInputs {
  // Objekt
  kaufpreis: Decimal;
  wohnflaecheQm: Decimal;
  bundesland: Bundesland;

  // Kaufnebenkosten
  kaufnebenkostenModus: KaufnebenkostenModus;
  kaufnebenkostenSumme?: Decimal;
  grunderwerbsteuerSatz?: Decimal;
  notarGrundbuchSatz?: Decimal;
  maklerprovisionSatz?: Decimal;

  // Sanierung
  sanierungskostenSumme: Decimal;
  sanierungWertanrechnungSatz: Decimal;

  // Finanzierung
  eigenkapital: Decimal;
  finanziertePosten: Set<FinanzierterPosten>;
  phase1Jahre: number;
  phase1Sollzins: Decimal;
  phase1AnfTilgung: Decimal;
  phase1Sondertilgung: Decimal;
  phase2Jahre: number;
  phase2Sollzins?: Decimal;
  phase2AnfTilgung?: Decimal;
  phase2Sondertilgung: Decimal;
  phase3Sollzins: Decimal;
  phase3AnfTilgung: Decimal;
  phase3Sondertilgung: Decimal;
  tilgungsplanMaxJahre: number;

  // Miete
  monatsnettokaltmiete: Decimal;
  mietsteigerungSatz: Decimal;

  // Kosten
  kostenModus: KostenModus;
  nichtUmlagefaehigeKostenSumme?: Decimal;
  hausgeldNichtUmlagefaehigPa?: Decimal;
  verwaltungskostenPa?: Decimal;
  versicherungenPa?: Decimal;
  sonstigeKostenPa?: Decimal;
  instandhaltungskostenPa: Decimal;
  kostensteigerungSatz: Decimal;

  // Risiko
  leerstandsmonateProJahr: Decimal;
  erstvermietungsleerstandMonate: Decimal;
  mietausfallwagnisSatz: Decimal;

  // Steuer
  steuerModulAktiv: boolean;
  persoenlicherSteuersatz?: Decimal;
  gebaeudeanteilSatz?: Decimal;
  afaSatz?: Decimal;

  // Wertentwicklung
  betrachtungszeitraumJahre: number;
  wertsteigerungSatz: Decimal;
}

export interface AmortizationRow {
  jahr: number;                 // 1..n
  phase: 1 | 2 | 3;
  restschuldAnfang: Decimal;
  zinsAnteil: Decimal;
  tilgungAnteil: Decimal;
  sondertilgung: Decimal;
  kapitaldienst: Decimal;       // zinsAnteil + tilgungAnteil + sondertilgung
  restschuldEnde: Decimal;
}

export interface AmortizationPlan {
  rows: AmortizationRow[];
  volltilgungErreicht: boolean;
  volltilgungJahr?: number;
  abgeschnittenAnMaxJahren: boolean;
}

export interface YearlyCashflow {
  jahr: number;
  jahresnettokaltmiete: Decimal;
  effektiveJahresmiete: Decimal;
  bewirtschaftungskosten: Decimal;
  jahresreinertrag: Decimal;
  zinsAnteil: Decimal;
  tilgungAnteil: Decimal;
  kapitaldienst: Decimal;
  cashflowVorSteuern: Decimal;
  afa: Decimal;
  steuerlicherUeberschuss: Decimal;
  steuerlast: Decimal;            // 0 wenn Steuermodul inaktiv
  cashflowNachSteuern: Decimal;
}

export interface KPIMetadata {
  id: string;
  displayName: string;
  formel: string;          // als lesbarer String, z. B. "Jahresnettokaltmiete / Kaufpreis × 100"
  bedeutung: string;
  eingaben: string[];      // Liste der Input-IDs
  einheit: 'EUR' | 'EUR/Jahr' | 'EUR/Monat' | 'EUR/m²' | 'EUR/m²/Monat' | 'EUR/m²/Jahr' | '%' | 'Faktor' | 'Jahre';
  kategorie: 'Schnellsicht' | 'Cashflow' | 'Risiko' | 'Rendite' | 'Break-even' | 'Markt' | 'Finanzierung' | 'Wertentwicklung' | 'Steuer';
  format: 'currency' | 'percent' | 'factor' | 'integer' | 'qm';
  decimals: number;
}

export interface KPIValue {
  metadata: KPIMetadata;
  value: Decimal | null;     // null wenn nicht berechenbar (z. B. Steuer-KPI bei inaktivem Modul)
  warnings?: string[];
}

export interface ComputedResult {
  intermediates: {
    kaufnebenkostenSummeBerechnet: Decimal;
    gesamtkapitalbedarf: Decimal;
    fremdkapital: Decimal;
    jahresnettokaltmiete: Decimal;
    leerstandsquote: Decimal;
    effektiveJahresmiete: Decimal;
    nichtUmlagefaehigeKostenAggregiert: Decimal;
    bewirtschaftungskosten: Decimal;
    jahresreinertragJahr1: Decimal;
    afaJaehrlich: Decimal;
  };
  amortization: AmortizationPlan;
  cashflows: YearlyCashflow[];        // Länge = betrachtungszeitraumJahre
  kpis: Record<string, KPIValue>;
  marktwertReihe: { jahr: number; wert: Decimal }[];
  warnings: string[];
}
```

Diese Typen sind verbindlich. Zod-Schemas in `schemas/inputs.ts` werden parallel gepflegt und durch Tests gegen die Typen geprüft (`z.infer<typeof InputSchema>` muss `ImmoInputs` entsprechen).

## 5. Berechnungs-Engine

Die Engine ist ein reines TypeScript-Modul. Keine React-Imports, kein DOM, kein Fetch. Sie wird sowohl vom Frontend (Live-Berechnung) als auch vom PDF-Renderer importiert. Eingabe ist ein vollständiges `ImmoInputs`-Objekt, Ausgabe ein `ComputedResult`. Reihenfolge der Berechnung ist festgelegt — keine Rekursionen, keine Zyklen.

### 5.1 Top-Level

```ts
// domain/finance/engine.ts
export function compute(inputs: ImmoInputs): ComputedResult {
  const intermediates = computeIntermediates(inputs);
  const amortization = computeAmortizationPlan(inputs, intermediates.fremdkapital);
  const cashflows = computeYearlyCashflows(inputs, intermediates, amortization);
  const marktwertReihe = computeMarktwertReihe(inputs);
  const kpis = computeKPIs(inputs, intermediates, amortization, cashflows, marktwertReihe);
  const warnings = collectWarnings(inputs, intermediates, amortization);
  return { intermediates, amortization, cashflows, kpis, marktwertReihe, warnings };
}
```

### 5.2 Kaufnebenkosten

```ts
function computeKaufnebenkostenSumme(inputs: ImmoInputs): Decimal {
  if (inputs.kaufnebenkostenModus === 'vereinfacht') {
    return inputs.kaufnebenkostenSumme ?? new Decimal(0);
  }
  // detailliert
  const grew = inputs.kaufpreis.mul(inputs.grunderwerbsteuerSatz ?? 0);
  const notar = inputs.kaufpreis.mul(inputs.notarGrundbuchSatz ?? 0);
  const makler = inputs.kaufpreis.mul(inputs.maklerprovisionSatz ?? 0);
  return grew.plus(notar).plus(makler);
}
```

Anmerkung: Sätze sind auf den **Kaufpreis** bezogen, nicht auf den Gesamtkapitalbedarf. Das ist marktüblich.

### 5.3 Fremdkapital

```ts
function computeFremdkapital(inputs: ImmoInputs, kaufnebenkostenSumme: Decimal): Decimal {
  const finanzierungsbasis = new Decimal(0)
    .plus(inputs.finanziertePosten.has('kaufpreis') ? inputs.kaufpreis : 0)
    .plus(inputs.finanziertePosten.has('kaufnebenkosten') ? kaufnebenkostenSumme : 0)
    .plus(inputs.finanziertePosten.has('sanierung') ? inputs.sanierungskostenSumme : 0);
  const fk = finanzierungsbasis.minus(inputs.eigenkapital);
  return Decimal.max(fk, 0);
}
```

**Annahme**: Eigenkapital wird vorrangig auf die finanzierten Posten angerechnet. Wenn Eigenkapital > Finanzierungsbasis, ist Fremdkapital 0; überschüssiges Eigenkapital wird **nicht** automatisch auf nicht finanzierte Posten umgewidmet (das wäre eine UX-Falle). Stattdessen wird in `warnings` ein Hinweis ausgegeben: „Ihr Eigenkapital übersteigt die finanzierte Basis um X €. Sie finanzieren das Objekt vollständig aus Eigenmitteln."

### 5.4 Bewirtschaftung und Mieteinnahmen

```ts
function computeIntermediates(inputs: ImmoInputs): ComputedResult['intermediates'] {
  const kaufnebenkostenSummeBerechnet = computeKaufnebenkostenSumme(inputs);
  const gesamtkapitalbedarf = inputs.kaufpreis
    .plus(kaufnebenkostenSummeBerechnet)
    .plus(inputs.sanierungskostenSumme);
  const fremdkapital = computeFremdkapital(inputs, kaufnebenkostenSummeBerechnet);
  const jahresnettokaltmiete = inputs.monatsnettokaltmiete.mul(12);
  const leerstandsquote = inputs.leerstandsmonateProJahr.div(12);
  const effektiveJahresmiete = jahresnettokaltmiete
    .mul(new Decimal(1).minus(leerstandsquote))
    .mul(new Decimal(1).minus(inputs.mietausfallwagnisSatz));
  const nichtUmlagefaehigeKostenAggregiert =
    inputs.kostenModus === 'vereinfacht'
      ? (inputs.nichtUmlagefaehigeKostenSumme ?? new Decimal(0))
      : (inputs.hausgeldNichtUmlagefaehigPa ?? new Decimal(0))
          .plus(inputs.verwaltungskostenPa ?? 0)
          .plus(inputs.versicherungenPa ?? 0)
          .plus(inputs.sonstigeKostenPa ?? 0);
  const bewirtschaftungskosten = nichtUmlagefaehigeKostenAggregiert
    .plus(inputs.instandhaltungskostenPa);
  const jahresreinertragJahr1 = effektiveJahresmiete.minus(bewirtschaftungskosten);
  const afaBemessungswert = inputs.steuerModulAktiv
    ? inputs.kaufpreis.mul(inputs.gebaeudeanteilSatz ?? 0)
    : new Decimal(0);
  const afaJaehrlich = inputs.steuerModulAktiv
    ? afaBemessungswert.mul(inputs.afaSatz ?? 0)
    : new Decimal(0);

  return {
    kaufnebenkostenSummeBerechnet,
    gesamtkapitalbedarf,
    fremdkapital,
    jahresnettokaltmiete,
    leerstandsquote,
    effektiveJahresmiete,
    nichtUmlagefaehigeKostenAggregiert,
    bewirtschaftungskosten,
    jahresreinertragJahr1,
    afaJaehrlich,
  };
}
```

**Anmerkung Erstvermietungsleerstand**: wirkt nur in Jahr 1 zusätzlich. Wird in `computeYearlyCashflows` für Jahr 1 verrechnet, **nicht** in `effektiveJahresmiete` der Intermediates (sonst würde Jahr 2+ falsch). Siehe 5.6.

### 5.5 Tilgungsplan-Algorithmus (zentral)

Verbindlich: jahresgenaue Auflösung, intern monatsgenau gerechnet. Die Annuität ist innerhalb einer Phase konstant; sie wird zu Beginn jeder Phase aus der dann gültigen Restschuld, dem Phasenzins und dem anfänglichen Tilgungssatz **dieser Phase** neu berechnet. Sondertilgung wird einmal jährlich am Jahresende abgezogen, **nach** Berechnung des Zins-/Tilgungsanteils.

#### 5.5.1 Berechnungslogik pro Phase

Für jede Phase `p` mit Beginn-Restschuld `R_p`, Sollzins `i_p` (Dezimal, p. a.), anfänglichem Tilgungssatz `t_p`:

- **Annuität pro Jahr**: `A_p = R_p × (i_p + t_p)`
- **Annuität pro Monat**: `a_p = A_p / 12`
- **Monatszins**: `i_m = i_p / 12`

Pro Monat innerhalb der Phase:
- Zinsanteil_Monat = Restschuld_Monat × i_m
- Tilgungsanteil_Monat = a_p − Zinsanteil_Monat
- Restschuld_neu = Restschuld_Monat − Tilgungsanteil_Monat

Zwölf Monate aggregieren → Jahreszeile. **Sondertilgung** wird einmal am Jahresende von der Restschuld abgezogen (separate Spalte). Wenn Sondertilgung > Restschuld am Jahresende, wird sie auf die Restschuld gekappt; der Überschuss wird **verworfen**, nicht in das nächste Jahr getragen.

#### 5.5.2 Phasenwechsel

Beim Übergang von Phase 1 → 2: Restschuld am Ende des letzten Phase-1-Jahres wird `R_2`. Annuität wird neu berechnet mit `i_2`, `t_2`. Analog Phase 2 → 3.

Falls `phase2Jahre = 0`, wird Phase 2 übersprungen, Phase 3 beginnt direkt nach Phase 1.

#### 5.5.3 Volltilgung und Abbruchbedingungen

Phase 3 läuft, bis entweder:
- Restschuld ≤ 0 erreicht ist → Volltilgung. Letzte Jahreszeile wird auf den genauen Volltilgungspunkt korrigiert (Tilgung im letzten Jahr = Restschuld zu Jahresbeginn + Restzinsen). `volltilgungErreicht = true`, `volltilgungJahr` gesetzt.
- `tilgungsplanMaxJahre` erreicht ist → Abbruch. `volltilgungErreicht = false`, `abgeschnittenAnMaxJahren = true`. Warning: „Bei den gewählten Konditionen wird das Darlehen innerhalb von X Jahren nicht vollständig getilgt."

#### 5.5.4 Sonderfall Fremdkapital = 0

Wenn `fremdkapital = 0`: leerer Plan, keine Zeilen, keine Warnings, alle Cashflow-Zinsen und -Tilgungen sind 0.

#### 5.5.5 Pseudocode

```ts
function computeAmortizationPlan(inputs: ImmoInputs, fremdkapital: Decimal): AmortizationPlan {
  if (fremdkapital.lte(0)) {
    return { rows: [], volltilgungErreicht: true, volltilgungJahr: 0, abgeschnittenAnMaxJahren: false };
  }

  const phases = [
    { phase: 1 as const, jahre: inputs.phase1Jahre, zins: inputs.phase1Sollzins, anfTilgung: inputs.phase1AnfTilgung, sondertilgung: inputs.phase1Sondertilgung },
    ...(inputs.phase2Jahre > 0 ? [{ phase: 2 as const, jahre: inputs.phase2Jahre, zins: inputs.phase2Sollzins!, anfTilgung: inputs.phase2AnfTilgung!, sondertilgung: inputs.phase2Sondertilgung }] : []),
    { phase: 3 as const, jahre: Infinity, zins: inputs.phase3Sollzins, anfTilgung: inputs.phase3AnfTilgung, sondertilgung: inputs.phase3Sondertilgung },
  ];

  const rows: AmortizationRow[] = [];
  let restschuld = fremdkapital;
  let jahr = 0;

  for (const phase of phases) {
    if (restschuld.lte(0)) break;
    const annuitaetJahr = restschuld.mul(phase.zins.plus(phase.anfTilgung));
    const annuitaetMonat = annuitaetJahr.div(12);
    const zinsMonat = phase.zins.div(12);

    for (let phasenJahr = 0; phasenJahr < phase.jahre; phasenJahr++) {
      if (restschuld.lte(0)) break;
      if (jahr >= inputs.tilgungsplanMaxJahre) break;
      jahr++;
      const restschuldAnfang = restschuld;
      let zinsSummeJahr = new Decimal(0);
      let tilgungSummeJahr = new Decimal(0);
      let r = restschuld;

      for (let m = 0; m < 12; m++) {
        if (r.lte(0)) break;
        const zinsM = r.mul(zinsMonat);
        let tilgungM = annuitaetMonat.minus(zinsM);
        if (tilgungM.gt(r)) tilgungM = r; // Volltilgung im Monat
        zinsSummeJahr = zinsSummeJahr.plus(zinsM);
        tilgungSummeJahr = tilgungSummeJahr.plus(tilgungM);
        r = r.minus(tilgungM);
      }

      // Sondertilgung am Jahresende
      let sondertilgung = phase.sondertilgung;
      if (sondertilgung.gt(r)) sondertilgung = r;
      r = r.minus(sondertilgung);

      rows.push({
        jahr,
        phase: phase.phase,
        restschuldAnfang,
        zinsAnteil: zinsSummeJahr,
        tilgungAnteil: tilgungSummeJahr,
        sondertilgung,
        kapitaldienst: zinsSummeJahr.plus(tilgungSummeJahr).plus(sondertilgung),
        restschuldEnde: r,
      });
      restschuld = r;
    }
  }

  const volltilgungErreicht = restschuld.lte(0);
  return {
    rows,
    volltilgungErreicht,
    volltilgungJahr: volltilgungErreicht ? jahr : undefined,
    abgeschnittenAnMaxJahren: !volltilgungErreicht && jahr >= inputs.tilgungsplanMaxJahre,
  };
}
```

### 5.6 Mehrjahres-Cashflow

Pro Jahr `t = 1..betrachtungszeitraumJahre`:

- `jahresnettokaltmiete_t = monatsnettokaltmiete × 12 × (1 + mietsteigerungSatz)^(t−1)`
- `effektivLeerstandsquote_t`:
  - `t = 1`: `(leerstandsmonateProJahr + erstvermietungsleerstandMonate) / 12`, gekappt bei `1`
  - `t > 1`: `leerstandsmonateProJahr / 12`
- `effektiveJahresmiete_t = jahresnettokaltmiete_t × (1 − effektivLeerstandsquote_t) × (1 − mietausfallwagnisSatz)`
- `bewirtschaftungskosten_t = bewirtschaftungskosten_basis × (1 + kostensteigerungSatz)^(t−1)`
- `jahresreinertrag_t = effektiveJahresmiete_t − bewirtschaftungskosten_t`
- `zinsAnteil_t`, `tilgungAnteil_t`, `kapitaldienst_t`: aus `amortization.rows[t−1]` (oder 0, falls `t > rows.length`, also nach Volltilgung)
- `cashflowVorSteuern_t = jahresreinertrag_t − kapitaldienst_t`
- `afa_t`: konstant `afaJaehrlich`, falls Steuermodul aktiv und solange `t ≤ Nutzungsdauer`. Vereinfachung: AfA läuft für die gesamte Betrachtungsdauer durch (kein Auslaufen modelliert; das ist im Schmal-Modul gewollt).
- `steuerlicherUeberschuss_t = jahresreinertrag_t − zinsAnteil_t − afa_t`
- `steuerlast_t = steuerlicherUeberschuss_t × persoenlicherSteuersatz` (kann negativ sein → Verlust mindert die Steuerlast aus anderen Einkünften; vereinfachte Annahme der Verrechenbarkeit)
- `cashflowNachSteuern_t = cashflowVorSteuern_t − steuerlast_t`

Wenn Steuermodul inaktiv: `afa_t = 0`, `steuerlicherUeberschuss_t = 0`, `steuerlast_t = 0`, `cashflowNachSteuern_t = cashflowVorSteuern_t`.

### 5.7 Steuermodul (vereinfacht)

```ts
function computeAfaJaehrlich(inputs: ImmoInputs): Decimal {
  if (!inputs.steuerModulAktiv) return new Decimal(0);
  const bemessung = inputs.kaufpreis.mul(inputs.gebaeudeanteilSatz!);
  return bemessung.mul(inputs.afaSatz!);
}
```

Bewusst nicht enthalten:
- 15-%-Grenze für anschaffungsnahen Aufwand (§6 Abs. 1 Nr. 1a EStG)
- Verteilung Erhaltungsaufwand auf 2–5 Jahre nach §82b EStDV
- Solidaritätszuschlag, Kirchensteuer
- Spekulationssteuer
- Sonstige Werbungskosten (Fahrt, Steuerberater)

Hinweis im UI neben dem Steuer-Toggle: „Vereinfachte Schätzung. Ersetzt keine Steuerberatung."

### 5.8 Steuerliche Behandlung der Sanierung

Die App verteilt Sanierungskosten **nicht** steuerlich. Die `afaSatz`-Eingabe bezieht sich ausschließlich auf den Gebäudeanteil des Kaufpreises. Wenn der Anwender die Sanierung steuerlich realistisch erfassen will, muss er sie außerhalb der App betrachten oder den `afaBemessungswert` durch Eingabe eines höheren `gebaeudeanteilSatz` indirekt anheben. Diese Vereinfachung wird in der UI klar benannt.

### 5.9 Wertentwicklung

```ts
function computeMarktwertReihe(inputs: ImmoInputs): { jahr: number; wert: Decimal }[] {
  const startwert = inputs.kaufpreis
    .plus(inputs.sanierungskostenSumme.mul(inputs.sanierungWertanrechnungSatz));
  const reihe = [];
  for (let t = 0; t <= inputs.betrachtungszeitraumJahre; t++) {
    const faktor = new Decimal(1).plus(inputs.wertsteigerungSatz).pow(t);
    reihe.push({ jahr: t, wert: startwert.mul(faktor) });
  }
  return reihe;
}
```

`marktwertEnde` = `reihe[betrachtungszeitraumJahre].wert`.
`vermoegensbilanzEnde` = `marktwertEnde − restschuldEnde`.

### 5.10 KPI-Formeln

In `domain/finance/kpis.ts` werden alle KPIs nach diesem Muster berechnet:

```ts
export function bruttomietrendite(i: ImmoInputs, x: Intermediates): Decimal {
  return x.jahresnettokaltmiete.div(i.kaufpreis).mul(100);
}

export function nettomietrendite(i: ImmoInputs, x: Intermediates): Decimal {
  return x.jahresreinertragJahr1.div(x.gesamtkapitalbedarf).mul(100);
}

export function kaufpreisfaktor(i: ImmoInputs, x: Intermediates): Decimal {
  return i.kaufpreis.div(x.jahresnettokaltmiete);
}

export function kaufpreisfaktorAllIn(i: ImmoInputs, x: Intermediates): Decimal {
  return x.gesamtkapitalbedarf.div(x.jahresnettokaltmiete);
}

export function dscr(_: ImmoInputs, x: Intermediates, plan: AmortizationPlan): Decimal | null {
  const kapitaldienstJahr1 = plan.rows[0]?.kapitaldienst;
  if (!kapitaldienstJahr1 || kapitaldienstJahr1.lte(0)) return null;
  return x.jahresreinertragJahr1.div(kapitaldienstJahr1);
}

export function cashflowVorSteuernJahr1(cashflows: YearlyCashflow[]): Decimal {
  return cashflows[0].cashflowVorSteuern;
}

export function eigenkapitalrenditeCashflow(i: ImmoInputs, cashflows: YearlyCashflow[]): Decimal | null {
  if (i.eigenkapital.lte(0)) return null;
  return cashflows[0].cashflowVorSteuern.div(i.eigenkapital).mul(100);
}

export function eigenkapitalrenditeMitTilgung(i: ImmoInputs, cashflows: YearlyCashflow[]): Decimal | null {
  if (i.eigenkapital.lte(0)) return null;
  return cashflows[0].cashflowVorSteuern.plus(cashflows[0].tilgungAnteil)
    .div(i.eigenkapital).mul(100);
}

export function breakEvenMieteProQmLiquiditaet(i: ImmoInputs, x: Intermediates, plan: AmortizationPlan): Decimal {
  const kapitaldienstJahr1 = plan.rows[0]?.kapitaldienst ?? new Decimal(0);
  const summe = x.bewirtschaftungskosten.plus(kapitaldienstJahr1);
  const nenner = i.wohnflaecheQm.mul(12).mul(new Decimal(1).minus(x.leerstandsquote));
  return summe.div(nenner);
}

export function breakEvenMieteProQmWirtschaftlich(i: ImmoInputs, x: Intermediates, plan: AmortizationPlan): Decimal {
  const zinsJahr1 = plan.rows[0]?.zinsAnteil ?? new Decimal(0);
  const summe = x.bewirtschaftungskosten.plus(zinsJahr1);
  const nenner = i.wohnflaecheQm.mul(12).mul(new Decimal(1).minus(x.leerstandsquote));
  return summe.div(nenner);
}

export function vermoegensbilanzEnde(plan: AmortizationPlan, marktwertReihe: {jahr: number; wert: Decimal}[], betrachtungJahre: number): Decimal {
  const marktwert = marktwertReihe[betrachtungJahre].wert;
  const restschuld = plan.rows[Math.min(betrachtungJahre, plan.rows.length) - 1]?.restschuldEnde
    ?? new Decimal(0);
  return marktwert.minus(restschuld);
}
```

(Die übrigen KPIs analog. Vollständige Implementierung im Modul; jede Funktion ist eine eigene exportierte Funktion mit einer klaren Verantwortung. Tests pro Funktion.)

### 5.11 Warnings

`collectWarnings` produziert eine Liste von Warnhinweisen, die im UI als Banner angezeigt werden:

- DSCR < 1: „Die Mieteinnahmen decken den Kapitaldienst im ersten Jahr nicht."
- DSCR < 1,2: „Geringer Sicherheitsabstand bei der Bedienung des Kapitaldienstes."
- Cashflow vor Steuern Jahr 1 < 0: „Sie zahlen monatlich X € zu."
- Eigenkapital > Finanzierungsbasis: siehe 5.3.
- `abgeschnittenAnMaxJahren`: siehe 5.5.3.
- Instandhaltung pro m²/Jahr außerhalb 5–25 €: „Plausibilitätshinweis: Übliche Spanne 7–15 €/m²/Jahr."
- Kaufpreisfaktor > 35: „Sehr hoher Kaufpreisfaktor."
- Wertsteigerung > 4 % p. a.: „Wertsteigerungsannahme ist optimistisch."
- Mietsteigerung > 3 % p. a.: „Mietsteigerung über üblichem Mittel."

### 5.12 Engine-Konsistenzregeln (verbindlich)

- `compute()` ist **deterministisch und seiteneffektfrei**. Gleiche Inputs → gleiche Outputs.
- Engine wirft **keine Exceptions** für Eingabefehler. Validierung passiert vorher (Zod im UI). Wenn ein KPI nicht berechenbar ist (z. B. Division durch null), wird `value: null` zurückgegeben mit `warnings: [...]`.
- Engine importiert **keine** Module außerhalb von `domain/finance/`. Insbesondere kein React, kein Browser-API, kein `Intl`.
- Tests prüfen Engine als Black Box gegen ein Set von Fixtures (siehe Anhang 13.1).

## 6. UI-Architektur

### 6.1 Layout

Eine Hauptseite (`DashboardPage`). Zweispaltiges Layout im Desktop, einspaltig im Mobile (responsiv ab Breakpoint `--bp-md: 768px`).

```
┌──────────────────────────────────────────────────────────┐
│ Header (Logo, Aktionen: Speichern → Share-Link, PDF)      │
├──────────────────────────────────────┬───────────────────┤
│ Eingaben (klappbare Sektionen)       │ KPI-Board (sticky)│
│  ▸ Objekt                            │  Schnellsicht     │
│  ▸ Kaufnebenkosten                   │  Cashflow         │
│  ▸ Sanierung                         │  Risiko           │
│  ▸ Finanzierung                      │  Rendite          │
│  ▸ Mieteinnahmen                     │  Break-even       │
│  ▸ Laufende Kosten                   │  Wertentwicklung  │
│  ▸ Leerstand und Risiko              │  Steuer (optional)│
│  ▸ Steuern (Toggle)                  │                   │
│  ▸ Wertentwicklung und Mehrjahressicht                   │
├──────────────────────────────────────┴───────────────────┤
│ Tilgungsplan (Tabelle + Chart)                            │
├──────────────────────────────────────────────────────────┤
│ Cashflow-Verlauf (Chart über Betrachtungszeitraum)        │
├──────────────────────────────────────────────────────────┤
│ Wertentwicklung (Chart Marktwert vs. Restschuld)          │
└──────────────────────────────────────────────────────────┘
```

Mobile: Eingaben-Spalte oben, KPI-Board einklappbar (Toggle „Kennzahlen anzeigen"), Charts darunter.

### 6.2 Klappbare Sektionen

Komponente `<Section title="..." defaultOpen={true|false}>`. Jede Sektion merkt ihren Aufklapp-Zustand pro Browser in LocalStorage (z. B. `section.objekt.open`). Inputs in geschlossenen Sektionen werden weiterhin validiert und in die Berechnung einbezogen.

Defaults für Aufklapp-Zustand bei einer leeren Berechnung:
- Objekt, Kaufnebenkosten, Finanzierung, Mieteinnahmen, Laufende Kosten, Leerstand: **offen**
- Sanierung, Wertentwicklung: **offen**
- Steuern: **geschlossen**, mit Toggle-Indikator „aktiv/inaktiv" am Header

### 6.3 KPI-Board

Karten in Gruppen, jede Karte zeigt:
- KPI-Name (display)
- Wert formatiert
- kleines Info-Icon → öffnet Tooltip oder Modal mit `metadata.formel`, `metadata.bedeutung`, `metadata.eingaben`
- Farbliche Statuskennzeichnung bei DSCR, Cashflow Jahr 1, Vermögensbilanz (rot/gelb/grün) — Schwellen identisch zu `collectWarnings`

Reihenfolge der Gruppen: Schnellsicht → Cashflow → Risiko → Rendite → Break-even → Markt → Finanzierung → Wertentwicklung → Steuer.

### 6.4 Tooltips und Erklärbarkeit (Pflicht)

Jede KPI-Karte und jedes Eingabefeld hat ein Info-Icon. Beim Hover/Tap erscheint:
- Eingabefelder: Definition, übliche Spanne, BW-Hinweis falls relevant.
- KPIs: `metadata.formel` (1:1 wie hinterlegt), `metadata.bedeutung`, Liste der `eingaben`.

Alle Texte zentral in `i18n/de.ts`. Niemals inline.

### 6.5 Charts

Verbindlich:

- **Tilgungsplan-Chart**: gestapelte Bars pro Jahr (Zinsanteil unten, Tilgungsanteil oben, Sondertilgung als separater Layer in anderer Farbe). X-Achse: Jahr. Y-Achse: EUR. Linie überlagert: Restschuld am Jahresende.
- **Cashflow-Verlauf**: Liniendiagramm. Linien für Cashflow vor Steuern, Cashflow nach Steuern (wenn aktiv), Vermögensaufbau (Tilgung) als zweite Linie. X: Jahr 1..n.
- **Wertentwicklung**: zwei Linien — Marktwert und Restschuld — über Betrachtungszeitraum. Vermögensbilanz als Fläche dazwischen optional.

Recharts mit deutscher Locale-Achsenformatierung (`Intl.NumberFormat`).

### 6.6 Tilgungsplan-Tabelle

Pro Jahr eine Zeile. Spalten: Jahr, Phase, Restschuld Anfang, Zinsanteil, Tilgungsanteil, Sondertilgung, Kapitaldienst, Restschuld Ende. Sortierbar nicht nötig. Sticky Header. Zeilen am Phasenwechsel optisch hervorgehoben (linker Border in Akzentfarbe).

### 6.7 Aktionen im Header

- **Speichern und Share-Link erzeugen** → POST an Backend, erhält `shareId`, schreibt `shareId` in lokale Liste, kopiert Link in Zwischenablage, Toast „Link kopiert".
- **Neue Berechnung** → setzt Inputs auf Defaults zurück (mit Bestätigungsdialog).
- **Meine gespeicherten Berechnungen** (Dropdown) → zeigt lokale `shareId`-Liste mit kurzen Labels (frei eintragbar). Klick lädt die Berechnung.
- **PDF-Export** → Dropdown: „Kennzahlen-Report" / „Kennzahlen + Tilgungsplan".
- **JSON-Export / -Import** (klein, im Footer oder Untermenü).

### 6.8 Designsystem-Tokens

In `src/styles/tokens.css`:

```css
:root {
  /* Farben — Basis */
  --color-bg: #ffffff;
  --color-bg-muted: #f7f8fa;
  --color-surface: #ffffff;
  --color-border: #e3e6eb;
  --color-text: #1a1f2b;
  --color-text-muted: #5a6473;

  /* Farben — Akzente */
  --color-primary: #1f5fbf;
  --color-primary-hover: #1a4f9f;
  --color-primary-soft: #e8f0fb;

  /* Farben — Status */
  --color-success: #2d7d46;
  --color-warning: #c08000;
  --color-danger: #b3261e;

  /* Typografie */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, monospace;
  --fs-xs: 0.75rem;
  --fs-sm: 0.875rem;
  --fs-base: 1rem;
  --fs-lg: 1.125rem;
  --fs-xl: 1.5rem;
  --fs-2xl: 2rem;

  /* Spacing */
  --sp-1: 0.25rem; --sp-2: 0.5rem; --sp-3: 0.75rem;
  --sp-4: 1rem;    --sp-5: 1.5rem; --sp-6: 2rem; --sp-8: 3rem;

  /* Radii */
  --r-sm: 0.25rem; --r-md: 0.5rem; --r-lg: 0.75rem;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);

  /* Breakpoints (für Container-Queries / JS) */
  --bp-md: 768px;
  --bp-lg: 1100px;
}
```

Alle Komponenten konsumieren ausschließlich diese Variablen. Keine Hex-Codes inline. Tokens-Erweiterungen werden nur in `tokens.css` ergänzt.

### 6.9 Komponenten-Library

In `components/ui/`. Pflichtkomponenten:

- `<NumberInput />`: generischer numerischer Input mit deutscher Eingabe (Komma als Dezimaltrenner, Punkt als Tausendertrenner). Bietet `min`, `max`, `step`, `decimals`, `unit`, `align="right"`. Kontrolliert über RHF.
- `<CurrencyInput />`: spezialisiert auf EUR. 2 Nachkommastellen, Suffix `€`, rechtsbündig.
- `<PercentInput />`: zeigt `4` für 4 %, intern wird im Schema in `0.04` umgerechnet (Zod-Transform). Suffix `%`. Max 2 Nachkommastellen.
- `<IntegerInput />`: für Jahre, Monate.
- `<Section title open onToggle>`: klappbar.
- `<KPICard label value unit info status>`: standardisiert. `status: 'neutral' | 'success' | 'warning' | 'danger'`.
- `<Tooltip />` und `<InfoIcon />`: barrierefrei (ARIA), Hover und Tastatur fokussierbar.
- `<Button variant>`: `primary | secondary | ghost | danger`.
- `<Toggle />`: für boolesche Felder.
- `<Tabs />`: für Untergliederung in Sektionen wie Kaufnebenkosten/Kosten (vereinfacht/detailliert).

### 6.10 Tone of Voice in UI-Texten

- Du-Form? Nein, **Sie-Form** im gesamten UI. Konsistent.
- Sachlich, präzise, ohne Marketing-Ton.
- KPI-Erklärungen beginnen mit der **Bedeutung**, dann **Formel**, dann ggf. **typischer Spanne**.
- Warnungen sachlich formulieren („Der Cashflow ist negativ. Sie zahlen monatlich 250 € zu.") — nicht alarmistisch.

---

## 7. Forms und Validierung

### 7.1 Zod-Schemas

In `schemas/inputs.ts` wird parallel zu `domain/finance/types.ts` ein vollständiges Zod-Schema gepflegt. Verbindliches Muster:

```ts
import { z } from 'zod';
import Decimal from 'decimal.js-light';

const decimalString = z
  .string()
  .min(1, 'Pflichtfeld')
  .transform((s) => new Decimal(s.replace(',', '.')))
  .refine((d) => d.isFinite(), 'Keine gültige Zahl');

const percentInput = z
  .string()
  .transform((s) => new Decimal(s.replace(',', '.')).div(100))
  .refine((d) => d.gte(0) && d.lte(1), 'Wert außerhalb 0–100 %');

export const InputsSchema = z.object({
  kaufpreis: decimalString.refine((d) => d.gt(0), 'Muss > 0 sein'),
  wohnflaecheQm: decimalString.refine((d) => d.gt(0)),
  bundesland: z.enum(['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH']),
  // ...
})
.superRefine((data, ctx) => {
  // Cross-Field-Regeln
  if (data.kaufnebenkostenModus === 'vereinfacht' && !data.kaufnebenkostenSumme) {
    ctx.addIssue({ code: 'custom', path: ['kaufnebenkostenSumme'], message: 'Pflichtfeld im vereinfachten Modus' });
  }
  if (data.kaufnebenkostenModus === 'detailliert' && (data.grunderwerbsteuerSatz === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['grunderwerbsteuerSatz'], message: 'Pflichtfeld im detaillierten Modus' });
  }
  if (data.phase2Jahre > 0 && (data.phase2Sollzins === undefined || data.phase2AnfTilgung === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['phase2Sollzins'], message: 'Pflichtfeld bei aktiver Phase 2' });
  }
  if (data.steuerModulAktiv && (data.persoenlicherSteuersatz === undefined
    || data.gebaeudeanteilSatz === undefined || data.afaSatz === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['persoenlicherSteuersatz'], message: 'Pflichtfeld bei aktivem Steuermodul' });
  }
});

export type InputsSchemaType = z.infer<typeof InputsSchema>;
```

**Test in CI**: Type-Equality-Test prüft, dass `InputsSchemaType` mit `ImmoInputs` strukturell übereinstimmt. Drift wird gefangen.

### 7.2 React Hook Form Integration

```ts
const form = useForm<InputsFormValues>({
  resolver: zodResolver(InputsSchema),
  defaultValues: defaultsBW,
  mode: 'onChange',
});
```

- `mode: 'onChange'` für Live-Validierung.
- Pro Feld in `<NumberInput {...form.register(...)} />`.
- Bei Validität wird `inputs` an den Zustand-Store übergeben (siehe 8.4).
- Inputs werden im Store **nur als gültige Werte** abgelegt. Solange ein Feld invalid ist, behält der Store den letzten gültigen Wert; KPIs bleiben konsistent.

### 7.3 Inline-Fehleranzeige

Pro Input:
- Bei Fehler: roter Border, Fehlertext unter dem Feld in `--color-danger`.
- Bei kontrollierbaren Hinweisen (z. B. „außerhalb üblicher Spanne"): gelber Hinweis in `--color-warning`, **keine** Blockade der Berechnung.

### 7.4 Defaults-Behandlung

Beim Anlegen einer neuen Berechnung werden Defaults aus `domain/finance/defaults.ts` geladen. Beim Wechsel `bundesland` wird `grunderwerbsteuerSatz` automatisch auf den Bundesland-Default gesetzt, **außer** der Nutzer hat den Wert manuell überschrieben (Detection: dirty-Flag pro Feld).

---

## 8. State-Management

### 8.1 Stores

Zwei Stores in `src/state/`:

- `useImmoStore`: Domain-Inputs, abgeleitete Werte (Selectors), Aktionen (`setInputs`, `resetToDefaults`, `loadFromShareLink`).
- `useUiStore`: UI-Zustand (Section-Open-Status, gespeicherte Share-IDs, aktiver KPI-Filter, Theme, Banner-Sichtbarkeit). Persistiert via `zustand/middleware/persist` in LocalStorage.

### 8.2 Beispielaufbau `useImmoStore`

```ts
import { create } from 'zustand';
import { compute } from '@/domain/finance';

type State = {
  inputs: ImmoInputs;
  result: ComputedResult;
  setInputs: (next: ImmoInputs) => void;
  loadFromShareLink: (data: SerializedInputs) => void;
  resetToDefaults: () => void;
};

export const useImmoStore = create<State>((set) => ({
  inputs: defaultsBW,
  result: compute(defaultsBW),
  setInputs: (next) => set({ inputs: next, result: compute(next) }),
  loadFromShareLink: (data) => {
    const inputs = deserialize(data);
    set({ inputs, result: compute(inputs) });
  },
  resetToDefaults: () => set({ inputs: defaultsBW, result: compute(defaultsBW) }),
}));
```

### 8.3 Memoization-Strategie

`compute()` ist nicht so teuer, dass Memoization über die Eingaben hinaus nötig wäre. Wichtig:
- KPI-Komponenten lesen über Selectors **nur** die KPIs, die sie anzeigen (`useImmoStore((s) => s.result.kpis.dscr)`), damit nicht jede Karte bei jeder Eingabe neu rendert.
- Charts lesen `result.amortization.rows`, `result.cashflows`, `result.marktwertReihe` einzeln.

### 8.4 Schreibpfad UI → Store

```
RHF onChange → Zod-Validierung → bei Erfolg: deserialize → store.setInputs(next)
```

Der RHF-Form-State und der Store sind nicht doppelt-Source-of-truth. RHF hält die Eingabe-Strings (mit Komma etc.), der Store hält die geprüften Decimals. Synchronisation einseitig: RHF → Store.

### 8.5 Auto-Save in LocalStorage

```ts
import { persist } from 'zustand/middleware';
// In useUiStore: gespeicherte Share-IDs, Section-Status
// In useImmoStore: serialisierte Inputs als "letzter Stand"
```

Debounce 300 ms beim Schreiben des `letzter Stand`-Snapshots. Beim Laden der App wird zuerst geprüft: Falls URL eine `shareId` enthält → Server. Sonst → LocalStorage (wenn vorhanden) → sonst Defaults.



## 9. Persistenz und Share-Links

### 9.1 Speicher-Modell

- **Server (Postgres)**: persistente Speicherung jeder bewusst gespeicherten Berechnung, eindeutig adressierbar über `shareId`. Keine Auth, kein User-Bezug. Wer den Link hat, sieht die Berechnung.
- **Browser (LocalStorage)**: Auto-Save des aktuellen, ggf. unfertigen Stands; lokale Liste der vom Browser erzeugten `shareId`s mit kleinen Metadaten (Label, Datum, Kaufpreis).

### 9.2 Share-ID

- Generierung serverseitig.
- Kollisionssicher: 16 Zeichen aus `[a-z0-9]`, ergibt > 7 × 10²⁴ Möglichkeiten. Bei Kollision (extrem unwahrscheinlich, aber in Code abfangen): erneut generieren.
- Nicht erratbar (nicht sequenziell). `nanoid` (length 16, custom alphabet) eignet sich.
- Beispiel-URL: `https://app.example.de/s/h7d3kqz9x2v1m4p0`.

### 9.3 Datenbankschema (neu, kein Migrationspfad)

```sql
-- backend/src/db/schema.sql
CREATE TABLE calculations (
  share_id        TEXT PRIMARY KEY,
  schema_version  INTEGER NOT NULL,    -- für künftige Schema-Migrationen
  inputs          JSONB NOT NULL,      -- serialisierte ImmoInputs
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calculations_created_at ON calculations(created_at);
```

- `inputs` wird als JSON gespeichert. Decimal-Felder als String serialisiert (nicht number, um Präzision zu erhalten).
- `schema_version`: integer, startet bei `1`. Bei jedem Breaking-Change am Schema wird inkrementiert.
- `last_accessed` wird bei jedem GET aktualisiert (für ein optionales späteres Cleanup-Job).

### 9.4 Serialisierung

In `domain/finance/serialization.ts`:

```ts
export function serialize(inputs: ImmoInputs): SerializedInputs { /* Decimal → String */ }
export function deserialize(s: SerializedInputs): ImmoInputs { /* String → Decimal */ }
```

`SerializedInputs` ist die Nicht-Decimal-Version (Strings statt Decimal). Test: `deserialize(serialize(x))` ist gleich `x` (Decimal-Equality).

### 9.5 Backend-API

Drei Endpoints in `backend/src/routes/calculations.ts`:

#### `POST /api/calculations`

- **Body**: `{ inputs: SerializedInputs }`.
- **Verhalten**:
  1. Validiere `inputs` gegen das gleiche Zod-Schema wie das Frontend (Schema wird im Backend wiederverwendet — als shared package oder per Symlink, siehe 9.7).
  2. Bei Fehler: HTTP 400 mit `{ errors: [...] }`.
  3. Bei Erfolg: erzeuge `shareId`, schreibe Zeile, antworte `{ shareId, schemaVersion }`.
- **Rate Limiting**: 10 Requests pro IP pro Minute. Schutz gegen Spam.

#### `GET /api/calculations/:shareId`

- Lädt die Zeile.
- Aktualisiert `last_accessed`.
- Antwortet `{ shareId, schemaVersion, inputs }`.
- Bei `schemaVersion` < aktuell: antwortet trotzdem mit den Daten und einem Hinweis-Header `X-Schema-Outdated: true`. Frontend zeigt Banner: „Diese Berechnung stammt aus einer älteren Version. Werte sind eingeschränkt vergleichbar."
- 404 wenn nicht gefunden.

#### `DELETE /api/calculations/:shareId`

- Entfernt die Zeile.
- Niemand kann fremde IDs „entdecken", aber jeder mit Link kann löschen. Im UI: Bestätigungsdialog plus Hinweis, dass das Löschen für alle gilt, die den Link haben.
- 204 bei Erfolg, 404 bei Nicht-Existenz.

### 9.6 Frontend-Aufrufe

In `src/api/shareLinks.ts` über TanStack Query:

```ts
export function useSaveCalculation() {
  return useMutation({
    mutationFn: async (inputs: ImmoInputs) => {
      const res = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: serialize(inputs) }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      return res.json() as Promise<{ shareId: string; schemaVersion: number }>;
    },
  });
}

export function useLoadCalculation(shareId: string) {
  return useQuery({
    queryKey: ['calculation', shareId],
    queryFn: async () => { /* ... */ },
    enabled: !!shareId,
    staleTime: Infinity,
  });
}
```

### 9.7 Schema-Wiederverwendung Frontend ↔ Backend

Das Zod-Schema wird in **einer** Datei gepflegt. Da kein pnpm-Workspace eingesetzt wird:

- **Pragmatischer Pfad**: Datei `schemas/inputs.ts` wird beim Build des Backends per Build-Step kopiert oder per relativem Import eingebunden, sofern Repository-Layout es erlaubt (`backend/src/schemas → ../../frontend/src/schemas`). Coding-Agent wählt die saubere Variante.
- **Fallback**: Schema serverseitig duplizieren, Test in CI prüft Diff (z. B. `diff frontend/src/schemas/inputs.ts backend/src/schemas/inputs.ts == 0`).

Quelle der Wahrheit ist die Frontend-Datei.

### 9.8 Lokale Share-ID-Liste

In `useUiStore`:

```ts
type SavedCalcEntry = {
  shareId: string;
  label: string;        // editierbar, default = "Berechnung vom <Datum>" oder Adresse
  createdAt: string;    // ISO
  kaufpreis?: number;   // für Vorschau
};
type SavedCalcs = SavedCalcEntry[];
```

Persistiert in LocalStorage. Im Header-Dropdown aufrufbar. Anwender kann eigene Labels setzen und Einträge aus der lokalen Liste löschen (löscht **nur lokal**, nicht serverseitig).

### 9.9 DSGVO-Aspekte

- Keine personenbezogenen Daten in den Eingaben (kein Name, keine Adresse). Falls der Anwender eine Adresse als Label vergibt, lebt die ausschließlich lokal.
- Datenschutzhinweis bei „Speichern und Share-Link erzeugen": „Ihre Eingaben werden auf unserem Server gespeichert. Wer den Link kennt, kann die Berechnung sehen, bearbeiten oder löschen."
- Keine Cookies. Kein Tracking. Keine externen Skripte.

---

## 10. PDF-Export

### 10.1 Rendering

`pdfmake` clientseitig. Zwei Templates in `src/components/pdf/`:

- `ReportTemplate.ts`: Kennzahlen-Report (1–2 Seiten).
- `TilgungsplanTemplate.ts`: Tilgungsplan-Tabelle (1 Seite pro 30 Jahre).

Im Header-Dropdown wählbar:
- „Kennzahlen-Report" → nur `ReportTemplate`.
- „Kennzahlen + Tilgungsplan" → `ReportTemplate` + `TilgungsplanTemplate` als zweites Dokument zusammengefügt.

### 10.2 Inhalt Kennzahlen-Report

1. Kopfzeile: Titel „Wirtschaftlichkeitsprüfung — Wohnungsobjekt", Erstellungsdatum, Share-Link (falls vorhanden).
2. Block „Eingabegrößen": Kaufpreis, Wohnfläche, Bundesland, Sanierungssumme, Eigenkapital, Phasenkonditionen kompakt, Mietansatz, Bewirtschaftungskosten.
3. Block „Schnellsicht-Kennzahlen": Brutto-/Nettomietrendite, Kaufpreisfaktor, Kaufpreisfaktor all-in.
4. Block „Cashflow Jahr 1": Jahresreinertrag, Kapitaldienst, Cashflow vor Steuern, Cashflow nach Steuern (falls aktiv), Vermögensaufbau.
5. Block „Risiko und Break-even": DSCR, Break-even-Mieten (Liquidität und Wirtschaftlichkeit).
6. Block „Wertentwicklung": Marktwert Ende, Restschuld Ende, Vermögensbilanz Ende.
7. Fußzeile: „Vereinfachte Schätzung. Ersetzt keine Steuer- oder Finanzberatung."

Jede KPI mit Wert + kleiner Formel-Zeile darunter (Formel aus `metadata.formel`). Tabellarisch, sachlich.

### 10.3 Inhalt Tilgungsplan

Tabelle mit allen Jahreszeilen aus `amortization.rows`. Spalten wie in 6.6. Phasenwechsel optisch markiert. Summenzeile am Ende: Summe Zinsen, Summe Tilgung, Summe Sondertilgungen, Summe Kapitaldienst.

### 10.4 Dateinamen

`Wohnung_Bewertung_<YYYY-MM-DD>.pdf`. Falls Label aus lokaler Liste gesetzt: `Wohnung_<Label>_<YYYY-MM-DD>.pdf` (Label slugifiziert).

### 10.5 Format

- A4 hoch, Schrift 10–11pt für Tabellen, 12pt für Body, 16pt für Überschriften.
- Schriftart: Roboto oder eine pdfmake-Standardschriftart, die auch Sonderzeichen (€, m²) unterstützt.
- Schwarz-weiß-tauglich; Farbliche Akzente nur dezent (Akzentlinie in Primärfarbe).



## 11. Phasenplan

Sechs Phasen, jede mit klarem „fertig"-Kriterium. Nach jeder Phase: Tests grün, Branch in Main mergebar, App lauffähig.

### Phase 0 — Setup (0,5 Tag)

**Inhalt**:
- Frontend-Repo entrümpeln (`src/App.tsx`, `src/ShareView.tsx` weg, neue Verzeichnisstruktur anlegen).
- Backend: alte `calculationEngine.ts` löschen.
- Dependencies installieren: `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `decimal.js-light`, `recharts`, `pdfmake`, `nanoid`.
- `tsconfig` strict, `vitest` für beide Pakete konfiguriert.
- `tokens.css`, `base.css` Grundgerüst.

**Fertig wenn**: `pnpm dev` startet leeres Dashboard mit Header und einer einzigen Section, Tests laufen leer.

### Phase 1 — Engine-Skelett und Datenmodell (2 Tage)

**Inhalt**:
- `domain/finance/types.ts` vollständig.
- `defaults.ts` mit BW-Defaults.
- `serialization.ts` mit Tests.
- `engine.ts` mit `compute()`-Stub, der nur Intermediates und KPIs der Schnellsicht (`bruttomietrendite`, `nettomietrendite`, `kaufpreisfaktor`, `kaufpreisfaktorAllIn`) berechnet.
- `kpis.ts` mit Metadaten für alle KPIs (auch derer, die noch nicht implementiert sind — als `value: null` mit `warnings: ['noch nicht implementiert']`).
- Tests: Engine-Fixtures aus Anhang 13.1, mindestens 6 Szenarien.

**Fertig wenn**: `compute(defaultsBW)` liefert konsistentes Result, alle Schnellsicht-KPIs durchgetestet.

### Phase 2 — UI-Grundgerüst und Forms (2 Tage)

**Inhalt**:
- `components/ui/`: `NumberInput`, `CurrencyInput`, `PercentInput`, `IntegerInput`, `Section`, `KPICard`, `Tooltip`, `InfoIcon`, `Button`, `Toggle`.
- Zod-Schema `schemas/inputs.ts` vollständig.
- `useImmoStore`, `useUiStore`.
- `DashboardPage` mit allen Sektionen klappbar, alle Eingaben verdrahtet.
- KPI-Board zeigt nur die Schnellsicht-KPIs.
- Live-Berechnung läuft.
- Auto-Save via `persist` aktiv.

**Fertig wenn**: man kann alle Eingaben tippen, Validierung greift, Schnellsicht-KPIs aktualisieren live.

### Phase 3 — Tilgungsplan und Cashflow (3 Tage)

**Inhalt**:
- `amortization.ts` vollständig mit Phasenwechsel, Sondertilgungen, Volltilgung, Abbruchbedingungen.
- `cashflow.ts` mit Mehrjahres-Cashflow inkl. Mietsteigerung, Kostensteigerung, Erstvermietungsleerstand, Mietausfallwagnis.
- KPIs: DSCR, alle Cashflow-KPIs, Eigenkapitalrenditen, Break-evens.
- Tilgungsplan-Tabelle in der UI.
- `TilgungsplanChart` (Recharts).
- `CashflowChart` (Recharts).
- Tests: Tilgungsplan über alle drei Phasen, Vergleich mit manuell gerechneten Referenzwerten.

**Fertig wenn**: Plan stimmt im Cent gegen Referenzberechnung, Charts rendern korrekt, Phasenwechsel sind sichtbar markiert.

### Phase 4 — Steuern, Wertentwicklung, restliche KPIs (1,5 Tage)

**Inhalt**:
- `tax.ts` mit `computeAfaJaehrlich`, Verlustverrechnungslogik im Cashflow.
- `valuation.ts` mit Marktwertreihe.
- KPIs: `steuerlasterJahr1`, `cashflowNachSteuernJahr1`, `marktwertEndeBetrachtung`, `vermoegensbilanzEnde`.
- Steuersektion mit Toggle in der UI.
- `WertentwicklungChart` (Recharts).
- `collectWarnings` vollständig, Warning-Banner in der UI.

**Fertig wenn**: Steuermodul togglebar, alle KPIs berechnet, Warnings erscheinen unter den entsprechenden Inputs/KPIs.

### Phase 5 — Persistenz, Share-Links, PDF (2 Tage)

**Inhalt**:
- Backend: neues Schema, Migration anlegen, Routes, Tests.
- Frontend: `useSaveCalculation`, `useLoadCalculation`, `ShareViewPage` (Read-only-Variante).
- Lokale Share-ID-Liste in `useUiStore` mit UI im Header.
- JSON-Export/Import.
- PDF-Templates und Dropdown im Header.

**Fertig wenn**: Speichern erzeugt einen Share-Link, der in einem zweiten Browser geöffnet werden kann; PDF-Export liefert beide Varianten korrekt.

### Phase 6 — Polish, A11y, Defensives (1 Tag)

**Inhalt**:
- A11y-Check (Tab-Reihenfolge, Labels, Kontraste, ARIA für Sections und Tooltips, Lighthouse ≥ 95).
- Mobile-Layout verifizieren.
- Edge-Cases: Fremdkapital = 0, Volltilgung in Phase 1, sehr lange Laufzeit, sehr kleine Wohnfläche, sehr hohe Sanierungssumme.
- README für Betrieb und Deploy aktualisiert.
- Versionierung (Git-Repo init, falls noch nicht erfolgt).

**Fertig wenn**: alle Akzeptanzkriterien aus Sektion 12 grün, manuelle Smoke-Tests durch.

### Gesamt

Etwa 12 Mannarbeitstage. Reihenfolge ist verbindlich, Phasen werden nicht parallel begonnen. Begründung: jede Phase produziert ein lauffähiges Inkrement, und die Engine ist Voraussetzung für UI, die UI ist Voraussetzung für Persistenz/PDF.

---

## 12. Akzeptanzkriterien und Tests

### 12.1 Engine-Tests (Vitest)

In `frontend/src/domain/finance/__tests__/`:

- `engine.test.ts`: pro Fixture aus 13.1 ein Test mit erwarteten KPI-Werten (Toleranz 0,01 €).
- `amortization.test.ts`:
  - Annuitätendarlehen, eine Phase: Restschuld am Ende stimmt mit klassischer Formel überein.
  - Drei Phasen mit Phasenwechsel: Annuität wird neu berechnet, Werte stimmen.
  - Sondertilgung kappt Restschuld korrekt.
  - Sondertilgung > Restschuld: keine negative Restschuld.
  - Volltilgung tritt vor `tilgungsplanMaxJahre` ein.
  - `phase2Jahre = 0`: Phase 2 wird übersprungen.
  - `fremdkapital = 0`: leerer Plan.
- `cashflow.test.ts`:
  - Mietsteigerung wirkt geometrisch.
  - Erstvermietungsleerstand nur in Jahr 1.
  - Verlustverrechnung: negativer steuerlicher Überschuss erzeugt negative Steuerlast.
- `tax.test.ts`:
  - AfA = 0 wenn Modul inaktiv.
  - AfA = Kaufpreis × Gebäudeanteil × AfA-Satz.
- `kpis.test.ts`:
  - DSCR < 1 produziert Warning.
  - Eigenkapitalrendite null wenn Eigenkapital 0.
  - Break-even Liquidität ≥ Break-even Wirtschaftlichkeit (immer).

### 12.2 Schema-Tests

- `InputsSchema` parsed Defaults erfolgreich.
- Fehlende Pflichtfelder im jeweiligen Modus (Kaufnebenkosten, Kosten, Steuer) werfen Issues an den richtigen Pfaden.
- Type-Equivalence-Test: `z.infer<typeof InputsSchema>` strukturell gleich `ImmoInputs` (manuell oder via `expect-type`).

### 12.3 Backend-Tests

- POST mit gültigem Body → 201 mit `shareId`.
- POST mit ungültigem Body → 400, Fehlerstruktur stimmt.
- GET mit existierender ID → 200, JSON deserialisierbar.
- GET mit unbekannter ID → 404.
- DELETE mit existierender ID → 204; nachfolgender GET → 404.
- Rate-Limit greift nach 10 POSTs/Minute.

### 12.4 UI-Akzeptanz (manuell)

Smoke-Liste:

1. Leere Berechnung anlegen, Standard-KPIs werden angezeigt.
2. Kaufpreis 250 000 €, Wohnfläche 65 m², Miete 1 050 €/Monat, EK 60 000 €, Phase 1: 4 % / 2 %, Phase 2: 4,5 % / 2,5 %, Phase 3: 5 % / 3 %. KPIs entsprechen Fixture „Standard-BW" aus 13.1.
3. Kaufnebenkosten-Modus auf „vereinfacht" wechseln, Summe eintragen, Detailfelder werden inaktiv. Zurückwechseln, Detailfelder wieder aktiv mit alten Werten.
4. Steuer-Toggle aktivieren, Pflichtfelder validieren, KPI „Steuerlast Jahr 1" erscheint.
5. Sektion „Wertentwicklung" einklappen, Zustand persistiert nach Reload.
6. „Speichern und Share-Link" → Link kopiert, neuer Tab mit `/s/<id>` zeigt identische Berechnung read-only.
7. „Bearbeiten" auf Share-View → erzeugt eigenständige neue Berechnung, ändert die fremde nicht.
8. PDF-Export „Kennzahlen + Tilgungsplan" → Datei korrekt, alle Jahreszeilen enthalten.
9. JSON-Export, danach Reset, danach JSON-Import → identische Eingaben.
10. Mobile-Viewport (375 px Breite): kein horizontales Scrollen, KPIs einklappbar.

### 12.5 Performance-Akzeptanz

- Live-Recalc nach Tasteneingabe < 30 ms (in DevTools-Profile messbar).
- Initial-Render des Dashboards < 1,5 s auf einer mittleren Hardware.
- PDF-Generierung Standardreport < 1,5 s.

### 12.6 Accessibility-Akzeptanz

- Lighthouse-A11y-Score ≥ 95.
- Tastatur-Navigation: Tab durchläuft alle Eingaben, Toggles und Buttons in logischer Reihenfolge.
- Alle Inputs haben sichtbare Labels.
- Tooltips sind via Tab/Enter erreichbar (nicht nur Hover).
- Farbkontraste WCAG AA für Text auf Hintergrund (≥ 4,5:1).

---

## 13. Anhang

### 13.1 Test-Fixtures

In `frontend/src/domain/finance/__tests__/fixtures.ts`. Mindestens diese Szenarien, jedes mit erwarteten KPI-Referenzwerten:

| ID | Beschreibung |
|---|---|
| `STANDARD_BW` | Wohnung 65 m², 250 000 €, 1 050 €/Monat, 60 000 € EK, 3-Phasen-Finanzierung 10/10/Rest, Standardkosten BW |
| `OHNE_FK` | Vollständig aus Eigenkapital finanziert, FK = 0 |
| `HOHE_TILGUNG` | Anfangstilgung 5 % Phase 1, Volltilgung erwartet vor Phase 3 |
| `LEERSTANDSWUNDE` | 3 Monate Leerstand p. a. + 6 Monate Erstvermietung |
| `STEUER_AKTIV` | Mit Steuermodul, Gebäudeanteil 80 %, AfA 2 %, Steuersatz 42 % |
| `LANGE_LAUFZEIT` | 1 % Anfangstilgung, prüft `tilgungsplanMaxJahre`-Abschnitt |
| `SANIERUNG_HOCH` | Sanierung 60 000 €, Wertanrechnung 70 % |
| `NEGATIV_CASHFLOW` | Hoher Kaufpreis, niedrige Miete → negativer Cashflow, DSCR < 1 |

Pro Fixture: Inputs vollständig, erwartete KPIs als Decimal-Strings (Vergleichstoleranz 1 Cent bei EUR, 0,001 bei Faktoren, 0,01 % bei Prozent).

### 13.2 Annahmen, die in Tooltips kommuniziert werden müssen

Damit der Anwender weiß, was er sieht:

- „Annuitätendarlehen, monatliche Zahlweise. Annuität bleibt innerhalb einer Phase konstant."
- „Sondertilgung wird einmal pro Jahr am Jahresende abgezogen."
- „Mietsteigerung und Kostensteigerung werden geometrisch fortgeschrieben."
- „Wertentwicklung nominal, ohne Inflationsbereinigung."
- „Steuermodul: vereinfachte Schätzung. AfA linear vom Gebäudeanteil. Verlustverrechnung wird angenommen."
- „Cashflow vor Steuern: Tilgung ist als Liquiditätsabfluss berücksichtigt, ist aber wirtschaftlich Vermögensaufbau."
- „Break-even Liquidität enthält Tilgung, Break-even Wirtschaftlichkeit nur Zinsen."
- „Marktwert Ende inkludiert einen Anteil der Sanierungskosten als wertanrechnend."

### 13.3 Bewusst nicht modelliert

Wird sowohl im Code-Kommentar `// SCOPE: not modeled` als auch im UI „Hinweise zum Modell" benannt:

- Anschaffungsnaher Aufwand (15-%-Grenze, §6 Abs. 1 Nr. 1a EStG).
- Verteilung Erhaltungsaufwand auf 2–5 Jahre (§82b EStDV).
- Solidaritätszuschlag, Kirchensteuer.
- Spekulationssteuer (10-Jahres-Frist).
- Verkaufskosten beim Exit (Makler, Notar, Vorfälligkeit).
- Anschlussfinanzierungs-Stresstest (Zins-Schock).
- Mehrobjekt-Vergleich.
- Mietausfall durch Mietendeckel oder regulatorische Eingriffe.
- Nicht-lineare AfA, Sonderabschreibungen (z. B. § 7b EStG für Mietwohnungsneubau).

Wird ein Punkt davon später nachgezogen, wird er als eigene Phase 7+ behandelt — mit eigener Spezifikation, eigenen Tests, eigenem KPI-Set.

### 13.4 Glossar (für UI-Texte)

Kann im Code in `i18n/de.ts` als Modul-Konstanten gepflegt werden:

```ts
export const GLOSSAR = {
  kaufpreis: 'Reiner Wohnungskaufpreis ohne Nebenkosten und Sanierung.',
  kaufnebenkosten: 'Grunderwerbsteuer (in Baden-Württemberg 5,0 %), Notar- und Grundbuchkosten (Faustregel 1,5 %), Maklerprovision (typisch 3,57 % brutto Käuferanteil).',
  gesamtkapitalbedarf: 'Summe aus Kaufpreis, Kaufnebenkosten und Sanierungskosten. Basis für Renditen.',
  fremdkapital: 'Differenz aus finanzierter Basis und Eigenkapital. Was die Bank gibt.',
  jahresreinertrag: 'Effektive Jahresmiete abzüglich Bewirtschaftungskosten. Vor Finanzierung, vor Steuern.',
  cashflowVorSteuern: 'Jahresreinertrag abzüglich Kapitaldienst (Zins + Tilgung). Tilgung ist hier als Liquiditätsabfluss enthalten, ist aber Vermögensaufbau.',
  cashflowNachSteuern: 'Cashflow vor Steuern abzüglich der Steuerlast aus der Vermietung.',
  dscr: 'Jahresreinertrag dividiert durch den Kapitaldienst des ersten Jahres. Werte unter 1 bedeuten: Mieten reichen nicht zur Bedienung der Bank. Banken erwarten meist mindestens 1,2.',
  eigenkapitalrenditeCashflow: 'Cashflow vor Steuern dividiert durch eingesetztes Eigenkapital. Reine Liquiditätssicht ohne Tilgung.',
  eigenkapitalrenditeMitTilgung: 'Inklusive Tilgung als Vermögensaufbau. Realistischere Sicht auf den Eigenkapital-Hebel.',
  breakEvenMieteProQmLiquiditaet: 'Welche Kaltmiete pro m² und Monat ist nötig, damit Liquidität neutral ist (mit Tilgung)?',
  breakEvenMieteProQmWirtschaftlich: 'Welche Kaltmiete pro m² und Monat ist nötig, damit das Objekt wirtschaftlich neutral ist (nur Zinsen, ohne Tilgung)?',
  vermoegensbilanzEnde: 'Marktwert am Ende des Betrachtungszeitraums abzüglich verbleibender Restschuld. Was vom Investment bleibt, wenn man heute verkaufen würde — vor Steuern, vor Verkaufskosten.',
};
```

### 13.5 Beispiel-Lookup BW-Defaults

In `defaults.ts`:

```ts
export const GREW_BY_BUNDESLAND: Record<Bundesland, number> = {
  BW: 0.050, BY: 0.035, BE: 0.060, BB: 0.065, HB: 0.050,
  HH: 0.055, HE: 0.060, MV: 0.060, NI: 0.050, NW: 0.065,
  RP: 0.050, SL: 0.065, SN: 0.055, ST: 0.050, SH: 0.065, TH: 0.065,
};
```

(Werte können im Lauf der Zeit variieren; Coding-Agent prüft beim Setup einmal die Aktualität, hinterlegt Quelle als Code-Kommentar mit Datum.)

### 13.6 Fehlerszenarien, die vorhersehbar sind

| Szenario | Verhalten |
|---|---|
| Eingabe nicht-numerisch (z. B. Zeichen) | RHF/Zod blockiert, Feldfehler |
| Pflichtfeld leer | RHF/Zod blockiert |
| Leerstand 13 Monate | Zod blockiert (>12) |
| Eigenkapital > Finanzierungsbasis | Engine setzt FK = 0, Warning |
| Sehr niedrige Tilgung, kein Volltilgung in Max-Jahren | Plan abgeschnitten, Warning |
| Backend nicht erreichbar bei „Speichern" | Toast „Speichern fehlgeschlagen, bitte erneut versuchen", Inputs bleiben lokal |
| Share-ID nicht gefunden | `NotFoundPage` mit Link „Neue Berechnung anlegen" |
| Schema-Outdated bei alten Share-Links | Banner „Werte sind eingeschränkt vergleichbar" (siehe 9.5) |

### 13.7 Wartungshinweise

- Wenn ein Default in BW (z. B. Grunderwerbsteuersatz) sich ändert: nur in `defaults.ts`, mit Datum und Quelle als Code-Kommentar.
- Wenn ein KPI hinzukommt: zwingend Metadata-Eintrag in `kpis.ts`, Tooltip in `i18n/de.ts`, Fixture-Erweiterung in `fixtures.ts`.
- Wenn das Schema sich ändert (Breaking): `schema_version` inkrementieren, Migration anlegen, Outdated-Banner im Frontend prüfen.

---

**Ende der Bauanleitung.**

Bei Unklarheiten oder Konflikten zwischen Sektionen gilt: Sektion 4 (Datenmodell) und Sektion 5 (Engine) haben Vorrang, da sie verbindliche Spezifikation sind. Sektionen 6 ff. sind Architektur, deren Umsetzung im Detail beim Agenten liegt — Abweichungen davon dürfen vorgenommen werden, wenn sie die Akzeptanzkriterien aus Sektion 12 nicht verletzen.

