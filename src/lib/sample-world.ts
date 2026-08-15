/**
 * The propagation demo's fixture data. Every number and name here comes straight from
 * the canonry product repository's docs/ux/SAMPLE-WORLD.md, "the fixture every
 * artifact uses: same names, same numbers" - this file adds no fiction of its own, it
 * only shapes that same fixture for `PropagationDemo.svelte`'s three steps.
 *
 * This is deliberately static data, not a simulation: guardrail 1 is "propose, never
 * apply", and a landing page that pretended to run a real Loremaster job would be
 * lying about that in the one place every visitor sees. `PropagationDemo` reads this
 * once and only ever changes `outcome` in response to a real click.
 *
 * Issue #129: one entry per `Locale`, not one entry machine-translated for both. The
 * product's own rule (SPEC.md §17, "canon keeps its own language, per entry") applies
 * here too, read as "this demo's canon is authored once per locale, the way a GM's own
 * world would be" rather than "an English canon gets translated on the fly" - the
 * distinction issue #129 draws between "written as Italian" and "translated word for
 * word". What does NOT change between the two: every entity name (`Aldric Vane`, `The
 * Valdoria Watch`, `The Ashen Ledger`, `The Gilded Rat`, `Iselde Wrenn`, `Valdoria`,
 * `Debts of Valdoria`, `Mother Sennah`) stays exactly as SAMPLE-WORLD.md spells it in
 * both locales - the same rule the product itself never breaks ("The Gilded Rat" stays
 * "The Gilded Rat" in an Italian sentence, the way a person's name would).
 */
import type { Locale } from './i18n';

export interface PlanRow {
	entity: string;
	why: string;
}

export interface SampleWorld {
	edit: { entity: string; entityType: string; before: string; after: string };
	plan: PlanRow[];
	diff: {
		entity: string;
		entityType: string;
		position: number;
		total: number;
		evidence: string;
		removed: string;
		added: string;
	};
}

const en: SampleWorld = {
	edit: {
		entity: 'Aldric Vane',
		entityType: 'character',
		before: 'Captain of the Valdoria Watch, forty sworn under him in the Lantern Quarter.',
		after:
			'Dismissed from the watch in the thaw after the Sable Winter, he now answers to the Ashen Ledger.'
	},
	// The impact set, in the order SAMPLE-WORLD.md lists it. Cap ~10 per plan (SPEC.md
	// §5.1); this trigger produces 7, so "+more" text below has nothing left to hide - it
	// is shown anyway, in the diff step, exactly the way the product itself would.
	plan: [
		{ entity: 'The Valdoria Watch', why: 'leadership paragraph still names him captain' },
		{ entity: 'The Ashen Ledger', why: 'roster has no Aldric' },
		{
			entity: 'The Gilded Rat',
			why: '"drinks unbothered because the watch is his" no longer holds'
		},
		{ entity: 'Iselde Wrenn', why: 'relation "appointed" is stale, should be "dismissed"' },
		{ entity: 'Valdoria', why: 'the Watch section of the city entry names the captain' },
		{
			entity: 'Debts of Valdoria \u2192 Act 2 \u2192 Ch 2 \u2192 Scene 3',
			why: 'the scene assumes a serving captain'
		},
		{ entity: 'Mother Sennah', why: 'relation "protects" reads the wrong way round now' }
	],
	diff: {
		entity: 'The Gilded Rat',
		entityType: 'place',
		position: 3,
		total: 7,
		evidence: 'Aldric Vane, edited just now: "he now answers to the Ashen Ledger".',
		removed: 'He drinks unbothered because the watch is his.',
		added: 'He still drinks at the Gilded Rat, in the corner seat nobody asks him to leave.'
	}
};

// Written thinking in Italian, not translated word-for-word from `en` above (the same
// rule this repository's AGENTS.md and issue #129 both hold the rest of the site to):
// plain, specific copy, not English syntax wearing Italian words. Quoted fragments stay
// consistent with the matching sentence elsewhere in this object (SPEC.md §17's own
// evidence rule, read the way a parallel-authored fixture can honour it: the quote in
// `diff.removed` and the quote inside `plan[2].why` are the same sentence).
const it: SampleWorld = {
	edit: {
		entity: 'Aldric Vane',
		entityType: 'personaggio',
		before:
			'Capitano di The Valdoria Watch, con quaranta uomini a lui giurati nel quartiere della Lanterna.',
		after:
			'Congedato dalla guardia nel disgelo dopo il Sable Winter, ora risponde a The Ashen Ledger.'
	},
	plan: [
		{ entity: 'The Valdoria Watch', why: 'il paragrafo sul comando lo nomina ancora capitano' },
		{ entity: 'The Ashen Ledger', why: "l'elenco non include Aldric" },
		{
			entity: 'The Gilded Rat',
			why: '«beve indisturbato perché la guardia è sua» non vale più'
		},
		{
			entity: 'Iselde Wrenn',
			why: 'la relazione «nominato» è superata, dovrebbe essere «congedato»'
		},
		{ entity: 'Valdoria', why: 'la sezione sulla guardia della voce cittadina nomina il capitano' },
		{
			entity: 'Debts of Valdoria \u2192 Atto 2 \u2192 Cap. 2 \u2192 Scena 3',
			why: 'la scena presuppone un capitano ancora in servizio'
		},
		{ entity: 'Mother Sennah', why: 'la relazione «protegge» ora si legge al contrario' }
	],
	diff: {
		entity: 'The Gilded Rat',
		entityType: 'luogo',
		position: 3,
		total: 7,
		evidence: 'Aldric Vane, modificato proprio ora: «ora risponde a The Ashen Ledger».',
		removed: 'Beve indisturbato perché la guardia è sua.',
		added: "Beve ancora a The Gilded Rat, al tavolo d'angolo da cui nessuno gli chiede di alzarsi."
	}
};

export const SAMPLE_WORLD: Record<Locale, SampleWorld> = { en, it };
