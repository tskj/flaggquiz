import { describe, it, expect } from "vitest";
import { fuzzyMatch, isCloseEnough, checkAnswer } from "./fuzzyMatch";
import { norwegianNames, alternativeNames } from "./App";

// All Norwegian country names for realistic ambiguity testing
const allNorwegianNames = Object.values(norwegianNames);

describe("checkAnswer", () => {
  describe("exact matches", () => {
    it("returns match for exact main name", () => {
      expect(checkAnswer("Norge", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
      expect(checkAnswer("norge", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
    });

    it("returns match for exact alternative name", () => {
      expect(checkAnswer("UK", "Storbritannia", allNorwegianNames, ["UK"])).toEqual(["match", "UK"]);
      expect(checkAnswer("Burma", "Myanmar", allNorwegianNames, ["Burma"])).toEqual(["match", "Burma"]);
    });
  });

  describe("fuzzy matches", () => {
    it("returns match for fuzzy main name", () => {
      expect(checkAnswer("Norg", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
      expect(checkAnswer("Storbritania", "Storbritannia", allNorwegianNames)).toEqual(["match", "Storbritannia"]);
    });

    it("accepts Columbia as Colombia (common misspelling)", () => {
      expect(checkAnswer("Columbia", "Colombia", allNorwegianNames)).toEqual(["match", "Colombia"]);
    });

    it("accepts 'Bosnia og Hercegovina' for 'Bosnia-Hercegovina'", () => {
      expect(checkAnswer("Bosnia og Hercegovina", "Bosnia-Hercegovina", allNorwegianNames)).toEqual(["match", "Bosnia-Hercegovina"]);
    });

    it("accepts typing without accents/diacritics", () => {
      expect(checkAnswer("Sao Tome og Principe", "São Tomé og Príncipe", allNorwegianNames)).toEqual(["match", "São Tomé og Príncipe"]);
      expect(checkAnswer("Ost-Timor", "Øst-Timor", allNorwegianNames)).toEqual(["match", "Øst-Timor"]);
      expect(checkAnswer("Osterrike", "Østerrike", allNorwegianNames)).toEqual(["match", "Østerrike"]);
    });

    it("returns match for fuzzy alternative name", () => {
      expect(checkAnswer("Amerik", "De forente stater", allNorwegianNames, ["Amerika"])).toEqual(["match", "Amerika"]);
      expect(checkAnswer("Bruma", "Myanmar", allNorwegianNames, ["Burma"])).toEqual(["match", "Burma"]);
    });
  });

  describe("ambiguous matches", () => {
    it("returns ambiguous with list of matching countries", () => {
      const result = checkAnswer("ira", "Iran", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Iran");
      expect(result[1]).toContain("Irak");
    });

    it("returns ambiguous for maurit matching both Mauritius and Mauritania", () => {
      const result = checkAnswer("maurit", "Mauritius", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Mauritius");
      expect(result[1]).toContain("Mauritania");
    });

    it("returns ambiguous for Sudan when answer is Sør-Sudan", () => {
      const result = checkAnswer("Sudan", "Sør-Sudan", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Sør-Sudan");
      expect(result[1]).toContain("Sudan");
    });
  });

  describe("no match", () => {
    it("returns no_match for wrong answer", () => {
      expect(checkAnswer("Sverige", "Norge", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Japan", "Kina", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("returns no_match for too short input", () => {
      expect(checkAnswer("No", "Norge", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Ir", "Iran", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("returns no_match for gibberish", () => {
      expect(checkAnswer("asdfgh", "Norge", allNorwegianNames)).toEqual(["no_match"]);
    });
  });

  describe("exact match bypasses ambiguity", () => {
    it("exact Sudan for Sudan is match, not ambiguous", () => {
      expect(checkAnswer("Sudan", "Sudan", allNorwegianNames)).toEqual(["match", "Sudan"]);
    });

    it("exact Iran for Iran is match, not ambiguous", () => {
      expect(checkAnswer("Iran", "Iran", allNorwegianNames)).toEqual(["match", "Iran"]);
    });
  });

  describe("alternative names can cause ambiguity", () => {
    it("input matching another countrys alt name causes ambiguity", () => {
      const allAltNames = { Nansenland: ["Nansen"] };
      const result = checkAnswer("Nansen", "Hansen", ["Hansen", "Nansenland"], [], allAltNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Hansen");
      expect(result[1]).toContain("Nansenland");
    });

    it("typing Burm for Myanmar via Burma alt is not ambiguous with Burundi", () => {
      const allAltNames = { Myanmar: ["Burma"] };
      const result = checkAnswer("Burm", "Myanmar", allNorwegianNames, ["Burma"], allAltNames);
      expect(result).toEqual(["match", "Burma"]);
    });

    it("exact alt name match is never ambiguous", () => {
      const allAltNames = { Myanmar: ["Burma"] };
      const result = checkAnswer("Burma", "Myanmar", allNorwegianNames, ["Burma"], allAltNames);
      expect(result).toEqual(["match", "Burma"]);
    });
  });
});

describe("alternativeNames", () => {
  it("has UK for United Kingdom", () => {
    expect(alternativeNames["United Kingdom"]).toContain("UK");
  });

  it("has Amerika and De forente amerikanske stater for United States", () => {
    expect(alternativeNames["United States"]).toContain("Amerika");
    expect(alternativeNames["United States"]).toContain("De forente amerikanske stater");
  });

  it("has Burma for Myanmar", () => {
    expect(alternativeNames["Myanmar"]).toContain("Burma");
  });
});

describe("fuzzyMatch", () => {
  it("returns 0 for exact matches", () => {
    expect(fuzzyMatch("norge", "norge")).toBe(0);
    expect(fuzzyMatch("storbritannia", "storbritannia")).toBe(0);
  });

  it("returns low distance for missing letter", () => {
    expect(fuzzyMatch("storbritania", "storbritannia")).toBeLessThanOrEqual(5);
  });

  it("returns high distance for completely wrong answers", () => {
    expect(fuzzyMatch("sverige", "norge")).toBeGreaterThan(5);
    expect(fuzzyMatch("abc", "storbritannia")).toBeGreaterThan(10);
  });
});

describe("isCloseEnough", () => {
  describe("should accept", () => {
    it("exact matches", () => {
      expect(isCloseEnough("Norge", "Norge")).toBe(true);
      expect(isCloseEnough("Storbritannia", "Storbritannia")).toBe(true);
      expect(checkAnswer("Norge", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
      expect(checkAnswer("Storbritannia", "Storbritannia", allNorwegianNames)).toEqual(["match", "Storbritannia"]);
    });

    it("case insensitive matches", () => {
      expect(isCloseEnough("norge", "Norge")).toBe(true);
      expect(isCloseEnough("STORBRITANNIA", "Storbritannia")).toBe(true);
      expect(checkAnswer("norge", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
      expect(checkAnswer("STORBRITANNIA", "Storbritannia", allNorwegianNames)).toEqual(["match", "Storbritannia"]);
    });

    it("missing single letter in longer words", () => {
      expect(isCloseEnough("storbritania", "Storbritannia")).toBe(true);
      expect(isCloseEnough("Tysklnd", "Tyskland")).toBe(true);
      expect(checkAnswer("storbritania", "Storbritannia", allNorwegianNames)).toEqual(["match", "Storbritannia"]);
      expect(checkAnswer("Tysklnd", "Tyskland", allNorwegianNames)).toEqual(["match", "Tyskland"]);
    });

    it("double letters typed as single", () => {
      expect(isCloseEnough("Marokko", "Marokko")).toBe(true);
      expect(isCloseEnough("Maroko", "Marokko")).toBe(true);
      expect(checkAnswer("Maroko", "Marokko", allNorwegianNames)).toEqual(["match", "Marokko"]);
    });

    it("longer country names with typos", () => {
      expect(isCloseEnough("Den sentralafrikanske repubikk", "Den sentralafrikanske republikk")).toBe(true);
      expect(checkAnswer("Den sentralafrikanske repubikk", "Den sentralafrikanske republikk", allNorwegianNames)).toEqual(["match", "Den sentralafrikanske republikk"]);
    });

    it("spaces and hyphens are optional", () => {
      expect(isCloseEnough("sørkorea", "Sør-Korea")).toBe(true);
      expect(isCloseEnough("nordkorea", "Nord-Korea")).toBe(true);
      expect(isCloseEnough("srilanka", "Sri Lanka")).toBe(true);
      expect(checkAnswer("sørkorea", "Sør-Korea", allNorwegianNames)).toEqual(["match", "Sør-Korea"]);
      expect(checkAnswer("nordkorea", "Nord-Korea", allNorwegianNames)).toEqual(["match", "Nord-Korea"]);
      expect(checkAnswer("srilanka", "Sri Lanka", allNorwegianNames)).toEqual(["match", "Sri Lanka"]);
    });
  });

  describe("should reject", () => {
    it("completely wrong answers", () => {
      expect(isCloseEnough("Sverige", "Norge")).toBe(false);
      expect(isCloseEnough("Finland", "Tyskland")).toBe(false);
      expect(checkAnswer("Sverige", "Norge", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Finland", "Tyskland", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("random gibberish", () => {
      expect(isCloseEnough("asdf", "Norge")).toBe(false);
      expect(isCloseEnough("xyz", "Storbritannia")).toBe(false);
      expect(checkAnswer("asdf", "Norge", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("empty input", () => {
      expect(isCloseEnough("", "Norge")).toBe(false);
      expect(checkAnswer("", "Norge", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("very short partial matches", () => {
      expect(isCloseEnough("No", "Norge")).toBe(false);
      expect(isCloseEnough("St", "Storbritannia")).toBe(false);
      expect(checkAnswer("No", "Norge", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("St", "Storbritannia", allNorwegianNames)).toEqual(["no_match"]);
    });
  });
});

describe("confusable country pairs", () => {
  describe("Mauritius vs Mauritania", () => {
    it("exact matches work", () => {
      expect(checkAnswer("mauritius", "Mauritius", allNorwegianNames)).toEqual(["match", "Mauritius"]);
      expect(checkAnswer("mauritania", "Mauritania", allNorwegianNames)).toEqual(["match", "Mauritania"]);
    });

    it('partial "maurit" is ambiguous', () => {
      const result1 = checkAnswer("maurit", "Mauritius", allNorwegianNames);
      expect(result1[0]).toBe("ambiguous");
      expect(result1[1]).toContain("Mauritius");
      expect(result1[1]).toContain("Mauritania");

      const result2 = checkAnswer("maurit", "Mauritania", allNorwegianNames);
      expect(result2[0]).toBe("ambiguous");
    });

    it("typing more disambiguates", () => {
      expect(checkAnswer("mauriti", "Mauritius", allNorwegianNames)).toEqual(["match", "Mauritius"]);
      expect(checkAnswer("maurita", "Mauritania", allNorwegianNames)).toEqual(["match", "Mauritania"]);
    });
  });

  describe("Niger vs Nigeria", () => {
    it("exact matches work", () => {
      expect(checkAnswer("niger", "Niger", allNorwegianNames)).toEqual(["match", "Niger"]);
      expect(checkAnswer("nigeria", "Nigeria", allNorwegianNames)).toEqual(["match", "Nigeria"]);
    });

    it("nigeri is ambiguous (close to both)", () => {
      const result = checkAnswer("nigeri", "Nigeria", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Nigeria");
      expect(result[1]).toContain("Niger");
    });
  });

  describe("Mali vs Malawi vs Malaysia", () => {
    it("exact matches work", () => {
      expect(checkAnswer("mali", "Mali", allNorwegianNames)).toEqual(["match", "Mali"]);
      expect(checkAnswer("malawi", "Malawi", allNorwegianNames)).toEqual(["match", "Malawi"]);
      expect(checkAnswer("malaysia", "Malaysia", allNorwegianNames)).toEqual(["match", "Malaysia"]);
    });
  });

  describe("Iran vs Irak vs Irland", () => {
    it("exact matches work", () => {
      expect(checkAnswer("iran", "Iran", allNorwegianNames)).toEqual(["match", "Iran"]);
      expect(checkAnswer("irak", "Irak", allNorwegianNames)).toEqual(["match", "Irak"]);
      expect(checkAnswer("irland", "Irland", allNorwegianNames)).toEqual(["match", "Irland"]);
    });

    it("ira is ambiguous between Iran and Irak", () => {
      const result = checkAnswer("ira", "Iran", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Iran");
      expect(result[1]).toContain("Irak");
    });
  });

  describe("Slovenia vs Slovakia", () => {
    it("exact matches work", () => {
      expect(checkAnswer("slovenia", "Slovenia", allNorwegianNames)).toEqual(["match", "Slovenia"]);
      expect(checkAnswer("slovakia", "Slovakia", allNorwegianNames)).toEqual(["match", "Slovakia"]);
    });

    it("they naturally disambiguate by their different letters", () => {
      expect(checkAnswer("slova", "Slovakia", allNorwegianNames)).toEqual(["match", "Slovakia"]);
      expect(checkAnswer("slova", "Slovenia", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("slove", "Slovenia", allNorwegianNames)).toEqual(["match", "Slovenia"]);
      expect(checkAnswer("slove", "Slovakia", allNorwegianNames)).toEqual(["no_match"]);
    });
  });

  describe("India vs Indonesia", () => {
    it("exact matches work", () => {
      expect(checkAnswer("india", "India", allNorwegianNames)).toEqual(["match", "India"]);
      expect(checkAnswer("indonesia", "Indonesia", allNorwegianNames)).toEqual(["match", "Indonesia"]);
    });

    it("indo is too short for both", () => {
      expect(checkAnswer("indo", "Indonesia", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("indo", "India", allNorwegianNames)).toEqual(["no_match"]);
    });
  });

  describe("Sudan vs Sør-Sudan", () => {
    it("exact matches work", () => {
      expect(checkAnswer("sudan", "Sudan", allNorwegianNames)).toEqual(["match", "Sudan"]);
      expect(checkAnswer("sør-sudan", "Sør-Sudan", allNorwegianNames)).toEqual(["match", "Sør-Sudan"]);
    });

    it("sørsudan without hyphen matches Sør-Sudan", () => {
      expect(checkAnswer("sørsudan", "Sør-Sudan", allNorwegianNames)).toEqual(["match", "Sør-Sudan"]);
    });

    it('typing just "Sudan" for Sør-Sudan is ambiguous', () => {
      const result = checkAnswer("Sudan", "Sør-Sudan", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Sør-Sudan");
      expect(result[1]).toContain("Sudan");
    });
  });

  describe("Nord-Korea vs Sør-Korea", () => {
    it("exact matches work", () => {
      expect(checkAnswer("nord-korea", "Nord-Korea", allNorwegianNames)).toEqual(["match", "Nord-Korea"]);
      expect(checkAnswer("sør-korea", "Sør-Korea", allNorwegianNames)).toEqual(["match", "Sør-Korea"]);
      expect(checkAnswer("nordkorea", "Nord-Korea", allNorwegianNames)).toEqual(["match", "Nord-Korea"]);
      expect(checkAnswer("sørkorea", "Sør-Korea", allNorwegianNames)).toEqual(["match", "Sør-Korea"]);
    });

    it("korea alone is ambiguous between Nord-Korea and Sør-Korea", () => {
      const result = checkAnswer("korea", "Nord-Korea", allNorwegianNames);
      expect(result[0]).toBe("ambiguous");
      expect(result[1]).toContain("Nord-Korea");
      expect(result[1]).toContain("Sør-Korea");
    });
  });

  describe("Guinea variations", () => {
    it("exact matches work", () => {
      expect(checkAnswer("guinea", "Guinea", allNorwegianNames)).toEqual(["match", "Guinea"]);
      expect(checkAnswer("guinea-bissau", "Guinea-Bissau", allNorwegianNames)).toEqual(["match", "Guinea-Bissau"]);
    });
  });

  describe("unique countries are never ambiguous", () => {
    it("norge is unique", () => {
      expect(checkAnswer("norge", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
    });

    it("australia is unique", () => {
      expect(checkAnswer("australia", "Australia", allNorwegianNames)).toEqual(["match", "Australia"]);
    });
  });
});

describe("transposed letters", () => {
  it("accepts swapped adjacent letters", () => {
    expect(checkAnswer("bharain", "Bahrain", allNorwegianNames)).toEqual(["match", "Bahrain"]);
    expect(checkAnswer("bleraus", "Hviterussland", allNorwegianNames, ["Belarus"])).toEqual(["match", "Belarus"]);
  });

  it("accepts common keyboard transpositions", () => {
    expect(checkAnswer("Bangaldesh", "Bangladesh", allNorwegianNames)).toEqual(["match", "Bangladesh"]);
    expect(checkAnswer("Jamacia", "Jamaica", allNorwegianNames)).toEqual(["match", "Jamaica"]);
    expect(checkAnswer("Pakitsan", "Pakistan", allNorwegianNames)).toEqual(["match", "Pakistan"]);
  });

  it("still rejects wrong countries even with transpositions", () => {
    expect(checkAnswer("Sveirge", "Norge", allNorwegianNames)).toEqual(["no_match"]);
    expect(checkAnswer("Dnamark", "Finland", allNorwegianNames)).toEqual(["no_match"]);
  });
});

describe("realistic misspellings", () => {
  describe("should accept", () => {
    it("missing single letter in middle", () => {
      expect(checkAnswer("Etiopa", "Etiopia", allNorwegianNames)).toEqual(["match", "Etiopia"]);
      expect(checkAnswer("Indonesa", "Indonesia", allNorwegianNames)).toEqual(["match", "Indonesia"]);
      expect(checkAnswer("Venezuea", "Venezuela", allNorwegianNames)).toEqual(["match", "Venezuela"]);
    });

    it("missing double letters", () => {
      expect(checkAnswer("Filipinene", "Filippinene", allNorwegianNames)).toEqual(["match", "Filippinene"]);
      expect(checkAnswer("Maroko", "Marokko", allNorwegianNames)).toEqual(["match", "Marokko"]);
    });

    it("ending variations", () => {
      expect(checkAnswer("Argentin", "Argentina", allNorwegianNames)).toEqual(["match", "Argentina"]);
      expect(checkAnswer("Colombian", "Colombia", allNorwegianNames)).toEqual(["match", "Colombia"]);
      expect(checkAnswer("Venezuella", "Venezuela", allNorwegianNames)).toEqual(["match", "Venezuela"]);
    });

    it("long names with typos", () => {
      expect(checkAnswer("Kirgistan", "Kirgisistan", allNorwegianNames)).toEqual(["match", "Kirgisistan"]);
      expect(checkAnswer("Aserbadsjan", "Aserbajdsjan", allNorwegianNames)).toEqual(["match", "Aserbajdsjan"]);
    });
  });

  describe("should reject", () => {
    it("wrong letter substitution in short words", () => {
      expect(checkAnswer("Sverige", "Sveits", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Island", "Irland", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("partial country names too short", () => {
      expect(checkAnswer("Guinea", "Ekvatorial-Guinea", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Kongo", "Republikken Kongo", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("completely wrong", () => {
      expect(checkAnswer("Spania", "Italia", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("Egypt", "Libya", allNorwegianNames)).toEqual(["no_match"]);
    });
  });
});

describe("alternative names", () => {
  it("should accept exact alternative names", () => {
    expect(checkAnswer("UK", "Storbritannia", allNorwegianNames, ["UK"])).toEqual(["match", "UK"]);
    expect(checkAnswer("Amerika", "USA", allNorwegianNames, ["Amerika"])).toEqual(["match", "Amerika"]);
    expect(checkAnswer("Burma", "Myanmar", allNorwegianNames, ["Burma"])).toEqual(["match", "Burma"]);
  });

  it("should accept fuzzy matches on alternative names", () => {
    expect(checkAnswer("Amerik", "USA", allNorwegianNames, ["Amerika"])).toEqual(["match", "Amerika"]);
    expect(checkAnswer("Bruma", "Myanmar", allNorwegianNames, ["Burma"])).toEqual(["match", "Burma"]);
  });

  it("should reject inputs shorter than 3 characters", () => {
    expect(checkAnswer("U", "Storbritannia", allNorwegianNames, ["UK"])).toEqual(["no_match"]);
    expect(checkAnswer("Am", "USA", allNorwegianNames, ["Amerika"])).toEqual(["no_match"]);
  });
});

describe("realistic typing scenarios", () => {
  describe("should accept common typos", () => {
    it("missing double letters", () => {
      expect(checkAnswer("maroko", "Marokko", allNorwegianNames)).toEqual(["match", "Marokko"]);
      expect(checkAnswer("filipinene", "Filippinene", allNorwegianNames)).toEqual(["match", "Filippinene"]);
    });

    it("missing single letter", () => {
      expect(checkAnswer("tysland", "Tyskland", allNorwegianNames)).toEqual(["match", "Tyskland"]);
      expect(checkAnswer("frakrike", "Frankrike", allNorwegianNames)).toEqual(["match", "Frankrike"]);
    });

    it("extra letter", () => {
      expect(checkAnswer("norgee", "Norge", allNorwegianNames)).toEqual(["match", "Norge"]);
      expect(checkAnswer("sveriige", "Sverige", allNorwegianNames)).toEqual(["match", "Sverige"]);
    });

    it("minor typos in longer words", () => {
      expect(checkAnswer("sverig", "Sverige", allNorwegianNames)).toEqual(["match", "Sverige"]);
      expect(checkAnswer("tysklan", "Tyskland", allNorwegianNames)).toEqual(["match", "Tyskland"]);
    });
  });

  describe("should accept without spaces/hyphens", () => {
    it("compound names without spaces", () => {
      expect(checkAnswer("srilanka", "Sri Lanka", allNorwegianNames)).toEqual(["match", "Sri Lanka"]);
      expect(checkAnswer("newzealand", "New Zealand", allNorwegianNames)).toEqual(["match", "New Zealand"]);
      expect(checkAnswer("sørafrika", "Sør-Afrika", allNorwegianNames)).toEqual(["match", "Sør-Afrika"]);
      expect(checkAnswer("saudiarabia", "Saudi-Arabia", allNorwegianNames)).toEqual(["match", "Saudi-Arabia"]);
    });

    it("long compound names", () => {
      expect(checkAnswer("densentralafrikanskerepublikk", "Den sentralafrikanske republikk", allNorwegianNames)).toEqual(["match", "Den sentralafrikanske republikk"]);
      expect(checkAnswer("deforentearabiskeemirater", "De forente arabiske emirater", allNorwegianNames)).toEqual(["match", "De forente arabiske emirater"]);
    });
  });

  describe("should reject wrong countries", () => {
    it("completely different countries", () => {
      expect(checkAnswer("norge", "Sverige", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("finland", "Danmark", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("japan", "Kina", allNorwegianNames)).toEqual(["no_match"]);
    });

    it("very different names", () => {
      expect(checkAnswer("østerrike", "Australia", allNorwegianNames)).toEqual(["no_match"]);
    });
  });

  describe("should reject very short inputs", () => {
    it("2-char partials rejected", () => {
      expect(checkAnswer("no", "Norge", allNorwegianNames)).toEqual(["no_match"]);
      expect(checkAnswer("sv", "Sverige", allNorwegianNames)).toEqual(["no_match"]);
    });
  });
});
