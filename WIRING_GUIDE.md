# 🗡️ JSON Wiring Guide — party.json → HTML Pages

## File Structure (for GitHub Pages)
```
/dnd/
  party.json          ← Master data source
  loader.js           ← Auto-injection script
  characters/
    sekhmet.html       ← Portrait sheet
    sekhmet_textsheet.html  ← Full stat sheet
    astrica.html
    astrica_textsheet.html
    raven.html
    raven_textsheet.html
```

---

## How to Wire a Page

### Step 1: Add `data-character` to `<body>`
```html
<body data-character="sekhmet">
```

### Step 2: Add loader script before `</body>`
```html
<script src="/dnd/loader.js"></script>
</body>
```

### Step 3: Tag elements with `data-path`
Every stat that should update from JSON gets a `data-path` attribute.
The value is the dot-notation path into that character's JSON object.

---

## Quick Reference — data-path Values

### Identity
| Element | data-path |
|---------|-----------|
| Character name | `name` |
| Race | `race` |
| Class | `class` |
| Subclass | `subclass` |
| Level | `level` |
| Background | `background` |
| Alignment | `alignment` |
| XP | `xp` |
| Proficiency Bonus | `proficiencyBonus` |

### Ability Scores
| Element | data-path |
|---------|-----------|
| STR score | `abilities.STR.score` |
| STR modifier | `abilities.STR.mod` |
| DEX score | `abilities.DEX.score` |
| DEX modifier | `abilities.DEX.mod` |
| CON score | `abilities.CON.score` |
| CON modifier | `abilities.CON.mod` |
| INT score | `abilities.INT.score` |
| INT modifier | `abilities.INT.mod` |
| WIS score | `abilities.WIS.score` |
| WIS modifier | `abilities.WIS.mod` |
| CHA score | `abilities.CHA.score` |
| CHA modifier | `abilities.CHA.mod` |

### Combat
| Element | data-path |
|---------|-----------|
| Current HP | `combat.hp.current` |
| Max HP | `combat.hp.max` |
| Armor Class | `combat.ac` |
| Speed | `combat.speed` |
| Initiative | `combat.initiative` |
| Hit Dice type | `combat.hitDice.type` |

### Saving Throws
| Element | data-path |
|---------|-----------|
| STR save value | `savingThrows.STR.value` |
| STR save dot | `savingThrows.STR.proficient` ← use with `data-path-class` |
| _(same pattern for DEX, CON, INT, WIS, CHA)_ | |

### Skills
| Element | data-path |
|---------|-----------|
| Athletics value | `skills.Athletics.value` |
| Athletics proficiency dot | `skills.Athletics.proficient` ← use with `data-path-class` |
| _(same pattern for all 18 skills)_ | |

### Passives
| Element | data-path |
|---------|-----------|
| Passive Perception | `passives.perception` |
| Passive Investigation | `passives.investigation` |
| Passive Insight | `passives.insight` |

### Gold
| Element | data-path |
|---------|-----------|
| Gold amount | `gold` |

---

## Example: Before & After

### Before (hardcoded):
```html
<span class="ability-score">16</span>
<span class="ability-mod">+3</span>
```

### After (JSON-wired):
```html
<span class="ability-score" data-path="abilities.STR.score">16</span>
<span class="ability-mod" data-path="abilities.STR.mod">+3</span>
```

### Proficiency dot (class toggling):
```html
<!-- Before -->
<div class="dot filled"></div>

<!-- After -->
<div class="dot" data-path-class="skills.Athletics.proficient" data-class="filled"></div>
```

### Equipment list (auto-generated):
```html
<!-- Before: manually listed items -->
<div class="equip-list">
  <div class="equip-item">Sun-Disc Club</div>
  <div class="equip-item">Explorer's Pack</div>
</div>

<!-- After: generated from array -->
<div class="equip-list" data-path-list="equipment" data-list-class="equip-item"></div>
```

---

## Session Update Workflow

After each session:
1. Open `party.json`
2. Update the stats that changed (HP, XP, level, new items, gold, etc.)
3. Commit to GitHub
4. Every page auto-updates on next load — no HTML editing needed

---

## Fallback Safety
If `party.json` fails to load (network error, bad path, etc.),
the hardcoded values in the HTML remain visible. The loader
never clears existing content unless it has a replacement.
