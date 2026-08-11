import { emptyLineItem, emptySection } from './draft';
import type { DraftLineItem, DraftQuote, DraftSection, Quote } from './types';

type QuoteFieldsPatch = Partial<
  Pick<DraftQuote, 'customerName' | 'status' | 'discountType' | 'discountValue' | 'taxRate'>
>;
type SectionPatch = Partial<Pick<DraftSection, 'name' | 'markupPercent'>>;
type LineItemPatch = Partial<Pick<DraftLineItem, 'description' | 'quantity' | 'unitPrice'>>;

export type DraftAction =
  | { type: 'clear' }
  | { type: 'load'; draft: DraftQuote }
  | { type: 'setFields'; patch: QuoteFieldsPatch }
  | { type: 'addSection' }
  | { type: 'removeSection'; sectionKey: string }
  | { type: 'updateSection'; sectionKey: string; patch: SectionPatch }
  | { type: 'addLineItem'; sectionKey: string }
  | { type: 'removeLineItem'; sectionKey: string; itemKey: string }
  | { type: 'updateLineItem'; sectionKey: string; itemKey: string; patch: LineItemPatch }
  | { type: 'mergeServerIds'; quote: Quote };

function mapSection(
  state: DraftQuote,
  sectionKey: string,
  fn: (section: DraftSection) => DraftSection,
): DraftQuote {
  return {
    ...state,
    sections: state.sections.map((s) => (s.clientKey === sectionKey ? fn(s) : s)),
  };
}

export function draftReducer(state: DraftQuote | null, action: DraftAction): DraftQuote | null {
  switch (action.type) {
    case 'clear':
      return null;

    case 'load':
      return action.draft;

    case 'setFields':
      return state ? { ...state, ...action.patch } : state;

    case 'addSection':
      return state ? { ...state, sections: [...state.sections, emptySection()] } : state;

    case 'removeSection':
      return state
        ? { ...state, sections: state.sections.filter((s) => s.clientKey !== action.sectionKey) }
        : state;

    case 'updateSection':
      return state ? mapSection(state, action.sectionKey, (s) => ({ ...s, ...action.patch })) : state;

    case 'addLineItem':
      return state
        ? mapSection(state, action.sectionKey, (s) => ({
            ...s,
            lineItems: [...s.lineItems, emptyLineItem()],
          }))
        : state;

    case 'removeLineItem':
      return state
        ? mapSection(state, action.sectionKey, (s) => ({
            ...s,
            lineItems: s.lineItems.filter((li) => li.clientKey !== action.itemKey),
          }))
        : state;

    case 'updateLineItem':
      return state
        ? mapSection(state, action.sectionKey, (s) => ({
            ...s,
            lineItems: s.lineItems.map((li) =>
              li.clientKey === action.itemKey ? { ...li, ...action.patch } : li,
            ),
          }))
        : state;

    case 'mergeServerIds': {
      // Adopts server-assigned ids for newly created rows (matched by
      // position, since we always send the full list) without clobbering
      // any text the user typed while the save request was in flight.
      //
      // Bailing out with the *same* object when nothing is missing an id is
      // load-bearing, not a micro-optimization: this action's result feeds
      // straight back into useAutosave's dependency. Returning a new
      // reference on every save — even a no-op one — would retrigger the
      // debounce effect and save again forever.
      if (!state) return state;
      const needsIdMerge = state.sections.some(
        (s) => !s.id || s.lineItems.some((li) => !li.id),
      );
      if (!needsIdMerge) return state;

      const { quote } = action;
      return {
        ...state,
        sections: state.sections.map((s, si) => ({
          ...s,
          id: s.id ?? quote.sections[si]?.id,
          lineItems: s.lineItems.map((li, liIndex) => ({
            ...li,
            id: li.id ?? quote.sections[si]?.lineItems[liIndex]?.id,
          })),
        })),
      };
    }

    default:
      return state;
  }
}
