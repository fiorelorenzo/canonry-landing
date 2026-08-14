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
 */

export const EDIT = {
	entity: 'Aldric Vane',
	entityType: 'character',
	before: 'Captain of the Valdoria Watch, forty sworn under him in the Lantern Quarter.',
	after:
		'Dismissed from the watch in the thaw after the Sable Winter, he now answers to the Ashen Ledger.'
};

export interface PlanRow {
	entity: string;
	why: string;
}

// The impact set, in the order SAMPLE-WORLD.md lists it. Cap ~10 per plan (SPEC.md
// §5.1); this trigger produces 7, so "+more" text below has nothing left to hide - it
// is shown anyway, in the diff step, exactly the way the product itself would.
export const PLAN: PlanRow[] = [
	{ entity: 'The Valdoria Watch', why: 'leadership paragraph still names him captain' },
	{ entity: 'The Ashen Ledger', why: 'roster has no Aldric' },
	{ entity: 'The Gilded Rat', why: '"drinks unbothered because the watch is his" no longer holds' },
	{ entity: 'Iselde Wrenn', why: 'relation "appointed" is stale, should be "dismissed"' },
	{ entity: 'Valdoria', why: 'the Watch section of the city entry names the captain' },
	{
		entity: 'Debts of Valdoria \u2192 Act 2 \u2192 Ch 2 \u2192 Scene 3',
		why: 'the scene assumes a serving captain'
	},
	{ entity: 'Mother Sennah', why: 'relation "protects" reads the wrong way round now' }
];

export const DIFF = {
	entity: 'The Gilded Rat',
	entityType: 'place',
	position: 3,
	total: PLAN.length,
	evidence: 'Aldric Vane, edited just now: "he now answers to the Ashen Ledger".',
	removed: 'He drinks unbothered because the watch is his.',
	added: 'He still drinks at the Gilded Rat, in the corner seat nobody asks him to leave.'
};
